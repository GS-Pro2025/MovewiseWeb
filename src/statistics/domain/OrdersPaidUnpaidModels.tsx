export interface OrderPaidUnpaidWeekRange {
  key: string;
  key_ref: string;
  client_name: string;
  customer_factory: string;
  date: string;
  expense: number;
  income: number;
  weight: number;
  state_usa: string;
  company_name: string;
  payStatus: string | null;
  paid: boolean;
}

export interface WeeklyCount {
  week: number;
  paid: number;
  unpaid: number;
}

// Interface for historic order format (without 'paid' boolean)
export interface HistoricOrder {
  key_ref: string;
  client_name?: string;
  customer_factory?: string;
  date: string;
  expense: number;
  income: number;
  weight: number;
  state_usa: string;
  company_name: string;
  payStatus: number | null;
}

export interface OrdersPaidUnpaidWeekRangeResponse {
  total_paid: number;
  total_unpaid: number;
  weekly_counts?: WeeklyCount[]; // Optional for historic mode
  orders_by_week?: Record<string, OrderPaidUnpaidWeekRange[]>; // Optional for historic mode
  paid_orders?: HistoricOrder[]; // For historic mode
  unpaid_orders?: HistoricOrder[]; // For historic mode
  mode?: string; // Campo opcional para identificar el modo de la respuesta
}

export interface PaidUnpaidChartData {
  week: number;
  paid: number;
  unpaid: number;
  total: number;
  paidPercentage: number;
  unpaidPercentage: number;
}