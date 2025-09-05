import { pool } from './db.js';
import { generatePartsIssuanceExcel } from './excel.js';

// Working Excel export handler for parts issuance
export default async function excelExportHandler(req, res) {
  try {
    console.log("Excel export handler called");
    const monthParam = req.query.month;
    const format = req.query.format || 'xlsx';
    
    // Parse the month parameter
    let startDate, endDate;
    let dateFilterSQL = '';
    const queryParams = [];
    
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      if (month && year && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        dateFilterSQL = 'WHERE pi.issued_at >= $1 AND pi.issued_at <= $2';
        queryParams.push(startDate.toISOString(), endDate.toISOString());
        console.log(`Excel Export: Filtering between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      }
    }
    
    // Query with all required fields
    const query = `
      SELECT 
        pi.id,
        pi.part_id,
        pi.quantity,
        pi.issued_to,
        pi.reason,
        pi.issued_at,
        pi.notes,
        pi.project_code,
        pi.department,
        pi.building,
        pi.issued_by_id,
        b.name as building_name,
        cc.name as cost_center_name,
        cc.code as cost_center_code,
        p.part_id as part_number,
        p.name as part_name,
        p.unit_cost
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      LEFT JOIN buildings b ON pi.building = b.id::text
      LEFT JOIN cost_centers cc ON pi.cost_center = cc.id::text
      ${dateFilterSQL}
      ORDER BY pi.issued_at DESC
    `;
    
    const result = await pool.query(query, queryParams);
    console.log(`Excel Export: Found ${result.rows.length} issuance records`);
    
    // Map the result to match expected format
    const issuances = result.rows.map(row => ({
      id: row.id,
      partId: row.part_id,
      quantity: row.quantity,
      issuedTo: row.issued_to,
      reason: row.reason,
      issuedAt: row.issued_at,
      notes: row.notes || null,
      projectCode: row.project_code || null,
      department: row.department || null,
      building: row.building || null,
      buildingName: row.building_name || null,
      costCenterName: row.cost_center_name || null,
      costCenterCode: row.cost_center_code || null,
      part: {
        partId: row.part_number,
        name: row.part_name,
        unitCost: row.unit_cost
      },
      extendedPrice: row.quantity * parseFloat(row.unit_cost || '0'),
      issuedById: row.issued_by_id || null
    }));
    
    // Generate Excel file
    const excelBuffer = await generatePartsIssuanceExcel(issuances);
    
    // Set proper headers for Excel download
    let filename = 'charge-out-report';
    if (monthParam) {
      filename += `-${monthParam.replace('/', '-')}`;
    } else {
      filename += `-${new Date().toISOString().split('T')[0]}`;
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
    
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
}