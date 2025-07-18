// types/payroll.ts
export interface WeekInfo {
    start_date: string;
    end_date: string;
  }
  
  export interface WeekAmounts {
    Mon?: number;
    Tue?: number;
    Wed?: number;
    Thu?: number;
    Fri?: number;
    Sat?: number;
    Sun?: number;
  }
  
  export interface OperatorRow extends WeekAmounts {
    code: string;
    name: string;
    lastName: string;
    role: string;
    cost: number;
    pay?: string | null;
    total?: number;
    additionalBonuses: number;
    expense?: number;
    grandTotal?: number;
    assignmentIds: (number | string)[];
    paymentIds: (number | string)[];
    assignmentsByDay?: {
      [key in keyof WeekAmounts]?: {
        id: number | string;
        date: string;
        bonus?: number;
      }[];
    };
  }
  
  export interface PaymentStats {
    paid: number;
    unpaid: number;
    total: number;
    paidAmount: number;
    unpaidAmount: number;
  }
  
  export interface PayrollExportProps {
    operators: OperatorRow[];
    weekInfo: WeekInfo;
    weekDates: { [key in keyof WeekAmounts]?: string };
    week: number;
    location: string;
    paymentStats: PaymentStats;
    totalGrand: number;
  }
  
  // Tipos adicionales que necesitas en tu página
  export const weekdayKeys: (keyof WeekAmounts)[] = [
    "Mon",
    "Tue", 
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];
  
  export type LocationStep = "country" | "state" | "city";