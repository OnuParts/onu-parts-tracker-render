import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getSchema() {
  try {
    // First, get all table names
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log("Tables in database:", tables.rows.map(r => r.table_name).join(', '));
    
    // Now let's check buildings table
    const buildingsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'buildings'
      ORDER BY ordinal_position
    `);
    
    console.log("\nBuildings table columns:");
    buildingsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Check the cost_centers table too
    const ccColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cost_centers'
      ORDER BY ordinal_position
    `);
    
    console.log("\nCost centers table columns:");
    ccColumns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Check parts_issuance
    const piColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parts_issuance'
      ORDER BY ordinal_position
    `);
    
    console.log("\nParts issuance table columns:");
    piColumns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Check parts_delivery
    const pdColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parts_delivery'
      ORDER BY ordinal_position
    `);
    
    console.log("\nParts delivery table columns:");
    pdColumns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Check a sample join to see how it actually works
    const sampleJoin = await pool.query(`
      SELECT 
        b.id as building_id,
        b.name as building_name,
        b.cost_center_id,
        cc.id as cc_id,
        cc.code as cost_center_code
      FROM 
        buildings b
      LEFT JOIN 
        cost_centers cc ON b.cost_center_id = cc.id
      LIMIT 1
    `);
    
    console.log("\nSample join result:");
    console.log(sampleJoin.rows[0]);
    
  } catch(err) {
    console.error("Database error:", err);
  } finally {
    await pool.end();
  }
}

getSchema();
