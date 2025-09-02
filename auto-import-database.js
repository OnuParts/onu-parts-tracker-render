const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
  console.log('Starting automatic database import...');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found');
    return false;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check if database is already populated
    const result = await pool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'");
    const tableCount = parseInt(result.rows[0].count);
    
    if (tableCount > 5) {
      console.log('Database already populated, skipping import');
      return true;
    }
    
    console.log('Importing database schema and data...');
    const sqlFile = fs.readFileSync(path.join(__dirname, 'complete-database.sql'), 'utf8');
    
    // Split into smaller chunks and execute
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';';
      if (statement.length > 5) {
        try {
          await pool.query(statement);
        } catch (err) {
          // Skip duplicate/constraint errors during import
          if (!err.message.includes('already exists') && 
              !err.message.includes('duplicate key') &&
              !err.message.includes('violates foreign key')) {
            console.error('SQL Error:', err.message.substring(0, 100));
          }
        }
      }
      
      if (i % 100 === 0) {
        console.log(`Imported ${i}/${statements.length} statements...`);
      }
    }
    
    console.log('Database import completed successfully');
    return true;
    
  } catch (error) {
    console.error('Database import failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

module.exports = { importDatabase };