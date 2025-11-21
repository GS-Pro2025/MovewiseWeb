import type { Operator } from './ModelOrdersReport';

export interface TableData {
  id: string;
  status: "finished" | "pending" | "inactive"; 
  key_ref: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  customer_factory: number;
  city: string;
  state: string;
  weekday: string;
  expense: number;
  income: number;
  dateReference: string;
  job: string;
  job_id: number;
  weight: string;
  truckType: string;
  totalCost: number;
  week: number; 
  payStatus: number;
  distance: number;
  created_by: string | null;
  operators: Operator[];
  dispatch_ticket: string;
  
  // Propiedades opcionales específicas de ExtraCost
  extraCostName?: string;
  extraCostType?: string;
  extraCostCost?: number;
}

// Interfaz para exportar solo los campos planos
export interface TableDataExport {
  [key: string]: string | number;
  id: string;
  status: string;
  key_ref: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  city: string;
  state: string;
  weekday: string;
  expense: number;
  income: number;
  dateReference: string;
  job: string;
  weight: string;
  truckType: string;
  totalCost: number;
  payStatus: number;
  distance: number;
  week: number;
}