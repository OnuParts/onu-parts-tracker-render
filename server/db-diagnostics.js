import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
  try {
    console.log("Checking database schema...");
    
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log("Tables:", tables.rows.map(r => r.table_name).join(', '));

    // Check parts_issuance columns
    const issuanceColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'parts_issuance'
      ORDER BY ordinal_position
    `);
    
    console.log("\nParts Issuance Columns:");
    issuanceColumns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Check parts_delivery columns
    const deliveryColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'parts_delivery'
      ORDER BY ordinal_position
    `);
    
    console.log("\nParts Delivery Columns:");
    deliveryColumns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Try a simple join test for real data
    const testQuery = await pool.query(`
      SELECT 
        pi.id, 
        pi.issued_at, 
        p.name as part_name,
        p.part_id as part_number,
        pi.quantity,
        pi.cost_center
      FROM parts_issuance pi
      JOIN parts p ON pi.part_id = p.id
      LIMIT 1
    `);
    
    if (testQuery.rows.length > 0) {
      console.log("\nSample row:", testQuery.rows[0]);
    } else {
      console.log("\nNo sample rows found");
    }
    
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await pool.end();
  }
}

checkSchema();
