import { fetchWithAuth } from '../../service/authService';
import type { LowMarginRow } from './lowMarginUtils';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

/** Server contract: see LOW_MARGIN_BACKEND_CONTRACT.md */
export interface LowMarginKpis {
  total: number;
  atRisk: number;
  lossCount: number;
  lossTotal: number;
  incomeAtRisk: number;
  avgMargin: number | null;
}

export interface LowMarginPage {
  count: number;
  kpis: LowMarginKpis;
  rows: LowMarginRow[];
}

export interface LowMarginQuery {
  from?: string;
  to?: string;
  numberWeek?: number;
  year?: number;
  threshold: number;
  groupBy: 'reference' | 'order';
  search: string;
  income: 'all' | 'with' | 'without';
  sort: 'margin' | 'profit' | 'income' | 'cost';
  page: number;
  pageSize: number;
}

/** The backend does not offer the endpoint (yet): the caller should compute in the browser. */
export class LowMarginUnavailableError extends Error {}

/** The endpoint exists but crashed (5xx): the caller may fall back to the browser calculation. */
export class LowMarginServerError extends Error {
  constructor(public status: number) { super(`HTTP ${status}`); }
}

/** Remembers a missing endpoint for the session so we do not retry on every filter change. */
export const lowMarginBackend: { supported: boolean | null } = { supported: null };

interface RawRow {
  id: string; key_ref: string; client: string; date: string | null; order_count: number;
  income: number; cost: number; profit: number; margin: number | null; no_weight: boolean;
  breakdown: { salaries: number; expense: number; fuel: number; work: number; bonus: number };
  children?: RawRow[];
}

const mapRow = (r: RawRow): LowMarginRow => ({
  id: r.id, key_ref: r.key_ref, client: r.client, date: r.date, orderCount: r.order_count,
  income: r.income, cost: r.cost, profit: r.profit, margin: r.margin, noWeight: r.no_weight,
  breakdown: r.breakdown, children: (r.children ?? []).map(mapRow),
});

export const fetchLowMargin = async (q: LowMarginQuery): Promise<LowMarginPage> => {
  const p = new URLSearchParams({
    threshold: String(q.threshold), group_by: q.groupBy, sort: q.sort,
    page: String(q.page), page_size: String(q.pageSize),
  });
  if (q.search.trim()) p.set('search', q.search.trim());
  if (q.income !== 'all') p.set('income', q.income);
  if (q.from && q.to) { p.set('from', q.from); p.set('to', q.to); }
  else if (q.numberWeek && q.year) { p.set('number_week', String(q.numberWeek)); p.set('year', String(q.year)); }

  const res = await fetchWithAuth(`${BASE_URL_API}/financials/low-margin/?${p.toString()}`, { method: 'GET' });
  if ([404, 405, 501].includes(res.status)) throw new LowMarginUnavailableError(`HTTP ${res.status}`);
  if (res.status >= 500) throw new LowMarginServerError(res.status);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.detail === 'string' ? body.detail : `HTTP ${res.status}`);
  }
  const data = await res.json();
  const k = data.kpis ?? {};
  return {
    count: data.count ?? 0,
    kpis: {
      total: k.total_rows ?? 0, atRisk: k.at_risk_count ?? 0, lossCount: k.loss_count ?? 0,
      lossTotal: k.loss_total ?? 0, incomeAtRisk: k.income_at_risk ?? 0, avgMargin: k.avg_margin ?? null,
    },
    rows: (data.results ?? []).map(mapRow),
  };
};
