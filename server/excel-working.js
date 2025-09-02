import { pool } from './db.js';
import xlsx from 'xlsx';

export default async function excelExport(req, res) {
  try {
    const { month, type = 'all' } = req.query;
    
    if (!month) {
      return res.status(400).send('Month parameter is required');
    }
    
    console.log(`Processing Excel export for month ${month}, type: ${type}`);
    
    // Parse month string to get month and year
    const [monthNum, year] = month.split('/');
    
    // Create date range for filtering
    const startDate = new Date(`${year}-${monthNum.padStart(2, '0')}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of month
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Date range for data filtering: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    let data = [];
    let filename = '';
    
    // Get charge-out data
    if (type === 'all' || type === 'charge-outs') {
      console.log(`Executing issuance query with date range: ${startDate} to ${endDate}`);
      
      const issuanceQuery = `
        SELECT 
          i.id, 
          i.issued_at AS date,
          p.part_id AS part_number,
          p.name AS part_name,
          i.quantity,
          p.unit_cost::numeric AS unit_cost,
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
          i.issued_at BETWEEN $1 AND $2
        ORDER BY 
          i.issued_at ASC
      `;
      
      const issuanceResult = await pool.query(issuanceQuery, [startDate, endDate]);
      console.log(`Found ${issuanceResult.rows.length} issuance records`);
      
      if (type === 'charge-outs') {
        data = issuanceResult.rows.map(row => ({...row, type: 'Charge-Out'}));
        filename = `ONU-Charge-Outs-Report-${monthNum}_${year}.xlsx`;
      } else {
        // Also get delivery data for combined report
        console.log(`Executing delivery query with date range: ${startDate} to ${endDate}`);
        
        const deliveryQuery = `
          SELECT 
            pd.id, 
            pd.delivered_at AS date,
            p.part_id AS part_number,
            p.name AS part_name,
            pd.quantity,
            COALESCE(pd.unit_cost::numeric, p.unit_cost::numeric) AS unit_cost,
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
            pd.delivered_at BETWEEN $1 AND $2
          ORDER BY 
            pd.delivered_at ASC
        `;
        
        const deliveryResult = await pool.query(deliveryQuery, [startDate, endDate]);
        console.log(`Found ${deliveryResult.rows.length} delivery records`);
        
        // Format data for combined report
        data = [
          ...issuanceResult.rows.map(row => ({...row, type: 'Charge-Out'})),
          ...deliveryResult.rows.map(row => ({...row, type: 'Delivery'}))
        ];
        
        filename = `ONU-Combined-Report-${monthNum}_${year}.xlsx`;
      }
    } else if (type === 'deliveries') {
      console.log(`Executing delivery-only query with date range: ${startDate} to ${endDate}`);
      
      const deliveryQuery = `
        SELECT 
          pd.id, 
          pd.delivered_at AS date,
          p.part_id AS part_number,
          p.name AS part_name,
          pd.quantity,
          COALESCE(pd.unit_cost::numeric, p.unit_cost::numeric) AS unit_cost,
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
          pd.delivered_at BETWEEN $1 AND $2
        ORDER BY 
          pd.delivered_at ASC
      `;
      
      const deliveryResult = await pool.query(deliveryQuery, [startDate, endDate]);
      console.log(`Found ${deliveryResult.rows.length} delivery records`);
      
      data = deliveryResult.rows.map(row => ({...row, type: 'Delivery'}));
      filename = `ONU-Deliveries-Report-${monthNum}_${year}.xlsx`;
    }
    
    // If no data found, return with a message
    if (data.length === 0) {
      console.log('No data found for the specified criteria');
      return res.status(404).send('No data found for the specified criteria');
    }
    
    // Sort by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Add extended_price field and running_total to each item
    let totalCost = 0;
    
    data = data.map(item => {
      // Format date
      const dateObj = new Date(item.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      // Calculate extended price
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      const extendedPrice = quantity * unitCost;
      
      // Update running total
      totalCost += extendedPrice;
      
      // Return formatted item
      return {
        ...item,
        date: formattedDate,
        extended_price: `$${extendedPrice.toFixed(2)}`,
        running_total: `$${totalCost.toFixed(2)}`
      };
    });
    
    console.log(`Total cost: $${totalCost.toFixed(2)} from ${data.length} records`);
    
    // Create workbook
    const wb = xlsx.utils.book_new();
    
    // Define column order in a logical, user-friendly format
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
      { wch: 8 },  // quantity
      { wch: 10 }, // unit_cost
      { wch: 12 }, // extended_price
      { wch: 12 }, // running_total
      { wch: 25 }, // staff_name
      { wch: 25 }, // building_name
      { wch: 15 }, // cost_center_code 
      { wch: 30 }, // cost_center_name
      { wch: 10 }  // type
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