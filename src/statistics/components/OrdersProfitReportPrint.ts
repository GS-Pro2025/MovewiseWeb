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
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Orders profit report week ${selectedWeek}</title>
  <style>
    ${getCommonStyles()}
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
    
    ${generatePaidOrdersSection(paidOrders)}
    ${generateUnpaidOrdersSection(unpaidOrders)}
  </div>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};

export const printUnpaidOrdersReport = (
  selectedWeek: number,
  year: number,
  unpaidOrders: OrderPaidUnpaidWeekRange[]
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const range = getWeekRange(year, selectedWeek);
  
  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Unpaid orders report week ${selectedWeek}</title>
  <style>
    ${getCommonStyles()}
    .unpaid-only-header {
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: white;
      text-align: center;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      border: 2px solid #e5e7eb;
    }
    .unpaid-only-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
      color: white;
    }
    .unpaid-only-subtitle {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .priority-badge {
      background: white;
      color: #dc2626;
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: 600;
      border: 2px solid #fecaca;
      display: inline-block;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="print-buttons no-print">
    <button onclick="window.print()" class="btn btn-print">🖨️ Print Report</button>
    <button onclick="window.close()" class="btn btn-close">✖️ Close</button>
  </div>

  <div class="report-container">
    <div class="unpaid-only-header">
      <div class="unpaid-only-title">UNPAID ORDERS REPORT</div>
      <div class="unpaid-only-subtitle">Week ${selectedWeek}</div>
      <div class="unpaid-only-subtitle">Period: ${range.start} to ${range.end}</div>
      <div class="priority-badge">⚠️ ATTENTION REQUIRED</div>
      <div style="font-size: 12px; margin-top: 15px; opacity: 0.8;">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-box" style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); border: 2px solid #3b82f6;">
        <div class="stat-value" style="color: #1e40af;">${unpaidOrders.length}</div>
        <div class="stat-label" style="color: #1e40af;">UNPAID ORDERS</div>
      </div>
      <div class="stat-box" style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 2px solid #0284c7;">
        <div class="stat-value" style="color: #0369a1;">${getAverageAge(unpaidOrders)} days</div>
        <div class="stat-label" style="color: #0369a1;">AVG OVERDUE</div>
      </div>
      <div class="stat-box" style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #64748b;">
        <div class="stat-value" style="color: #475569;">${getUniqueClients(unpaidOrders)}</div>
        <div class="stat-label" style="color: #475569;">CLIENTS AFFECTED</div>
      </div>
    </div>
    
    <div class="section unpaid-section">
      <div class="section-title" style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); color: #1e40af; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #3b82f6;">
        ORDERS REQUIRING PAYMENT (${unpaidOrders.length})
      </div>
      <table style="margin-top: 20px;">
        <thead>
          <tr>
            <th style="background: #1e40af; color: white;">Order Ref</th>
            <th style="background: #1e40af; color: white;">Client</th>
            <th style="background: #1e40af; color: white;">Factory</th>
            <th style="background: #1e40af; color: white;">Date</th>
            <th style="background: #1e40af; color: white;">Days Overdue</th>
          </tr>
        </thead>
        <tbody>`;

  if (unpaidOrders.length === 0) {
    htmlContent += `
          <tr>
            <td colspan="5" class="center" style="padding: 40px; color: #059669; font-size: 18px; font-weight: bold;">
              ✅ EXCELLENT! No unpaid orders for this week!
            </td>
          </tr>`;
  } else {
    unpaidOrders.forEach(order => {
      const daysOverdue = getDaysOverdue(order.date);
      const rowClass = daysOverdue > 30 ? 'style="background: #fef2f2; border-left: 4px solid #dc2626;"' : 
                       daysOverdue > 7 ? 'style="background: #fefce8; border-left: 4px solid #f59e0b;"' : 
                       'style="background: #f0f9ff; border-left: 4px solid #3b82f6;"';
      htmlContent += `
          <tr ${rowClass}>
            <td class="center" style="font-family: monospace; font-weight: bold; color: #1e40af;">${order.key_ref}</td>
            <td class="left" style="font-weight: 500; color: #374151;">${order.client_name}</td>
            <td class="left" style="color: #6b7280;">${order.customer_factory}</td>
            <td class="center" style="color: #6b7280;">${order.date}</td>
            <td class="center" style="font-weight: bold; color: ${daysOverdue > 30 ? '#dc2626' : daysOverdue > 7 ? '#f59e0b' : '#059669'};">
              ${daysOverdue} days
            </td>
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

// Funciones auxiliares
const getCommonStyles = () => `
  * { box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    margin: 0; 
    padding: 20px;
    background-color: #f8fafc;
    color: #1f2937;
    line-height: 1.5;
  }
  
  .report-container {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    max-width: 1400px;
    margin: 0 auto;
    border: 1px solid #e5e7eb;
  }
  
  .header { 
    text-align: center; 
    margin-bottom: 30px;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 20px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-radius: 8px;
    padding: 20px;
  }
  
  .title { 
    font-size: 28px; 
    font-weight: 700; 
    margin-bottom: 10px;
    color: #1e40af;
  }
  
  .subtitle { 
    font-size: 16px; 
    color: #6b7280; 
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .generated-date {
    font-size: 12px;
    color: #9ca3af;
    font-style: italic;
  }
  
  .stats { 
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    margin: 25px 0;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }
  
  .stat-box { 
    text-align: center; 
    padding: 15px;
    background: white;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .stat-value { 
    font-size: 20px; 
    font-weight: 700;
    margin-bottom: 5px;
    color: #1e40af;
  }
  
  .stat-label { 
    font-size: 11px; 
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }
  
  .section { 
    margin: 25px 0;
  }
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    padding: 12px 0;
    border-bottom: 2px solid #e5e7eb;
    color: #374151;
  }
  
  .paid-section .section-title {
    color: #059669;
    border-bottom-color: #059669;
    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
    padding: 12px 15px;
    border-radius: 6px;
    border-bottom: none;
    border: 2px solid #059669;
  }
  
  .unpaid-section .section-title {
    color: #1e40af;
    border-bottom-color: #1e40af;
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    padding: 12px 15px;
    border-radius: 6px;
    border-bottom: none;
    border: 2px solid #1e40af;
  }
  
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-top: 15px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  
  th, td { 
    padding: 12px 10px; 
    text-align: left; 
    font-size: 12px;
    border: 1px solid #e5e7eb;
  }
  
  th { 
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: white;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 11px;
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
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .btn-print {
    background: #3b82f6;
    color: white;
  }
  
  .btn-print:hover {
    background: #1e40af;
  }
  
  .btn-close {
    background: #6b7280;
    color: white;
  }
  
  .btn-close:hover {
    background: #4b5563;
  }
  
  @media print {
    body { 
      margin: 0; 
      padding: 8px;
      background: white;
      font-size: 10px;
    }
    
    .print-buttons { display: none; }
    
    .report-container {
      box-shadow: none;
      padding: 0;
      max-width: none;
      border: none;
    }
    
    .header {
      margin-bottom: 15px;
      padding-bottom: 8px;
      background: white !important;
    }
    
    .title {
      font-size: 20px;
      color: #1e40af !important;
    }
    
    .subtitle {
      font-size: 12px;
    }
    
    .stats {
      margin: 15px 0;
      padding: 8px;
      background: white !important;
      border: 1px solid #d1d5db !important;
    }
    
    .stat-box {
      border: 1px solid #d1d5db !important;
      background: white !important;
    }
    
    .stat-value {
      color: #1e40af !important;
    }
    
    table { 
      border: 2px solid #1e40af !important;
      page-break-inside: avoid;
    }
    
    th {
      background: #1e40af !important;
      color: white !important;
      border: 1px solid #1e40af !important;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
    td {
      border: 1px solid #d1d5db !important;
    }
  }
  
  @page {
    margin: 0.5in;
    size: A4 landscape;
  }
`;

const generatePaidOrdersSection = (paidOrders: OrderPaidUnpaidWeekRange[]) => `
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
      <tbody>
        ${paidOrders.length === 0 
          ? '<tr><td colspan="4" class="center" style="padding: 20px; color: #6b7280; font-style: italic;">No paid orders for this week</td></tr>'
          : paidOrders.map(order => `
              <tr style="background: #f0fdf4;">
                <td class="center" style="font-family: monospace; font-weight: bold; color: #1e40af;">${order.key_ref}</td>
                <td class="left" style="color: #374151;">${order.client_name}</td>
                <td class="left" style="color: #6b7280;">${order.customer_factory}</td>
                <td class="center" style="color: #6b7280;">${order.date}</td>
              </tr>
            `).join('')
        }
      </tbody>
    </table>
  </div>
`;

const generateUnpaidOrdersSection = (unpaidOrders: OrderPaidUnpaidWeekRange[]) => `
  <div class="section unpaid-section">
    <div class="section-title">⚠️ Unpaid Orders (${unpaidOrders.length})</div>
    <table>
      <thead>
        <tr>
          <th>Order Ref</th>
          <th>Client</th>
          <th>Factory</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${unpaidOrders.length === 0 
          ? '<tr><td colspan="4" class="center" style="padding: 20px; color: #6b7280; font-style: italic;">No unpaid orders for this week</td></tr>'
          : unpaidOrders.map(order => `
              <tr style="background: #fef2f2;">
                <td class="center" style="font-family: monospace; font-weight: bold; color: #1e40af;">${order.key_ref}</td>
                <td class="left" style="color: #374151;">${order.client_name}</td>
                <td class="left" style="color: #6b7280;">${order.customer_factory}</td>
                <td class="center" style="color: #6b7280;">${order.date}</td>
              </tr>
            `).join('')
        }
      </tbody>
    </table>
  </div>
`;

const getAverageAge = (orders: OrderPaidUnpaidWeekRange[]): number => {
  if (orders.length === 0) return 0;
  const totalDays = orders.reduce((sum, order) => sum + getDaysOverdue(order.date), 0);
  return Math.round(totalDays / orders.length);
};

const getUniqueClients = (orders: OrderPaidUnpaidWeekRange[]): number => {
  const clients = new Set(orders.map(order => order.client_name));
  return clients.size;
};

const getDaysOverdue = (dateString: string): number => {
  const orderDate = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - orderDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};