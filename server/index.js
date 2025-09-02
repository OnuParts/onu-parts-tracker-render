import express from "express";
import dotenv from "dotenv";
import pg from "pg";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '..', 'public')));
// Set correct content type for HTML files
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    res.set('Content-Type', 'text/html');
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

// Serve login page
app.get('/login', (req, res) => {
  const loginPath = path.join(__dirname, '..', 'public', 'login.html');
console.log('Looking for login.html at:', loginPath);
res.sendFile(loginPath);
});

// Root route redirects to login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Database initialization
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        department VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS parts (
        id SERIAL PRIMARY KEY,
        part_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 1,
        unit_cost DECIMAL(10,2) DEFAULT 0.00,
        category VARCHAR(255),
        location VARCHAR(255),
        supplier VARCHAR(255),
        last_restock_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert admin user if not exists
    const adminCheck = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (username, password, name, email, role, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin', 'admin', 'Michael Gierhart', 'm-gierhart@onu.edu', 'admin', new Date()]);
      console.log('Admin user created successfully');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Authentication endpoint
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  
  // Simple authentication
  if (username === 'admin' && password === 'admin') {
    res.json({ 
      success: true, 
      user: { username: 'admin', role: 'admin', name: 'Michael Gierhart' },
      redirectTo: '/dashboard' 
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});
// Current user endpoint  
app.get('/api/current-user', (req, res) => {
  res.json({ username: 'admin', role: 'admin', name: 'Michael Gierhart' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ONU Parts Tracker server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
