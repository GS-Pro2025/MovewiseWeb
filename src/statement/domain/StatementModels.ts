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
