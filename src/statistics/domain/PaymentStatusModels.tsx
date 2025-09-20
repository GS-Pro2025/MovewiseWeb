export interface OrderPaymentStatus {
  order_id: string;
  key_ref: string;
  date: string;
  income: number;
}

export interface WeeklyPaymentStatusResponse {
  paid_orders: OrderPaymentStatus[];
  unpaid_orders: OrderPaymentStatus[];
  week: number;
  year: number;
  start_date: string;
  end_date: string;
}

export interface PaymentStatusStats {
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  paidPercentage: number;
  unpaidPercentage: number;
  totalIncome: number;
  paidIncome: number;
  unpaidIncome: number;
  totalExpenses?: number;
}

export interface PaymentStatusComparison {
  currentStats: PaymentStatusStats;
  previousStats: PaymentStatusStats;
  changes: {
    totalOrdersChange: number;
    paidOrdersChange: number;
    unpaidOrdersChange: number;
    paidPercentageChange: number;
    totalIncomeChange?: number;
    totalExpenseChange?: number;
    netProfitChange?: number;
  };
}