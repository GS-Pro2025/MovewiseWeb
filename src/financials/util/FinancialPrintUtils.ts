import { SuperOrder } from '../domain/ModelsOCR';

export const printFinancialReport = (
  superOrders: SuperOrder[],
  isSearchResults: boolean = false,
  week?: number,
  year?: number,
  weekRange?: { start: string; end: string }
): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Calcular totales
  const totals = superOrders.reduce((acc, order) => ({
    totalOrders: acc.totalOrders + 1,
    totalIncome: acc.totalIncome + order.totalIncome,
    totalCost: acc.totalCost + order.totalCost,
    totalProfit: acc.totalProfit + order.totalProfit,
    totalExpense: acc.totalExpense + order.expense,
    totalFuelCost: acc.totalFuelCost + order.fuelCost,
    totalWorkCost: acc.totalWorkCost + order.workCost,
    totalDriverSalaries: acc.totalDriverSalaries + order.driverSalaries,
    totalOperatorSalaries: acc.totalOperatorSalaries + order.otherSalaries,
    paidCount: acc.paidCount + (order.payStatus === 1 ? 1 : 0),
    unpaidCount: acc.unpaidCount + (order.payStatus === 0 ? 1 : 0)
  }), {
    totalOrders: 0,
    totalIncome: 0,
    totalCost: 0,
    totalProfit: 0,
    totalExpense: 0,
    totalFuelCost: 0,
    totalWorkCost: 0,
    totalDriverSalaries: 0,
    totalOperatorSalaries: 0,
    paidCount: 0,
    unpaidCount: 0
  });

  const totalDiscount = totals.totalExpense + totals.totalFuelCost + totals.totalWorkCost + 
                       totals.totalDriverSalaries + totals.totalOperatorSalaries;

  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Financial Report${isSearchResults ? ' - Search Results' : ` - Week ${week}, ${year}`}</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      padding: 20px;
      background-color: #f8f9fa;
      color: #212529;
      line-height: 1.4;
    }
    
    .report-container {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header { 
      text-align: center; 
      margin-bottom: 30px;
      border-bottom: 3px solid #0B2863;
      padding-bottom: 20px;
    }
    
    .title { 
      font-size: 28px; 
      font-weight: 700; 
      margin-bottom: 10px;
      color: #0B2863;
    }
    
    .subtitle { 
      font-size: 16px; 
      color: #6c757d; 
      margin-bottom: 5px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px solid #0B2863;
    }
    
    .stat-box {
      text-align: center;
      padding: 15px;
      background: white;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #0B2863;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .profit-positive { color: #28a745 !important; }
    .profit-negative { color: #dc3545 !important; }
    .expense-color { color: #dc3545 !important; }
    .income-color { color: #28a745 !important; }
    .cost-color { color: #0B2863 !important; }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 20px;
      font-size: 11px;
      border: 2px solid #0B2863;
    }
    
    th, td { 
      padding: 8px; 
      text-align: left; 
      border: 1px solid #dee2e6;
    }
    
    th { 
      background: #0B2863;
      color: white;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 10px;
    }
    
    tr:nth-child(even) { background-color: #f8f9fa; }
    tr:hover { background-color: #e3f2fd; }
    
    .currency { 
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 500;
    }
    
    .center { text-align: center; }
    .left { text-align: left; }
    
    .paid { 
      color: #28a745;
      font-weight: 600;
    }
    
    .unpaid { 
      color: #ffc107;
      font-weight: 600;
    }
    
    .totals { 
      background-color: #e9ecef !important;
      font-weight: 700 !important;
      border-top: 3px solid #0B2863 !important;
      font-size: 12px !important;
    }
    
    .totals td {
      background-color: #e9ecef !important;
      font-weight: 700 !important;
      border-top: 2px solid #0B2863 !important;
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
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .btn-print {
      background: #0B2863;
      color: white;
    }
    
    .btn-print:hover {
      background: #072454;
    }
    
    .btn-close {
      background: #6c757d;
      color: white;
    }
    
    .btn-close:hover {
      background: #545b62;
    }
    
    @media print {
      body { 
        margin: 0; 
        padding: 10px;
        background: white;
        font-size: 10px;
      }
      
      .print-buttons { display: none; }
      
      .report-container {
        box-shadow: none;
        padding: 0;
        max-width: none;
      }
      
      .header {
        margin-bottom: 20px;
        padding-bottom: 10px;
      }
      
      .title {
        font-size: 24px;
        color: #000 !important;
      }
      
      .subtitle {
        font-size: 14px;
      }
      
      .stats {
        margin: 20px 0;
        padding: 10px;
        background: white !important;
        border: 1px solid #000 !important;
      }
      
      .stat-box {
        border: 1px solid #000 !important;
        background: white !important;
      }
      
      .stat-value {
        color: #000 !important;
      }
      
      table { 
        border: 2px solid #000 !important;
        page-break-inside: avoid;
      }
      
      th {
        background: #f8f9fa !important;
        color: #000 !important;
        border: 1px solid #000 !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      td {
        border: 1px solid #000 !important;
      }
      
      .totals {
        background: #f0f0f0 !important;
        border-top: 2px solid #000 !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      .totals td {
        background: #f0f0f0 !important;
        border-top: 2px solid #000 !important;
      }
    }
    
    @page {
      margin: 0.5in;
      size: A4 landscape;
    }
  </style>
</head>
<body>
  <div class="print-buttons no-print">
    <button onclick="window.print()" class="btn btn-print">🖨️ Print Report</button>
    <button onclick="window.close()" class="btn btn-close">✖️ Close</button>
  </div>

  <div class="report-container">
    <div class="header">
      <div class="title">FINANCIAL SUMMARY REPORT</div>
      <div class="subtitle">${isSearchResults 
        ? 'Search Results' 
        : `Week ${week}, ${year}`}</div>
      ${weekRange ? `<div class="subtitle">Period: ${weekRange.start} to ${weekRange.end}</div>` : ''}
      <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value">${totals.totalOrders}</div>
        <div class="stat-label">Total Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value income-color">$${totals.totalIncome.toLocaleString()}</div>
        <div class="stat-label">Total Income</div>
      </div>
      <div class="stat-box">
        <div class="stat-value cost-color">$${totals.totalCost.toLocaleString()}</div>
        <div class="stat-label">Total Cost</div>
      </div>
      <div class="stat-box">
        <div class="stat-value ${totals.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">$${totals.totalProfit.toLocaleString()}</div>
        <div class="stat-label">Net Profit</div>
      </div>
      <div class="stat-box">
        <div class="stat-value expense-color">$${totals.totalExpense.toLocaleString()}</div>
        <div class="stat-label">Expenses</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${totals.paidCount}</div>
        <div class="stat-label">Paid Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${totals.unpaidCount}</div>
        <div class="stat-label">Unpaid Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value cost-color">$${totalDiscount.toLocaleString()}</div>
        <div class="stat-label">Total Discount</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Reference</th>
          <th>Client</th>
          <th>Expense</th>
          <th>Operator Salaries</th>
          <th>Work Cost</th>
          <th>Driver Salaries</th>
          <th>Total Discount</th>
          <th>Total Income</th>
          <th>Profit</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>`;

  // Agregar filas de datos
  superOrders.forEach(order => {
    const orderDiscount = order.expense + order.otherSalaries + order.workCost + order.driverSalaries + order.fuelCost;
    htmlContent += `
        <tr>
          <td class="left">${order.key_ref}</td>
          <td class="left">${order.client.length > 25 ? order.client.substring(0, 22) + '...' : order.client}</td>
          <td class="currency expense-color">$${order.expense.toLocaleString()}</td>
          <td class="currency cost-color">$${order.otherSalaries.toLocaleString()}</td>
          <td class="currency cost-color">$${order.workCost.toLocaleString()}</td>
          <td class="currency income-color">$${order.driverSalaries.toLocaleString()}</td>
          <td class="currency cost-color">$${orderDiscount.toLocaleString()}</td>
          <td class="currency income-color">$${order.totalIncome.toLocaleString()}</td>
          <td class="currency ${order.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">$${order.totalProfit.toLocaleString()}</td>
          <td class="center ${order.payStatus === 1 ? 'paid' : 'unpaid'}">${order.payStatus === 1 ? 'Paid' : 'Unpaid'}</td>
        </tr>`;
  });

  // Agregar fila de totales
  htmlContent += `
        <tr class="totals">
          <td class="left"><strong>TOTALS</strong></td>
          <td class="center"><strong>${totals.totalOrders} orders</strong></td>
          <td class="currency"><strong>$${totals.totalExpense.toLocaleString()}</strong></td>
          <td class="currency"><strong>$${totals.totalOperatorSalaries.toLocaleString()}</strong></td>
          <td class="currency"><strong>$${totals.totalWorkCost.toLocaleString()}</strong></td>
          <td class="currency"><strong>$${totals.totalDriverSalaries.toLocaleString()}</strong></td>
          <td class="currency"><strong>$${totalDiscount.toLocaleString()}</strong></td>
          <td class="currency"><strong>$${totals.totalIncome.toLocaleString()}</strong></td>
          <td class="currency"><strong>$${totals.totalProfit.toLocaleString()}</strong></td>
          <td class="center"><strong>${totals.paidCount}/${totals.unpaidCount}</strong></td>
        </tr>
      </tbody>
    </table>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
      <p><strong>Financial Summary Report</strong> - Generated by MovingWise System</p>
      <p>This report contains confidential financial information</p>
    </div>
  </div>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};