import React from 'react';

// Interfaces (mismas que antes)
interface WeekInfo {
  start_date: string;
  end_date: string;
}

interface WeekAmounts {
  Mon?: number;
  Tue?: number;
  Wed?: number;
  Thu?: number;
  Fri?: number;
  Sat?: number;
  Sun?: number;
}

interface OperatorRow extends WeekAmounts {
  code: string;
  name: string;
  lastName: string;
  role: string;
  cost: number;
  pay?: string | null;
  total?: number;
  additionalBonuses?: number;
  expense?: number;
  grandTotal?: number;
  assignmentIds: (number | string)[];
  paymentIds: (number | string)[];
}

interface PaymentStats {
  paid: number;
  unpaid: number;
  total: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface PayrollExportProps {
  operators: OperatorRow[];
  weekInfo: WeekInfo;
  weekDates: { [key in keyof WeekAmounts]?: string };
  week: number;
  location: string;
  paymentStats: PaymentStats;
  totalGrand: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
};

// Función para generar CSV mejorado
const generateCSV = (props: PayrollExportProps): string => {
  const { operators, weekInfo, week, location, paymentStats, totalGrand, weekDates } = props;
  
  let csv = '';
  
  // Header information
  csv += `"PAYROLL REPORT"\n`;
  csv += `"Week ${week} - ${location || 'All Locations'}"\n`;
  csv += `"Period: ${formatDate(weekInfo.start_date)} to ${formatDate(weekInfo.end_date)}"\n`;
  csv += `"Generated: ${new Date().toLocaleDateString()}"\n`;
  csv += `\n`;
  
  // Stats
  csv += `"SUMMARY STATISTICS"\n`;
  csv += `"Total Operators","${operators.length}"\n`;
  csv += `"Paid Operators","${paymentStats.paid}"\n`;
  csv += `"Pending Payments","${paymentStats.unpaid}"\n`;
  csv += `"Total Amount","${formatCurrency(totalGrand)}"\n`;
  csv += `\n`;
  
  // Table headers
  const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let headerRow = '"Status","Code","Cost","Name","Last Name"';
  
  weekdayKeys.forEach(day => {
    const dateStr = weekDates[day];
    const displayDate = dateStr ? formatDate(dateStr) : day;
    headerRow += `,"${day} (${displayDate})"`;
  });
  
  headerRow += ',"Additional Bonuses","Expenses","Total","Grand Total"\n';
  csv += headerRow;
  
  // Data rows
  operators.forEach(operator => {
    let row = '';
    row += `"${operator.pay != null ? 'PAID' : 'PENDING'}"`;
    row += `,"${operator.code}"`;
    row += `,"${formatCurrency(operator.cost)}"`;
    row += `,"${operator.name}"`;
    row += `,"${operator.lastName}"`;
    
    weekdayKeys.forEach(day => {
      const value = operator[day];
      row += `,"${value ? formatCurrency(value) : '$0.00'}"`;
    });
    
    row += `,"${formatCurrency(operator.additionalBonuses || 0)}"`;
    row += `,"${formatCurrency(operator.expense || 0)}"`;
    row += `,"${formatCurrency((operator.total || 0) + (operator.additionalBonuses || 0))}"`;
    row += `,"${formatCurrency(operator.grandTotal || 0)}"`;
    row += '\n';
    
    csv += row;
  });
  
  // Totals row
  csv += '\n';
  csv += '"","","","","TOTALS","",';
  weekdayKeys.forEach(() => {
    csv += '"",';
  });
  csv += `"","${formatCurrency(totalGrand)}"\n`;
  
  return csv;
};

// Función para generar Excel mejorado
const generateExcel = (props: PayrollExportProps): string => {
  const { operators, weekInfo, week, location, paymentStats, totalGrand, weekDates } = props;
  
  let excel = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
    .main-header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      font-weight: bold; 
      text-align: center; 
      font-size: 18px;
      padding: 15px;
      border-radius: 8px 8px 0 0;
    }
    .sub-header { 
      background-color: #f8f9fa; 
      text-align: center; 
      padding: 10px;
      font-size: 14px;
      color: #495057;
      border-left: 1px solid #dee2e6;
      border-right: 1px solid #dee2e6;
    }
    .stats-header {
      background-color: #e9ecef;
      font-weight: bold;
      text-align: center;
      padding: 8px;
      color: #495057;
    }
    .table-header { 
      background: linear-gradient(to bottom, #d1fae5, #a7f3d0);
      font-weight: bold; 
      text-align: center;
      padding: 12px 8px;
      border: 2px solid #10b981;
      font-size: 12px;
      color: #065f46;
    }
    .currency { text-align: right; padding: 8px; }
    .center { text-align: center; padding: 8px; }
    .left { text-align: left; padding: 8px; }
    .paid { 
      background-color: #d1e7dd; 
      border-left: 4px solid #0f5132;
    }
    .pending { 
      background-color: #fff3cd; 
      border-left: 4px solid #664d03;
    }
    .totals-row {
      background: linear-gradient(to bottom, #e9ecef, #dee2e6);
      font-weight: bold;
      border-top: 3px solid #6c757d;
    }
    .stat-value {
      font-weight: bold;
      font-size: 16px;
    }
    .paid-stat { color: #0f5132; }
    .pending-stat { color: #664d03; }
    .total-stat { color: #0a58ca; }
    td { 
      border: 1px solid #dee2e6;
      font-size: 11px;
    }
    .day-header {
      writing-mode: horizontal-tb;
      transform: rotate(0deg);
    }
  </style>
</head>
<body>
  <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
    <!-- Main Header -->
    <tr><td colspan="13" class="main-header">PAYROLL REPORT</td></tr>
    <tr><td colspan="13" class="sub-header">Week ${week} - ${location || 'All Locations'}</td></tr>
    <tr><td colspan="13" class="sub-header">Period: ${formatDate(weekInfo.start_date)} to ${formatDate(weekInfo.end_date)}</td></tr>
    <tr><td colspan="13" class="sub-header">Generated: ${new Date().toLocaleDateString()}</td></tr>
    
    <!-- Empty row -->
    <tr><td colspan="13" style="height: 20px; border: none;"></td></tr>
    
    <!-- Statistics Section -->
    <tr><td colspan="13" class="stats-header">SUMMARY STATISTICS</td></tr>
    <tr>
      <td class="left" style="font-weight: bold;">Total Operators:</td>
      <td class="stat-value">${operators.length}</td>
      <td class="left" style="font-weight: bold;">Paid:</td>
      <td class="stat-value paid-stat">${paymentStats.paid}</td>
      <td class="left" style="font-weight: bold;">Pending:</td>
      <td class="stat-value pending-stat">${paymentStats.unpaid}</td>
      <td class="left" style="font-weight: bold;">Grand Total:</td>
      <td class="stat-value total-stat">${formatCurrency(totalGrand)}</td>
      <td colspan="5" style="border: none;"></td>
    </tr>
    
    <!-- Empty row -->
    <tr><td colspan="13" style="height: 20px; border: none;"></td></tr>
    
    <!-- Table Headers -->
    <tr>
      <td class="table-header">STATUS</td>
      <td class="table-header">CODE</td>
      <td class="table-header">COST</td>
      <td class="table-header">NAME</td>
      <td class="table-header">LAST NAME</td>`;
  
  const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  weekdayKeys.forEach(day => {
    const dateStr = weekDates[day];
    const displayDate = dateStr ? formatDate(dateStr) : day;
    excel += `<td class="table-header day-header">${day}<br/><small>${displayDate}</small></td>`;
  });
  
  excel += `
      <td class="table-header">BONUSES</td>
      <td class="table-header">EXPENSES</td>
      <td class="table-header">TOTAL</td>
      <td class="table-header">GRAND TOTAL</td>
    </tr>`;
  
  // Data rows
  operators.forEach(operator => {
    const rowClass = operator.pay != null ? 'paid' : 'pending';
    const statusIcon = operator.pay != null ? '✅ PAID' : '⚠️ PENDING';
    excel += `
    <tr class="${rowClass}">
      <td class="center">${statusIcon}</td>
      <td class="center">${operator.code}</td>
      <td class="currency">${formatCurrency(operator.cost)}</td>
      <td class="left">${operator.name}</td>
      <td class="left">${operator.lastName}</td>`;
    
    weekdayKeys.forEach(day => {
      const value = operator[day];
      excel += `<td class="currency">${value ? formatCurrency(value) : '—'}</td>`;
    });
    
    excel += `
      <td class="currency">${formatCurrency(operator.additionalBonuses || 0)}</td>
      <td class="currency">${operator.expense && operator.expense > 0 ? '-' + formatCurrency(operator.expense) : '—'}</td>
      <td class="currency">${formatCurrency((operator.total || 0) + (operator.additionalBonuses || 0))}</td>
      <td class="currency">${formatCurrency(operator.grandTotal || 0)}</td>
    </tr>`;
  });
  
  // Totals row
  excel += `
    <tr class="totals-row">
      <td colspan="5" class="center" style="font-size: 14px;">TOTALS</td>`;
  
  weekdayKeys.forEach(() => {
    excel += '<td class="currency"></td>';
  });
  
  excel += `
      <td class="currency"></td>
      <td class="currency"></td>
      <td class="currency"></td>
      <td class="currency" style="font-size: 14px;">${formatCurrency(totalGrand)}</td>
    </tr>
  </table>
</body>
</html>`;
  
  return excel;
};

// Función para imprimir reporte mejorado
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
      max-width: 1200px;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
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
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border: 1px solid #dee2e6;
    }
    
    .stat-box { 
      text-align: center; 
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }
    
    .stat-box:hover {
      transform: translateY(-2px);
    }
    
    .stat-value { 
      font-size: 24px; 
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .stat-label { 
      font-size: 12px; 
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }
    
    .stat-operators .stat-value { color: #495057; }
    .stat-paid .stat-value { color: #28a745; }
    .stat-pending .stat-value { color: #ffc107; }
    .stat-total .stat-value { color: #007bff; }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 30px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    th, td { 
      padding: 12px 8px; 
      text-align: left; 
      font-size: 11px;
      border-bottom: 1px solid #dee2e6;
    }
    
    th { 
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      color: white;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 10px;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .currency { 
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 500;
    }
    
    .center { text-align: center; }
    .left { text-align: left; }
    
    .paid { 
      background: linear-gradient(90deg, rgba(40, 167, 69, 0.1) 0%, rgba(40, 167, 69, 0.05) 100%);
      border-left: 4px solid #28a745;
    }
    
    .pending { 
      background: linear-gradient(90deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
      border-left: 4px solid #ffc107;
    }
    
    .totals { 
      background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
      font-weight: 700;
      border-top: 3px solid #667eea;
      font-size: 12px;
    }
    
    .status-paid {
      color: #28a745;
      font-weight: 600;
    }
    
    .status-pending {
      color: #ffc107;
      font-weight: 600;
    }
    
    .day-header {
      min-width: 80px;
    }
    
    .day-date {
      font-size: 9px;
      opacity: 0.8;
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
      transform: translateY(-1px);
    }
    
    .btn-close {
      background: #6c757d;
      color: white;
    }
    
    .btn-close:hover {
      background: #545b62;
      transform: translateY(-1px);
    }
    
    @media print {
      body { 
        margin: 0; 
        padding: 10px;
        background: white;
      }
      .print-buttons { display: none; }
      .report-container {
        box-shadow: none;
        padding: 0;
      }
      .stat-box:hover {
        transform: none;
      }
      table { 
        box-shadow: none;
        page-break-inside: avoid;
      }
      th {
        background: #10b981 !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      .paid, .pending {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
    
    @page {
      margin: 0.5in;
      size: landscape;
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
      <div class="stat-box stat-operators">
        <div class="stat-value">${operators.length}</div>
        <div class="stat-label">Total Operators</div>
      </div>
      <div class="stat-box stat-paid">
        <div class="stat-value">${paymentStats.paid}</div>
        <div class="stat-label">Paid</div>
      </div>
      <div class="stat-box stat-pending">
        <div class="stat-value">${paymentStats.unpaid}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-box stat-total">
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
          <th>📊 Total</th>
          <th>💎 Grand Total</th>
        </tr>
      </thead>
      <tbody>`;

  operators.forEach(operator => {
    const rowClass = operator.pay != null ? 'paid' : 'pending';
    const statusClass = operator.pay != null ? 'status-paid' : 'status-pending';
    const statusText = operator.pay != null ? '✅ PAID' : '⚠️ PENDING';
    
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
          <td colspan="5" class="center">TOTALS</td>
          <td class="currency"></td>`;

  weekdayKeys.forEach(() => {
    htmlContent += '<td class="currency"></td>';
  });

  htmlContent += `
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

// Función para descargar archivo
const downloadFile = (content: string, fileName: string, contentType: string): void => {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Componente principal con estilos mejorados
const PayrollExport: React.FC<PayrollExportProps> = (props) => {
  const fileName = `payroll_week_${props.week}_${new Date().toISOString().split('T')[0]}`;

  const handleCSVExport = () => {
    const csvContent = generateCSV(props);
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExcelExport = () => {
    const excelContent = generateExcel(props);
    downloadFile(excelContent, `${fileName}.xls`, 'application/vnd.ms-excel');
  };

  const handlePrint = () => {
    printReport(props);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Botón CSV mejorado */}
      <button
        onClick={handleCSVExport}
        className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        title="Export as CSV"
      >
        <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span className="hidden sm:inline">CSV</span>
      </button>

      {/* Botón Excel mejorado */}
      <button
        onClick={handleExcelExport}
        className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        title="Export as Excel"
      >
        <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span className="hidden sm:inline">Excel</span>
      </button>

      {/* Botón Imprimir mejorado */}
      <button
        onClick={handlePrint}
        className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        title="Print Report"
      >
        <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
        </svg>
        <span className="hidden sm:inline">Print</span>
      </button>
    </div>
  );
};

export default PayrollExport;