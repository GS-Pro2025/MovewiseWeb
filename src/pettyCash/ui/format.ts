export const fmtMoney = (v: string | number | null | undefined): string => {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0);
  if (isNaN(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
};

/** YYYY-MM-DD → locale date without timezone shifts. */
export const fmtDay = (d: string | null | undefined): string => {
  if (!d) return '—';
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/** True for a positive amount with at most 2 decimals and 10 digits total. */
export const isValidAmount = (v: string): boolean =>
  /^\d{1,8}(\.\d{1,2})?$/.test(v.trim()) && parseFloat(v) > 0;
