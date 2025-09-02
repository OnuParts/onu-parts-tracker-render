import xlsx from 'xlsx';
import { pool } from './db.ts';

// This implementation uses the same data fetching logic that's already working in the application
async function excelExport(req, res) {
  try {
    const { month, type = 'combined' } = req.query;
    
    if (!month) {
      return res.status(400).send('Month parameter is required');
    }
    
    console.log(`Processing Excel export for month ${month}, type: ${type}`);
    
    // Parse month string to get month and year
    const [monthNum, yearStr] = month.split('/');
    const year = parseInt(yearStr);
    const monthNumber = parseInt(monthNum);
    
    // Format dates for data filtering
    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);
    
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();
    
    console.log(`Date range for data filtering: ${startDateISO} to ${endDateISO}`);
    
    // Data arrays for our reports
    let issuanceData = [];
    let deliveryData = [];
    let combinedData = [];
    let filename = '';
    
    // Fetch issuance data using the storage interface calls that already work
    if (type === 'combined' || type === 'charge-outs' || type === 'all') {
      console.log("Fetching issuance data directly using the database");
      
      const issuanceQuery = `
        SELECT 
          i.id, 
          i.issued_at AS date,
          i.quantity,
          p.name AS part_name,
          p.part_id AS part_number,
          p.unit_cost,
          COALESCE(p.unit_of_measure, 'EA') AS unit_of_measure,
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
          i.issued_at DESC
      `;
      
      console.log(`Executing issuance query with date range params`);
      const issuanceResult = await pool.query(issuanceQuery, [startDateISO, endDateISO]);
      issuanceData = issuanceResult.rows;
      console.log(`Found ${issuanceData.length} issuance records`);
      
      if (type === 'charge-outs') {
        combinedData = issuanceData;
        filename = `ONU-Charge-Outs-Report-${monthNum}_${year}.xlsx`;
      }
    }
    
    // Fetch delivery data if needed
    if (type === 'combined' || type === 'deliveries' || type === 'all') {
      console.log("Fetching delivery data directly using the database");
      
      const deliveryQuery = `
        SELECT 
          pd.id, 
          pd.delivered_at AS date,
          pd.quantity,
          p.name AS part_name,
          p.part_id AS part_number,
          COALESCE(pd.unit_cost, p.unit_cost) AS unit_cost,
          COALESCE(p.unit_of_measure, 'EA') AS unit_of_measure,
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
          pd.delivered_at DESC
      `;
      
      console.log(`Executing delivery query with date range params`);
      const deliveryResult = await pool.query(deliveryQuery, [startDateISO, endDateISO]);
      deliveryData = deliveryResult.rows;
      console.log(`Found ${deliveryData.length} delivery records`);
      
      if (type === 'deliveries') {
        combinedData = deliveryData;
        filename = `ONU-Deliveries-Report-${monthNum}_${year}.xlsx`;
      }
    }
    
    // Combine data if needed
    if (type === 'combined' || type === 'all') {
      // Format data for combined report
      combinedData = [
        ...issuanceData.map(row => ({
          ...row,
          type: 'Charge-Out'
        })),
        ...deliveryData.map(row => ({
          ...row,
          type: 'Delivery'
        }))
      ];
      
      filename = `ONU-Combined-Report-${monthNum}_${year}.xlsx`;
    }
    
    // If no data found after all the above queries, return with a message
    if (combinedData.length === 0) {
      console.log('No data found for the specified criteria');
      return res.status(404).send('No data found for the specified month');
    }
    
    // Calculate total cost with error handling for invalid numbers
    const totalCost = combinedData.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      return sum + (quantity * unitCost);
    }, 0);
    
    console.log(`Total cost: $${totalCost.toFixed(2)} from ${combinedData.length} records`);
    
    // Format dates for Excel
    const dataWithFormattedDates = combinedData.map(item => {
      const dateObj = new Date(item.date);
      return {
        ...item,
        date: dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      };
    });
    
    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(dataWithFormattedDates);
    
    // Add total row at the bottom
    const lastRow = dataWithFormattedDates.length + 1;
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