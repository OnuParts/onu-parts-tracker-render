import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

const backupData = JSON.parse(fs.readFileSync('./exports/onu-parts-tracker-complete-2025-06-16T12-19-39-157Z/database-backup.json', 'utf8'));

export async function importAllData() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found - skipping data import');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Importing all data to production database...');
    
    // Import users
    for (const user of backupData.users) {
      await pool.query(
        'INSERT INTO users (id, username, password, name, email, role, department, phone, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (username) DO NOTHING',
        [user.id, user.username, user.password, user.name, user.email, user.role, user.department, user.phone, user.created_at]
      );
    }
    console.log(`✅ Imported ${backupData.users.length} users`);

    // Import parts
    for (const part of backupData.parts) {
      await pool.query(
        'INSERT INTO parts (id, part_id, name, description, quantity, reorder_level, unit_cost, category, location, supplier, last_restock_date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (part_id) DO NOTHING',
        [part.id, part.part_id, part.name, part.description, part.quantity, part.reorder_level, part.unit_cost, part.category, part.location, part.supplier, part.last_restock_date, part.created_at]
      );
    }
    console.log(`✅ Imported ${backupData.parts.length} parts`);

    // Import buildings if they exist
    if (backupData.buildings && backupData.buildings.length > 0) {
      for (const building of backupData.buildings) {
        await pool.query(
          'INSERT INTO buildings (id, name, location, description, contact_person, contact_email, contact_phone, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
          [building.id, building.name, building.location, building.description, building.contact_person, building.contact_email, building.contact_phone, building.active, building.created_at]
        );
      }
      console.log(`✅ Imported ${backupData.buildings.length} buildings`);
    }

    // Import cost centers if they exist
    if (backupData.costCenters && backupData.costCenters.length > 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS cost_centers (
          id SERIAL PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      for (const cc of backupData.costCenters) {
        await pool.query(
          'INSERT INTO cost_centers (id, code, name, active, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING',
          [cc.id, cc.code, cc.name, cc.active, cc.created_at]
        );
      }
      console.log(`✅ Imported ${backupData.costCenters.length} cost centers`);
    }

    // Import staff members if they exist
    if (backupData.staff && backupData.staff.length > 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS staff (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          building_id INTEGER,
          department VARCHAR(255),
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      for (const staff of backupData.staff) {
        await pool.query(
          'INSERT INTO staff (id, name, email, building_id, department, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
          [staff.id, staff.name, staff.email, staff.buildingId, staff.department, staff.active, staff.created_at]
        );
      }
      console.log(`✅ Imported ${backupData.staff.length} staff members`);
    }

    console.log('🎉 All data imported successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}