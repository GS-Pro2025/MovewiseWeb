// components/ExcelCsvExporter.tsx
import React from 'react';
import { PayrollExportProps, WeekAmounts } from '../../models/payrroll';
import { formatCurrency, formatDate, downloadFile } from './PayrollUtil';


type ExcelCsvExporterProps = PayrollExportProps; 

// Función para generar CSV
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

// Función para generar Excel
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

const ExcelCsvExporter: React.FC<ExcelCsvExporterProps> = (props) => {
  const fileName = `payroll_week_${props.week}_${new Date().toISOString().split('T')[0]}`;

  const handleCSVExport = () => {
    const csvContent = generateCSV(props);
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExcelExport = () => {
    const excelContent = generateExcel(props);
    downloadFile(excelContent, `${fileName}.xls`, 'application/vnd.ms-excel');
  };

  return (
    <div className="flex items-center gap-3">
      {/* Botón CSV con Tailwind optimizado */}
      <button
        onClick={handleCSVExport}
        className="group relative overflow-hidden flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        title="Export as CSV"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span className="hidden sm:inline relative z-10">CSV</span>
      </button>

      {/* Botón Excel con Tailwind optimizado */}
      <button
        onClick={handleExcelExport}
        className="group relative overflow-hidden flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
        title="Export as Excel"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span className="hidden sm:inline relative z-10">Excel</span>
      </button>
    </div>
  );
};

export default ExcelCsvExporter;