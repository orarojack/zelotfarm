/**
 * Export data to CSV file
 */
export function exportToCSV(
  data: any[],
  columns: { key: string; label: string }[],
  filename: string
) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV headers
  const headers = columns.map(col => col.label).join(',');
  
  // Create CSV rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      
      // Handle nested objects
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        value = value.join('; ');
      }
      
      // Escape commas and quotes
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""'); // Escape quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`; // Wrap in quotes if contains special chars
        }
      }
      
      return value ?? '';
    }).join(',');
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

