
export interface CostFromTable {
  id_cost: string;
  description: string;
  cost: number;
  type: 'FIXED' | 'VARIABLE';
  date: string;
}

export interface OrderSummaryTotalsData {
  expense: number;
  rentingCost: number;
  fuelCost: number;
  workCost: number;
  driverSalaries: number;
  otherSalaries: number;
  operators_discount: number;
  bonus: number;
  costs: CostFromTable[];
  totalCostFromTable: number;
  totalCost: number;
  total_orders: number;
  customer_factories: number[];
  net_profit: number;
}

export interface OrderSummaryLightTotalsResponse {
  // Cuando summary_mode=totals, viene directo el data
  expense?: number;
  rentingCost?: number;
  fuelCost?: number;
  workCost?: number;
  driverSalaries?: number;
  otherSalaries?: number;
  operators_discount?: number;
  bonus?: number;
  costs?: CostFromTable[];
  totalCostFromTable?: number;
  totalCost?: number;
  total_orders?: number;
  net_profit?: number;
  
  // O envuelto en estructura completa
  status?: string;
  messDev?: string;
  messUser?: string;
  data?: OrderSummaryTotalsData;
  filter_applied?: {
    mode: string;
    year: number;
    only_paid: boolean;
    summary_mode: string;
    start_date: string;
    end_date: string;
  };
}