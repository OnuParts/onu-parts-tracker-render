import express from 'express';
import session from 'express-session';
import { setupVite } from './vite';
import morgan from 'morgan';
import cors from 'cors';
import { registerRoutes } from './routes';
import MemoryStore from 'memorystore';
import path from 'path';
import cron from 'node-cron';
import 'dotenv/config';
import multer from 'multer';

// For uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create Express app
const app = express();

// Configure CORS
app.use(cors());

// Middleware for logging
app.use(morgan('short'));

// Session handling
const MemorySessionStore = MemoryStore(session);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemorySessionStore({
      checkPeriod: 86400000, // Cleanup expired every 24h
    }),
  }),
);

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to serve static files
app.use('/uploads', express.static('uploads'));

// Set up PostgreSQL connection
console.log('Initializing PostgreSQL database...');

// Register API routes
const httpServer = registerRoutes(app);

// Add the simple route for reliable Excel exports
try {
  const simpleRouter = require('./routes-simple');
  app.use(simpleRouter);
  console.log('Reliable Excel export route added at /api/simple-export');
} catch (err) {
  console.error('Error adding reliable export route:', err);
}

// Deploy Vite app
setupVite(app, httpServer);

const port = process.env.PORT || 5000;
httpServer.listen(port, () => {
  console.log(`serving on port ${port}`);
});
