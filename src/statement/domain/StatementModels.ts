/* eslint-disable @typescript-eslint/no-explicit-any */

export interface StatementRecord {
  id: number;
  keyref: string;
  date: string;
  week: number;
  shipper_name?: string;
  income?: string;
  expense?: string;
  state?: string;
  company?: string;
  [k: string]: any;
}

export interface WeekSummary {
  week: number;
  total_income: string;
  total_expense: string;
  net_amount: string;
  total_records: number;
  state_breakdown?: Record<string, number>;
  [k: string]: any;
}

export interface StatementsByWeekResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: StatementRecord[];
  week_summary?: WeekSummary;
  [k: string]: any;
}

// Verification Models
export interface MatchingOrder {
  order_key: string;
  key_ref: string;
  date: string;
  income: string;
  expense: string;
  status: string;
}

export interface VerificationItem {
  statement_record_id: number;
  keyref: string;
  current_state: string;
  statement_income: string;
  statement_expense: string;
  has_matches: boolean;
  matching_orders_count: number;
  matching_orders: MatchingOrder[];
  total_orders_income: string;
  total_orders_expense: string;
  income_difference: string;
  expense_difference: string;
  suggested_state: string;
}

export interface VerifyStatementRecordsResponse {
  total_records: number;
  records_with_matches: number;
  records_without_matches: number;
  warning?: string;
  missing_ids?: number[];
  verifications: VerificationItem[];
}

// Bulk Update Models
export interface BulkUpdateResult {
  statement_record_id: number;
  success: boolean;
  previous_state?: string;
  new_state?: string;
  error_message?: string;
}

export interface BulkUpdateStatementResponse {
  total_updates: number;
  successful_updates: number;
  failed_updates: number;
  results: BulkUpdateResult[];
}

// Apply to Orders Models
export interface OrderResult {
  order_key: string;
  success: boolean;
  previous_income: string;
  previous_expense: string;
  new_income: string;
  new_expense: string;
  action_taken: string;
  error_message?: string;
}

export interface ApplyToOrdersResponse {
  statement_record_id: number;
  total_orders: number;
  orders_updated: number;
  orders_skipped: number;
  orders_failed: number;
  distribution_per_order: {
    income: string;
    expense: string;
  };
  order_results: OrderResult[];
}
