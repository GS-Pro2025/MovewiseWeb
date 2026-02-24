// domain/LoansSummaryModels.ts

/** Exactly what the API returns per loan */
export interface LoanRecord {
  id_loan: number;
  operator: number;
  operator_name: string;
  total_amount_to_pay: string;
  description: string;
  status: 'unpaid' | 'paid' | 'canceled' | string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  total_paid: string;
  remaining_amount: string;
  payment_percentage: string;
}

/** Aggregated per operator (built in the frontend) */
export interface OperatorGroup {
  operator_id: number;
  operator_name: string;
  total_loaned: number;
  total_paid: number;
  total_pending: number;
  payment_percentage: number;
  loans: LoanRecord[];
}

export interface LoansSummaryFilters {
  weeks?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}