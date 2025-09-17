import { TableData, TableDataExport } from '../domain/TableData';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define proper types for autoTable
interface AutoTableOptions {
  head: string[][];
  body: (string | number)[][];
  startY: number;
  styles: {
    fontSize: number;
    cellPadding: number;
  };
  headStyles: {
    fillColor: number[];
    textColor: number;
    fontStyle: string;
  };
  alternateRowStyles: {
    fillColor: number[];
  };
  columnStyles: Record<number, { cellWidth: number }>;
  margin: {
    top: number;
    left: number;
    right: number;
  };
  didDrawPage: (data: AutoTableData) => void;
}

interface AutoTableData {
  pageNumber: number;
  settings: {
    margin: {
      left: number;
    };
  };
}

// Extend the jsPDF type to include autoTable and getNumberOfPages
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    getNumberOfPages(): number;
  }
}

// Function to clean data before export
export const mapTableDataForExport = (data: TableData[]): TableDataExport[] =>
  data.map(
    ({
      id,
      status,
      key_ref,
      firstName,
      lastName,
      phone,
      email,
      company,
      customer_factory,
      city,
      state,
      weekday,
      expense,
      income,
      dateReference,
      job,
      job_id,
      weight,
      truckType,
      totalCost,
      payStatus,
      distance,
      week,
    }) => ({
      id,
      key_ref,
      status,
      firstName,
      lastName,
      phone,
      email,
      company,
      customer_factory,
      city,
      state,
      weekday,
      expense, 
      income,  
      dateReference,
      job,
      job_id,
      weight,
      truckType,
      totalCost,
      payStatus,
      distance,
      week,
    })
  );

// CSV Configuration
const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

// Export to Excel (CSV)
export const exportToExcel = (data: TableData[], filename: string = 'orders_export') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  const exportData = mapTableDataForExport(data);
  const csv = generateCsv(csvConfig)(exportData);
  download({
    ...csvConfig,
    filename: `${filename}_${new Date().toISOString().split('T')[0]}`
  })(csv);
};

// Export to PDF
export const exportToPDF = (data: TableData[], filename: string = 'orders_export') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
  
  // Title
  doc.setFontSize(16);
  doc.text('Orders Report', 14, 15);
  
  // Generation date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);
  
  // Prepare data for table
  const tableData = data.map(row => [
    row.key_ref,
    row.status,
    row.firstName,
    row.lastName,
    row.company,
    row.state,
    row.dateReference,
    row.weekday,
    row.weight,
    `$${Number(row.expense || 0).toLocaleString()}`,
    `$${Number(row.income || 0).toLocaleString()}`,
    row.payStatus === 0 ? 'Unpaid' : 'Paid'
  ]);

  // Table configuration
  const autoTableOptions: AutoTableOptions = {
    head: [[
      'Reference', 'Status', 'First Name', 'Last Name', 'Company', 
      'Location', 'Date', 'Weekday', 'Weight', 'Expense', 'Income', 'Pay Status'
    ]],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [63, 81, 181],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Reference
      1: { cellWidth: 18 }, // Status
      2: { cellWidth: 25 }, // First Name
      3: { cellWidth: 25 }, // Last Name
      4: { cellWidth: 30 }, // Company
      5: { cellWidth: 20 }, // Location
      6: { cellWidth: 22 }, // Date
      7: { cellWidth: 20 }, // Weekday
      8: { cellWidth: 18 }, // Weight
      9: { cellWidth: 20 }, // Expense
      10: { cellWidth: 20 }, // Income
      11: { cellWidth: 18 }, // Pay Status
    },
    margin: { top: 35, left: 14, right: 14 },
    didDrawPage: function (data: AutoTableData) {
      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    }
  };

  doc.autoTable(autoTableOptions);

  // Download PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export filtered data by week
export const exportWeeklyData = (
  data: TableData[], 
  week: number, 
  year: number, 
  format: 'excel' | 'pdf' = 'excel'
) => {
  const weeklyData = data.filter(item => item.week === week);
  const filename = `orders_week_${week}_${year}`;
  
  if (format === 'excel') {
    exportToExcel(weeklyData, filename);
  } else {
    exportToPDF(weeklyData, filename);
  }
};