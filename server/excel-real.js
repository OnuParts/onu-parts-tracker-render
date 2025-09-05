import pg from 'pg';
import * as XLSX from 'xlsx';
const { Pool } = pg;

// CORRECTED EXCEL FILE GENERATOR - GENERATES PROPER XLSX FILES
export default async function excelExport(req, res) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get params
    const month = req.query.month;
    const type = req.query.type || 'all';
    
    console.log(`Excel Export (proper XLSX file): month=${month}, type=${type}`);
    
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
        console.log("Querying issuance data...");
        // Direct, simplified query that won't fail with schema differences
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
        console.log(`Found ${issuances.length} issuance records for Excel export`);
      } catch (err) {
        console.error("Issuance query error:", err);
      }
    }
    
    // Get delivery data if needed
    if (type === 'all' || type === 'deliveries') {
      try {
        console.log("Querying delivery data...");
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
        console.log(`Found ${deliveries.length} delivery records for Excel export`);
      } catch (err) {
        console.error("Delivery query error:", err);
        // Still continue processing issuance records even if deliveries fail
      }
    }
    
    // Combine and process the data for Excel format
    const combinedData = [...issuances, ...deliveries];
    console.log(`Processing ${combinedData.length} total records for export`);
    
    // Create a proper Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheets
    const ws = XLSX.utils.aoa_to_sheet([
      [`ONU Parts Report - ${month}`], // Title row
      [], // Empty row for spacing
      [
        'Date', 
        'Part Number', 
        'Description', 
        'Quantity',
        'Unit Cost',
        'Extended Price',
        'Building',
        'Cost Center',
        'Type'
      ] // Headers row
    ]);
    
    let totalCost = 0;
    let rowNum = 3; // Start at row 4 (0-indexed)
    
    // Add each data row
    for (const item of combinedData) {
      // Format date
      const date = new Date(item.issued_at);
      const formattedDate = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
      
      // Calculate extended price
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      totalCost += extendedPrice;
      
      // Add row to worksheet
      XLSX.utils.sheet_add_aoa(ws, [[
        formattedDate,
        item.part_number || '',
        item.part_name || '',
        quantity,
        unitCost ? `$${unitCost.toFixed(2)}` : '$0.00',
        `$${extendedPrice.toFixed(2)}`,
        item.building_name || '',
        item.cost_center || '',
        item.type || ''
      ]], { origin: { r: rowNum, c: 0 } });
      
      rowNum++;
    }
    
    // Add empty row
    rowNum++;
    
    // Add total row at bottom
    XLSX.utils.sheet_add_aoa(ws, [[
      'TOTAL', '', '', '', '', `$${totalCost.toFixed(2)}`, '', ''
    ]], { origin: { r: rowNum, c: 0 } });
    
    // Set column widths
    ws['!cols'] = [
      { width: 12 },  // Date
      { width: 15 },  // Part Number
      { width: 30 },  // Description
      { width: 10 },  // Quantity
      { width: 12 },  // Unit Cost
      { width: 15 },  // Extended Price
      { width: 20 },  // Building
      { width: 15 },  // Cost Center
      { width: 12 }   // Type
    ];
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    
    // Write the workbook to buffer
    const excelBuffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx'
    });
    
    // Determine report type for filename
    let reportType = 'Parts';
    if (type === 'deliveries') reportType = 'Deliveries';
    if (type === 'chargeouts') reportType = 'Charge-Outs';
    
    // Send the Excel file
    const filename = `ONU-${reportType}-Report-${month.replace('/', '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).send('Export failed: ' + (error.message || 'Unknown error'));
  } finally {
    await pool.end();
  }
};