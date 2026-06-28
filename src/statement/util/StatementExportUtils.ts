import { StatementRecord } from '../domain/StatementModels';
import { enqueueSnackbar } from 'notistack';

export interface StatementExportData {
  'Reference': string;
  'Date': string;
  'Week': number;
  'Shipper': string;
  'Income': number;
  'Expense': number;
  'State': string;
  'Company': string;
}

export class StatementExportUtils {

  static prepareExportData(records: StatementRecord[]): StatementExportData[] {
    return records.map(record => ({
      'Reference': record.keyref,
      'Date': record.date,
      'Week': record.week,
      'Shipper': record.shipper_name || 'N/A',
      'Income': parseFloat(record.income || '0'),
      'Expense': parseFloat(record.expense || '0'),
      'State': record.state || 'N/A',
      'Company': record.company || 'N/A',
    }));
  }

  static async exportToExcel(
    data: StatementRecord[],
    filename: string
  ): Promise<void> {
    try {
      const XLSX = await import('xlsx');

      const exportData = this.prepareExportData(data);

      const totalsRow = {
        'Reference': 'TOTALS',
        'Date': `${exportData.length} records`,
        'Week': 0,
        'Shipper': '',
        'Income': exportData.reduce((sum, row) => sum + row.Income, 0),
        'Expense': exportData.reduce((sum, row) => sum + row.Expense, 0),
        'State': '',
        'Company': `Net: $${(exportData.reduce((sum, row) => sum + row.Income, 0) - exportData.reduce((sum, row) => sum + row.Expense, 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      };

      const dataWithTotals = [...exportData, totalsRow];

      const ws = XLSX.utils.json_to_sheet(dataWithTotals);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Statements');

      const colWidths = [
        { wch: 18 },
        { wch: 14 },
        { wch: 8 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
      ];
      ws['!cols'] = colWidths;

      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
            fill: { fgColor: { rgb: '0B2863' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }

      const totalRowIndex = range.e.r;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: '0B2863' }, sz: 12 },
            fill: { fgColor: { rgb: 'FFE67B' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thick', color: { rgb: '0B2863' } },
              bottom: { style: 'thick', color: { rgb: '0B2863' } },
            },
          };
        }
      }

      XLSX.writeFile(wb, filename);

      enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error exporting to Excel', { variant: 'error' });
      console.error('Excel export error:', error);
    }
  }

  static exportToPDF(
    data: StatementRecord[],
    filename: string,
    week?: number,
    year?: number
  ): void {
    try {
      const exportData = this.prepareExportData(data);
      const totalIncome = exportData.reduce((sum, row) => sum + row.Income, 0);
      const totalExpense = exportData.reduce((sum, row) => sum + row.Expense, 0);
      const net = totalIncome - totalExpense;

      const weekLabel = week && year ? `Week ${week}, ${year}` : 'All Records';
      const dateRange = week && year
        ? `${year}, Week ${week}`
        : 'All available records';

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Statements Report - ${dateRange}</title>
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
    .btn-print { background: #3b82f6; color: white; }
    .btn-close { background: #6b7280; color: white; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); }
    .report-container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0B2863, #1e40af); color: white; padding: 40px; text-align: center; }
    .title { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .subtitle { font-size: 16px; opacity: 0.9; margin-bottom: 8px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 40px; background: #f8fafc; }
    .stat-box { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 2px solid #e5e7eb; }
    .stat-value { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .stat-label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 40px; }
    .section-title { font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-size: 11px; }
    th { background: #3b82f6; color: white; padding: 12px 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
    tr:nth-child(even) { background: #f8fafc; }
    .totals-row { background: #fef3c7 !important; font-weight: 700; border-top: 3px solid #0B2863; }
    .no-data { text-align: center; padding: 40px; color: #6b7280; font-style: italic; }
    @media print {
      .print-buttons { display: none !important; }
      body { margin: 0; padding: 0; }
      .report-container { box-shadow: none; }
      table { page-break-inside: avoid; font-size: 10px; }
      th { background: #3b82f6 !important; -webkit-print-color-adjust: exact; font-size: 10px; }
      .totals-row { background: #fef3c7 !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-buttons">
    <button onclick="window.print()" class="btn btn-print">Print / Save as PDF</button>
    <button onclick="window.close()" class="btn btn-close">Close</button>
  </div>

  <div class="report-container">
    <div class="header">
      <div class="title">STATEMENTS REPORT</div>
      <div class="subtitle">${weekLabel}</div>
      <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-value" style="color: #3b82f6;">${exportData.length}</div>
        <div class="stat-label">Total Records</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #22c55e;">$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div class="stat-label">Total Income</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #ef4444;">$${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div class="stat-label">Total Expense</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: ${net >= 0 ? '#22c55e' : '#ef4444'};">$${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div class="stat-label">Net Amount</div>
      </div>
    </div>

    <div class="content">
      <div class="section-title">Statement Records</div>
      ${exportData.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Date</th>
            <th>Week</th>
            <th>Shipper</th>
            <th>Income</th>
            <th>Expense</th>
            <th>State</th>
            <th>Company</th>
          </tr>
        </thead>
        <tbody>
          ${exportData.map(row => `
            <tr>
              <td><strong>${row['Reference']}</strong></td>
              <td>${row['Date']}</td>
              <td>${row['Week']}</td>
              <td>${row['Shipper']}</td>
              <td>$${row['Income'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Expense'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>${row['State']}</td>
              <td>${row['Company']}</td>
            </tr>
          `).join('')}
          <tr class="totals-row">
            <td colspan="3"><strong>TOTALS — ${exportData.length} records</strong></td>
            <td></td>
            <td><strong>$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td></td>
            <td><strong>Net: $${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
          </tr>
        </tbody>
      </table>
      ` : `
      <div class="no-data">
        <h3>No statement records found</h3>
        <p>There are no records available for the selected criteria.</p>
      </div>
      `}
    </div>
  </div>
</body>
</html>`;

      const reportWindow = window.open('', '_blank');
      if (!reportWindow) {
        enqueueSnackbar('Please allow popups to view the report', { variant: 'warning' });
        return;
      }

      reportWindow.document.write(html);
      reportWindow.document.close();
      reportWindow.focus();

      enqueueSnackbar('PDF report opened for printing!', { variant: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      enqueueSnackbar('Error opening PDF report', { variant: 'error' });
    }
  }
}
