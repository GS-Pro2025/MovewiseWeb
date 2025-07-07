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

// Función para generar CSV
const generateCSV = (props: PayrollExportProps): string => {
  const { operators, weekInfo, week, location, paymentStats, totalGrand, weekDates } = props;
  
  let csv = '';
  
  // Header information
  csv += `"Operators Payroll Report"\n`;
  csv += `"Week ${week} - ${location || 'All Locations'}"\n`;
  csv += `"Period: ${weekInfo.start_date} to ${weekInfo.end_date}"\n`;
  csv += `\n`;
  
  // Stats
  csv += `"Summary Statistics"\n`;
  csv += `"Total Operators","${operators.length}"\n`;
  csv += `"Paid","${paymentStats.paid}"\n`;
  csv += `"Pending","${paymentStats.unpaid}"\n`;
  csv += `"Grand Total","${totalGrand}"\n`;
  csv += `\n`;
  
  // Table headers
  const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let headerRow = '"Pay Status","Code","Name","Last Name","Cost"';
  
  weekdayKeys.forEach(day => {
    const dateStr = weekDates[day];
    const displayDate = dateStr ? formatDate(dateStr) : day;
    headerRow += `,"${day} (${displayDate})"`;
  });
  
  headerRow += ',"Additional Bonuses","Grand Total"\n';
  csv += headerRow;
  
  // Data rows
  operators.forEach(operator => {
    let row = '';
    row += `"${operator.pay != null ? 'Paid' : 'Pending'}"`;
    row += `,"${operator.code}"`;
    row += `,"${operator.name}"`;
    row += `,"${operator.lastName}"`;
    row += `,"${operator.cost}"`;
    
    weekdayKeys.forEach(day => {
      const value = operator[day];
      row += `,"${value ? value : 0}"`;
    });
    
    row += `,"${operator.additionalBonuses || 0}"`;
    row += `,"${operator.grandTotal || 0}"`;
    row += '\n';
    
    csv += row;
  });
  
  // Totals row
  csv += '\n';
  csv += '"","","","TOTALS","",';
  weekdayKeys.forEach(() => {
    csv += '"",';
  });
  csv += `"","${totalGrand}"\n`;
  
  return csv;
};

