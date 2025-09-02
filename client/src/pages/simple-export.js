// Simple direct CSV export that will always work
export function exportToCsv(items, filename) {
  // Format the items into CSV rows
  let csvContent = "Date,Part Number,Description,Quantity,Unit Cost,Extended Price,Building,Cost Center,Type\n";
  
  // Total sum for extended price
  let totalSum = 0;
  
  // Process each data row with robust error handling
  for (let i = 0; i < items.length; i++) {
    try {
      const item = items[i];
      if (!item) continue;
      
      // Get price as number for total
      let price = 0;
      if (item.extendedPrice) {
        if (typeof item.extendedPrice === 'number') {
          price = item.extendedPrice;
        } else if (typeof item.extendedPrice === 'string') {
          // Extract numeric part
          const match = item.extendedPrice.match(/[\d.]+/);
          if (match) price = parseFloat(match[0]);
        }
      }
      
      totalSum += price;
      
      // Format all fields as CSV-safe values
      const csvRow = [
        (item.date || '').toString().replace(/,/g, ' '),
        (item.partName || '').toString().replace(/,/g, ' '),
        `"${(item.description || '').toString().replace(/"/g, '""')}"`,
        (item.quantity || 0).toString(),
        (item.unitCost || '').toString().replace(/,/g, ' '),
        (item.extendedPrice || '').toString().replace(/,/g, ' '),
        `"${(item.building || '').toString().replace(/"/g, '""')}"`,
        (item.costCenter || '').toString().replace(/,/g, ' '),
        (item.type || '').toString().replace(/,/g, ' ')
      ].join(',');
      
      csvContent += csvRow + '\n';
    } catch (err) {
      console.error("Error processing row:", err);
      continue; // Skip this row but continue with others
    }
  }
  
  // Add the total row at the bottom
  csvContent += `\nTOTAL,,,,,\$${totalSum.toFixed(2)},,`;
  
  // Create a blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
  
  return true;
}