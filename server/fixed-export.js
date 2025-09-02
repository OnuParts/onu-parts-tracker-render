import pg from 'pg';
const { Pool } = pg;

// Direct export handler with completely fixed SQL queries
export default async function fixedExport(req, res) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get params
    const month = req.query.month;
    const type = req.query.type || 'all';
    
    console.log(`FIXED Excel Export: month=${month}, type=${type}`);
    
    if (!month) {
      return res.status(400).send('Month parameter is required');
    }
    
    // Parse the month string to create date range
    const [monthNum, yearNum] = month.split('/').map(n => parseInt(n));
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    
    // Arrays to hold our data
    let issuances = [];
    let deliveries = [];
    
    // Get issuance data if needed
    if (type === 'all' || type === 'chargeouts') {
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
            cc.code as cost_center_code,
            'Charge-Out' as type
          FROM parts_issuance pi
          LEFT JOIN parts p ON pi.part_id = p.id
          LEFT JOIN buildings b ON pi.building_id = b.id
          LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
          WHERE pi.issued_at BETWEEN $1 AND $2
          ORDER BY pi.issued_at DESC
        `, [startDate.toISOString(), endDate.toISOString()]);
        
        issuances = issuanceResult.rows || [];
        console.log(`FIXED Export: Found ${issuances.length} issuance records`);
      } catch (err) {
        console.error("Issuance query error:", err);
        // Continue instead of failing completely
      }
    }
    
    // Get delivery data if needed
    if (type === 'all' || type === 'deliveries') {
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
            cc.code as cost_center_code,
            'Delivery' as type
          FROM parts_delivery pd
          LEFT JOIN parts p ON pd.part_id = p.id
          LEFT JOIN buildings b ON pd.building_id = b.id
          LEFT JOIN cost_centers cc ON cc.id = pd.cost_center_id
          WHERE pd.delivered_at BETWEEN $1 AND $2
          ORDER BY pd.delivered_at DESC
        `, [startDate.toISOString(), endDate.toISOString()]);
        
        deliveries = deliveryResult.rows || [];
        console.log(`FIXED Export: Found ${deliveries.length} delivery records`);
      } catch (err) {
        console.error("Delivery query error:", err);
        // Continue instead of failing completely
      }
    }
    
    // Process the data to match our expected format with CORRECT column ordering
    const data = [...issuances, ...deliveries].map(item => {
      // Format date
      const date = new Date(item.issued_at);
      const formattedDate = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
      
      // Calculate extended price
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      
      return {
        date: formattedDate,
        partName: item.part_number || '',        // Part Number field correctly mapped
        description: item.part_name || '',       // Description field correctly mapped
        quantity,
        unitCost: unitCost ? `$${unitCost.toFixed(2)}` : '$0.00',
        extendedPrice: `$${extendedPrice.toFixed(2)}`,
        building: item.building_name || '',
        costCenter: item.cost_center_code || '',
        type: item.type || ''
      };
    });
    
    // Generate a simple CSV file - ultra reliable
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
    
    csvRows.push(`ONU Parts Report - ${month}`);
    csvRows.push('');
    csvRows.push(headers.join(','));
    
    // Add data rows
    let totalCost = 0;
    
    data.forEach(row => {
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
      
      // Add to total
      const price = parseFloat(row.extendedPrice.replace(/[^0-9.-]/g, '')) || 0;
      totalCost += price;
    });
    
    // Add total row
    csvRows.push('');
    csvRows.push(`TOTAL,,,,,$${totalCost.toFixed(2)},,`);
    
    // Combine into CSV string
    const csvString = csvRows.join('\n');
    
    // Determine report type for filename
    let reportType = 'Parts';
    if (type === 'deliveries') reportType = 'Deliveries';
    if (type === 'chargeouts') reportType = 'Charge-Outs';
    
    // Send response
    const filename = `ONU-${reportType}-Report-${month.replace('/', '-')}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvString);
    
  } catch (error) {
    console.error('Fixed export error:', error);
    res.status(500).send('Export failed: ' + (error.message || 'Unknown error'));
  } finally {
    // Always close the pool when done
    await pool.end();
  }
};
