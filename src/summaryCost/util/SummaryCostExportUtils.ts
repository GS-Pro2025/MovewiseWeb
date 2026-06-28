import { OrderSummary } from '../domain/OrderSummaryModel';
import { enqueueSnackbar } from 'notistack';

export interface SummaryCostExportData {
  'Reference': string;
  'Client': string;
  'Customer Factory': string;
  'Date': string;
  'State': string;
  'Status': string;
  'Pay Status': string;
  'Income': number;
  'Expense': number;
  'Fuel Cost': number;
  'Work Cost': number;
  'Driver Salaries': number;
  'Other Salaries': number;
  'Bonus': number;
  'Total Cost': number;
  'Net Profit': number;
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export class SummaryCostExportUtils {

  static prepareExportData(orders: OrderSummary[]): SummaryCostExportData[] {
    return orders.map(order => ({
      'Reference': order.key_ref,
      'Client': order.client,
      'Customer Factory': order.customer_name || 'N/A',
      'Date': parseLocalDate(order.date).toLocaleDateString(),
      'State': order.state,
      'Status': (order.status || 'N/A').charAt(0).toUpperCase() + (order.status || 'N/A').slice(1),
      'Pay Status': order.payStatus === 1 ? 'Paid' : order.payStatus === 0 ? 'Unpaid' : 'N/A',
      'Income': order.summary?.rentingCost ?? order.income ?? 0,
      'Expense': order.summary?.expense ?? 0,
      'Fuel Cost': order.summary?.fuelCost ?? 0,
      'Work Cost': order.summary?.workCost ?? 0,
      'Driver Salaries': order.summary?.driverSalaries ?? 0,
      'Other Salaries': order.summary?.otherSalaries ?? 0,
      'Bonus': order.summary?.bonus ?? 0,
      'Total Cost': order.summary?.totalCost ?? 0,
      'Net Profit': order.summary?.net_profit ?? 0,
    }));
  }

  static generateFileName(
    mode: 'single_week' | 'week_range',
    year: number,
    week?: number,
    startWeek?: number,
    endWeek?: number
  ): string {
    if (mode === 'single_week') {
      return `summary_cost_week_${week}_${year}.xlsx`;
    }
    return `summary_cost_range_${startWeek}-${endWeek}_${year}.xlsx`;
  }

  static async exportToExcel(
    orders: OrderSummary[],
    mode: 'single_week' | 'week_range',
    year: number,
    week?: number,
    startWeek?: number,
    endWeek?: number
  ): Promise<void> {
    try {
      const XLSX = await import('xlsx');

      const exportData = this.prepareExportData(orders);

      const totalsRow: SummaryCostExportData = {
        'Reference': 'TOTALS',
        'Client': `${exportData.length} orders`,
        'Customer Factory': '',
        'Date': '',
        'State': '',
        'Status': `Paid: ${orders.filter(o => o.payStatus === 1).length} | Unpaid: ${orders.filter(o => o.payStatus === 0).length}`,
        'Pay Status': '',
        'Income': exportData.reduce((sum, r) => sum + r.Income, 0),
        'Expense': exportData.reduce((sum, r) => sum + r.Expense, 0),
        'Fuel Cost': exportData.reduce((sum, r) => sum + r['Fuel Cost'], 0),
        'Work Cost': exportData.reduce((sum, r) => sum + r['Work Cost'], 0),
        'Driver Salaries': exportData.reduce((sum, r) => sum + r['Driver Salaries'], 0),
        'Other Salaries': exportData.reduce((sum, r) => sum + r['Other Salaries'], 0),
        'Bonus': exportData.reduce((sum, r) => sum + r.Bonus, 0),
        'Total Cost': exportData.reduce((sum, r) => sum + r['Total Cost'], 0),
        'Net Profit': exportData.reduce((sum, r) => sum + r['Net Profit'], 0),
      };

      const dataWithTotals = [...exportData, totalsRow];

      const ws = XLSX.utils.json_to_sheet(dataWithTotals);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Summary Cost');

      const cols = Object.keys(dataWithTotals[0] || {});
      const colWidths = cols.map(key =>
        key === 'Reference' || key === 'Customer Factory' ? { wch: 20 }
          : key.length > 10 ? { wch: key.length + 4 }
            : { wch: 16 }
      );
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

      const fileName = this.generateFileName(mode, year, week, startWeek, endWeek);
      XLSX.writeFile(wb, fileName);

      enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error exporting to Excel', { variant: 'error' });
      console.error('Excel export error:', error);
    }
  }

  static exportToPDF(
    orders: OrderSummary[],
    mode: 'single_week' | 'week_range',
    year: number,
    week?: number,
    startWeek?: number,
    endWeek?: number
  ): void {
    try {
      const exportData = this.prepareExportData(orders);
      const totalIncome = exportData.reduce((sum, r) => sum + r.Income, 0);
      const totalExpense = exportData.reduce((sum, r) => sum + r.Expense, 0);
      const totalCost = exportData.reduce((sum, r) => sum + r['Total Cost'], 0);
      const totalProfit = exportData.reduce((sum, r) => sum + r['Net Profit'], 0);

      const dateLabel = mode === 'single_week'
        ? `Year ${year}, Week ${week}`
        : `Year ${year}, Weeks ${startWeek}-${endWeek}`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Summary Cost Report - ${dateLabel}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; color: #1f2937; background: white; padding: 20px; }
    .print-buttons { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; }
    .btn { padding: 12px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .btn-print { background: #3b82f6; color: white; }
    .btn-close { background: #6b7280; color: white; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
    .report-container { max-width: 100%; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0B2863, #1e40af); color: white; padding: 40px; text-align: center; }
    .title { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .subtitle { font-size: 16px; opacity: 0.9; margin-bottom: 8px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; padding: 40px; background: #f8fafc; }
    .stat-box { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #e5e7eb; }
    .stat-value { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .stat-label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 40px; overflow-x: auto; }
    .section-title { font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 10px; }
    th { background: #3b82f6; color: white; padding: 10px 6px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap; }
    td { padding: 6px; border-bottom: 1px solid #e5e7eb; font-size: 9px; white-space: nowrap; }
    tr:nth-child(even) { background: #f8fafc; }
    .totals-row { background: #fef3c7 !important; font-weight: 700; border-top: 3px solid #0B2863; }
    .no-data { text-align: center; padding: 40px; color: #6b7280; font-style: italic; }
    @media print {
      .print-buttons { display: none !important; }
      body { margin: 0; padding: 0; }
      .report-container { box-shadow: none; }
      table { page-break-inside: avoid; }
      th { background: #3b82f6 !important; -webkit-print-color-adjust: exact; }
      .totals-row { background: #fef3c7 !important; -webkit-print-color-adjust: exact; }
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
      <div class="title">SUMMARY COST REPORT</div>
      <div class="subtitle">${dateLabel}</div>
      <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-value" style="color: #3b82f6;">${exportData.length}</div>
        <div class="stat-label">Total Orders</div>
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
        <div class="stat-value" style="color: #6366f1;">$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div class="stat-label">Total Cost</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: ${totalProfit >= 0 ? '#22c55e' : '#ef4444'};">$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div class="stat-label">Net Profit</div>
      </div>
    </div>

    <div class="content">
      <div class="section-title">Detailed Summary</div>
      ${exportData.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Client</th>
            <th>Customer Factory</th>
            <th>Date</th>
            <th>State</th>
            <th>Status</th>
            <th>Pay Status</th>
            <th>Income</th>
            <th>Expense</th>
            <th>Fuel Cost</th>
            <th>Work Cost</th>
            <th>Driver Salaries</th>
            <th>Other Salaries</th>
            <th>Bonus</th>
            <th>Total Cost</th>
            <th>Net Profit</th>
          </tr>
        </thead>
        <tbody>
          ${exportData.map(row => `
            <tr>
              <td><strong>${row['Reference']}</strong></td>
              <td>${row['Client']}</td>
              <td>${row['Customer Factory']}</td>
              <td>${row['Date']}</td>
              <td>${row['State']}</td>
              <td>${row['Status']}</td>
              <td>${row['Pay Status']}</td>
              <td>$${row['Income'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Expense'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Fuel Cost'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Work Cost'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Driver Salaries'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Other Salaries'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Bonus'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Total Cost'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>$${row['Net Profit'].toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
          <tr class="totals-row">
            <td colspan="7"><strong>TOTALS — ${exportData.length} orders</strong></td>
            <td><strong>$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${exportData.reduce((s, r) => s + r['Fuel Cost'], 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${exportData.reduce((s, r) => s + r['Work Cost'], 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${exportData.reduce((s, r) => s + r['Driver Salaries'], 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${exportData.reduce((s, r) => s + r['Other Salaries'], 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${exportData.reduce((s, r) => s + r['Bonus'], 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><strong>$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
          </tr>
        </tbody>
      </table>
      ` : `
      <div class="no-data">
        <h3>No summary cost data found</h3>
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
