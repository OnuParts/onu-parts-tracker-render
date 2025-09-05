// Add the filter parameter to Excel export
router.get("/api/combined-report/export-excel", async (req: Request, res: Response) => {
  try {
    // Get month and filter type params
    const month = req.query.month as string;
    const type = req.query.type as string || 'all';
    
    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }
    
    console.log(`Excel Export: Processing with month=${month}, type=${type}`);
    
    // Parse the month string and create date range
    const [monthNum, yearNum] = month.split('/').map(n => parseInt(n));
    const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Last day of month
    
    console.log(`Excel Export: Date range ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // STEP 1: Get all parts issuance for the selected month
    console.log(`Excel Export: Getting issuance data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Only get issuance data if we need it (type=all or type=chargeouts) 
    let issuances = [];
    if (type === 'all' || type === 'chargeouts') {
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
        LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id
        WHERE pi.issued_at BETWEEN $1 AND $2
        ORDER BY pi.issued_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      
      issuances = issuanceResult.rows || [];
    }
    
    // STEP 2: Get all deliveries for the month
    console.log(`Excel Export: Getting delivery data for month ${month}`);
    
    // Only get delivery data if we need it (type=all or type=deliveries)
    let deliveries = [];
    if (type === 'all' || type === 'deliveries') {
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
        LEFT JOIN cost_centers cc ON pd.cost_center_id = cc.id
        WHERE pd.delivered_at BETWEEN $1 AND $2
        ORDER BY pd.delivered_at DESC
      `, [startDate.toISOString(), endDate.toISOString()]);
      
      deliveries = deliveryResult.rows || [];
    }
    
    console.log(`Excel Export: Found ${issuances.length} issuance and ${deliveries.length} delivery records`);
    
    // STEP 3: Combine and prepare the data for Excel format
    const combinedData = [...issuances, ...deliveries].map(item => {
      // Calculate extended price
      const unitCost = parseFloat(item.unit_cost || 0);
      const quantity = parseInt(item.quantity || 0);
      const extendedPrice = unitCost * quantity;
      
      // Format date properly
      const date = new Date(item.issued_at);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      
      return {
        date: formattedDate,
        partName: item.part_number,  // Intentionally map part_number to partName
        description: item.part_name,  // And part_name to description
        quantity: quantity,
        unitCost: unitCost ? `$${unitCost.toFixed(2)}` : '$0.00',
        extendedPrice: `$${extendedPrice.toFixed(2)}`,
        building: item.building_name || '',
        costCenter: item.cost_center_code || '',
        type: item.type
      };
    });
    
    // STEP 4: Generate the Excel file using our dedicated function
    console.log(`Excel Export: Generating Excel file with ${combinedData.length} total records`);
    
    // Determine the report type for filename
    let reportType = 'Parts';
    if (type === 'deliveries') reportType = 'Deliveries';
    if (type === 'chargeouts') reportType = 'Charge-Outs';
    
    const { generateCombinedReportExcel } = await import('./excel');
    const excelBuffer = generateCombinedReportExcel(combinedData, month);
    
    // STEP 5: Send the excel file for download
    const filename = `ONU-${reportType}-Report-${month.replace('/', '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    console.log(`Excel Export: Sending file ${filename} (${excelBuffer.length} bytes)`);
    
    // Send the buffer directly to client
    res.end(excelBuffer);
    
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ 
      error: `Failed to generate Excel report: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});
