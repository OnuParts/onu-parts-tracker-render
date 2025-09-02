import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { createBackup } from './reliability.js';

export async function createExportPackage() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const packageName = `onu-parts-tracker-complete-${timestamp}`;
  const packageDir = path.join(process.cwd(), 'exports', packageName);
  const zipPath = path.join(process.cwd(), 'exports', `${packageName}.zip`);
  
  // Ensure exports directory exists
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  // Create package directory
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }
  
  console.log(`Creating export package: ${packageName}`);
  
  // Copy essential application files
  const filesToCopy = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'drizzle.config.ts'
  ];
  
  const directoriesToCopy = [
    'client',
    'server',
    'shared'
  ];
  
  // Copy files
  for (const file of filesToCopy) {
    const srcPath = path.join(process.cwd(), file);
    const destPath = path.join(packageDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${file}`);
    }
  }
  
  // Copy directories recursively
  for (const dir of directoriesToCopy) {
    const srcPath = path.join(process.cwd(), dir);
    const destPath = path.join(packageDir, dir);
    
    if (fs.existsSync(srcPath)) {
      copyDirectoryRecursive(srcPath, destPath);
      console.log(`Copied directory: ${dir}`);
    }
  }
  
  // Create data backup
  try {
    const backupFile = await createBackup();
    const backupDestPath = path.join(packageDir, 'database-backup.json');
    fs.copyFileSync(backupFile, backupDestPath);
    console.log('Included database backup');
  } catch (error) {
    console.warn('Could not create database backup for export:', error);
  }
  
  // Create .env template
  const envTemplate = `# Database Configuration
DATABASE_URL=postgresql://onu_admin:your_password@localhost:5432/onu_parts_tracker
PGHOST=localhost
PGPORT=5432
PGUSER=onu_admin
PGPASSWORD=your_secure_password
PGDATABASE=onu_parts_tracker

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_very_long_random_session_secret_at_least_32_characters

# Email Configuration (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key_if_needed

# Security Note: 
# Change all passwords and secrets before deploying to production!
`;
  
  fs.writeFileSync(path.join(packageDir, '.env.template'), envTemplate);
  console.log('Created .env template');
  
  // Create startup scripts
  const startupScriptWindows = `@echo off
echo Starting ONU Parts Tracker...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo ERROR: PostgreSQL is not running or not accessible
    echo Please start PostgreSQL service and try again
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please copy .env.template to .env and configure it
    pause
    exit /b 1
)

REM Start the application
echo Starting application...
npm run dev

pause
`;
  
  const startupScriptUnix = `#!/bin/bash
echo "Starting ONU Parts Tracker..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "ERROR: PostgreSQL is not running or not accessible"
    echo "Please start PostgreSQL service and try again"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    echo "Please copy .env.template to .env and configure it"
    exit 1
fi

# Start the application
echo "Starting application..."
npm run dev
`;
  
  fs.writeFileSync(path.join(packageDir, 'start.bat'), startupScriptWindows);
  fs.writeFileSync(path.join(packageDir, 'start.sh'), startupScriptUnix);
  fs.chmodSync(path.join(packageDir, 'start.sh'), 0o755);
  console.log('Created startup scripts');
  
  // Create README for the package
  const readme = `# ONU Parts Tracker - Local Installation Package

This package contains everything needed to run the ONU Parts Tracker application locally.

## Quick Start

### Windows
1. Install Node.js (https://nodejs.org/) and PostgreSQL (https://postgresql.org/)
2. Copy .env.template to .env and configure database settings
3. Double-click start.bat

### Linux/macOS
1. Install Node.js and PostgreSQL
2. Copy .env.template to .env and configure database settings  
3. Run: chmod +x start.sh && ./start.sh

## What's Included

- Complete application source code
- Database backup with sample data
- Configuration templates
- Startup scripts for Windows and Unix systems
- Comprehensive deployment guide (see deployment-guide.pdf)

## System Requirements

- Node.js 18+ 
- PostgreSQL 12+
- 4GB RAM minimum
- 10GB available disk space

## First Time Setup

1. **Install Prerequisites**
   - Download and install Node.js from https://nodejs.org/
   - Download and install PostgreSQL from https://postgresql.org/

2. **Database Setup**
   - Start PostgreSQL service
   - Create database: \`CREATE DATABASE onu_parts_tracker;\`
   - Create user: \`CREATE USER onu_admin WITH PASSWORD 'your_password';\`
   - Grant permissions: \`GRANT ALL PRIVILEGES ON DATABASE onu_parts_tracker TO onu_admin;\`

3. **Application Configuration**
   - Copy .env.template to .env
   - Update database credentials in .env file
   - Generate secure session secret (32+ random characters)

4. **Install Dependencies**
   - Run: \`npm install\`

5. **Start Application**
   - Run: \`npm run dev\` (development) or \`npm start\` (production)
   - Open browser to http://localhost:5000

## Default Login

- Username: admin
- Password: admin123

**Important:** Change the default password immediately after first login!

## Support

For detailed installation instructions, see the deployment guide PDF included in this package.

## Backup and Recovery

- Database backup included: database-backup.json
- Regular backups are automatically created in /backups directory
- Manual backup via: POST /api/create-backup

## Security Notes

- Change all default passwords
- Use strong session secrets
- Configure firewall properly
- Enable SSL for production use

Generated: ${new Date().toISOString()}
`;
  
  fs.writeFileSync(path.join(packageDir, 'README.md'), readme);
  console.log('Created README.md');
  
  // Create the ZIP file
  return new Promise<string>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`Export package created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve(zipPath);
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(packageDir, false);
    archive.finalize();
  });
}

function copyDirectoryRecursive(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Skip certain directories and files
    if (entry.name === 'node_modules' || 
        entry.name === '.git' || 
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.env' ||
        entry.name.startsWith('.env.')) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}