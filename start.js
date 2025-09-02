// Simple starter for Render deployment
const path = require('path');

// Set up environment
require('dotenv').config();

// Auto-import database if needed
const { importDatabase } = require('./auto-import-database.js');

async function start() {
  console.log('Starting ONU Parts Tracker...');
  
  // Try to import database first
  const dbImported = await importDatabase();
  if (!dbImported) {
    console.log('Continuing without database import...');
  }
  
  // Start the main server
  require('./server/index.js');
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});