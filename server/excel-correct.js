import { db } from './db.js';
import xlsx from 'xlsx';

async function excelExport(req, res) {
  try {
    const { month, type = 'combined' } = req.query;
    
    if (!month) {
      return res.status(400).send('Month parameter is required');
    }
    
    console.log(`Processing Excel export for month ${month}, type: ${type}`);
    
    // Parse month string to get month and year
    console.log(`Parsing month string: ${month}`);
    const [monthNum, year] = month.split('/');
    console.log(`Parsed month: ${monthNum}, year: ${year}`);
    
    // Create date range - first and last day of month
    const startDate = new Date(Number(year), Number(monthNum) - 1, 1);
    const endDate = new Date(Number(year), Number(monthNum), 0); // Last day of month
    
    // Format dates for SQL query - IMPORTANT: Use YYYY-MM-DD format
    const startDateStr = `${year}-${monthNum.padStart(2, '0')}-01`;
    const endDateStr = `${year}-${monthNum.padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
    
    console.log(`Fixed date range: ${startDateStr} to ${endDateStr} (Manual formatting)`);
    console.log(`Original date objects: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    console.log(`Date range: ${startDateStr} to ${endDateStr}`);
    
    let data = [];
    let filename = '';
    
    if (type === 'combined' || type === 'charge-outs') {
      // Get charge-out data directly with SQL query
      const issuanceQuery = `
        SELECT 
          i.id, 
          i.date,
          i.quantity,
          p.name AS part_name,
          p.part_number,
          p.unit_cost,
          p.unit_of_measure,
          s.name AS staff_name,
          b.name AS building_name,
          cc.code AS cost_center_code,
          cc.name AS cost_center_name
        FROM 
          parts_issuance i
        JOIN 
          parts p ON i.part_id = p.id
        JOIN 
          staff s ON i.staff_id = s.id
        LEFT JOIN 
          buildings b ON i.building_id = b.id
        LEFT JOIN 
          cost_centers cc ON i.cost_center_id = cc.id
        WHERE 
          i.date BETWEEN '${startDateStr}' AND '${endDateStr}'
        ORDER BY 
          i.date DESC
      `;
      
      const issuanceResult = await db.query(issuanceQuery);
      console.log(`Found ${issuanceResult.rows.length} issuance records`);
      
      if (type === 'charge-outs') {
        data = issuanceResult.rows;
        filename = `ONU-Charge-Outs-Report-${monthNum}_${year}.xlsx`;
      } else if (type === 'combined') {
        // Also get delivery data for combined report
        const deliveryQuery = `
          SELECT 
            pd.id, 
            pd.date,
            pd.quantity,
            p.name AS part_name,
            p.part_number,
            p.unit_cost,
            p.unit_of_measure,
            s.name AS staff_name,
            b.name AS building_name,
            NULL AS cost_center_code,
            NULL AS cost_center_name
          FROM 
            parts_delivery pd
          JOIN 
            parts p ON pd.part_id = p.id
          JOIN 
            staff s ON pd.staff_id = s.id
          LEFT JOIN 
            buildings b ON s.building_id = b.id
          WHERE 
            pd.date BETWEEN '${startDateStr}' AND '${endDateStr}'
          ORDER BY 
            pd.date DESC
        `;
        
        const deliveryResult = await db.query(deliveryQuery);
        console.log(`Found ${deliveryResult.rows.length} delivery records`);
        
        // Format data for combined report
        data = [
          ...issuanceResult.rows.map(row => ({
            ...row,
            type: 'Charge-Out'
          })),
          ...deliveryResult.rows.map(row => ({
            ...row,
            type: 'Delivery'
          }))
        ];
        
        filename = `ONU-Combined-Report-${monthNum}_${year}.xlsx`;
      }
    } else if (type === 'deliveries') {
      // Get only delivery data
      const deliveryQuery = `
        SELECT 
          pd.id, 
          pd.date,
          pd.quantity,
          p.name AS part_name,
          p.part_number,
          p.unit_cost,
          p.unit_of_measure,
          s.name AS staff_name,
          b.name AS building_name
        FROM 
          parts_delivery pd
        JOIN 
          parts p ON pd.part_id = p.id
        JOIN 
          staff s ON pd.staff_id = s.id
        LEFT JOIN 
          buildings b ON s.building_id = b.id
        WHERE 
          pd.date BETWEEN '${startDateStr}' AND '${endDateStr}'
        ORDER BY 
          pd.date DESC
      `;
      
      const deliveryResult = await db.query(deliveryQuery);
      console.log(`Found ${deliveryResult.rows.length} delivery records`);
      
      data = deliveryResult.rows;
      filename = `ONU-Deliveries-Report-${monthNum}_${year}.xlsx`;
    }
    
    // If no data found, return empty Excel file with headers
    if (data.length === 0) {
      console.log('No data found for the specified criteria');
      data = [{ message: 'No data found for the specified criteria' }];
    }
    
    // Calculate total cost
    const totalCost = data.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unit_cost || 0));
    }, 0);
    
    console.log(`Total cost: $${totalCost.toFixed(2)}`);
    
    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    
    // Add headers with specific styling
    // This happens automatically with json_to_sheet
    
    // Add total row at the bottom
    const lastRow = data.length + 1;
    xlsx.utils.sheet_add_aoa(ws, [
      ['Total Cost:', `$${totalCost.toFixed(2)}`]
    ], { origin: { r: lastRow, c: 0 } });
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, 'Report');
    
    // Set column widths
    const columnWidths = [
      { wch: 10 }, // id
      { wch: 12 }, // date
      { wch: 8 }, // quantity
      { wch: 30 }, // part_name
      { wch: 15 }, // part_number
      { wch: 10 }, // unit_cost
      { wch: 8 }, // unit_of_measure
      { wch: 25 }, // staff_name
      { wch: 25 }, // building_name
      { wch: 15 }, // cost_center_code 
      { wch: 30 }, // cost_center_name
      { wch: 10 } // type
    ];
    
    ws['!cols'] = columnWidths;
    
    // Generate Excel file
    const excelBuffer = xlsx.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer'
    });
    
    // Send Excel file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(excelBuffer);
    
    console.log(`Excel export successful: ${filename}`);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).send(`Excel export failed: ${error.message}`);
  }
}

export default excelExport;