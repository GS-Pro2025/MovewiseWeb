export type Money = string;

export type FundStatus = 'active' | 'closed';
export type HolderType = 'user' | 'operator';

export interface PettyCashFund {
  id_fund: number;
  holder_type: HolderType;
  holder_user: number | null;
  holder_operator: number | null;
  holder_name: string | null;
  week_start: string;
  week_end: string;
  balance: Money;
  is_in_debt: boolean;
  status: FundStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export type TxType =
  | 'fund_in'
  | 'expense'
  | 'return'
  | 'transfer_out'
  | 'transfer_in'
  | 'carry_over'
  | 'adjustment'
  | 'reversal';

export type TxCategory = 'fuel' | 'extra_cost' | 'payroll_advance' | 'per_diem' | 'loan' | 'other';

export interface PettyCashTransaction {
  id_transaction: number;
  fund: number;
  type: TxType;
  direction: 'in' | 'out';
  category: TxCategory | null;
  amount: Money;
  balance_before: Money;
  balance_after: Money;
  date: string;
  description: string | null;
  receipt: string | null;
  order: string | null;
  truck: number | null;
  operator: number | null;
  operator_name: string | null;
  payment: number | null;
  loan: number | null;
  counterpart: number | null;
  reverses: number | null;
  is_reversed: boolean;
  created_by: number | null;
  created_by_operator: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface FundsFilters {
  status?: FundStatus;
  week?: string;
  holder_type?: HolderType;
}

export interface OpenFundBody {
  holder_user?: number;
  holder_operator?: number;
  day?: string;
  initial_amount?: string;
  description?: string;
}

export interface AmountBody {
  amount: string;
  date?: string;
  description?: string;
}

export interface ReturnBody extends AmountBody {
  to_user?: number;
}

export interface AdjustBody {
  amount: string;
  direction: 'in' | 'out';
  description: string;
}

export interface TransferBody extends AmountBody {
  to_operator: number;
}

export interface ExpenseBody {
  amount: string;
  category: Exclude<TxCategory, never>;
  date?: string;
  description?: string;
  receipt?: File | null;
  order?: string;
  truck?: number;
  operator?: number;
  payment?: number;
}

export const EXPENSE_CATEGORIES: TxCategory[] = ['fuel', 'extra_cost', 'payroll_advance', 'per_diem', 'loan', 'other'];

/** Monday (YYYY-MM-DD) of the current week, local time. */
export const currentWeekMonday = (): string => {
  const d = new Date();
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Monday (YYYY-MM-DD) of an ISO week, matching the week/year pickers used elsewhere. */
export const isoWeekMonday = (year: number, week: number): string => {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime() + ((week - 1) * 7 - (jan4Dow - 1)) * 86400000);
  return monday.toISOString().slice(0, 10);
};
