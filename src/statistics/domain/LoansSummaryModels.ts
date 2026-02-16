// Modelos para el resumen de préstamos de la empresa

export interface LoanStatusBreakdown {
  status: 'unpaid' | 'paid' | 'canceled';
  count: number;
  total_amount: string;
}

export interface PaymentMethodBreakdown {
  payment_method: 'cash' | 'deduction' | 'transfer' | 'check';
  count: number;
  total_amount: string;
}

export interface WeeklyLoanBreakdown {
  week: string;
  loans_count: number;
  amount_loaned: string;
}

export interface WeeklyPaymentBreakdown {
  week: string;
  payments_count: number;
  amount_paid: string;
}

export interface LoansSummaryPeriod {
  start_date: string | null;
  end_date: string | null;
  weeks: number | null;
}

export interface LoansSummaryData {
  total_loans: number;
  total_amount_loaned: string;
  by_status: LoanStatusBreakdown[];
}

export interface PaymentsSummaryData {
  total_payments: number;
  total_amount_paid: string;
  by_payment_method: PaymentMethodBreakdown[];
}

export interface WeeklyBreakdown {
  loans: WeeklyLoanBreakdown[];
  payments: WeeklyPaymentBreakdown[];
}

export interface OverallSummary {
  total_pending_amount: string;
  active_loans_count: number;
}

export interface CompanyLoansSummaryResponse {
  period: LoansSummaryPeriod;
  loans_summary: LoansSummaryData;
  payments_summary: PaymentsSummaryData;
  weekly_breakdown: WeeklyBreakdown;
  overall: OverallSummary;
}

export interface LoansSummaryFilters {
  weeks?: number;
  start_date?: string;
  end_date?: string;
}
