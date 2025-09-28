// Utilidades mejoradas para exportar el breakdown a Excel y PDF/Print
// Con diseño profesional similar al reporte de pagos
export function exportBreakdownToExcel(
  expenses: Record<string, number>,
  income: number,
  profit: number,
  startWeek: number,
  endWeek: number,
  year: number
) {
  import('xlsx').then((XLSX) => {
    const sortedExpenses = Object.entries(expenses).sort(([, a], [, b]) => b - a);

    // Solo tabla de dos columnas: tipo y valor, gastos primero, luego income y profit
    const tableData = [
      ['Category', 'Amount'],
      ...sortedExpenses.map(([type, value]) => [type, value]),
      ['Income', income],
      ['Profit', profit]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(tableData);
    worksheet['!cols'] = [{ width: 30 }, { width: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Breakdown');

    const fileName = `ExpenseBreakdown_${year}_W${startWeek}-${endWeek}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }).catch((error) => {
    console.error('XLSX library not available:', error);

    // Fallback a CSV si XLSX no está disponible
    const dateRange = `${year}, Weeks ${startWeek}-${endWeek}`;
    const sortedExpenses = Object.entries(expenses).sort(([, a], [, b]) => b - a);

    let csv = `Expense Breakdown (${dateRange})\n`;
    csv += "Category,Amount\n";
    sortedExpenses.forEach(([type, value]) => {
      csv += `${type},${value}\n`;
    });
    csv += `Income,${income}\n`;
    csv += `Profit,${profit}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ExpenseBreakdown_${year}_W${startWeek}-${endWeek}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('Excel export requires XLSX library. Exported as CSV instead.');
  });
}

export function exportBreakdownToPDF(
  expenses: Record<string, number>,
  income: number,
  profit: number,
  startWeek: number,
  endWeek: number,
  year: number
) {
  const dateRange = `${year}, Weeks ${startWeek}-${endWeek}`;
  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
  const profitMargin: string = income > 0 ? ((profit / income) * 100).toFixed(1) : '0';
  
  // Ordenar gastos por valor descendente
  const sortedExpenses = Object.entries(expenses).sort(([,a], [,b]) => b - a);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Expense Breakdown Report - ${dateRange}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.4;
      color: #1f2937;
      background: white;
      padding: 20px;
    }
    
    .print-buttons {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .btn-print {
      background: #3b82f6;
      color: white;
    }
    
    .btn-close {
      background: #6b7280;
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #0B2863, #1e40af);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8fafc;
    }
    
    .stat-box {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 2px solid #e5e7eb;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .content {
      padding: 40px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #1f2937;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }
    
    .expense-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .expense-table th {
      background: #3b82f6;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .expense-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .expense-table tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .expense-table tr:hover {
      background: #e0f2fe;
    }
    
    .expense-category {
      font-weight: 600;
      color: #1f2937;
    }
    
    .expense-amount {
      font-weight: 700;
      color: #ef4444;
      text-align: right;
    }
    
    .income-row {
      background: linear-gradient(135deg, #ecfdf5, #d1fae5) !important;
      border-top: 2px solid #22c55e;
    }
    
    .income-amount {
      font-weight: 700;
      color: #22c55e;
      text-align: right;
    }
    
    .profit-row {
      background: linear-gradient(135deg, ${profit >= 0 ? '#ecfdf5, #d1fae5' : '#fef2f2, #fecaca'}) !important;
      border-top: 2px solid ${profit >= 0 ? '#22c55e' : '#ef4444'};
    }
    
    .profit-amount {
      font-weight: 700;
      color: ${profit >= 0 ? '#22c55e' : '#ef4444'};
      text-align: right;
    }
    
    .summary-row {
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe) !important;
      border-top: 2px solid #3b82f6;
      font-weight: 700;
    }
    
    .no-data {
      text-align: center;
      padding: 40px;
      color: #6b7280;
      font-style: italic;
    }
    
    @media print {
      .print-buttons { display: none !important; }
      body { margin: 0; padding: 0; }
      .report-container { box-shadow: none; }
      .expense-table { page-break-inside: avoid; }
      .expense-table th { background: #3b82f6 !important; -webkit-print-color-adjust: exact; }
      .summary-row { background: #f0f9ff !important; -webkit-print-color-adjust: exact; }
      .income-row { background: #ecfdf5 !important; -webkit-print-color-adjust: exact; }
      .profit-row { background: ${profit >= 0 ? '#ecfdf5' : '#fef2f2'} !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-buttons">
    <button onclick="window.print()" class="btn btn-print">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()" class="btn btn-close">✖️ Close</button>
  </div>

  <div class="report-container">
    <div class="header">
      <div class="title">EXPENSE BREAKDOWN REPORT</div>
      <div class="subtitle">${dateRange}</div>
      <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value" style="color: #10b981;">${income.toLocaleString()}</div>
        <div class="stat-label">Total Income</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #ef4444;">${totalExpenses.toLocaleString()}</div>
        <div class="stat-label">Total Expenses</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: ${profit >= 0 ? '#22c55e' : '#ef4444'};">${profit.toLocaleString()}</div>
        <div class="stat-label">Net Profit</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: ${parseFloat(profitMargin) >= 0 ? '#3b82f6' : '#ef4444'};">${profitMargin}%</div>
        <div class="stat-label">Profit Margin</div>
      </div>
    </div>
    
    <div class="content">
      <div class="section-title">Financial Summary</div>
      ${sortedExpenses.length > 0 || income > 0 ? `
      <table class="expense-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${sortedExpenses.map(([type, value]) => `
            <tr>
              <td class="expense-category">${type}</td>
              <td class="expense-amount">${value.toLocaleString()}</td>
            </tr>
          `).join('')}
          <tr class="income-row">
            <td class="expense-category"><strong>Income</strong></td>
            <td class="income-amount"><strong>${income.toLocaleString()}</strong></td>
          </tr>
          <tr class="profit-row">
            <td class="expense-category"><strong>Profit</strong></td>
            <td class="profit-amount"><strong>${profit.toLocaleString()}</strong></td>
          </tr>
        </tbody>
      </table>
      ` : `
      <div class="no-data">
        <h3>No financial data found</h3>
        <p>There are no records available for the selected period.</p>
      </div>
      `}
    </div>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}