import { OrderPaidUnpaidWeekRange } from '../domain/OrdersPaidUnpaidModels';
import { getWeekRange } from '../utils/dateUtils';

export const printOrdersReport = (
  selectedWeek: number,
  year: number,
  paidOrders: OrderPaidUnpaidWeekRange[],
  unpaidOrders: OrderPaidUnpaidWeekRange[]
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const range = getWeekRange(year, selectedWeek);
  
  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Orders profit report week ${selectedWeek}</title>
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
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header { 
      text-align: center; 
      margin-bottom: 30px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
    }
    
    .title { 
      font-size: 32px; 
      font-weight: 700; 
      margin-bottom: 10px;
      color: #212529;
    }
    
    .subtitle { 
      font-size: 18px; 
      color: #6c757d; 
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .generated-date {
      font-size: 14px;
      color: #adb5bd;
      font-style: italic;
    }
    
    .stats { 
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #dee2e6;
    }
    
    .stat-box { 
      text-align: center; 
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }
    
    .stat-value { 
      font-size: 24px; 
      font-weight: 700;
      margin-bottom: 5px;
      color: #212529;
    }
    
    .stat-label { 
      font-size: 12px; 
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }
    
    .section { 
      margin: 30px 0;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 15px;
      padding: 10px 0;
      border-bottom: 2px solid #dee2e6;
    }
    
    .paid-section .section-title {
      color: #28a745;
      border-bottom-color: #28a745;
    }
    
    .unpaid-section .section-title {
      color: #dc3545;
      border-bottom-color: #dc3545;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 15px;
      background: white;
      border: 2px solid #dee2e6;
    }
    
    th, td { 
      padding: 12px 8px; 
      text-align: left; 
      font-size: 12px;
      border: 1px solid #dee2e6;
    }
    
    th { 
      background-color: #f8f9fa;
      color: #212529;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 2px solid #dee2e6;
    }
    
    .center { text-align: center; }
    .left { text-align: left; }
    
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
      background: #007bff;
      color: white;
    }
    
    .btn-print:hover {
      background: #0056b3;
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
      }
      
      .subtitle {
        font-size: 14px;
      }
      
      .stats {
        margin: 20px 0;
        padding: 10px;
        background: white !important;
        border: 1px solid #dee2e6 !important;
      }
      
      .stat-box {
        border: 1px solid #dee2e6 !important;
        background: white !important;
      }
      
      .stat-value {
        color: #212529 !important;
      }
      
      table { 
        border: 2px solid #000 !important;
        page-break-inside: avoid;
      }
      
      th {
        background: #f8f9fa !important;
        color: #212529 !important;
        border: 1px solid #000 !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      td {
        border: 1px solid #000 !important;
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
      <div class="title">ORDERS PROFIT REPORT</div>
      <div class="subtitle">Week ${selectedWeek}</div>
      <div class="subtitle">Period: ${range.start} to ${range.end}</div>
      <div class="generated-date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value">${paidOrders.length + unpaidOrders.length}</div>
        <div class="stat-label">Total Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${paidOrders.length}</div>
        <div class="stat-label">Paid Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${unpaidOrders.length}</div>
        <div class="stat-label">Unpaid Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${((paidOrders.length / (paidOrders.length + unpaidOrders.length)) * 100).toFixed(1)}%</div>
        <div class="stat-label">Payment Rate</div>
      </div>
    </div>
    
    <div class="section paid-section">
      <div class="section-title">✅ Paid Orders (${paidOrders.length})</div>
      <table>
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Client</th>
            <th>Factory</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>`;

  if (paidOrders.length === 0) {
    htmlContent += `
          <tr>
            <td colspan="4" class="center" style="padding: 20px; color: #6c757d; font-style: italic;">
              No paid orders for this week
            </td>
          </tr>`;
  } else {
    paidOrders.forEach(order => {
      htmlContent += `
          <tr>
            <td class="center" style="font-family: monospace; font-weight: bold;">${order.key_ref}</td>
            <td class="left">${order.client_name}</td>
            <td class="left">${order.customer_factory}</td>
            <td class="center">${order.date}</td>
          </tr>`;
    });
  }

  htmlContent += `
        </tbody>
      </table>
    </div>
    
    <div class="section unpaid-section">
      <div class="section-title">❌ Unpaid Orders (${unpaidOrders.length})</div>
      <table>
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Client</th>
            <th>Factory</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>`;

  if (unpaidOrders.length === 0) {
    htmlContent += `
          <tr>
            <td colspan="4" class="center" style="padding: 20px; color: #6c757d; font-style: italic;">
              No unpaid orders for this week
            </td>
          </tr>`;
  } else {
    unpaidOrders.forEach(order => {
      htmlContent += `
          <tr>
            <td class="center" style="font-family: monospace; font-weight: bold;">${order.key_ref}</td>
            <td class="left">${order.client_name}</td>
            <td class="left">${order.customer_factory}</td>
            <td class="center">${order.date}</td>
          </tr>`;
    });
  }

  htmlContent += `
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};