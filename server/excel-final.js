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
    
    // Format dates for SQL query - using date strings directly
    const startDateStr = `${year}-${monthNum.padStart(2, '0')}-01`;
    const endDateStr = `${year}-${monthNum.padStart(2, '0')}-30`;
    
    console.log(`Using date range for SQL: ${startDateStr} to ${endDateStr}`);
    
    let data = [];
    let filename = '';
    
    if (type === 'combined' || type === 'charge-outs' || type === 'all') {
      // Get charge-out data with CORRECT column names from table structure
      const issuanceQuery = `
        SELECT 
          i.id, 
          i.issued_at AS date,
          i.quantity,
          p.name AS part_name,
          p.part_id AS part_number,
          p.unit_cost,
          p.unit_of_measure,
          i.issued_to AS staff_name,
          b.name AS building_name,
          i.cost_center AS cost_center_code,
          cc.name AS cost_center_name
        FROM 
          parts_issuance i
        JOIN 
          parts p ON i.part_id = p.id
        LEFT JOIN 
          buildings b ON i.building_id = b.id
        LEFT JOIN 
          cost_centers cc ON i.cost_center = cc.code
        WHERE 
          i.issued_at BETWEEN '${startDateStr}' AND '${endDateStr}'
        ORDER BY 
          i.issued_at DESC
      `;
      
      console.log("Executing issuance query:", issuanceQuery);
      const issuanceResult = await db.query(issuanceQuery);
      console.log(`Found ${issuanceResult.rows.length} issuance records`);
      
      if (type === 'charge-outs') {
        data = issuanceResult.rows;
        filename = `ONU-Charge-Outs-Report-${monthNum}_${year}.xlsx`;
      } else {
        // Also get delivery data for combined report
        const deliveryQuery = `
          SELECT 
            pd.id, 
            pd.delivered_at AS date,
            pd.quantity,
            p.name AS part_name,
            p.part_id AS part_number,
            COALESCE(pd.unit_cost, p.unit_cost) AS unit_cost,
            p.unit_of_measure,
            s.name AS staff_name,
            b.name AS building_name,
            cc.code AS cost_center_code,
            cc.name AS cost_center_name
          FROM 
            parts_delivery pd
          JOIN 
            parts p ON pd.part_id = p.id
          JOIN 
            staff_members s ON pd.staff_member_id = s.id
          LEFT JOIN 
            buildings b ON pd.building_id = b.id
          LEFT JOIN 
            cost_centers cc ON pd.cost_center_id = cc.id
          WHERE 
            pd.delivered_at BETWEEN '${startDateStr}' AND '${endDateStr}'
          ORDER BY 
            pd.delivered_at DESC
        `;
        
        console.log("Executing delivery query:", deliveryQuery);
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
      // Get only delivery data with CORRECT column names
      const deliveryQuery = `
        SELECT 
          pd.id, 
          pd.delivered_at AS date,
          pd.quantity,
          p.name AS part_name,
          p.part_id AS part_number,
          COALESCE(pd.unit_cost, p.unit_cost) AS unit_cost,
          p.unit_of_measure,
          s.name AS staff_name,
          b.name AS building_name,
          cc.code AS cost_center_code,
          cc.name AS cost_center_name
        FROM 
          parts_delivery pd
        JOIN 
          parts p ON pd.part_id = p.id
        JOIN 
          staff_members s ON pd.staff_member_id = s.id
        LEFT JOIN 
          buildings b ON pd.building_id = b.id
        LEFT JOIN 
          cost_centers cc ON pd.cost_center_id = cc.id
        WHERE 
          pd.delivered_at BETWEEN '${startDateStr}' AND '${endDateStr}'
        ORDER BY 
          pd.delivered_at DESC
      `;
      
      console.log("Executing delivery-only query:", deliveryQuery);
      const deliveryResult = await db.query(deliveryQuery);
      console.log(`Found ${deliveryResult.rows.length} delivery records`);
      
      data = deliveryResult.rows;
      filename = `ONU-Deliveries-Report-${monthNum}_${year}.xlsx`;
    }
    
    // If no data found after all the above queries, return with a message
    if (data.length === 0) {
      console.log('No data found for the specified criteria');
      data = [{ message: 'No data found for the specified criteria' }];
    }
    
    // Sort data by date before calculating running totals
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Add extended_price field and running_total to each item
    let totalCost = 0;
    
    data = data.map(item => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      const extendedPrice = quantity * unitCost;
      
      // Update running total
      totalCost += extendedPrice;
      
      // Add both extended price and running total to the data item
      return {
        ...item,
        extended_price: `$${extendedPrice.toFixed(2)}`,  // Format as currency with $ sign
        running_total: `$${totalCost.toFixed(2)}`        // Add running total column
      };
    });
    
    console.log(`Total cost: $${totalCost.toFixed(2)}`);
    console.log(`Processed ${data.length} records with extended price calculations`);
    
    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    
    // Define explicit column order with proper logical grouping
    const columnOrder = [
      'id', 'date', 'part_number', 'part_name', 'quantity', 'unit_cost', 
      'extended_price', 'running_total', 'staff_name', 'building_name', 
      'cost_center_code', 'cost_center_name', 'type'
    ];
    
    // Create worksheet with explicit column order
    const ws = xlsx.utils.json_to_sheet(data, { header: columnOrder });
    
    // Add custom headers with better formatting
    const headers = [
      'ID', 'Date', 'Part Number', 'Part Name', 'Quantity', 'Unit Cost',
      'Extended Price', 'Running Total', 'Staff Name', 'Building Name',
      'Cost Center Code', 'Cost Center Name', 'Type'
    ];
    
    // Replace the automatically generated headers with our custom headers
    xlsx.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });
    
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
      { wch: 15 }, // part_number
      { wch: 30 }, // part_name
      { wch: 8 }, // quantity
      { wch: 10 }, // unit_cost
      { wch: 12 }, // extended_price
      { wch: 12 }, // running_total
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