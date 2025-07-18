// utils/payrollUtils.ts
import { WeekAmounts } from '../../models/payrroll';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
};

/** Formatear fecha para mostrar en header */
export const formatDateForHeader = (dateStr: string): string => {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) {
    return "--/--";
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    return "--/--";
  }
  const date = new Date(year, month - 1, day);

  const monthStr = (date.getMonth() + 1).toString().padStart(2, "0");
  const dayStr = date.getDate().toString().padStart(2, "0");

  return `${monthStr}/${dayStr}`;
};

/** Devuelve el número de semana ISO para una fecha dada */
export const getISOWeek = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/** Genera las fechas de la semana basado en la información de week_info */
export const generateWeekDates = (
  startDate: string
): { [key in keyof WeekAmounts]?: string } => {
  const dates: { [key in keyof WeekAmounts]?: string } = {};

  // El startDate ya debería ser el lunes, usar directamente
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const monday = new Date(startYear, startMonth - 1, startDay);

  // Generar fechas de lunes a domingo en orden
  const dayKeys: (keyof WeekAmounts)[] = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);

    const year = current.getFullYear();
    const month = (current.getMonth() + 1).toString().padStart(2, "0");
    const day = current.getDate().toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    dates[dayKeys[i]] = dateStr;
  }

  return dates;
};

export const downloadFile = (content: string, fileName: string, contentType: string): void => {
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