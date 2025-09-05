import fs from 'fs';
import path from 'path';
import { createExportPackage } from './export-package.js';

// Simple deployment guide as plain text that works reliably
export function createDeploymentGuide(): string {
  const guide = `ONU PARTS TRACKER - LOCAL DEPLOYMENT GUIDE
===============================================

SYSTEM REQUIREMENTS
------------------
- Node.js 18+ 
- PostgreSQL 12+
- 4GB RAM minimum
- 10GB available disk space

PREREQUISITES INSTALLATION
------------------------

Windows:
1. Download Node.js from https://nodejs.org/
2. Download PostgreSQL from https://postgresql.org/download/windows/
3. Run installers and note PostgreSQL password

macOS:
1. Install Homebrew: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
2. Install Node.js: brew install node
3. Install PostgreSQL: brew install postgresql
4. Start PostgreSQL: brew services start postgresql

Linux (Ubuntu/Debian):
1. Update packages: sudo apt update
2. Install Node.js: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs
3. Install PostgreSQL: sudo apt install postgresql postgresql-contrib
4. Start PostgreSQL: sudo systemctl start postgresql

DATABASE SETUP
-------------
1. Connect to PostgreSQL:
   psql -U postgres

2. Create database and user:
   CREATE DATABASE onu_parts_tracker;
   CREATE USER onu_admin WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE onu_parts_tracker TO onu_admin;
   GRANT ALL ON SCHEMA public TO onu_admin;
   \\q

3. Test connection:
   psql -U onu_admin -d onu_parts_tracker -h localhost

APPLICATION INSTALLATION
-----------------------
1. Extract the downloaded package to your desired directory
2. Open terminal/command prompt in that directory
3. Install dependencies: npm install
4. Copy .env.template to .env
5. Edit .env file with your database credentials:
   DATABASE_URL=postgresql://onu_admin:your_password@localhost:5432/onu_parts_tracker
   SESSION_SECRET=your_very_long_random_session_secret

RUNNING THE APPLICATION
---------------------
Development mode: npm run dev
Production mode: npm start

The application will be available at: http://localhost:5000

DEFAULT LOGIN CREDENTIALS
------------------------
Username: admin
Password: admin123

IMPORTANT: Change the default password immediately after first login!

SECURITY CONSIDERATIONS
---------------------
- Use strong, unique passwords
- Generate secure session secrets (32+ characters)
- Configure firewall to restrict access
- Enable SSL for production use
- Regular backups and updates

TROUBLESHOOTING
--------------
Common Issues:
- Port 5000 in use: Change PORT in .env file
- Database connection failed: Check PostgreSQL service and credentials
- npm install errors: Ensure Node.js version 18+
- Permission errors: Run as administrator/sudo for system-level operations

For detailed troubleshooting and production deployment instructions,
visit the System Administration dashboard in the application.

Generated: ${new Date().toISOString()}
`;

  const guidePath = path.join(process.cwd(), 'onu-deployment-guide.txt');
  fs.writeFileSync(guidePath, guide);
  return guidePath;
}

export async function getExportPackage(): Promise<string> {
  return await createExportPackage();
}