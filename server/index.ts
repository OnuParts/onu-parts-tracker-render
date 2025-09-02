import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { pgStorage } from "./pgStorage";
import { pool } from "./db";
import path from "path";
import fs from "fs";
import { 
  healthCheck, 
  createBackup, 
  systemMonitor, 
  errorRecovery, 
  validateCriticalOperations,
  systemStatus 
} from "./reliability.js";

// Load environment variables from .env file if it exists
dotenv.config();

// Initialize PostgreSQL database
console.log("Initializing PostgreSQL database...");
pgStorage.initDb().then(() => {
  console.log("PostgreSQL database initialized successfully");
}).catch(err => {
  console.error("Failed to initialize PostgreSQL database:", err);
});

const app = express();

// Health check endpoint for deployments - must respond quickly with 200 OK
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Create aging analysis endpoint using direct router approach
const agingRouter = express.Router();
agingRouter.get('/inventory/aging-analysis', async (req, res) => {
  try {
    console.log("=== AGING ANALYSIS: Starting generation (direct router) ===");
    
    // Force JSON response headers immediately
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    const query = `
      SELECT 
        p.part_id,
        p.name,
        p.description,
        p.quantity,
        p.unit_cost,
        p.category,
        COALESCE(sl.name, p.location, 'Unassigned') as location,
        p.last_restock_date,
        MAX(pi.issued_at) as last_issued_date
      FROM parts p
      LEFT JOIN parts_issuance pi ON p.id = pi.part_id
      LEFT JOIN storage_locations sl ON p.location_id = sl.id
      GROUP BY p.id, p.part_id, p.name, p.description, p.quantity, p.unit_cost, p.category, sl.name, p.location, p.last_restock_date
      ORDER BY p.part_id
    `;
    
    const result = await pool.query(query);
    console.log(`=== AGING ANALYSIS: Query returned ${result.rows.length} rows ===`);
    
    const today = new Date();
    
    const agingData = result.rows.map(row => {
      const lastIssuedDate = row.last_issued_date ? new Date(row.last_issued_date) : null;
      const lastRestockDate = row.last_restock_date ? new Date(row.last_restock_date) : null;
      
      const daysSinceLastIssued = lastIssuedDate 
        ? Math.floor((today.getTime() - lastIssuedDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
        
      const daysSinceLastRestock = lastRestockDate
        ? Math.floor((today.getTime() - lastRestockDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Calculate aging category based on last issued date
      let agingCategory;
      if (daysSinceLastIssued === null) {
        agingCategory = 'dead-stock';
      } else if (daysSinceLastIssued <= 30) {
        agingCategory = 'fast-moving';
      } else if (daysSinceLastIssued <= 180) {
        agingCategory = 'slow-moving';
      } else if (daysSinceLastIssued <= 365) {
        agingCategory = 'stagnant';
      } else {
        agingCategory = 'dead-stock';
      }
      
      const unitCost = parseFloat(row.unit_cost || '0');
      const estimatedValue = row.quantity * unitCost;
      
      return {
        partId: row.part_id,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        unitCost: row.unit_cost,
        lastIssuedDate: lastIssuedDate ? lastIssuedDate.toISOString() : null,
        lastRestockDate: lastRestockDate ? lastRestockDate.toISOString() : null,
        category: row.category,
        location: row.location,
        daysSinceLastIssued,
        daysSinceLastRestock,
        agingCategory,
        estimatedValue
      };
    });
    
    console.log(`=== AGING ANALYSIS: Generated aging analysis for ${agingData.length} parts ===`);
    return res.json(agingData);
    
  } catch (error) {
    console.error("Aging analysis error:", error);
    return res.status(500).json({ error: "Failed to generate aging analysis" });
  }
});

// Performance metrics endpoint - direct implementation
agingRouter.get('/performance/metrics', async (req, res) => {
  try {
    console.log("=== PERFORMANCE METRICS: Starting generation (direct router) ===");
    
    // Force JSON response headers immediately
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Get database performance metrics
    const dbStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM parts) as total_parts,
        (SELECT COUNT(*) FROM parts_issuance) as total_issuances,
        (SELECT COUNT(*) FROM storage_locations) as total_locations,
        (SELECT COUNT(*) FROM shelves) as total_shelves,
        (SELECT pg_database_size(current_database())) as db_size_bytes
    `);
    
    // Get table sizes
    const tableSizes = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);
    
    // Calculate performance metrics
    const metrics = {
      database: {
        totalRecords: parseInt(dbStats.rows[0].total_parts) + parseInt(dbStats.rows[0].total_issuances),
        totalParts: parseInt(dbStats.rows[0].total_parts),
        totalIssuances: parseInt(dbStats.rows[0].total_issuances),
        totalLocations: parseInt(dbStats.rows[0].total_locations),
        totalShelves: parseInt(dbStats.rows[0].total_shelves),
        databaseSize: dbStats.rows[0].db_size_bytes,
        databaseSizeFormatted: Math.round(dbStats.rows[0].db_size_bytes / 1024 / 1024) + ' MB'
      },
      tables: tableSizes.rows,
      health: {
        status: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      recommendations: [
        'Database performance is optimal',
        'Consider archiving old issuance records after 2 years',
        'Regular vacuum operations recommended monthly'
      ]
    };
    
    console.log(`=== PERFORMANCE METRICS: Generated metrics successfully ===`);
    return res.json(metrics);
    
  } catch (error) {
    console.error("Performance metrics error:", error);
    return res.status(500).json({ error: "Failed to generate performance metrics" });
  }
});

// Mount the aging router BEFORE other middleware
app.use('/api', agingRouter);

// PUBLIC DOWNLOAD ENDPOINTS (no middleware interference)
// Parts inventory download endpoint - MUST be before Vite catch-all
app.get('/download/parts-inventory', async (req, res) => {
  console.log('Direct parts inventory download requested (no auth required)');
  
  try {
    // Import ExcelJS directly
    const ExcelJS = (await import('exceljs')).default;
    
    // Get all parts from storage
    const parts = await pgStorage.getParts();
    console.log(`Generating Excel for ${parts.length} parts`);
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Parts Inventory');

    // Define columns
    worksheet.columns = [
      { header: 'Part ID', key: 'partId', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Reorder Level', key: 'reorderLevel', width: 15 },
      { header: 'Unit Cost', key: 'unitCost', width: 12 },
      { header: 'Extended Value', key: 'extendedValue', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Supplier', key: 'supplier', width: 20 },
    ];

    // Add data rows with proper field mapping
    let grandTotal = 0;
    parts.forEach((part, index) => {
      const quantity = parseFloat(part.quantity) || 0;
      // Try both possible field names for unit cost
      const unitCost = parseFloat(part.unitCost || part.unit_cost || '0') || 0;
      const extendedValue = quantity * unitCost;
      grandTotal += extendedValue;
      


      worksheet.addRow({
        partId: part.partId,
        name: part.name,
        description: part.description || '',
        quantity: quantity,
        reorderLevel: part.reorderLevel || '',
        unitCost: unitCost.toFixed(2),
        extendedValue: extendedValue.toFixed(2),
        category: part.category || '',
        location: part.location || '',
        supplier: part.supplier || '',
      });
    });

    console.log(`Excel generation: Calculated grand total = $${grandTotal.toFixed(2)}`);

    // Add grand total row
    worksheet.addRow({});
    worksheet.addRow({
      partId: '',
      name: '',
      description: '',
      quantity: '',
      reorderLevel: '',
      unitCost: 'GRAND TOTAL:',
      extendedValue: grandTotal.toFixed(2),
      category: '',
      location: '',
      supplier: ''
    });

    // Generate buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();
    console.log('Excel buffer created, length:', excelBuffer.length);
    
    // Set proper headers for Excel download with unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `ONU_Parts_Inventory_${timestamp}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());
    
    // Send the Excel file
    res.end(excelBuffer);
  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

app.get('/api/public-download-guide', (req, res) => {
  const guideContent = `ONU PARTS TRACKER - LOCAL DEPLOYMENT GUIDE
===============================================

SYSTEM REQUIREMENTS
------------------
- Node.js 18+ 
- PostgreSQL 12+
- 4GB RAM minimum
- 10GB available disk space

QUICK START
----------
1. Extract the complete package (ZIP file)
2. Install Node.js and PostgreSQL
3. Create database: CREATE DATABASE onu_parts_tracker;
4. Copy .env.template to .env and configure database
5. Run: npm install
6. Run: npm start
7. Open: http://localhost:5000

DETAILED INSTALLATION
--------------------

Windows:
1. Download Node.js from https://nodejs.org/
2. Download PostgreSQL from https://postgresql.org/
3. Run installers and note PostgreSQL password

macOS:
1. Install Homebrew
2. Run: brew install node postgresql
3. Start PostgreSQL: brew services start postgresql

Linux (Ubuntu):
1. Run: sudo apt update
2. Run: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
3. Run: sudo apt-get install -y nodejs postgresql postgresql-contrib

DATABASE SETUP
-------------
1. Connect: psql -U postgres
2. Run: CREATE DATABASE onu_parts_tracker;
3. Run: CREATE USER onu_admin WITH PASSWORD 'your_password';
4. Run: GRANT ALL PRIVILEGES ON DATABASE onu_parts_tracker TO onu_admin;

APPLICATION SETUP
----------------
1. Extract package to desired directory
2. Copy .env.template to .env
3. Edit .env with your database credentials
4. Run: npm install
5. Run: npm start

DEFAULT LOGIN
------------
Username: admin
Password: admin123

SECURITY NOTES
-------------
- Change default password immediately
- Use strong session secrets (32+ characters)
- Configure firewall properly
- Enable SSL for production

Generated: ${new Date().toISOString()}`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="onu-deployment-guide.txt"');
  res.send(guideContent);
});

app.get('/api/public-download-package', async (req, res) => {
  try {
    const { createExportPackage } = await import('./export-package.js');
    const zipPath = await createExportPackage();
    
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ error: 'Export package not found' });
    }
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(zipPath)}"`);
    res.sendFile(path.resolve(zipPath));
  } catch (error) {
    console.error('Failed to create export package:', error);
    res.status(500).json({ error: 'Failed to create export package' });
  }
});

// Conditional body parsing - skip for file upload routes
app.use((req, res, next) => {
  // Skip JSON parsing for file upload routes
  if (req.path.includes('/import') && req.method === 'POST') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use((req, res, next) => {
  // Skip URL encoding for file upload routes
  if (req.path.includes('/import') && req.method === 'POST') {
    next();
  } else {
    express.urlencoded({ extended: false })(req, res, next);
  }
});

// Add reliability monitoring middleware
app.use(systemMonitor);
app.use(validateCriticalOperations);

// Directly serve static files from client/public directory
app.use(express.static(path.join(process.cwd(), 'client', 'public')));

// Serve the root directory (where mobile.html is located)
app.use(express.static(process.cwd()));

// Setup PostgreSQL session store
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'onu-parts-tracker-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer sessions
    secure: false, // Set to false for development
    httpOnly: true, // Can't be accessed by JavaScript
    sameSite: 'lax', // Helps with cross-site compatibility
  },
  rolling: true // Renew session with each response
}));

