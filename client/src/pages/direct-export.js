// Ultra-reliable export functions
export async function exportToExcel(month, reportType) {
  // Use our fixed export endpoint
  const url = `/api/fixed-export?month=${encodeURIComponent(month)}&type=${encodeURIComponent(reportType)}`;
  window.open(url, '_blank');
  return true;
}
