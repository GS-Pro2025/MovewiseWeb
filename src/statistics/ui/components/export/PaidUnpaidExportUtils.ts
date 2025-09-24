import { enqueueSnackbar } from 'notistack';
import { OrdersPaidUnpaidWeekRangeResponse } from '../../../domain/OrdersPaidUnpaidModels';
import { ExportMode } from './PaidUnpaidExportMenu';
import { getWeekRange } from '../../../utils/dateUtils';

export interface ExportData {
  'Week': string;
  'Order Ref': string;
  'Client': string;
  'Factory': string;
  'Date': string;
  'Status': string;
  'Payment Status': 'Paid' | 'Unpaid';
}

export class PaidUnpaidExportUtils {
  
  /**
   * Convierte los datos de OrdersPaidUnpaidWeekRangeResponse a formato para exportación
   */
  static prepareExportData(data: OrdersPaidUnpaidWeekRangeResponse | null): ExportData[] {
    if (!data) return [];

    const exportData: ExportData[] = [];
    
    // Iterar por cada semana en orders_by_week
    Object.entries(data.orders_by_week).forEach(([week, orders]) => {
      orders.forEach(order => {
        exportData.push({
          'Week': `W${week}`,
          'Order Ref': order.key_ref,
          'Client': order.client_name,
          'Factory': order.customer_factory,
          'Date': order.date,
          'Status': order.payStatus || 'Unknown',
          'Payment Status': order.paid ? 'Paid' : 'Unpaid'
        });
      });
    });

    return exportData.sort((a, b) => a.Week.localeCompare(b.Week));
  }

  /**
   * Genera nombre de archivo basado en el contexto
   */
  static generateFileName(
    format: 'xlsx' | 'pdf',
    exportMode: ExportMode
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (exportMode.type === 'historic') {
      return `payment_analytics_historic_${exportMode.year}_${timestamp}.${format}`;
    } else {
      return `payment_analytics_weeks_${exportMode.startWeek}-${exportMode.endWeek}_${exportMode.year}_${timestamp}.${format}`;
    }
  }

