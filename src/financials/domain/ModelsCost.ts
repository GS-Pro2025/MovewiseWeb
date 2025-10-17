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
    operators_discount: number; 
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