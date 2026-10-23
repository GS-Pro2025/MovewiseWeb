import type { OrderSummary } from '../domain/OrderSummaryModel';
import type { ProportionalSalary } from '../util/proportionalSalaryUtils';

export interface CostBreakdown {
  expense: number;
  fuel: number;
  work: number;
  salaries: number;
  bonus: number;
}

export interface LowMarginRow {
  id: string;
  key_ref: string;
  client: string;
  date: string | null;
  orderCount: number;
  income: number;
  cost: number;
  profit: number;
  /** Profit / income in %. null when there is no income. */
  margin: number | null;
  breakdown: CostBreakdown;
  /** Some order has no weight, so the salary split fell back to equal shares. */
  noWeight: boolean;
  /** Orders of a reference (only when grouped). */
  children: LowMarginRow[];
}

export type Severity = 'loss' | 'low';

const finish = (r: Omit<LowMarginRow, 'cost' | 'profit' | 'margin'>): LowMarginRow => {
  const b = r.breakdown;
  // Same cost formula as the Financials table so both screens agree.
  const cost = b.expense + b.fuel + b.work + b.salaries + b.bonus;
  const profit = r.income - cost;
  return { ...r, cost, profit, margin: r.income > 0 ? (profit / r.income) * 100 : null };
};

export const rowFromOrder = (o: OrderSummary, prop?: ProportionalSalary): LowMarginRow => {
  const s = o.summary;
  const salaries = prop
    ? prop.driverSalariesProportional + prop.otherSalariesProportional
    : (s?.driverSalaries ?? 0) + (s?.otherSalaries ?? 0);
  return finish({
    id: o.key,
    key_ref: o.key_ref,
    client: o.client,
    date: o.date ?? null,
    orderCount: 1,
    income: o.income ?? 0,
    breakdown: { expense: s?.expense ?? 0, fuel: s?.fuelCost ?? 0, work: s?.workCost ?? 0, salaries, bonus: s?.bonus ?? 0 },
    noWeight: !(o.weight > 0),
    children: [],
  });
};

export const groupRows = (rows: LowMarginRow[]): LowMarginRow[] => {
  const map = new Map<string, LowMarginRow[]>();
  rows.forEach(r => map.set(r.key_ref, [...(map.get(r.key_ref) ?? []), r]));
  return [...map.entries()].map(([key_ref, kids]) => finish({
    id: key_ref,
    key_ref,
    client: kids[0].client,
    date: null,
    orderCount: kids.length,
    income: kids.reduce((s, k) => s + k.income, 0),
    breakdown: {
      expense: kids.reduce((s, k) => s + k.breakdown.expense, 0),
      fuel: kids.reduce((s, k) => s + k.breakdown.fuel, 0),
      work: kids.reduce((s, k) => s + k.breakdown.work, 0),
      salaries: kids.reduce((s, k) => s + k.breakdown.salaries, 0),
      bonus: kids.reduce((s, k) => s + k.breakdown.bonus, 0),
    },
    noWeight: kids.some(k => k.noWeight),
    children: kids,
  }));
};

/** Below the margin threshold (losses included). Without income, any cost counts as a loss. */
export const isAtRisk = (r: LowMarginRow, threshold: number): boolean =>
  r.margin === null ? r.cost > 0 : r.margin < threshold;

export const severityOf = (r: LowMarginRow): Severity => (r.profit < 0 ? 'loss' : 'low');

export const toCsv = (rows: LowMarginRow[]): string => {
  const head = ['Reference', 'Client', 'Orders', 'Income', 'Salaries', 'Expense', 'Fuel', 'Extra costs', 'Bonus', 'Cost', 'Result', 'Margin %'];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map(r => [
    r.key_ref, r.client, r.orderCount, r.income.toFixed(2), r.breakdown.salaries.toFixed(2), r.breakdown.expense.toFixed(2),
    r.breakdown.fuel.toFixed(2), r.breakdown.work.toFixed(2), r.breakdown.bonus.toFixed(2), r.cost.toFixed(2),
    r.profit.toFixed(2), r.margin === null ? '' : r.margin.toFixed(1),
  ].map(esc).join(','));
  return [head.map(esc).join(','), ...lines].join('\n');
};

/* ───────────── Period selection (global mode) ───────────── */

export type PeriodType = 'range' | 'year' | 'month' | 'semester';

export interface PeriodInput {
  type: PeriodType;
  year: number;
  /** 0–11 */
  month: number;
  /** 1 or 2 */
  semester: number;
  from: string;
  to: string;
}

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Inclusive YYYY-MM-DD bounds of the selected period. */
export const periodBounds = (p: PeriodInput): { from: string; to: string } => {
  switch (p.type) {
    case 'year': return { from: iso(p.year, 0, 1), to: iso(p.year, 11, 31) };
    case 'month': return { from: iso(p.year, p.month, 1), to: iso(p.year, p.month, new Date(p.year, p.month + 1, 0).getDate()) };
    case 'semester': return p.semester === 1
      ? { from: iso(p.year, 0, 1), to: iso(p.year, 5, 30) }
      : { from: iso(p.year, 6, 1), to: iso(p.year, 11, 31) };
    default: return { from: p.from, to: p.to };
  }
};

const parseDay = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

const isoWeekOf = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - y0.getTime()) / 86400000 + 1) / 7);
};

export interface WeekRequest { year: number; start: number; end: number; }

/**
 * Week ranges to request so that every order dated in [from, to] is covered.
 * The backend's week numbering may differ by one from ISO, so each edge is padded by a
 * week (and the neighbouring year's edge weeks are added near Jan 1 / Dec 31); callers
 * must filter the result by date afterwards.
 */
export const weekRequestsFor = (from: string, to: string): WeekRequest[] => {
  const a = parseDay(from);
  const b = parseDay(to);
  const y1 = a.getFullYear();
  const y2 = b.getFullYear();
  const out: WeekRequest[] = [];
  if (a.getMonth() === 0 && a.getDate() <= 7) out.push({ year: y1 - 1, start: 52, end: 53 });
  for (let y = y1; y <= y2; y++) {
    out.push({
      year: y,
      start: y === y1 ? Math.max(1, (a.getMonth() === 0 ? 1 : isoWeekOf(a)) - 1) : 1,
      end: y === y2 ? Math.min(53, (b.getMonth() === 11 ? 53 : isoWeekOf(b)) + 1) : 53,
    });
  }
  if (b.getMonth() === 11 && b.getDate() >= 25) out.push({ year: y2 + 1, start: 1, end: 2 });
  return out;
};

export const inPeriod = (date: string | null | undefined, from: string, to: string): boolean => {
  const d = (date ?? '').slice(0, 10);
  return d >= from && d <= to;
};
