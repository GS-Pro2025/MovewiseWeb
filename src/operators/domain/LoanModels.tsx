export type LoanStatus = 'unpaid' | 'paid' | 'canceled';

export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'card' | 'deduction' | 'other';

export interface Loan {
  id_loan: number;
  operator: number;
  operator_name: string;
  total_amount_to_pay: string;
  description: string;
  status: LoanStatus;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  total_paid: string;
  remaining_amount: string;
  payment_percentage: string;
}

export interface LoanPayment {
  id: number;
  loan_id: number;
  amount: string;
  payment_method: PaymentMethod;
  notes: string;
  created_at: string;
  created_by: number;
}

export interface CreateLoanPaymentData {
  loan_id: number;
  amount: string;
  payment_method: PaymentMethod;
  notes: string;
}

export interface LoansResponse {
  count: number;
  results: Loan[];
}

export interface LoansByOperatorParams {
  operatorId: number;
  status?: LoanStatus;
}
