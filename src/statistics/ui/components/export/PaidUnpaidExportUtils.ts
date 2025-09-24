import { enqueueSnackbar } from 'notistack';
import { OrdersPaidUnpaidWeekRangeResponse } from '../../../domain/OrdersPaidUnpaidModels';
import { ExportDialogMode } from './PaidUnpaidExportDialog';
import { getWeekRange } from '../../../utils/dateUtils';
import { fetchOrdersPaidUnpaidWeekRange, fetchOrdersPaidUnpaidHistoric } from '../../../data/repositoryStatistics';

export interface ExportData {
  'Order Ref': string;
  'Client': string;
  'Factory': string;
  'Date': string;
  'Payment Status': 'Paid' | 'Unpaid';
  'Income': number;
  'Expense': number;
  'Weight': number;
  'State': string;
  'Company': string;
}

export class PaidUnpaidExportUtils {
  
  /**
   * Obtiene datos según el modo especificado
   */
  static async fetchDataForExport(exportMode: ExportDialogMode): Promise<OrdersPaidUnpaidWeekRangeResponse> {
    try {
      if (exportMode.type === 'historic') {
        return await fetchOrdersPaidUnpaidHistoric();
      } else {
        if (!exportMode.startWeek || !exportMode.endWeek) {
          throw new Error('Start and end weeks are required for range mode');
        }
        return await fetchOrdersPaidUnpaidWeekRange(
          exportMode.startWeek,
          exportMode.endWeek,
          exportMode.year
        );
      }
    } catch (error) {
      console.error('Error fetching export data:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to fetch data for export'
      );
    }
  }
  
  /**
   * Convierte los datos de OrdersPaidUnpaidWeekRangeResponse a formato para exportación
   * Maneja tanto el formato de ranges (orders_by_week) como histórico (paid_orders/unpaid_orders)
   */
  static prepareExportData(data: OrdersPaidUnpaidWeekRangeResponse | null): ExportData[] {
    if (!data) {
      console.warn('No data available');
      return [];
    }

    const exportData: ExportData[] = [];
    
    try {
      // Modo histórico: usa paid_orders y unpaid_orders
      if (data.paid_orders || data.unpaid_orders) {
        console.log('Using historic format (paid_orders/unpaid_orders)');
        
        // Procesar órdenes pagadas
        if (data.paid_orders && Array.isArray(data.paid_orders)) {
          data.paid_orders.forEach(order => {
            exportData.push({
              'Order Ref': order.key_ref || 'N/A',
              'Client': order.client_name || 'Unknown Client',
              'Factory': order.customer_factory || 'Unknown Factory',
              'Date': order.date || 'N/A',
              'Payment Status': 'Paid',
              'Income': order.income || 0,
              'Expense': order.expense || 0,
              'Weight': order.weight || 0,
              'State': order.state_usa || 'N/A',
              'Company': order.company_name || 'N/A'
            });
          });
        }

        // Procesar órdenes no pagadas
        if (data.unpaid_orders && Array.isArray(data.unpaid_orders)) {
          data.unpaid_orders.forEach(order => {
            exportData.push({
              'Order Ref': order.key_ref || 'N/A',
              'Client': order.client_name || 'Unknown Client',
              'Factory': order.customer_factory || 'Unknown Factory',
              'Date': order.date || 'N/A',
              'Payment Status': 'Unpaid',
              'Income': order.income || 0,
              'Expense': order.expense || 0,
              'Weight': order.weight || 0,
              'State': order.state_usa || 'N/A',
              'Company': order.company_name || 'N/A'
            });
          });
        }
      }
      // Modo por rangos: usa orders_by_week
      else if (data.orders_by_week && typeof data.orders_by_week === 'object') {
        console.log('Using range format (orders_by_week)');
        
        Object.entries(data.orders_by_week).forEach(([week, orders]) => {
          if (!Array.isArray(orders)) {
            console.warn(`Orders for week ${week} is not an array:`, orders);
            return;
          }

          orders.forEach(order => {
            exportData.push({
              'Order Ref': order.key_ref || 'N/A',
              'Client': order.client_name || 'Unknown Client',
              'Factory': order.customer_factory || 'Unknown Factory',
              'Date': order.date || 'N/A',
              'Payment Status': order.paid ? 'Paid' : 'Unpaid',
              'Income': order.income || 0,
              'Expense': order.expense || 0,
              'Weight': order.weight || 0,
              'State': order.state_usa || 'N/A',
              'Company': order.company_name || 'N/A'
            });
          });
        });
      } else {
        console.warn('No valid data structure found. Expected orders_by_week or paid_orders/unpaid_orders');
        return [];
      }

      // Ordenar por fecha
      return exportData.sort((a, b) => {
        const dateA = new Date(a.Date);
        const dateB = new Date(b.Date);
        return dateB.getTime() - dateA.getTime(); // Más reciente primero
      });
    } catch (error) {
      console.error('Error preparing export data:', error);
      return [];
    }
  }

