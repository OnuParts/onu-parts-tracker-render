import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generateDeploymentGuidePDF() {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `ONU-Parts-Tracker-Deployment-Guide-${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Ensure the guides directory exists
  const guidesDir = path.join(process.cwd(), 'guides');
  if (!fs.existsSync(guidesDir)) {
    fs.mkdirSync(guidesDir, { recursive: true });
  }
  
  const filepath = path.join(guidesDir, filename);
  
  doc.pipe(fs.createWriteStream(filepath));
  
  // Title page
  doc.fontSize(24).font('Helvetica-Bold').text('ONU Parts Tracker', { align: 'center' });
  doc.fontSize(18).font('Helvetica').text('Local Deployment Guide', { align: 'center' });
  doc.moveDown(2);
  
  doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.addPage();
  
  // Table of Contents
  doc.fontSize(18).font('Helvetica-Bold').text('Table of Contents');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  doc.text('1. System Requirements ........................... 3');
  doc.text('2. Prerequisites Installation ................... 4');
  doc.text('3. Database Setup ............................... 5');
  doc.text('4. Application Installation ..................... 6');
  doc.text('5. Configuration ................................ 7');
  doc.text('6. Running the Application ...................... 8');
  doc.text('7. Production Deployment ........................ 9');
  doc.text('8. Backup and Maintenance ...................... 10');
  doc.text('9. Troubleshooting ............................. 11');
  doc.text('10. Security Considerations .................... 12');
  doc.addPage();
  
  // Chapter 1: System Requirements
  doc.fontSize(16).font('Helvetica-Bold').text('1. System Requirements');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  doc.text('Minimum Hardware Requirements:');
  doc.text('• CPU: 2 cores, 2.0 GHz or higher');
  doc.text('• RAM: 4 GB minimum, 8 GB recommended');
  doc.text('• Storage: 10 GB available space');
  doc.text('• Network: Stable internet connection for initial setup');
  doc.moveDown();
  
  doc.text('Supported Operating Systems:');
  doc.text('• Windows 10/11 (x64)');
  doc.text('• macOS 10.15 or later');
  doc.text('• Ubuntu 18.04 LTS or later');
  doc.text('• CentOS 7 or later');
  doc.text('• Docker-compatible systems');
  doc.moveDown();
  
  doc.text('Network Requirements:');
  doc.text('• Port 5000 available for the application');
  doc.text('• Port 5432 available for PostgreSQL');
  doc.text('• Firewall configured to allow internal access');
  doc.addPage();
  
  // Chapter 2: Prerequisites Installation
  doc.fontSize(16).font('Helvetica-Bold').text('2. Prerequisites Installation');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Install Node.js (version 18 or higher):');
  doc.text('1. Visit https://nodejs.org/');
  doc.text('2. Download the LTS version for your operating system');
  doc.text('3. Run the installer and follow the setup wizard');
  doc.text('4. Verify installation: open terminal and run "node --version"');
  doc.moveDown();
  
  doc.text('Install PostgreSQL (version 12 or higher):');
  doc.text('Windows:');
  doc.text('1. Download from https://www.postgresql.org/download/windows/');
  doc.text('2. Run the installer and note the password for postgres user');
  doc.text('3. Ensure PostgreSQL service is running');
  doc.moveDown();
  
  doc.text('macOS:');
  doc.text('1. Install via Homebrew: "brew install postgresql"');
  doc.text('2. Start service: "brew services start postgresql"');
  doc.moveDown();
  
  doc.text('Ubuntu/Debian:');
  doc.text('1. Update packages: "sudo apt update"');
  doc.text('2. Install PostgreSQL: "sudo apt install postgresql postgresql-contrib"');
  doc.text('3. Start service: "sudo systemctl start postgresql"');
  doc.addPage();
  
  // Chapter 3: Database Setup
  doc.fontSize(16).font('Helvetica-Bold').text('3. Database Setup');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Create Database and User:');
  doc.text('1. Connect to PostgreSQL as postgres user:');
  doc.text('   psql -U postgres');
  doc.moveDown();
  
  doc.text('2. Create database:');
  doc.text('   CREATE DATABASE onu_parts_tracker;');
  doc.moveDown();
  
  doc.text('3. Create user with password:');
  doc.text('   CREATE USER onu_admin WITH PASSWORD \'your_secure_password\';');
  doc.moveDown();
  
  doc.text('4. Grant privileges:');
  doc.text('   GRANT ALL PRIVILEGES ON DATABASE onu_parts_tracker TO onu_admin;');
  doc.text('   GRANT ALL ON SCHEMA public TO onu_admin;');
  doc.moveDown();
  
  doc.text('5. Exit psql:');
  doc.text('   \\q');
  doc.moveDown();
  
  doc.text('Test Connection:');
  doc.text('psql -U onu_admin -d onu_parts_tracker -h localhost');
  doc.addPage();
  
  // Chapter 4: Application Installation
  doc.fontSize(16).font('Helvetica-Bold').text('4. Application Installation');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Download Application Files:');
  doc.text('1. Create application directory:');
  doc.text('   mkdir /opt/onu-parts-tracker');
  doc.text('   cd /opt/onu-parts-tracker');
  doc.moveDown();
  
  doc.text('2. Copy all application files to this directory');
  doc.text('3. Ensure the following structure exists:');
  doc.text('   /opt/onu-parts-tracker/');
  doc.text('   ├── client/');
  doc.text('   ├── server/');
  doc.text('   ├── shared/');
  doc.text('   ├── package.json');
  doc.text('   ├── package-lock.json');
  doc.text('   ├── tsconfig.json');
  doc.text('   └── vite.config.ts');
  doc.moveDown();
  
  doc.text('Install Dependencies:');
  doc.text('1. Navigate to application directory');
  doc.text('2. Install packages: "npm install"');
  doc.text('3. Build the application: "npm run build"');
  doc.addPage();
  
  // Chapter 5: Configuration
  doc.fontSize(16).font('Helvetica-Bold').text('5. Configuration');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Environment Variables:');
  doc.text('Create a .env file in the root directory with:');
  doc.moveDown();
  
  doc.text('# Database Configuration');
  doc.text('DATABASE_URL=postgresql://onu_admin:your_password@localhost:5432/onu_parts_tracker');
  doc.text('PGHOST=localhost');
  doc.text('PGPORT=5432');
  doc.text('PGUSER=onu_admin');
  doc.text('PGPASSWORD=your_secure_password');
  doc.text('PGDATABASE=onu_parts_tracker');
  doc.moveDown();
  
  doc.text('# Application Configuration');
  doc.text('NODE_ENV=production');
  doc.text('PORT=5000');
  doc.text('SESSION_SECRET=your_very_long_random_session_secret');
  doc.moveDown();
  
  doc.text('# Email Configuration (Optional)');
  doc.text('SENDGRID_API_KEY=your_sendgrid_api_key');
  doc.moveDown();
  
  doc.text('Important Security Notes:');
  doc.text('• Use strong, unique passwords');
  doc.text('• Generate a secure session secret (32+ characters)');
  doc.text('• Never commit .env files to version control');
  doc.text('• Restrict database access to localhost only');
  doc.addPage();
  
  // Chapter 6: Running the Application
  doc.fontSize(16).font('Helvetica-Bold').text('6. Running the Application');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Development Mode:');
  doc.text('npm run dev');
  doc.moveDown();
  
  doc.text('Production Mode:');
  doc.text('1. Build the application: "npm run build"');
  doc.text('2. Start the server: "npm start"');
  doc.moveDown();
  
  doc.text('Verify Installation:');
  doc.text('1. Open web browser');
  doc.text('2. Navigate to http://localhost:5000');
  doc.text('3. You should see the login page');
  doc.text('4. Use default admin credentials or create new user');
  doc.moveDown();
  
  doc.text('Default Admin Account:');
  doc.text('Username: admin');
  doc.text('Password: admin123 (change immediately after first login)');
  doc.moveDown();
  
  doc.text('Health Check:');
  doc.text('Test system health at: http://localhost:5000/api/health');
  doc.addPage();
  
  // Chapter 7: Production Deployment
  doc.fontSize(16).font('Helvetica-Bold').text('7. Production Deployment');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Process Manager (PM2):');
  doc.text('1. Install PM2 globally: "npm install -g pm2"');
  doc.text('2. Create ecosystem file: "pm2 ecosystem init"');
  doc.text('3. Configure ecosystem.config.js');
  doc.text('4. Start application: "pm2 start ecosystem.config.js"');
  doc.text('5. Save PM2 configuration: "pm2 save"');
  doc.text('6. Setup startup script: "pm2 startup"');
  doc.moveDown();
  
  doc.text('Reverse Proxy (Nginx):');
  doc.text('1. Install Nginx');
  doc.text('2. Configure virtual host for domain');
  doc.text('3. Setup SSL certificate with Let\'s Encrypt');
  doc.text('4. Configure proxy to localhost:5000');
  doc.moveDown();
  
  doc.text('Firewall Configuration:');
  doc.text('• Block direct access to port 5000 from external networks');
  doc.text('• Allow only port 80 and 443 for web traffic');
  doc.text('• Restrict PostgreSQL port 5432 to localhost only');
  doc.addPage();
  
  // Chapter 8: Backup and Maintenance
  doc.fontSize(16).font('Helvetica-Bold').text('8. Backup and Maintenance');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Automated Backups:');
  doc.text('The application includes automated backup features:');
  doc.text('• Weekly database backups (Sundays at 2:00 AM)');
  doc.text('• Manual backup via: POST /api/create-backup');
  doc.text('• Backup files stored in /backups directory');
  doc.moveDown();
  
  doc.text('Manual Database Backup:');
  doc.text('pg_dump -U onu_admin -h localhost onu_parts_tracker > backup_$(date +%Y%m%d).sql');
  doc.moveDown();
  
  doc.text('Database Restore:');
  doc.text('1. Stop the application');
  doc.text('2. Drop and recreate database');
  doc.text('3. Restore from backup:');
  doc.text('   psql -U onu_admin -h localhost onu_parts_tracker < backup_file.sql');
  doc.text('4. Restart application');
  doc.moveDown();
  
  doc.text('Log Management:');
  doc.text('• Application logs in /logs directory');
  doc.text('• Rotate logs weekly to prevent disk space issues');
  doc.text('• Monitor for error patterns and performance issues');
  doc.addPage();
  
  // Chapter 9: Troubleshooting
  doc.fontSize(16).font('Helvetica-Bold').text('9. Troubleshooting');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Common Issues and Solutions:');
  doc.moveDown();
  
  doc.text('Application won\'t start:');
  doc.text('• Check Node.js version: "node --version"');
  doc.text('• Verify PostgreSQL is running');
  doc.text('• Check .env file configuration');
  doc.text('• Review error logs in console output');
  doc.moveDown();
  
  doc.text('Database connection errors:');
  doc.text('• Verify PostgreSQL service status');
  doc.text('• Check database credentials in .env');
  doc.text('• Test connection with psql command');
  doc.text('• Ensure database exists and user has permissions');
  doc.moveDown();
  
  doc.text('Port already in use:');
  doc.text('• Change PORT in .env file');
  doc.text('• Kill process using port: "lsof -ti:5000 | xargs kill"');
  doc.text('• Use different port number');
  doc.moveDown();
  
  doc.text('Performance issues:');
  doc.text('• Check system resources (CPU, RAM, disk)');
  doc.text('• Review slow query logs');
  doc.text('• Monitor network connectivity');
  doc.text('• Check for database locks or long-running queries');
  doc.addPage();
  
  // Chapter 10: Security Considerations
  doc.fontSize(16).font('Helvetica-Bold').text('10. Security Considerations');
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  
  doc.text('Network Security:');
  doc.text('• Use firewall to restrict network access');
  doc.text('• Enable SSL/TLS encryption for web traffic');
  doc.text('• Limit database access to localhost');
  doc.text('• Regular security updates for all components');
  doc.moveDown();
  
  doc.text('Application Security:');
  doc.text('• Change default admin password immediately');
  doc.text('• Use strong session secrets');
  doc.text('• Implement proper user role management');
  doc.text('• Regular backup verification');
  doc.moveDown();
  
  doc.text('Data Protection:');
  doc.text('• Encrypt sensitive data at rest');
  doc.text('• Secure backup storage');
  doc.text('• Monitor access logs regularly');
  doc.text('• Implement data retention policies');
  doc.moveDown();
  
  doc.text('Monitoring:');
  doc.text('• Set up system health monitoring');
  doc.text('• Configure alerting for critical issues');
  doc.text('• Regular security audits');
  doc.text('• Monitor for suspicious activity');
  
  // Footer
  doc.fontSize(10).text('ONU Parts Tracker - Deployment Guide', 50, doc.page.height - 50);
  
  // Return a promise that resolves when the PDF is fully written
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(filepath);
    });
    
    doc.on('error', (error) => {
      reject(error);
    });
    
    doc.end();
  });
}