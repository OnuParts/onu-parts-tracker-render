import { pool } from './db.js';

// Direct SQL query test
async function testExport() {
  try {
    const startDate = new Date(2025, 3, 1); // April 1st
    const endDate = new Date(2025, 3, 30, 23, 59, 59); // April 30th
    
    console.log(`Testing issuance query...`);
    
    // Test the issuance query
    const issuanceResult = await pool.query(`
      SELECT 
        pi.id,
        pi.issued_at,
        p.name as part_name,
        p.part_id as part_number,
        pi.quantity,
        p.unit_cost,
        b.name as building_name,
        cc.code as cost_center_code 
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      LEFT JOIN buildings b ON pi.building_id = b.id
      LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
      WHERE pi.issued_at BETWEEN $1 AND $2
      LIMIT 1
    `, [startDate.toISOString(), endDate.toISOString()]);
    
    console.log(`Issuance query result:`, issuanceResult.rows[0]);
    
    console.log(`Testing delivery query...`);
    
    // Test the delivery query
    const deliveryResult = await pool.query(`
      SELECT 
        pd.id,
        pd.delivered_at as issued_at, 
        p.name as part_name,
        p.part_id as part_number,
        pd.quantity,
        p.unit_cost,
        b.name as building_name,
        cc.code as cost_center_code
      FROM parts_delivery pd
      LEFT JOIN parts p ON pd.part_id = p.id
      LEFT JOIN buildings b ON pd.building_id = b.id
      LEFT JOIN cost_centers cc ON cc.id = pd.cost_center_id
      WHERE pd.delivered_at BETWEEN $1 AND $2
      LIMIT 1
    `, [startDate.toISOString(), endDate.toISOString()]);
    
    console.log(`Delivery query result:`, deliveryResult.rows[0]);
    
    // Test a direct export to see content
    console.log("Creating direct export file...");
    
    // Process sample data
    const data = [
      ...issuanceResult.rows.map(item => ({
        ...item,
        type: 'Charge-Out'
      })),
      ...deliveryResult.rows.map(item => ({
        ...item,
        type: 'Delivery'
      }))
    ];
    
    const processed = data.map(item => {
      // Format date
      const date = new Date(item.issued_at);
      const formattedDate = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
      
      // Calculate extended price
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      
      return {
        date: formattedDate,
        partName: item.part_number || '',
        description: item.part_name || '',
        quantity,
        unitCost: unitCost ? `$${unitCost.toFixed(2)}` : '$0.00',
        extendedPrice: `$${extendedPrice.toFixed(2)}`,
        building: item.building_name || '',
        costCenter: item.cost_center_code || '',
        type: item.type || ''
      };
    });
    
    console.log("Processed data:", processed);
    
    // Create CSV
    const csvRows = [];
    
    // Add headers
    const headers = [
      'Date', 
      'Part Number', 
      'Description', 
      'Quantity', 
      'Unit Cost', 
      'Extended Price', 
      'Building', 
      'Cost Center', 
      'Type'
    ];
    
    csvRows.push(`ONU Parts Report - Test`);
    csvRows.push('');
    csvRows.push(headers.join(','));
    
    // Add data rows
    processed.forEach(row => {
      const values = [
        row.date,
        `"${(row.partName || '').replace(/"/g, '""')}"`,
        `"${(row.description || '').replace(/"/g, '""')}"`,
        row.quantity,
        row.unitCost,
        row.extendedPrice,
        `"${(row.building || '').replace(/"/g, '""')}"`,
        `"${(row.costCenter || '').replace(/"/g, '""')}"`,
        row.type
      ];
      
      csvRows.push(values.join(','));
    });
    
    // Print sample CSV
    console.log("CSV Output:");
    console.log(csvRows.join('\n'));
    
  } catch (err) {
    console.error("Error in test:", err);
  } finally {
    await pool.end();
  }
}

// Run the test
testExport();
