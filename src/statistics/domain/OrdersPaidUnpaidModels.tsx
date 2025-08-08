export interface OrderPaidUnpaidWeekRange {
  key: string;
  key_ref: string;
  client_name: string;
  customer_factory: string;
  date: string;
  payStatus: string | null;
  paid: boolean;
}

export interface WeeklyCount {
  week: number;
  paid: number;
  unpaid: number;
}

export interface OrdersPaidUnpaidWeekRangeResponse {
  total_paid: number;
  total_unpaid: number;
  weekly_counts: WeeklyCount[];
  orders_by_week: Record<string, OrderPaidUnpaidWeekRange[]>;
}

export interface PaidUnpaidChartData {
  week: number;
  paid: number;
  unpaid: number;
  total: number;
  paidPercentage: number;
  unpaidPercentage: number;
}