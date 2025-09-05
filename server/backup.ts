import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { JWT } from 'google-auth-library';
import { drive_v3 } from '@googleapis/drive';
import { log } from './vite';

const execPromise = promisify(exec);
const fsPromises = fs.promises;

// Backup directory
const BACKUP_DIR = path.resolve(process.cwd(), 'backups');

// Ensure the backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Generate a database backup using pg_dump
 */
export async function generateDatabaseBackup(): Promise<string> {
  try {
    // Extract connection info from environment variable
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable not found');
    }

    // Create a timestamp for the backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    log(`Creating database backup: ${backupFilename}`, 'backup');
    
    // Run pg_dump to create a backup
    await execPromise(`pg_dump "${connectionString}" > "${backupPath}"`);
    
    log(`Database backup created successfully at ${backupPath}`, 'backup');
    return backupPath;
  } catch (error) {
    log(`Error generating database backup: ${error}`, 'backup');
    throw error;
  }
}

/**
 * Initialize Google Drive client using service account credentials
 */
function getDriveClient(): drive_v3.Drive | null {
  try {
    const credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };
    
    if (!credentials.client_email || !credentials.private_key) {
      log('Google Drive credentials not found in environment variables', 'backup');
      return null;
    }
    
    const jwtClient = new JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/drive']
    );
    
    // Import dynamically to avoid TypeScript errors
    // The drive module is available at runtime via @googleapis/drive
    const { google } = require('@googleapis/drive');
    const drive = google.drive({
      version: 'v3',
      auth: jwtClient
    });
    
    return drive;
  } catch (error) {
    log(`Error initializing Google Drive client: ${error}`, 'backup');
    return null;
  }
}

/**
 * Upload a file to Google Drive
 */
export async function uploadToGoogleDrive(filePath: string): Promise<void> {
  try {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error('Google Drive client could not be initialized');
    }
    
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable not found');
    }
    
    const fileName = path.basename(filePath);
    log(`Uploading ${fileName} to Google Drive...`, 'backup');
    
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/sql',
        parents: [folderId]
      },
      media: {
        mimeType: 'application/sql',
        body: fs.createReadStream(filePath)
      }
    });
    
    log(`File uploaded successfully to Google Drive with ID: ${response.data.id}`, 'backup');
  } catch (error) {
    log(`Error uploading to Google Drive: ${error}`, 'backup');
    throw error;
  }
}

/**
 * Clean up old local backup files, keeping only the latest 5
 */
async function cleanupOldBackups(): Promise<void> {
  try {
    const files = await fsPromises.readdir(BACKUP_DIR);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    if (sqlFiles.length <= 5) return;
    
    // Sort files by last modified time (oldest first)
    const fileStats = await Promise.all(
      sqlFiles.map(async file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fsPromises.stat(filePath);
        return { file, path: filePath, mtime: stats.mtime };
      })
    );
    
    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
    
    // Remove oldest files, keeping the latest 5
    const filesToDelete = fileStats.slice(0, fileStats.length - 5);
    for (const fileInfo of filesToDelete) {
      log(`Removing old backup: ${fileInfo.file}`, 'backup');
      await fsPromises.unlink(fileInfo.path);
    }
  } catch (error) {
    log(`Error cleaning up old backups: ${error}`, 'backup');
  }
}

/**
 * Run a full backup process - generate backup and upload to Google Drive
 */
export async function runBackup(): Promise<void> {
  try {
    log('Starting backup process...', 'backup');
    
    // Create the database backup
    const backupFilePath = await generateDatabaseBackup();
    
    // Upload to Google Drive if credentials are available
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
        process.env.GOOGLE_PRIVATE_KEY && 
        process.env.GOOGLE_DRIVE_FOLDER_ID) {
      await uploadToGoogleDrive(backupFilePath);
    } else {
      log('Google Drive credentials not configured, skipping upload', 'backup');
    }
    
    // Clean up old backup files
    await cleanupOldBackups();
    
    log('Backup process completed successfully', 'backup');
  } catch (error) {
    log(`Backup process failed: ${error}`, 'backup');
  }
}

/**
 * Schedule weekly backups (runs every Sunday at 2:00 AM)
 */
export function scheduleWeeklyBackups(): void {
  // Schedule for every Sunday at 2:00 AM
  cron.schedule('0 2 * * 0', async () => {
    log('Running scheduled weekly backup...', 'backup');
    await runBackup();
  });
  
  log('Weekly backup scheduled (Sundays at 2:00 AM)', 'backup');
}

/**
 * Manual backup route handler for API
 */
export async function manualBackupHandler(): Promise<{ success: boolean; message: string }> {
  try {
    await runBackup();
    return { success: true, message: 'Backup completed successfully' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Backup failed: ${errorMessage}` };
  }
}