// Función para generar Excel (básico usando CSV con extensión .xls)
const generateExcel = (props: PayrollExportProps): string => {
  // Similar al CSV pero con formato de tabla HTML que Excel puede leer
  const { operators, weekInfo, week, location, paymentStats, totalGrand, weekDates } = props;
  
  let excel = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <style>
    .header { background-color: #f0f0f0; font-weight: bold; text-align: center; }
    .currency { text-align: right; }
    .center { text-align: center; }
    .paid { background-color: #d4edda; }
    .pending { background-color: #fff3cd; }
  </style>
</head>
<body>
  <table border="1" cellpadding="3" cellspacing="0">
    <tr><td colspan="12" class="header">Operators Payroll Report</td></tr>
    <tr><td colspan="12" class="center">Week ${week} - ${location || 'All Locations'}</td></tr>
    <tr><td colspan="12" class="center">Period: ${weekInfo.start_date} to ${weekInfo.end_date}</td></tr>
    <tr><td colspan="12"></td></tr>
    
    <tr>
      <td class="header">Total Operators</td><td>${operators.length}</td>
      <td class="header">Paid</td><td>${paymentStats.paid}</td>
      <td class="header">Pending</td><td>${paymentStats.unpaid}</td>
      <td class="header">Grand Total</td><td class="currency">${formatCurrency(totalGrand)}</td>
      <td colspan="4"></td>
    </tr>
    <tr><td colspan="12"></td></tr>
    
    <tr class="header">
      <td>Pay Status</td>
      <td>Code</td>
      <td>Name</td>
      <td>Last Name</td>
      <td>Cost</td>`;
  
  const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  weekdayKeys.forEach(day => {
    const dateStr = weekDates[day];
    const displayDate = dateStr ? formatDate(dateStr) : day;
    excel += `<td>${day}<br/>${displayDate}</td>`;
  });
  
  excel += `
      <td>Bonus</td>
      <td>Grand Total</td>
    </tr>`;
  
  operators.forEach(operator => {
    const rowClass = operator.pay != null ? 'paid' : 'pending';
    excel += `
    <tr class="${rowClass}">
      <td class="center">${operator.pay != null ? '✓ Paid' : '⚠ Pending'}</td>
      <td>${operator.code}</td>
      <td>${operator.name}</td>
      <td>${operator.lastName}</td>
      <td class="currency">${formatCurrency(operator.cost)}</td>`;
    
    weekdayKeys.forEach(day => {
      const value = operator[day];
      excel += `<td class="currency">${value ? formatCurrency(value) : '—'}</td>`;
    });
    
    excel += `
      <td class="currency">${formatCurrency(operator.additionalBonuses || 0)}</td>
      <td class="currency">${formatCurrency(operator.grandTotal || 0)}</td>
    </tr>`;
  });
  
  excel += `
    <tr class="header">
      <td colspan="4">TOTALS</td>
      <td></td>`;
  
  weekdayKeys.forEach(() => {
    excel += '<td></td>';
  });
  
  excel += `
      <td></td>
      <td class="currency">${formatCurrency(totalGrand)}</td>
    </tr>
  </table>
</body>
</html>`;
  
  return excel;
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

// Función para imprimir reporte
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
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .subtitle { font-size: 16px; color: #666; margin-bottom: 5px; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat-box { text-align: center; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    .stat-value { font-size: 18px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
    th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
    .currency { text-align: right; }
    .center { text-align: center; }
    .paid { background-color: #d4edda; }
    .pending { background-color: #fff3cd; }
    .totals { background-color: #e9ecef; font-weight: bold; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Operators Payroll Report</div>
    <div class="subtitle">Week ${week} - ${location || 'All Locations'}</div>
    <div class="subtitle">Period: ${weekInfo.start_date} to ${weekInfo.end_date}</div>
  </div>
  
  <div class="stats">
    <div class="stat-box">
      <div class="stat-value">${operators.length}</div>
      <div class="stat-label">Total Operators</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color: green;">${paymentStats.paid}</div>
      <div class="stat-label">Paid</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color: red;">${paymentStats.unpaid}</div>
      <div class="stat-label">Pending</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color: blue;">${formatCurrency(totalGrand)}</div>
      <div class="stat-label">Grand Total</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Pay</th>
        <th>Code</th>
        <th>Name</th>
        <th>Last Name</th>
        <th>Cost</th>`;

  weekdayKeys.forEach(day => {
    const dateStr = weekDates[day];
    const displayDate = dateStr ? formatDate(dateStr) : day;
    htmlContent += `<th>${day}<br/><small>${displayDate}</small></th>`;
  });

  htmlContent += `
        <th>Bonus</th>
        <th>Grand Total</th>
      </tr>
    </thead>
    <tbody>`;

  operators.forEach(operator => {
    const rowClass = operator.pay != null ? 'paid' : 'pending';
    htmlContent += `
      <tr class="${rowClass}">
        <td class="center">${operator.pay != null ? '✓' : '⚠'}</td>
        <td>${operator.code}</td>
        <td>${operator.name}</td>
        <td>${operator.lastName}</td>
        <td class="currency">${formatCurrency(operator.cost)}</td>`;

    weekdayKeys.forEach(day => {
      const value = operator[day];
      htmlContent += `<td class="currency">${value ? formatCurrency(value) : '—'}</td>`;
    });

    htmlContent += `
        <td class="currency">${formatCurrency(operator.additionalBonuses || 0)}</td>
        <td class="currency">${formatCurrency(operator.grandTotal || 0)}</td>
      </tr>`;
  });

  htmlContent += `
      <tr class="totals">
        <td colspan="4">TOTALS</td>
        <td></td>`;

  weekdayKeys.forEach(() => {
    htmlContent += '<td></td>';
  });

  htmlContent += `
        <td></td>
        <td class="currency">${formatCurrency(totalGrand)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
    <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
  </div>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};

// Componente principal
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
    <div className="flex items-center gap-2">
      {/* Botón CSV */}
      <button
        onClick={handleCSVExport}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
        title="Export as CSV"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span className="hidden sm:inline">CSV</span>
      </button>

      {/* Botón Excel */}
      <button
        onClick={handleExcelExport}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
        title="Export as Excel"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span className="hidden sm:inline">Excel</span>
      </button>

      {/* Botón Imprimir */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
        title="Print Report"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
        </svg>
        <span className="hidden sm:inline">Print</span>
      </button>
    </div>
  );
};

export default PayrollExport;