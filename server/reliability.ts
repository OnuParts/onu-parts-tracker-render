import { Request, Response, NextFunction } from 'express';
import { pool } from './db.js';
import fs from 'fs';
import path from 'path';

// Health check endpoint for monitoring
export async function healthCheck(req: Request, res: Response) {
  try {
    // Check database connection
    const dbResult = await pool.query('SELECT 1 as health');
    
    // Check file system access
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const hasFileAccess = fs.existsSync(uploadsDir);
    
    // Get system stats
    const stats = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbResult.rows.length > 0 ? 'connected' : 'disconnected',
      fileSystem: hasFileAccess ? 'accessible' : 'inaccessible',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Automatic backup functionality
export async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Export all tables
    const tables = ['users', 'parts', 'parts_issuance', 'buildings', 'cost_centers', 'storage_locations', 'shelves'];
    const backupData: any = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        backupData[table] = result.rows;
        console.log(`Backed up ${result.rows.length} records from ${table}`);
      } catch (error) {
        console.error(`Failed to backup table ${table}:`, error);
        backupData[table] = [];
      }
    }
    
    // Save backup file
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('Backup creation failed:', error);
    throw error;
  }
}

// System monitoring middleware
export function systemMonitor(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Log request details
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 5000) { // Log slow requests
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
}

// Error recovery middleware
export function errorRecovery(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('Application error:', error);
  
  // Log error details for debugging
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
    body: req.body,
    params: req.params,
    query: req.query
  };
  
  // Save error log
  try {
    const errorDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(errorDir)) {
      fs.mkdirSync(errorDir, { recursive: true });
    }
    
    const errorFile = path.join(errorDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(errorFile, JSON.stringify(errorLog) + '\n');
  } catch (logError) {
    console.error('Failed to write error log:', logError);
  }
  
  // Send appropriate response
  if (error.name === 'ValidationError') {
    res.status(400).json({ error: 'Invalid data provided', details: error.message });
  } else if (error.code === '23505') { // Postgres unique violation
    res.status(409).json({ error: 'Duplicate entry', details: 'This record already exists' });
  } else if (error.code?.startsWith('23')) { // Other Postgres constraint violations
    res.status(400).json({ error: 'Database constraint violation', details: error.message });
  } else {
    res.status(500).json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
}

// Data validation middleware
export function validateCriticalOperations(req: Request, res: Response, next: NextFunction) {
  const criticalPaths = [
    '/api/parts-issuance',
    '/api/parts',
    '/api/users'
  ];
  
  if (criticalPaths.some(path => req.path.startsWith(path)) && 
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    
    // Skip validation for file upload routes (they use req.file instead of req.body)
    if (req.path.includes('/import')) {
      // File upload routes are valid without req.body
    } else if (req.method === 'DELETE') {
      // DELETE operations don't require request body
    } else {
      // Validate required fields exist for non-file-upload routes
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body is required for this operation' });
      }
    }
    
    // Log critical operations
    console.log(`Critical operation: ${req.method} ${req.path} by user ${req.session?.user?.username || 'unknown'}`);
  }
  
  next();
}

// Cache management for offline capability
class LocalCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMinutes: number = 30) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  keys() {
    return Array.from(this.cache.keys());
  }
}

export const localCache = new LocalCache();

// System status monitoring
export class SystemStatus {
  private static instance: SystemStatus;
  private status = {
    database: 'unknown',
    lastBackup: null as Date | null,
    errors: [] as any[],
    requests: 0,
    uptime: Date.now()
  };
  
  static getInstance() {
    if (!SystemStatus.instance) {
      SystemStatus.instance = new SystemStatus();
    }
    return SystemStatus.instance;
  }
  
  updateDatabaseStatus(status: 'connected' | 'disconnected' | 'error') {
    this.status.database = status;
  }
  
  recordBackup() {
    this.status.lastBackup = new Date();
  }
  
  recordError(error: any) {
    this.status.errors.push({
      timestamp: new Date(),
      error: error.message || error,
      stack: error.stack
    });
    
    // Keep only last 50 errors
    if (this.status.errors.length > 50) {
      this.status.errors = this.status.errors.slice(-50);
    }
  }
  
  incrementRequests() {
    this.status.requests++;
  }
  
  getStatus() {
    return {
      ...this.status,
      uptime: Date.now() - this.status.uptime,
      recentErrors: this.status.errors.slice(-10)
    };
  }
}

export const systemStatus = SystemStatus.getInstance();