// Root route to redirect to login or appropriate page based on auth status
// Also serves as health check endpoint for deployment systems
app.get('/', (req, res) => {
  // Health check detection - respond with 200 OK for deployment systems
  if (!req.headers.cookie && (
    req.headers['user-agent']?.includes('health') || 
    req.headers['user-agent']?.includes('deployment') ||
    req.headers['user-agent']?.includes('curl') ||
    req.method === 'HEAD'
  )) {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  
  if (req.session?.user) {
    console.log('User authenticated at root URL, redirecting based on role:', req.session.user.role);
    if (req.session.user.role === 'admin') {
      return res.redirect('/dashboard');
    } else if (req.session.user.role === 'student') {
      return res.redirect('/parts-inventory');
    } else if (req.session.user.role === 'controller') {
      return res.redirect('/dashboard');
    } else {
      return res.redirect('/parts-issuance');
    }
  } else {
    console.log('No user detected at root URL, redirecting to login');
    return res.redirect('/login');
  }
});

// Serve the static login.html file for the login route
app.get('/login', (req, res) => {
  // Check if user is already authenticated using session
  if (req.session?.user) {
    console.log('User already authenticated at /login:', req.session.user);
    // Redirect based on role
    if (req.session.user.role === 'admin') {
      return res.redirect('/dashboard');
    } else if (req.session.user.role === 'student') {
      return res.redirect('/parts-inventory');
    } else if (req.session.user.role === 'controller') {
      return res.redirect('/dashboard');
    } else {
      return res.redirect('/parts-issuance');
    }
  }
  
  console.log('Direct login access with query params:', req.query);
  
  const loginHtmlPath = path.join(process.cwd(), 'client', 'public', 'login.html');
  console.log('Serving static login page from:', loginHtmlPath);
  
  if (fs.existsSync(loginHtmlPath)) {
    res.sendFile(loginHtmlPath);
  } else {
    console.error('Login HTML file not found at', loginHtmlPath);
    res.status(404).send('Login page not found');
  }
});

// Redirect mobile-login to the main login page
app.get('/mobile-login', (req, res) => {
  console.log('Mobile login access detected - redirecting to main login page');
  return res.redirect('/login');
});

// Serve the admin login page directly
app.get('/admin-login', (req, res) => {
  // Check if user is already authenticated
  if (req.session?.user) {
    console.log('User already authenticated at /admin-login:', req.session.user);
    // Redirect based on role
    if (req.session.user.role === 'admin') {
      return res.redirect('/dashboard');
    } else if (req.session.user.role === 'student') {
      return res.redirect('/parts-inventory');
    } else {
      return res.redirect('/parts-issuance');
    }
  }
  
  console.log('Serving admin login page');
  
  // Try the simple version first
  const simpleAdminLoginHtmlPath = path.join(process.cwd(), 'client', 'public', 'admin-login-simple.html');
  
  if (fs.existsSync(simpleAdminLoginHtmlPath)) {
    console.log('Simple admin login HTML exists, sending file');
    return res.sendFile(simpleAdminLoginHtmlPath);
  }
  
  // Fall back to the regular version if simple version doesn't exist
  const adminLoginHtmlPath = path.join(process.cwd(), 'client', 'public', 'admin-login.html');
  console.log('Admin login path:', adminLoginHtmlPath);
  
  if (fs.existsSync(adminLoginHtmlPath)) {
    console.log('Admin login HTML exists, sending file');
    res.sendFile(adminLoginHtmlPath);
  } else {
    console.error('Admin login HTML file not found');
    res.status(404).send('Admin login page not found');
  }
});

// Also add a direct endpoint for testing
app.get('/admin-simple', (req, res) => {
  console.log('Serving simple admin login page');
  
  const simpleAdminLoginHtmlPath = path.join(process.cwd(), 'client', 'public', 'admin-login-simple.html');
  
  if (fs.existsSync(simpleAdminLoginHtmlPath)) {
    console.log('Simple admin login HTML exists, sending file');
    res.sendFile(simpleAdminLoginHtmlPath);
  } else {
    console.error('Simple admin login HTML file not found, serving inline HTML');
    // Serve a simple inline HTML as fallback
    const html = `<!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ONU Admin Login</title>
          <style>
              body { font-family: Arial; margin: 20px; background: #f5f5f5; }
              .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #F36532; text-align: center; }
              input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }
              button { background: #F36532; color: white; border: none; padding: 12px; width: 100%; cursor: pointer; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>ONU Admin Login</h1>
              
              <form action="/api/login" method="post">
                  <input type="hidden" name="role" value="admin">
                  <input type="hidden" name="redirect" value="/dashboard">
                  
                  <label>Username:</label>
                  <input type="text" name="username" value="admin" required>
                  
                  <label>Password:</label>
                  <input type="password" name="password" value="admin" required>
                  
                  <button type="submit">Login</button>
              </form>
              
              <p style="text-align: center; margin-top: 20px;">
                  <a href="/mobile-login" style="color: #F36532;">Back to Mobile Login</a>
              </p>
          </div>
      </body>
      </html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
});

// Serve the student login page directly
app.get('/student-login', (req, res) => {
  // Check if user is already authenticated
  if (req.session?.user) {
    console.log('User already authenticated at /student-login:', req.session.user);
    // Redirect based on role
    if (req.session.user.role === 'admin') {
      return res.redirect('/dashboard');
    } else if (req.session.user.role === 'student') {
      return res.redirect('/parts-inventory');
    } else {
      return res.redirect('/parts-issuance');
    }
  }
  
  console.log('Serving student login page');
  
  const studentLoginHtmlPath = path.join(process.cwd(), 'client', 'public', 'student-login.html');
  console.log('Student login path:', studentLoginHtmlPath);
  
  if (fs.existsSync(studentLoginHtmlPath)) {
    console.log('Student login HTML exists, sending file');
    res.sendFile(studentLoginHtmlPath);
  } else {
    console.error('Student login HTML file not found');
    res.status(404).send('Student login page not found');
  }
});

// Serve a simplified dashboard for mobile devices
app.get('/dashboard-simple', (req, res) => {
  // Check authentication
  if (!req.session?.user) {
    console.log('User not authenticated at /dashboard-simple');
    return res.redirect('/admin-login');
  }
  
  console.log('Serving simple dashboard page');
  
  const simpleDashboardPath = path.join(process.cwd(), 'client', 'public', 'dashboard-simple.html');
  
  if (fs.existsSync(simpleDashboardPath)) {
    console.log('Simple dashboard HTML exists, sending file');
    res.sendFile(simpleDashboardPath);
  } else {
    console.error('Simple dashboard HTML file not found');
    // Fall back to the React dashboard
    res.redirect('/dashboard');
  }
});

// Serve the tech login page directly
app.get('/tech-login', (req, res) => {
  // Check if user is already authenticated
  if (req.session?.user) {
    console.log('User already authenticated at /tech-login:', req.session.user);
    // Redirect based on role
    if (req.session.user.role === 'admin') {
      return res.redirect('/dashboard');
    } else if (req.session.user.role === 'student') {
      return res.redirect('/parts-inventory');
    } else {
      return res.redirect('/parts-issuance');
    }
  }
  
  console.log('Serving tech login page');
  
  const techLoginHtmlPath = path.join(process.cwd(), 'client', 'public', 'tech-login.html');
  console.log('Tech login path:', techLoginHtmlPath);
  
  if (fs.existsSync(techLoginHtmlPath)) {
    console.log('Tech login HTML exists, sending file');
    res.sendFile(techLoginHtmlPath);
  } else {
    console.error('Tech login HTML file not found');
    res.status(404).send('Tech login page not found');
  }
});

// Serve the static quick-count-direct.html file for direct access to Quick Count
app.get('/quick-count-direct', (req, res) => {
  console.log('Direct quick count access');
  
  const quickCountDirectPath = path.join(process.cwd(), 'client', 'public', 'quick-count-direct.html');
  console.log('Serving static quick count direct access page from:', quickCountDirectPath);
  
  if (fs.existsSync(quickCountDirectPath)) {
    res.sendFile(quickCountDirectPath);
  } else {
    console.error('Quick count direct access HTML file not found at', quickCountDirectPath);
    res.status(404).send('Quick count direct access page not found');
  }
});

// Serve the standalone quick-count-standalone.html file that doesn't depend on React auth
app.get('/quick-count-standalone', (req, res) => {
  console.log('Standalone quick count access');
  
  const quickCountStandalonePath = path.join(process.cwd(), 'client', 'public', 'quick-count-standalone.html');
  console.log('Serving standalone quick count page from:', quickCountStandalonePath);
  
  if (fs.existsSync(quickCountStandalonePath)) {
    res.sendFile(quickCountStandalonePath);
  } else {
    console.error('Standalone quick count HTML file not found at', quickCountStandalonePath);
    res.status(404).send('Standalone quick count page not found');
  }
});

// Direct root level route to serve an ultra-simple HTML form for mobile
app.get('/mobile', (req, res) => {
  // Check if user is already authenticated using session
  if (req.session?.user) {
    console.log('User already authenticated:', req.session.user);
    return res.redirect('/parts-issuance');
  }
  
  const mobilePath = path.join(process.cwd(), 'mobile.html');
  console.log('Trying to serve mobile login from:', mobilePath);
  
  if (fs.existsSync(mobilePath)) {
    console.log('Mobile login file exists, sending...');
    res.sendFile(mobilePath);
  } else {
    console.error('Mobile login file not found at', mobilePath);
    // Serve a simple inline HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ONU Parts Tracker Login</title>
        <style>
          body { font-family: sans-serif; margin: 20px; }
          input, button { margin: 10px 0; padding: 8px; width: 100%; box-sizing: border-box; }
          button { background: #F36532; color: white; border: none; }
          #technicianList { margin-top: 20px; }
          .tech-item { border-bottom: 1px solid #eee; padding: 10px 0; }
          h3 { margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>ONU Parts Tracker</h1>
        <form id="loginForm">
          <label>Name: <input name="name" required></label>
          <label>Department: <input name="department"></label>
          <input type="hidden" name="role" value="technician">
          <button type="submit">Login</button>
        </form>
        
        <h3>OR Select Technician</h3>
        <div id="technicianList">Loading technicians...</div>
        
        <script>
          // Fetch technicians on page load
          fetch('/api/technicians-list')
            .then(res => res.json())
            .then(technicians => {
              const list = document.getElementById('technicianList');
              if (technicians && technicians.length) {
                let html = '';
                technicians.forEach(tech => {
                  html += '<div class="tech-item">';
                  html += '<strong>' + tech.name + '</strong>';
                  if (tech.department) html += ' (' + tech.department + ')';
                  html += '<button onclick="loginAsTechnician(\'' + tech.username + '\')">Select</button>';
                  html += '</div>';
                });
                list.innerHTML = html;
              } else {
                list.innerHTML = '<p>No technicians found</p>';
              }
            })
            .catch(err => {
              document.getElementById('technicianList').innerHTML = 
                '<p>Could not load technicians. Please use the form above.</p>';
              console.error('Error loading technicians:', err);
            });
          
          // Login as technician function
          function loginAsTechnician(username) {
            const data = {
              username: username,
              role: 'technician'
            };
            
            fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            .then(response => {
              if (response.redirected) {
                window.location.href = response.url;
              } else if (response.ok) {
                window.location.href = '/parts-issuance';
              } else {
                return response.text().then(text => {
                  alert('Login failed: ' + text);
                });
              }
            })
            .catch(error => {
              alert('Login error: ' + error.message);
            });
          }
          
          // Add manual submission handling
          document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = {};
            for (const [key, value] of formData.entries()) {
              data[key] = value;
            }
            
            fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            .then(response => {
              if (response.redirected) {
                window.location.href = response.url;
              } else if (response.ok) {
                window.location.href = '/parts-issuance'; 
              } else {
                return response.text().then(text => {
                  alert('Login failed: ' + text);
                });
              }
            })
            .catch(error => {
              alert('Login error: ' + error.message);
            });
          });
        </script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // First, register our API routes
  const server = await registerRoutes(app);

  // Set up error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Use PORT environment variable if available, otherwise use 5000
  // this serves both the API and the client
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // IMPORTANT: Setup Vite AFTER all other routes have been registered
  // so the catch-all doesn't interfere with our explicit routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // serveStatic(app); 
  }
})();

// Add health check and system status endpoints
app.get('/api/health', healthCheck);
app.get('/api/system-status', (req, res) => {
  res.json(systemStatus.getStatus());
});

// Manual backup endpoint for administrators
app.post('/api/create-backup', async (req, res) => {
  try {
    const backupFile = await createBackup();
    res.json({ 
      success: true, 
      message: 'Backup created successfully', 
      file: path.basename(backupFile) 
    });
  } catch (error) {
    console.error('Manual backup failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Backup creation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Public downloads (no authentication required)
app.get('/downloads', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ONU Parts Tracker - Downloads</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #F36532; text-align: center; margin-bottom: 30px; }
        .download-btn { display: inline-block; background: #F36532; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 0; font-weight: 600; }
        .download-btn:hover { background: #e5532a; }
        .description { color: #64748b; margin-bottom: 20px; }
        .section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 ONU Parts Tracker Downloads</h1>
        
        <div class="section">
            <h3>📦 Complete Export Package</h3>
            <p class="description">Full source code, database backup, and setup files for independent deployment.</p>
            <a href="/api/public-download-package" class="download-btn">Download Export Package (ZIP)</a>
        </div>
        
        <div class="section">
            <h3>📋 Deployment Guide</h3>
            <p class="description">Step-by-step installation instructions for local deployment.</p>
            <a href="/api/public-download-guide" class="download-btn">Download Setup Guide (TXT)</a>
        </div>
        
        <div class="section">
            <h3>ℹ️ Package Contents</h3>
            <ul>
                <li>Complete React frontend and Node.js backend</li>
                <li>PostgreSQL database backup with all data</li>
                <li>Environment configuration templates</li>
                <li>Startup scripts and documentation</li>
                <li>Installation guide for Windows, macOS, and Linux</li>
            </ul>
        </div>
        
        <p style="text-align: center; color: #64748b; margin-top: 40px;">
            Generated: ${new Date().toISOString()}<br>
            System ready for independent deployment
        </p>
    </div>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});



// Add Excel export route at the app level to avoid conflicts
app.get('/api/excel-export-fixed', async (req, res) => {
  try {
    console.log("Fixed Excel export called");
    const monthParam = req.query.month as string;
    
    let dateFilterSQL = '';
    const queryParams: any[] = [];
    
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        dateFilterSQL = 'WHERE pi.issued_at >= $1 AND pi.issued_at <= $2';
        queryParams.push(startDate.toISOString(), endDate.toISOString());
      }
    }
    
    const { pool } = await import('./db.js');
    
    const query = `
      SELECT 
        pi.id, pi.part_id, pi.quantity, pi.issued_to, pi.reason, pi.issued_at,
        pi.notes, pi.project_code, pi.department, pi.building, pi.issued_by_id,
        p.part_id as part_number, p.name as part_name, p.unit_cost
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      ${dateFilterSQL}
      ORDER BY pi.issued_at DESC
    `;
    
    const result = await pool.query(query, queryParams);
    console.log(`Fixed Excel Export: Found ${result.rows.length} records`);
    
    const issuances = result.rows.map(row => ({
      id: row.id,
      partId: row.part_id,
      quantity: row.quantity,
      issuedTo: row.issued_to,
      reason: row.reason,
      issuedAt: row.issued_at,
      notes: row.notes || null,
      projectCode: row.project_code || null,
      department: row.department || null,
      building: row.building || null,
      part: {
        partId: row.part_number,
        name: row.part_name,
        unitCost: row.unit_cost
      },
      extendedPrice: row.quantity * parseFloat(row.unit_cost || '0'),
      issuedById: row.issued_by_id || null
    }));
    
    const { generatePartsIssuanceExcel } = await import('./excel.js');
    const excelBuffer = await generatePartsIssuanceExcel(issuances as any);
    
    let filename = 'charge-out-report';
    if (monthParam) {
      filename += `-${monthParam.replace('/', '-')}`;
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
    
  } catch (error) {
    console.error("Fixed Excel export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});

// Add the reliable Excel export routes
import simpleRouter from './routes-simple.js';
app.use(simpleRouter);
console.log('Reliable Excel export route added at /api/simple-export');

// Add working Excel export with unique route name to avoid conflicts
app.get('/api/excel-charge-outs', async (req, res) => {
  try {
    console.log("Excel charge-outs export handler called");
    const monthParam = req.query.month as string;
    
    // Parse the month parameter
    let startDate, endDate;
    let dateFilterSQL = '';
    const queryParams: any[] = [];
    
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        dateFilterSQL = 'WHERE pi.issued_at >= $1 AND pi.issued_at <= $2';
        queryParams.push(startDate.toISOString(), endDate.toISOString());
        console.log(`Excel Export: Filtering between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      }
    }
    
    // Import pool directly
    const { pool } = await import('./db.js');
    
    // Query with all required fields
    const query = `
      SELECT 
        pi.id,
        pi.part_id,
        pi.quantity,
        pi.issued_to,
        pi.reason,
        pi.issued_at,
        pi.notes,
        pi.project_code,
        pi.department,
        pi.building,
        pi.issued_by_id,
        b.name as building_name,
        cc.name as cost_center_name,
        cc.code as cost_center_code,
        p.part_id as part_number,
        p.name as part_name,
        p.unit_cost
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      LEFT JOIN buildings b ON pi.building = b.id::text
      LEFT JOIN cost_centers cc ON pi.cost_center = cc.id::text
      ${dateFilterSQL}
      ORDER BY pi.issued_at DESC
    `;
    
    const result = await pool.query(query, queryParams);
    console.log(`Excel Export: Found ${result.rows.length} issuance records`);
    
    // Map the result to match expected format
    const issuances = result.rows.map(row => ({
      id: row.id,
      partId: row.part_id,
      quantity: row.quantity,
      issuedTo: row.issued_to,
      reason: row.reason,
      issuedAt: row.issued_at,
      notes: row.notes || null,
      projectCode: row.project_code || null,
      department: row.department || null,
      building: row.building || null,
      buildingName: row.building_name || null,
      costCenterName: row.cost_center_name || null,
      costCenterCode: row.cost_center_code || null,
      part: {
        partId: row.part_number,
        name: row.part_name,
        unitCost: row.unit_cost
      },
      extendedPrice: row.quantity * parseFloat(row.unit_cost || '0'),
      issuedById: row.issued_by_id || null
    }));
    
    // Generate Excel file using the working generatePartsIssuanceExcel function
    const { generatePartsIssuanceExcel } = await import('./excel.js');
    const excelBuffer = await generatePartsIssuanceExcel(issuances as any);
    
    // Set proper headers for Excel download
    let filename = 'charge-out-report';
    if (monthParam) {
      filename += `-${monthParam.replace('/', '-')}`;
    } else {
      filename += `-${new Date().toISOString().split('T')[0]}`;
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
    
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});
console.log('Working Excel export added at /api/excel-charge-outs');

// Add direct Excel export routes
try {
  const directRouter = await import('./direct-route.js');
  const excelDebug = await import('./excel-debug.js');
  const finalRoute = await import('./routes-final.js');
  
  app.use(directRouter.default);
  app.get('/api/excel-debug', excelDebug.default);
  app.use(finalRoute.default);
  
  console.log('Excel export routes added successfully');
  
  // Initialize bulk email system
  try {
    const { initializeBulkEmailSystem } = await import('./bulk-email-service');
    initializeBulkEmailSystem();
  } catch (error) {
    console.error('Failed to initialize bulk email system:', error);
  }
} catch (err) {
  console.error('Error adding Excel routes:', err);
}
