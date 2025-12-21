/**
 * Print table to PDF using browser print functionality
 */
export function printTableToPDF(
  tableId: string,
  title: string,
  columns: { key: string; label: string }[],
  data: any[],
  getRowData?: (row: any) => Record<string, any>
) {
  if (!data || data.length === 0) {
    alert('No data to print');
    return;
  }

  // Create a print-friendly table
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print');
    return;
  }

  // Build table HTML
  const tableRows = data.map((row, index) => {
    const rowData = getRowData ? getRowData(row) : row;
    const cells = columns.map(col => {
      let value = rowData[col.key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      
      return `<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${value ?? ''}</td>`;
    }).join('');
    
    return `<tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
      ${cells}
    </tr>`;
  }).join('');

  const headers = columns.map(col => 
    `<th style="border: 1px solid #ddd; padding: 12px; background-color: #4CAF50; color: white; text-align: left; font-weight: bold;">${col.label}</th>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
              size: A4 landscape;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              font-size: 10px;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
          }
          .info {
            margin-bottom: 20px;
            color: #666;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="info">
          Generated on: ${new Date().toLocaleString()}<br>
          Total Records: ${data.length}
        </div>
        <table>
          <thead>
            <tr>
              ${headers}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
}

