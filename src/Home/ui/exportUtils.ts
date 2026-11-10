import * as XLSX from 'xlsx';
import { TableData, TableDataExport } from '../domain/TableData';
import { generatePrintableHTML, getOperatorsCost } from './exportToPrintableHTML';

export const exportToExcel = (data: TableData[], filename: string): void => {
  // Transform data for export (flatten complex fields)
  const exportData: TableDataExport[] = data.map(item => ({
    id: item.id,
    status: item.status,
    key_ref: item.key_ref,
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    email: item.email,
    company: item.company,
    city: item.city,
    state: item.state,
    weekday: item.weekday,
    expense: item.expense,
    income: item.income,
    dateReference: item.dateReference,
    job: item.job,
    weight: item.weight,
    truckType: item.truckType || 'N/A',
    operators: (item.operators || [])
      .map(op => `${op.first_name} ${op.last_name} ($${(Number(op.salary) || 0).toFixed(2)})`)
      .join(', '),
    operatorsCost: Math.round(getOperatorsCost(item) * 100) / 100,
    fuelCost: item.fuelCost ?? 0,
    extraCost: item.extraCost ?? 0,
    totalCost: item.totalCost,
    payStatus: item.payStatus,
    distance: item.distance,
    week: item.week,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data: TableData[], filename: string): void => {
  generatePrintableHTML(data, filename);
};