  /**
   * Genera nombre de archivo basado en el contexto
   */
  static generateFileName(
    format: 'xlsx' | 'pdf',
    exportMode: ExportDialogMode
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (exportMode.type === 'historic') {
      return `payment_analytics_historic_all_data_${timestamp}.${format}`;
    } else {
      return `payment_analytics_weeks_${exportMode.startWeek}-${exportMode.endWeek}_${exportMode.year}_${timestamp}.${format}`;
    }
  }

  /**
   * Exporta datos a Excel
   */
  static async exportToExcel(
    data: OrdersPaidUnpaidWeekRangeResponse | null,
    exportMode: ExportDialogMode
  ): Promise<void> {
    try {
      // Importación dinámica de XLSX
      const XLSX = await import('xlsx');
      
      const exportData = this.prepareExportData(data);
      
      if (exportData.length === 0) {
        enqueueSnackbar('No data available to export', { variant: 'warning' });
        return;
      }
      
      // Calcular totales de forma segura
      const totalPaid = data?.total_paid || 0;
      const totalUnpaid = data?.total_unpaid || 0;
      const total = totalPaid + totalUnpaid;
      const successRate = total > 0 ? ((totalPaid / total) * 100).toFixed(1) : '0';
      
      // Agregar fila de resumen
      const totalsRow = {
        'Order Ref': `${exportData.length} orders`,
        'Client': `Paid: ${totalPaid}`,
        'Factory': `Unpaid: ${totalUnpaid}`,
        'Date': `Success Rate: ${successRate}%`,
        'Payment Status': exportMode.type === 'historic' ? 'Historic Data' : `Weeks ${exportMode.startWeek}-${exportMode.endWeek}` as 'Paid' | 'Unpaid',
        'Income': exportData.reduce((sum, row) => sum + (row.Income || 0), 0),
        'Expense': exportData.reduce((sum, row) => sum + (row.Expense || 0), 0),
        'Weight': exportData.reduce((sum, row) => sum + (row.Weight || 0), 0),
        'State': 'TOTAL',
        'Company': 'SUMMARY'
      };
      
      // Combinar datos con totales
      const dataWithTotals = [...exportData, totalsRow];
      
      const ws = XLSX.utils.json_to_sheet(dataWithTotals);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payment Analytics');
      
      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 20 },  // Order Ref
        { wch: 25 },  // Client
        { wch: 20 },  // Factory
        { wch: 12 },  // Date
        { wch: 15 },  // Payment Status
        { wch: 12 },  // Income
        { wch: 12 },  // Expense
        { wch: 10 },  // Weight
        { wch: 15 },  // State
        { wch: 20 }   // Company
      ];
      ws['!cols'] = colWidths;
      
