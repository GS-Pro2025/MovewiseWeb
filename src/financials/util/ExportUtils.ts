// utils/ExportUtils.ts
import { SuperOrder } from "../domain/ModelsOCR";
import { enqueueSnackbar } from "notistack";

export interface ExportData {
  'Reference': string;
  'Client': string;
  'Total Income': number;
  'Total Cost': number;
  'Profit': number;
  'Expense': number;
  'Fuel Cost': number;
  'Work Cost': number;
  'Driver Salaries': number;
  'Operator Salaries': number;
  'Pay Status': string;
}

export class ExportUtils {
  
  /**
   * Convierte los datos de SuperOrder a formato para exportación
   */
  static prepareExportData(superOrders: SuperOrder[]): ExportData[] {
    return superOrders.map(order => ({
      'Reference': order.key_ref,
      'Client': order.client,
      'Total Income': order.totalIncome,
      'Total Cost': order.totalCost,
      'Profit': order.totalProfit,
      'Expense': order.expense,
      'Fuel Cost': order.fuelCost,
      'Work Cost': order.workCost,
      'Driver Salaries': order.driverSalaries,
      'Operator Salaries': order.otherSalaries,
      'Pay Status': order.payStatus === 1 ? 'Paid' : 'Unpaid'
    }));
  }

  /**
   * Genera nombre de archivo basado en el contexto
   */
  static generateFileName(
    format: 'xlsx' | 'pdf',
    isSearchResults: boolean,
    week?: number,
    year?: number
  ): string {
    const extension = format;
    const date = new Date().toISOString().split('T')[0];
    
    if (isSearchResults) {
      return `financial_search_results_${date}.${extension}`;
    } else {
      return `financial_summary_week_${week}_${year}.${extension}`;
    }
  }

  /**
   * Exporta datos a Excel
   */
  static async exportToExcel(
    superOrders: SuperOrder[],
    isSearchResults: boolean = false,
    week?: number,
    year?: number
  ): Promise<void> {
    try {
      // Importar dinámicamente la librería XLSX
      const XLSX = await import('xlsx');
      
      const exportData = this.prepareExportData(superOrders);
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Financial Summary');
      
      // Ajustar ancho de columnas
      const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
      ws['!cols'] = colWidths;
      
      // Agregar estilo al header
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "667EEA" } },
            alignment: { horizontal: "center" }
          };
        }
      }
      
      const fileName = this.generateFileName('xlsx', isSearchResults, week, year);
      XLSX.writeFile(wb, fileName);
      
      enqueueSnackbar('Excel exported successfully! 📊', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error exporting to Excel ❌', { variant: 'error' });
      console.error('Excel export error:', error);
    }
  }

  /**
   * Exporta datos a PDF
   */
  static async exportToPDF(
    superOrders: SuperOrder[],
    isSearchResults: boolean = false,
    week?: number,
    year?: number,
    weekRange?: { start: string; end: string }
  ): Promise<void> {
    try {
      // Importar dinámicamente las librerías de PDF
      const jsPDF = (await import('jspdf')).default;
      await import('jspdf-autotable');

      const doc = new jsPDF();
      
      // Configurar título y subtítulo
      doc.setFontSize(24);
      doc.setTextColor(102, 126, 234);
      doc.text('📊 Financial Summary Report', 14, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      
      const subtitle = isSearchResults 
        ? `Search Results - Generated on ${new Date().toLocaleDateString()}`
        : `Week ${week}, ${year} (${weekRange?.start} - ${weekRange?.end})`;
      
      doc.text(subtitle, 14, 35);
      
      // Agregar línea decorativa
      doc.setDrawColor(102, 126, 234);
      doc.setLineWidth(0.5);
      doc.line(14, 40, 196, 40);
      
      // Calcular totales
      const totals = superOrders.reduce((acc, order) => ({
        totalIncome: acc.totalIncome + order.totalIncome,
        totalCost: acc.totalCost + order.totalCost,
        totalProfit: acc.totalProfit + order.totalProfit,
        paidCount: acc.paidCount + (order.payStatus === 1 ? 1 : 0),
        unpaidCount: acc.unpaidCount + (order.payStatus === 0 ? 1 : 0)
      }), { totalIncome: 0, totalCost: 0, totalProfit: 0, paidCount: 0, unpaidCount: 0 });
      
      // Agregar resumen de totales
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const summaryY = 48;
      doc.text(`Total Orders: ${superOrders.length}`, 14, summaryY);
      doc.text(`Total Income: $${totals.totalIncome.toLocaleString()}`, 14, summaryY + 6);
      doc.text(`Total Cost: $${totals.totalCost.toLocaleString()}`, 14, summaryY + 12);
      doc.text(`Net Profit: $${totals.totalProfit.toLocaleString()}`, 14, summaryY + 18);
      doc.text(`Paid: ${totals.paidCount} | Unpaid: ${totals.unpaidCount}`, 14, summaryY + 24);
      
      // Preparar datos para la tabla
      const tableData = superOrders.map(order => [
        order.key_ref,
        order.client.length > 20 ? order.client.substring(0, 17) + '...' : order.client,
        `$${order.totalIncome.toLocaleString()}`,
        `$${order.totalCost.toLocaleString()}`,
        `$${order.totalProfit.toLocaleString()}`,
        order.payStatus === 1 ? 'Paid' : 'Unpaid'
      ]);

      // Crear tabla con estilos mejorados
      (doc as any).autoTable({
        head: [['Reference', 'Client', 'Income', 'Cost', 'Profit', 'Status']],
        body: tableData,
        startY: summaryY + 35,
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'center'
        },
        headStyles: { 
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: { 
          fillColor: [248, 250, 252] 
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'left' },  // Reference
          1: { cellWidth: 35, halign: 'left' },  // Client
          2: { cellWidth: 25, halign: 'right' }, // Income
          3: { cellWidth: 25, halign: 'right' }, // Cost
          4: { cellWidth: 25, halign: 'right' }, // Profit
          5: { cellWidth: 20, halign: 'center' } // Status
        },
        didParseCell: function (data: any) {
          // Colorear las celdas de profit según el valor
          if (data.column.index === 4 && data.section === 'body') {
            const profitText = data.cell.text[0];
            const profitValue = parseFloat(profitText.replace(/[$,]/g, ''));
            if (profitValue < 0) {
              data.cell.styles.textColor = [244, 67, 54]; // Rojo para pérdidas
            } else {
              data.cell.styles.textColor = [76, 175, 80]; // Verde para ganancias
            }
          }
          // Colorear el status
          if (data.column.index === 5 && data.section === 'body') {
            if (data.cell.text[0] === 'Paid') {
              data.cell.styles.fillColor = [200, 230, 201];
              data.cell.styles.textColor = [27, 94, 32];
            } else {
              data.cell.styles.fillColor = [255, 224, 178];
              data.cell.styles.textColor = [230, 81, 0];
            }
          }
        }
      });

      // Agregar footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      }

      const fileName = this.generateFileName('pdf', isSearchResults, week, year);
      doc.save(fileName);
      
      enqueueSnackbar('PDF exported successfully! 📄', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error exporting to PDF ❌', { variant: 'error' });
      console.error('PDF export error:', error);
    }
  }
}