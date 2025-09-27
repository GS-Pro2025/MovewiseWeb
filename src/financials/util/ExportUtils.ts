/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/ExportUtils.ts
import { SuperOrder } from "../domain/ModelsOCR";
import { enqueueSnackbar } from "notistack";
import { printFinancialReport } from "./FinancialPrintUtils";

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
      const XLSX = await import('xlsx');
      
      const exportData = this.prepareExportData(superOrders);
      
      // Agregar fila de totales
      const totalsRow = {
        'Reference': 'TOTALS',
        'Client': `${superOrders.length} orders`,
        'Total Income': superOrders.reduce((sum, order) => sum + order.totalIncome, 0),
        'Total Cost': superOrders.reduce((sum, order) => sum + order.totalCost, 0),
        'Profit': superOrders.reduce((sum, order) => sum + order.totalProfit, 0),
        'Expense': superOrders.reduce((sum, order) => sum + order.expense, 0),
        'Fuel Cost': superOrders.reduce((sum, order) => sum + order.fuelCost, 0),
        'Work Cost': superOrders.reduce((sum, order) => sum + order.workCost, 0),
        'Driver Salaries': superOrders.reduce((sum, order) => sum + order.driverSalaries, 0),
        'Operator Salaries': superOrders.reduce((sum, order) => sum + order.otherSalaries, 0),
        'Pay Status': `Paid: ${superOrders.filter(o => o.payStatus === 1).length} | Unpaid: ${superOrders.filter(o => o.payStatus === 0).length}`
      };
      
      // Combinar datos con totales
      const dataWithTotals = [...exportData, totalsRow];
      
      const ws = XLSX.utils.json_to_sheet(dataWithTotals);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Financial Summary');
      
      // Ajustar ancho de columnas
      const colWidths = Object.keys(dataWithTotals[0] || {}).map(() => ({ wch: 15 }));
      ws['!cols'] = colWidths;
      
      // Estilo para header y fila de totales
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // Estilo del header
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
      
      // Estilo para la fila de totales (última fila)
      const totalRowIndex = range.e.r;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "0B2863" } },
            fill: { fgColor: { rgb: "F1F5F9" } },
            alignment: { horizontal: "center" },
            border: {
              top: { style: "thick", color: { rgb: "0B2863" } }
            }
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
   * Exporta datos a PDF (Impresión en nueva pestaña)
   */
  static exportToPDF(
    superOrders: SuperOrder[],
    isSearchResults: boolean = false,
    week?: number,
    year?: number,
    weekRange?: { start: string; end: string }
  ): void {
    try {
      printFinancialReport(superOrders, isSearchResults, week, year, weekRange);
      enqueueSnackbar('PDF report opened for printing! 🖨️', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error opening PDF report ❌', { variant: 'error' });
      console.error('PDF print error:', error);
    }
  }
}