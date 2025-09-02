import pg from 'pg';
import * as XLSX from 'xlsx';
const { Pool } = pg;

// Debug-focused Excel export function
export default async function excelDebugExport(req, res) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log("==== DEBUG EXCEL EXPORT START ====");
  
  try {
    // Get params
    const month = req.query.month || '04/2025';
    const type = req.query.type || 'all';
    
    console.log(`DEBUG Excel Export: month=${month}, type=${type}`);
    
    // Parse month
    const [monthNum, yearNum] = month.split('/').map(n => parseInt(n));
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // First, check table schemas directly
    console.log("Checking table schemas...");
    
    const issuanceColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parts_issuance'
      ORDER BY ordinal_position
    `);
    
    console.log("Parts Issuance columns:", issuanceColumns.rows.map(r => r.column_name).join(', '));
    
    const deliveryColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parts_delivery'
      ORDER BY ordinal_position
    `);
    
    console.log("Parts Delivery columns:", deliveryColumns.rows.map(r => r.column_name).join(', '));
    
    // Test a very simple query first to see if it works at all
    console.log("Testing very basic query first...");
    const basicQuery = await pool.query(`
      SELECT * FROM parts_issuance LIMIT 3
    `);
    
    console.log(`Basic query result count: ${basicQuery.rows.length}`);
    if (basicQuery.rows.length > 0) {
      console.log("Sample row:", JSON.stringify(basicQuery.rows[0]));
    }
    
    // Now try the actual queries
    console.log("\nTesting issuance query...");
    
    // Issuance data
    let issuances = [];
    try {
      const issuanceResult = await pool.query(`
        SELECT 
          pi.id,
          pi.issued_at,
          p.name as part_name,
          p.part_id as part_number,
          pi.quantity,
          p.unit_cost,
          b.name as building_name,
          pi.cost_center,
          'Charge-Out' as type
        FROM parts_issuance pi
        LEFT JOIN parts p ON pi.part_id = p.id
        LEFT JOIN buildings b ON pi.building_id = b.id
        WHERE pi.issued_at BETWEEN $1 AND $2
        ORDER BY pi.issued_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      
      issuances = issuanceResult.rows || [];
      console.log(`Found ${issuances.length} issuance records`);
      if (issuances.length > 0) {
        console.log("Sample issuance:", JSON.stringify(issuances[0]));
      }
    } catch (err) {
      console.error("Issuance query error:", err);
    }
    
    // Delivery data
    console.log("\nTesting delivery query...");
    let deliveries = [];
    try {
      const deliveryResult = await pool.query(`
        SELECT 
          pd.id,
          pd.delivered_at as issued_at,
          p.name as part_name,
          p.part_id as part_number,
          pd.quantity,
          p.unit_cost,
          b.name as building_name,
          (SELECT code FROM cost_centers WHERE id = pd.cost_center_id) as cost_center,
          'Delivery' as type
        FROM parts_delivery pd
        LEFT JOIN parts p ON pd.part_id = p.id
        LEFT JOIN buildings b ON pd.building_id = b.id
        WHERE pd.delivered_at BETWEEN $1 AND $2
        ORDER BY pd.delivered_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      
      deliveries = deliveryResult.rows || [];
      console.log(`Found ${deliveries.length} delivery records`);
      if (deliveries.length > 0) {
        console.log("Sample delivery:", JSON.stringify(deliveries[0]));
      }
    } catch (err) {
      console.error("Delivery query error:", err);
    }
    
    // Analyze combined data
    const combinedData = [...issuances, ...deliveries];
    console.log(`Total combined records: ${combinedData.length}`);
    
    // Check for data issues
    let hasNullOrUndefined = false;
    let hasNaNValues = false;
    
    combinedData.forEach((item, index) => {
      if (!item.issued_at || !item.part_number || !item.part_name) {
        console.log(`Record ${index} has null essential fields:`, JSON.stringify(item));
        hasNullOrUndefined = true;
      }
      
      const unitCost = parseFloat(item.unit_cost || 0);
      if (isNaN(unitCost)) {
        console.log(`Record ${index} has NaN unit cost:`, item.unit_cost);
        hasNaNValues = true;
      }
    });
    
    console.log(`Data issues: hasNullOrUndefined=${hasNullOrUndefined}, hasNaNValues=${hasNaNValues}`);
    
    // Calculate the expected total
    let totalValue = 0;
    combinedData.forEach(item => {
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      totalValue += extendedPrice;
    });
    
    console.log(`Expected total value: $${totalValue.toFixed(2)}`);
    
    // Send response with debugging info
    res.status(200).send(`
      <h1>Excel Export Debug Results</h1>
      <p>Month: ${month}</p>
      <p>Type: ${type}</p>
      <p>Date range: ${startDate.toISOString()} to ${endDate.toISOString()}</p>
      <p>Issuance records: ${issuances.length}</p>
      <p>Delivery records: ${deliveries.length}</p>
      <p>Total combined records: ${combinedData.length}</p>
      <p>Expected total value: $${totalValue.toFixed(2)}</p>
      <p>Data issues: hasNullOrUndefined=${hasNullOrUndefined}, hasNaNValues=${hasNaNValues}</p>
      
      <h2>Sample Data:</h2>
      <pre>${JSON.stringify(combinedData.slice(0, 3), null, 2)}</pre>
    `);
    
  } catch (error) {
    console.error('Debug export error:', error);
    res.status(500).send(`Export debug failed: ${error.message || 'Unknown error'}`);
  } finally {
    console.log("==== DEBUG EXCEL EXPORT END ====");
    await pool.end();
  }
}

// Debug handler is already exported above
// No need for a second export
