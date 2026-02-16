/* eslint-disable @typescript-eslint/no-explicit-any */
export interface createCost{
    description: string;
    cost: number;
    type: string;
}

export interface Cost{
    id_cost: string,
    description: string,
    cost: number,
    type: string,
    date: string,
    update: string,
    is_active: boolean
}

export interface LightOrderSummary {
  key: string;
  income: number;
  summary: {
    expense: number;
    rentingCost: number;
    fuelCost: number;
    workCost: number;
    driverSalaries: number;
    otherSalaries: number;
    customer_factory: number;
    bonus: number;
    totalCost: number;
  };
}

export interface LightOrderSummaryResult {
  count: number;
  next: string | null;
  previous: string | null;
  results: LightOrderSummary[];
  filter_applied?: Record<string, any>;
}

// NUEVOS MODELOS PARA TOTALS MODE
export interface OrderSummaryTotalsData {
  expense: number;
  rentingCost: number;
  fuelCost: number;
  workCost: number;
  driverSalaries: number;
  otherSalaries: number;
  bonus: number;
  totalCost: number;
  total_orders: number;
  customer_factories: number[];
  net_profit: number;
}

export interface OrderSummaryTotalsResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: OrderSummaryTotalsData;
  filter_applied: {
    mode: string;
    year: number;
    only_paid: boolean;
    summary_mode: string;
    start_date: string;
    end_date: string;
  };
}