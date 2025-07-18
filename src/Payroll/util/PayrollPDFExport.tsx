// components/PdfExporter.tsx
import React from 'react';
import { PayrollExportProps, WeekAmounts } from '../../models/payrroll';
import { formatCurrency, formatDate } from './PayrollUtil';

// ✅ SOLUCIÓN 1:
type PdfExporterProps = PayrollExportProps;

// Función para imprimir reporte (PDF con orientación landscape)
const printReport = (props: PayrollExportProps): void => {
  const { operators, weekInfo, week, location, paymentStats, totalGrand, weekDates } = props;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Payroll Report - Week ${week}</title>
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
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 30px;
      background: white;
      border: 2px solid #dee2e6;
    }
    
    th, td { 
      padding: 8px 6px; 
      text-align: left; 
      font-size: 10px;
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
    
    .currency { 
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 500;
    }
    
    .center { text-align: center; }
    .left { text-align: left; }
    
    .paid { 
      border-left: 3px solid #28a745;
    }
    
    .pending { 
      border-left: 3px solid #ffc107;
    }
    
    .totals { 
      background-color: #e9ecef;
      font-weight: 700;
      border-top: 3px solid #6c757d;
      font-size: 11px;
    }
    
    .status-paid {
      color: #28a745;
      font-weight: 600;
    }
    
    .status-pending {
      color: #e67e22;
      font-weight: 600;
    }
    
    .day-header {
      min-width: 70px;
    }
    
    .day-date {
      font-size: 8px;
      color: #6c757d;
      display: block;
      margin-top: 2px;
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
      
      .paid {
        border-left: 2px solid #000 !important;
      }
      
      .pending {
        border-left: 2px solid #000 !important;
      }
      
      .totals {
        background: #f0f0f0 !important;
        border-top: 2px solid #000 !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
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
      <div class="title">PAYROLL REPORT</div>
      <div class="subtitle">Week ${week} - ${location || 'All Locations'}</div>
      <div class="subtitle">Period: ${formatDate(weekInfo.start_date)} to ${formatDate(weekInfo.end_date)}</div>
      <div class="generated-date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value">${operators.length}</div>
        <div class="stat-label">Total Operators</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${paymentStats.paid}</div>
        <div class="stat-label">Paid</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${paymentStats.unpaid}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${formatCurrency(totalGrand)}</div>
        <div class="stat-label">Grand Total</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Code</th>
          <th>Cost</th>
          <th>Name</th>
          <th>Last Name</th>`;

  weekdayKeys.forEach(day => {
    const dateStr = weekDates[day];
    const displayDate = dateStr ? formatDate(dateStr) : day;
    htmlContent += `<th class="day-header">${day}<span class="day-date">${displayDate}</span></th>`;
  });

  htmlContent += `
          <th>Bonuses</th>
          <th>Expenses</th>
          <th>Total</th>
          <th>Grand Total</th>
        </tr>
      </thead>
      <tbody>`;

  operators.forEach(operator => {
    const rowClass = operator.pay != null ? 'paid' : 'pending';
    const statusClass = operator.pay != null ? 'status-paid' : 'status-pending';
    const statusText = operator.pay != null ? 'PAID' : 'PENDING';
    
    htmlContent += `
        <tr class="${rowClass}">
          <td class="center ${statusClass}">${statusText}</td>
          <td class="center">${operator.code}</td>
          <td class="currency">${formatCurrency(operator.cost)}</td>
          <td class="left">${operator.name}</td>
          <td class="left">${operator.lastName}</td>`;

    weekdayKeys.forEach(day => {
      const value = operator[day];
      htmlContent += `<td class="currency">${value ? formatCurrency(value) : '—'}</td>`;
    });

    htmlContent += `
          <td class="currency">${formatCurrency(operator.additionalBonuses || 0)}</td>
          <td class="currency">${operator.expense && operator.expense > 0 ? '-' + formatCurrency(operator.expense) : '—'}</td>
          <td class="currency">${formatCurrency((operator.total || 0) + (operator.additionalBonuses || 0))}</td>
          <td class="currency">${formatCurrency(operator.grandTotal || 0)}</td>
        </tr>`;
  });

  htmlContent += `
        <tr class="totals">
          <td colspan="5" class="center">TOTALS</td>`;

  weekdayKeys.forEach(() => {
    htmlContent += '<td class="currency"></td>';
  });

  htmlContent += `
          <td class="currency"></td>
          <td class="currency"></td>
          <td class="currency"></td>
          <td class="currency">${formatCurrency(totalGrand)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};

const PdfExporter: React.FC<PdfExporterProps> = (props) => {
  const handlePrint = () => {
    printReport(props);
  };

  return (
    <button
      onClick={handlePrint}
      className="group relative overflow-hidden flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      title="Print Report"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
      </svg>
      <span className="hidden sm:inline relative z-10">Print</span>
    </button>
  );
};

export default PdfExporter;