import { Loan } from '../../operators/domain/LoanModels';

/**
 * LoanRecord extends Loan directly — same shape, no duplication.
 * This allows passing LoanRecord to components that expect Loan without casting.
 */
export type LoanRecord = Loan;

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