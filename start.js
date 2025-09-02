import path from 'path';
import { fileURLToPath } from 'url';

// Set up environment
process.env.NODE_ENV = 'production';

// Auto-import database if needed
import('./auto-import-database.js').then(() => {
  console.log('Database import check complete');
  // Start the main server
  import('./server/index.js').then(() => {
    console.log('ONU Parts Tracker started successfully');
  }).catch(err => {
    console.error('Server startup failed:', err);
    process.exit(1);
  });
}).catch(err => {
  console.log('Continuing without database import...');
  // Start server anyway
  import('./server/index.js').catch(err => {
    console.error('Startup failed:', err);
    process.exit(1);
  });
});