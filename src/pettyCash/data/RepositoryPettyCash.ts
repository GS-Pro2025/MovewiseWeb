import { fetchWithAuth } from '../../service/authService';
import {
  AdjustBody, AmountBody, ExpenseBody, FundsFilters, OpenFundBody,
  PettyCashFund, PettyCashTransaction, ReturnBody, TransferBody,
} from '../domain/PettyCashModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

/**
 * Builds a user-facing message from a DRF error body: `{ detail }` for business
 * rules or `{ field: [msgs] }` for field validation. Unlike other repositories,
 * a 403 here is a role error and must NOT log the user out.
 */
const extractError = async (res: Response): Promise<string> => {
  const data = await res.json().catch(() => null);
  if (!data) return `HTTP ${res.status}`;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data === 'object') {
    const parts = Object.entries(data).map(([k, v]) => {
      const msg = Array.isArray(v) ? v.join(' ') : String(v);
      return k === 'non_field_errors' ? msg : `${k}: ${msg}`;
    });
    if (parts.length) return parts.join(' | ');
  }
  return `HTTP ${res.status}`;
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<{ data: T; status: number }> => {
  const res = await fetchWithAuth(`${BASE_URL_API}/${path}`, init);
  if (!res.ok) throw new Error(await extractError(res));
  const data = (await res.json().catch(() => null)) as T;
  return { data, status: res.status };
};

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const fetchFunds = async (filters: FundsFilters = {}): Promise<PettyCashFund[]> => {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, v); });
  const q = qs.toString();
  return (await request<PettyCashFund[]>(`petty-cash/funds/${q ? `?${q}` : ''}`)).data;
};

export const fetchFund = async (id: number): Promise<PettyCashFund> =>
  (await request<PettyCashFund>(`petty-cash/funds/${id}/`)).data;

export const fetchFundTransactions = async (id: number): Promise<PettyCashTransaction[]> =>
  (await request<PettyCashTransaction[]>(`petty-cash/funds/${id}/transactions/`)).data;

/** `created` is false (HTTP 200) when the fund already existed — no money moved. */
export const openFund = async (body: OpenFundBody): Promise<{ fund: PettyCashFund; created: boolean }> => {
  const { data, status } = await post<PettyCashFund>('petty-cash/funds/open/', body);
  return { fund: data, created: status === 201 };
};

export const depositToFund = async (id: number, body: AmountBody) =>
  (await post<PettyCashTransaction>(`petty-cash/funds/${id}/deposit/`, body)).data;

export const returnSurplus = async (id: number, body: ReturnBody) =>
  (await post<PettyCashTransaction>(`petty-cash/funds/${id}/return/`, body)).data;

export const adjustFund = async (id: number, body: AdjustBody) =>
  (await post<PettyCashTransaction>(`petty-cash/funds/${id}/adjust/`, body)).data;

export const transferToOperator = async (id: number, body: TransferBody) =>
  (await post<PettyCashTransaction[]>(`petty-cash/funds/${id}/transfer/`, body)).data;

export const registerExpense = async (id: number, body: ExpenseBody): Promise<PettyCashTransaction> => {
  const path = `petty-cash/funds/${id}/expense/`;
  if (body.receipt) {
    const fd = new FormData();
    Object.entries(body).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      fd.append(k, v instanceof File ? v : String(v));
    });
    return (await request<PettyCashTransaction>(path, { method: 'POST', body: fd })).data;
  }
  const { receipt: _receipt, ...json } = body;
  void _receipt;
  const clean = Object.fromEntries(Object.entries(json).filter(([, v]) => v !== undefined && v !== ''));
  return (await post<PettyCashTransaction>(path, clean)).data;
};

export const reverseTransaction = async (id: number, description?: string) =>
  (await post<PettyCashTransaction[]>(`petty-cash/transactions/${id}/reverse/`, description ? { description } : {})).data;

/**
 * Active (non-reversed) payroll advances linked to a payment, summed across the
 * admin-type funds the caller can see. The API has no `payment` filter, so this
 * scans the most recent funds; advances in older funds or in funds the caller
 * cannot see are not counted.
 */
export const fetchPaymentAdvances = async (paymentId: number, maxFunds = 12): Promise<{ total: number; items: PettyCashTransaction[] }> => {
  const funds = (await fetchFunds({ holder_type: 'user' }))
    .sort((a, b) => b.week_start.localeCompare(a.week_start))
    .slice(0, maxFunds);
  const lists = await Promise.all(funds.map(f => fetchFundTransactions(f.id_fund).catch(() => [] as PettyCashTransaction[])));
  const items = lists.flat().filter(tx => tx.category === 'payroll_advance' && tx.payment === paymentId && tx.type === 'expense' && !tx.is_reversed);
  return { total: items.reduce((s, tx) => s + parseFloat(tx.amount), 0), items };
};
