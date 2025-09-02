const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkDb() {
  try {
    console.log("Checking buildings table structure...");
    
    const result = await pool.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'buildings' 
      ORDER BY 
        ordinal_position
    `);
    
    console.log("Buildings table columns:", result.rows);
    
    // Also check cost_centers table for completeness
    const costCenters = await pool.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'cost_centers' 
      ORDER BY 
        ordinal_position
    `);
    
    console.log("Cost centers table columns:", costCenters.rows);
    
    // Check our actual data
    const sample = await pool.query(`
      SELECT 
        b.*, 
        cc.* 
      FROM 
        buildings b
      LEFT JOIN 
        cost_centers cc ON cc.id = b.cost_center_id 
      LIMIT 1
    `);
    
    console.log("Sample building with cost center:", sample.rows[0]);
    
  } catch (err) {
    console.error("Error checking database:", err);
  } finally {
    pool.end();
  }
}

checkDb();