      if (ws['!ref']) {
        // Obtener rango para aplicar estilos
        const range = XLSX.utils.decode_range(ws['!ref']);
        
        // Aplicar estilos al header (primera fila)
        for (let col = range.s.c; col <= range.e.c; col++) {
          const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!ws[headerCell]) continue;
          
          ws[headerCell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "0B2863" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        
        // Aplicar estilos a la fila de totales (última fila)
        const totalsRowIndex = range.e.r;
        for (let col = range.s.c; col <= range.e.c; col++) {
          const totalsCell = XLSX.utils.encode_cell({ r: totalsRowIndex, c: col });
          if (!ws[totalsCell]) continue;
          
          ws[totalsCell].s = {
            font: { bold: true, color: { rgb: "0B2863" } },
            fill: { fgColor: { rgb: "FFE67B" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thick", color: { rgb: "0B2863" } },
              bottom: { style: "thick", color: { rgb: "0B2863" } },
              left: { style: "thick", color: { rgb: "0B2863" } },
              right: { style: "thick", color: { rgb: "0B2863" } }
            }
          };
        }
        
        // Aplicar colores a las filas según el estado de pago
        for (let row = 1; row < totalsRowIndex; row++) {
          const paymentStatusCell = XLSX.utils.encode_cell({ r: row, c: 4 }); // Columna 4 es "Payment Status"
          if (!ws[paymentStatusCell]) continue;
          
          const isPaid = ws[paymentStatusCell].v === 'Paid';
          const rowColor = isPaid ? "ECFDF5" : "FEF3C7";
          
          // Colorear toda la fila
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cell = XLSX.utils.encode_cell({ r: row, c: col });
            if (!ws[cell]) continue;
            
            ws[cell].s = {
              ...ws[cell].s,
              fill: { fgColor: { rgb: rowColor } },
              font: { 
                color: { rgb: isPaid ? "16A34A" : "D97706" },
                bold: col === 4
              }
            };
          }
        }
      }
      
      // Generar nombre de archivo
      const fileName = this.generateFileName('xlsx', exportMode);
      
      // Descargar archivo
      XLSX.writeFile(wb, fileName);
      
      enqueueSnackbar('Excel file downloaded successfully! 📊', { variant: 'success' });
    } catch (error) {
      console.error('Excel export error:', error);
      enqueueSnackbar('Error exporting to Excel ❌', { variant: 'error' });
      throw error;
    }
  }

  /**
   * Abre una nueva ventana con el reporte para impresión/PDF (patrón financialView)
   */
  static openPrintableReport(
    data: OrdersPaidUnpaidWeekRangeResponse | null,
    exportMode: ExportDialogMode
  ): void {
    try {
      if (!data) {
        enqueueSnackbar('No data available to export', { variant: 'warning' });
        return;
      }

      const exportData = this.prepareExportData(data);
      
      if (exportData.length === 0) {
        enqueueSnackbar('No data available to export', { variant: 'warning' });
        return;
      }

      // Crear ventana para el reporte
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) {
        enqueueSnackbar('Please allow popups to view the report', { variant: 'warning' });
        return;
      }

      const htmlContent = this.generatePrintHTML(data, exportData, exportMode);
      
      reportWindow.document.write(htmlContent);
      reportWindow.document.close();
      reportWindow.focus();
      
      enqueueSnackbar('Report opened in new tab! Use browser print to save as PDF 🖨️', { variant: 'success' });
    } catch (error) {
      console.error('PDF report error:', error);
      enqueueSnackbar('Error opening report ❌', { variant: 'error' });
      throw error;
    }
  }

  /**
   * Genera el HTML para impresión/PDF
   */
  private static generatePrintHTML(
    rawData: OrdersPaidUnpaidWeekRangeResponse,
    exportData: ExportData[],
    exportMode: ExportDialogMode
  ): string {
    const totalPaid = rawData.total_paid || 0;
    const totalUnpaid = rawData.total_unpaid || 0;
    const total = totalPaid + totalUnpaid;
    const successRate = total > 0 ? ((totalPaid / total) * 100).toFixed(1) : '0';
    
    const dateRange = exportMode.type === 'historic' 
      ? `Historic Data - All Available Records`
      : `Weeks ${exportMode.startWeek}-${exportMode.endWeek}, ${exportMode.year}`;

    const weekRangeText = exportMode.type === 'range' && exportMode.startWeek && exportMode.endWeek
      ? `${getWeekRange(exportMode.year, exportMode.startWeek).start} to ${getWeekRange(exportMode.year, exportMode.endWeek).end}`
      : exportMode.type === 'historic'
      ? 'Complete historical dataset from all available periods'
      : '';

    const totalIncome = exportData.reduce((sum, row) => sum + (row.Income || 0), 0);
    const totalExpense = exportData.reduce((sum, row) => sum + (row.Expense || 0), 0);
    const totalWeight = exportData.reduce((sum, row) => sum + (row.Weight || 0), 0);

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Payment Analytics Report - ${dateRange}</title>
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
    
    .btn-print {
      background: #3b82f6;
      color: white;
    }
    
    .btn-close {
      background: #6b7280;
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    .report-container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #0B2863, #1e40af);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8fafc;
    }
    
    .stat-box {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 2px solid #e5e7eb;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .content {
      padding: 40px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #1f2937;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-size: 11px;
    }
    
    th {
      background: #3b82f6;
      color: white;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10px;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .paid {
      background: linear-gradient(135deg, #ecfdf5, #d1fae5) !important;
      border-left: 3px solid #22c55e;
    }
    
    .unpaid {
      background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
      border-left: 3px solid #f59e0b;
    }
    
    .status-paid {
      color: #22c55e;
      font-weight: 600;
    }
    
    .status-unpaid {
      color: #f59e0b;
      font-weight: 600;
    }
    
    .no-data {
      text-align: center;
      padding: 40px;
      color: #6b7280;
      font-style: italic;
    }
    
    @media print {
      .print-buttons { display: none !important; }
      body { margin: 0; padding: 0; }
      .report-container { box-shadow: none; }
      table { page-break-inside: avoid; font-size: 10px; }
      th { background: #3b82f6 !important; -webkit-print-color-adjust: exact; font-size: 10px; }
      .paid { background: #ecfdf5 !important; -webkit-print-color-adjust: exact; }
      .unpaid { background: #fef3c7 !important; -webkit-print-color-adjust: exact; }
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
      <div class="title">PAYMENT ANALYTICS REPORT</div>
      <div class="subtitle">${dateRange}</div>
      ${weekRangeText ? `<div class="subtitle">Period: ${weekRangeText}</div>` : ''}
      <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value" style="color: #3b82f6;">${total}</div>
        <div class="stat-label">Total Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #22c55e;">${totalPaid}</div>
        <div class="stat-label">Paid Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #f59e0b;">${totalUnpaid}</div>
        <div class="stat-label">Unpaid Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #8b5cf6;">${successRate}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #10b981;">$${totalIncome.toFixed(2)}</div>
        <div class="stat-label">Total Income</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #ef4444;">$${totalExpense.toFixed(2)}</div>
        <div class="stat-label">Total Expense</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #6366f1;">${totalWeight.toFixed(1)} lbs</div>
        <div class="stat-label">Total Weight</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #059669;">$${(totalIncome - totalExpense).toFixed(2)}</div>
        <div class="stat-label">Net Profit</div>
      </div>
    </div>
    
    <div class="content">
      <div class="section-title">Detailed Payment Records</div>
      ${exportData.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Client</th>
            <th>Factory</th>
            <th>Date</th>
            <th>Payment</th>
            <th>Income</th>
            <th>Expense</th>
            <th>Weight</th>
            <th>State</th>
            <th>Company</th>
          </tr>
        </thead>
        <tbody>
          ${exportData.map(row => `
            <tr class="${row['Payment Status'].toLowerCase()}">
              <td><strong>${row['Order Ref']}</strong></td>
              <td>${row.Client}</td>
              <td>${row.Factory}</td>
              <td>${row.Date}</td>
              <td class="status-${row['Payment Status'].toLowerCase()}">${row['Payment Status']}</td>
              <td>$${row.Income.toFixed(2)}</td>
              <td>$${row.Expense.toFixed(2)}</td>
              <td>${row.Weight.toFixed(1)}</td>
              <td>${row.State}</td>
              <td>${row.Company}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : `
      <div class="no-data">
        <h3>No payment records found</h3>
        <p>There are no records available for the selected criteria.</p>
      </div>
      `}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Método para compatibilidad con el patrón anterior (ahora redirige a openPrintableReport)
   */
  static exportToPDF(
    data: OrdersPaidUnpaidWeekRangeResponse | null,
    exportMode: ExportDialogMode
  ): void {
    this.openPrintableReport(data, exportMode);
  }
}