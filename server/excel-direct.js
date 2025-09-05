import express from 'express';
import { pool } from './db.js';
import { generatePartsIssuanceExcel } from './excel.js';

const app = express();

// Direct Excel export endpoint that bypasses all middleware
app.get('/api/direct-excel-export', async (req, res) => {
  try {
    console.log("Direct Excel export endpoint called");
    const monthParam = req.query.month;
    
    let dateFilterSQL = '';
    const queryParams = [];
    
    if (monthParam) {
      const [month, year] = monthParam.split('/');
      if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        dateFilterSQL = 'WHERE pi.issued_at >= $1 AND pi.issued_at <= $2';
        queryParams.push(startDate.toISOString(), endDate.toISOString());
        console.log(`Direct Excel Export: Filtering ${monthParam}`);
      }
    }
    
    const query = `
      SELECT 
        pi.id, pi.part_id, pi.quantity, pi.issued_to, pi.reason, pi.issued_at,
        pi.notes, pi.project_code, pi.department, pi.building, pi.issued_by_id,
        p.part_id as part_number, p.name as part_name, p.unit_cost
      FROM parts_issuance pi
      LEFT JOIN parts p ON pi.part_id = p.id
      ${dateFilterSQL}
      ORDER BY pi.issued_at DESC
    `;
    
    const result = await pool.query(query, queryParams);
    console.log(`Direct Excel Export: Found ${result.rows.length} records`);
    
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
      part: {
        partId: row.part_number,
        name: row.part_name,
        unitCost: row.unit_cost
      },
      extendedPrice: row.quantity * parseFloat(row.unit_cost || '0'),
      issuedById: row.issued_by_id || null
    }));
    
    const excelBuffer = await generatePartsIssuanceExcel(issuances);
    
    let filename = 'charge-out-report';
    if (monthParam) {
      filename += `-${monthParam.replace('/', '-')}`;
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
    
  } catch (error) {
    console.error("Direct Excel export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});

// Start a separate server on port 5001 for Excel exports
const port = 5001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Direct Excel export server running on port ${port}`);
});

export default app;