  /**
   * Exporta datos a Excel
   */
  static async exportToExcel(
    data: OrdersPaidUnpaidWeekRangeResponse | null,
    exportMode: ExportMode
  ): Promise<void> {
    try {
      const XLSX = await import('xlsx');
      
      const exportData = this.prepareExportData(data);
      
      if (exportData.length === 0) {
        enqueueSnackbar('No data available to export', { variant: 'warning' });
        return;
      }
      
      // Agregar fila de resumen
      const totalsRow = {
        'Week': 'SUMMARY',
        'Order Ref': `${exportData.length} orders`,
        'Client': `Paid: ${data?.total_paid || 0}`,
        'Factory': `Unpaid: ${data?.total_unpaid || 0}`,
        'Date': `Success Rate: ${data ? ((data.total_paid / (data.total_paid + data.total_unpaid)) * 100).toFixed(1) : 0}%`,
        'Status': exportMode.type === 'historic' ? 'Historic Data' : `Weeks ${exportMode.startWeek}-${exportMode.endWeek}`,
        'Payment Status': `Year ${exportMode.year}` as 'Paid' | 'Unpaid'
      };
      
      // Combinar datos con totales
      const dataWithTotals = [...exportData, totalsRow];
      
      const ws = XLSX.utils.json_to_sheet(dataWithTotals);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payment Analytics');
      
      // Ajustar ancho de columnas
      const colWidths = Object.keys(dataWithTotals[0] || {}).map(() => ({ wch: 15 }));
      ws['!cols'] = colWidths;
      
      // AHORA SÍ USAMOS range para aplicar estilos
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
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
      for (let row = 1; row < totalsRowIndex; row++) { // Empezar en 1 para saltar el header
        const paymentStatusCell = XLSX.utils.encode_cell({ r: row, c: 6 }); // Columna 6 es "Payment Status"
        if (!ws[paymentStatusCell]) continue;
        
        const isPaid = ws[paymentStatusCell].v === 'Paid';
        const rowColor = isPaid ? "ECFDF5" : "FEF3C7"; // Verde claro para paid, amarillo para unpaid
        
        // Colorear toda la fila
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cell = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cell]) continue;
          
          ws[cell].s = {
            ...ws[cell].s,
            fill: { fgColor: { rgb: rowColor } },
            font: { 
              color: { rgb: isPaid ? "16A34A" : "D97706" }, // Verde oscuro para paid, naranja para unpaid
              bold: col === 6 // Bold solo para la columna Payment Status
            }
          };
        }
      }
      
      // Generar nombre de archivo
      const fileName = this.generateFileName('xlsx', exportMode);
      
      // Descargar archivo
      XLSX.writeFile(wb, fileName);
      
      enqueueSnackbar('Excel file downloaded successfully! 📊', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error exporting to Excel ❌', { variant: 'error' });
      console.error('Excel export error:', error);
    }
  }

  /**
   * Exporta datos a PDF (Impresión en nueva pestaña)
   */
  static exportToPDF(
    data: OrdersPaidUnpaidWeekRangeResponse | null,
    exportMode: ExportMode
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

      // Crear ventana de impresión
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        enqueueSnackbar('Please allow popups to export PDF', { variant: 'warning' });
        return;
      }

      const htmlContent = this.generatePrintHTML(data, exportData, exportMode);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      enqueueSnackbar('PDF report opened for printing! 🖨️', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error opening PDF report ❌', { variant: 'error' });
      console.error('PDF print error:', error);
    }
  }

  /**
   * Genera el HTML para impresión/PDF
   */
  private static generatePrintHTML(
    rawData: OrdersPaidUnpaidWeekRangeResponse,
    exportData: ExportData[],
    exportMode: ExportMode
  ): string {
    const successRate = ((rawData.total_paid / (rawData.total_paid + rawData.total_unpaid)) * 100).toFixed(1);
    
    const dateRange = exportMode.type === 'historic' 
      ? `Historic Data - ${exportMode.year}`
      : `Weeks ${exportMode.startWeek}-${exportMode.endWeek}, ${exportMode.year}`;

    const weekRangeText = exportMode.type === 'range' && exportMode.startWeek && exportMode.endWeek
      ? `${getWeekRange(exportMode.year, exportMode.startWeek).start} to ${getWeekRange(exportMode.year, exportMode.endWeek).end}`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Payment Analytics Report - ${dateRange}</title>
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
    
    .report-container {
      max-width: 1200px;
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
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 14px;
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
    }
    
    th {
      background: #3b82f6;
      color: white;
      padding: 15px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .paid {
      background: linear-gradient(135deg, #ecfdf5, #d1fae5) !important;
      border-left: 4px solid #22c55e;
    }
    
    .unpaid {
      background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
      border-left: 4px solid #f59e0b;
    }
    
    .status-paid {
      color: #22c55e;
      font-weight: 600;
    }
    
    .status-unpaid {
      color: #f59e0b;
      font-weight: 600;
    }
    
    @media print {
      .print-buttons { display: none !important; }
      body { margin: 0; padding: 0; }
      .report-container { box-shadow: none; }
      table { page-break-inside: avoid; }
      th { background: #3b82f6 !important; -webkit-print-color-adjust: exact; }
      .paid { background: #ecfdf5 !important; -webkit-print-color-adjust: exact; }
      .unpaid { background: #fef3c7 !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-buttons">
    <button onclick="window.print()" class="btn btn-print">🖨️ Print Report</button>
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
        <div class="stat-value" style="color: #3b82f6;">${rawData.total_paid + rawData.total_unpaid}</div>
        <div class="stat-label">Total Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #22c55e;">${rawData.total_paid}</div>
        <div class="stat-label">Paid Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #f59e0b;">${rawData.total_unpaid}</div>
        <div class="stat-label">Unpaid Orders</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #8b5cf6;">${successRate}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
    </div>
    
    <div class="content">
      <div class="section-title">📊 Detailed Payment Records</div>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Order Ref</th>
            <th>Client</th>
            <th>Factory</th>
            <th>Date</th>
            <th>Status</th>
            <th>Payment Status</th>
          </tr>
        </thead>
        <tbody>
          ${exportData.map(row => `
            <tr class="${row['Payment Status'].toLowerCase()}">
              <td><strong>${row.Week}</strong></td>
              <td>${row['Order Ref']}</td>
              <td>${row.Client}</td>
              <td>${row.Factory}</td>
              <td>${row.Date}</td>
              <td>${row.Status}</td>
              <td class="status-${row['Payment Status'].toLowerCase()}">${row['Payment Status']}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  }
}