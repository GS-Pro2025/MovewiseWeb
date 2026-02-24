import { useState, useEffect, useMemo } from 'react';
import { fetchCompanyLoansSummary } from '../data/repositoryLoansSummary';
import { LoanRecord, LoansSummaryFilters, OperatorGroup } from '../domain/LoansSummaryModels';
import LoaderSpinner from '../../components/Login_Register/LoadingSpinner';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';

/* ─────────────────────────── helpers ─────────────────────────── */
const fmt = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
};

const fmtDate = (d: string | null): string => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return d; }
};

const statusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'unpaid':   return { badge: 'bg-red-100 text-red-700 border border-red-200',              dot: 'bg-red-500' };
    case 'paid':     return { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',  dot: 'bg-emerald-500' };
    case 'canceled': return { badge: 'bg-gray-100 text-gray-600 border border-gray-200',           dot: 'bg-gray-400' };
    default:         return { badge: 'bg-blue-100 text-blue-700 border border-blue-200',           dot: 'bg-blue-500' };
  }
};

const initials = (name: string) =>
  name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase();

/* ─────────── aggregate flat loans → operator groups ────────── */
const groupByOperator = (loans: LoanRecord[]): OperatorGroup[] => {
  const map = new Map<number, OperatorGroup>();
  for (const loan of loans) {
    if (!map.has(loan.operator)) {
      map.set(loan.operator, {
        operator_id: loan.operator,
        operator_name: loan.operator_name,
        total_loaned: 0,
        total_paid: 0,
        total_pending: 0,
        payment_percentage: 0,
        loans: [],
      });
    }
    const g = map.get(loan.operator)!;
    g.total_loaned  += parseFloat(loan.total_amount_to_pay);
    g.total_paid    += parseFloat(loan.total_paid);
    g.total_pending += parseFloat(loan.remaining_amount);
    g.loans.push(loan);
  }
  for (const g of map.values()) {
    g.payment_percentage = g.total_loaned > 0 ? (g.total_paid / g.total_loaned) * 100 : 0;
  }
  return Array.from(map.values()).sort((a, b) => b.total_pending - a.total_pending);
};

/* ─────────────────── sub-components ──────────────────────────── */
const ProgressBar = ({ pct }: { pct: number }) => {
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : pct >= 25 ? 'bg-orange-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-11 text-right">{pct.toFixed(1)}%</span>
    </div>
  );
};

interface KpiCardProps { label: string; value: string | number; colorClass: string; sub?: string; }
const KpiCard = ({ label, value, colorClass, sub }: KpiCardProps) => (
  <div className={`bg-white rounded-2xl p-5 border-l-4 ${colorClass} shadow-sm hover:shadow-md transition-shadow`}>
    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
    <div className="text-2xl font-extrabold text-gray-800 tracking-tight">{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
  </div>
);

/* ═══════════════════════ MAIN COMPONENT ════════════════════════ */
type Tab = 'overview' | 'loans' | 'weekly';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview',     icon: 'fa-chart-bar' },
  { id: 'loans',    label: 'Loan History', icon: 'fa-hand-holding-usd' },
  { id: 'weekly',   label: 'Weekly',       icon: 'fa-calendar-week' },
];
const STATUS_FILTERS = ['all', 'unpaid', 'paid', 'canceled'] as const;

const LoansSummary = () => {
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [loans, setLoans]                   = useState<LoanRecord[]>([]);
  const [filterMode, setFilterMode]         = useState<'preset' | 'custom'>('preset');
  const [selectedPeriod, setSelectedPeriod] = useState('4');
  const [expandedOps, setExpandedOps]       = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab]           = useState<Tab>('overview');
  const [statusFilter, setStatusFilter]     = useState<string>('all');

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7));
  });

  const getWeekRange = (year: number, week: number) => {
    const jan1  = new Date(year, 0, 1);
    const start = new Date(jan1.getTime() + ((week - 1) * 7 - jan1.getDay() + 1) * 86400000);
    const end   = new Date(start.getTime() + 6 * 86400000);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const buildFilters = (): LoansSummaryFilters => {
    const f: LoansSummaryFilters = {};
    if (filterMode === 'preset') {
      if (selectedPeriod !== 'all') f.weeks = parseInt(selectedPeriod);
    } else {
      const { start, end } = getWeekRange(selectedYear, selectedWeek);
      f.start_date = start;
      f.end_date   = end;
    }
    return f;
  };

  const loadData = async (filters?: LoansSummaryFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCompanyLoansSummary(filters);
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(buildFilters()); }, [selectedPeriod, filterMode, selectedYear, selectedWeek]);

  const toggleOp = (id: number) => {
    setExpandedOps(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  /* ── derived data ── */
  const filteredLoans = useMemo(
    () => statusFilter === 'all' ? loans : loans.filter(l => l.status === statusFilter),
    [loans, statusFilter]
  );

  const operators = useMemo(() => groupByOperator(filteredLoans), [filteredLoans]);

  const totals = useMemo(() => ({
    loaned:  loans.reduce((s, l) => s + parseFloat(l.total_amount_to_pay), 0),
    paid:    loans.reduce((s, l) => s + parseFloat(l.total_paid), 0),
    pending: loans.reduce((s, l) => s + parseFloat(l.remaining_amount), 0),
    unpaid:  loans.filter(l => l.status === 'unpaid').length,
  }), [loans]);

  const weeklyMap = useMemo(() => {
    const map = new Map<string, { loaned: number; count: number }>();
    for (const loan of loans) {
      const d    = new Date(loan.created_at);
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const wNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
      const key  = `${d.getFullYear()}-W${String(wNum).padStart(2, '0')}`;
      const prev = map.get(key) ?? { loaned: 0, count: 0 };
      map.set(key, { loaned: prev.loaned + parseFloat(loan.total_amount_to_pay), count: prev.count + 1 });
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [loans]);

  /* ── loading / error ── */
  if (loading)
    return (
      <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <LoaderSpinner />
          <span className="text-sm font-semibold text-blue-900 animate-pulse">Loading loans…</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-red-200 text-center">
        <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4 block" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">Could not load data</h3>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => loadData(buildFilters())} className="px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition">
          Retry
        </button>
      </div>
    );

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Header + filters ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-blue-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <i className="fas fa-hand-holding-usd text-white text-sm" />
              </span>
              Operator Loans
            </h2>
            <p className="text-xs text-gray-400 mt-1 ml-10">{loans.length} total records loaded</p>
          </div>
          <button
            onClick={() => loadData(buildFilters())}
            disabled={loading}
            className="self-start sm:self-auto p-2.5 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition disabled:opacity-50"
            title="Refresh"
          >
            <i className={`fas fa-sync-alt text-sm ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Period mode */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {(['preset', 'custom'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterMode === mode ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <i className={`fas ${mode === 'preset' ? 'fa-clock' : 'fa-calendar-alt'} mr-1.5`} />
              {mode === 'preset' ? 'Quick Periods' : 'Custom Week'}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          {filterMode === 'preset' ? (
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            >
              <option value="1">Last Week</option>
              <option value="4">Last Month</option>
              <option value="12">Last Quarter</option>
              <option value="24">Last 6 Months</option>
              <option value="52">Last Year</option>
              <option value="all">All Time</option>
            </select>
          ) : (
            <>
              <YearPicker year={selectedYear} onYearSelect={setSelectedYear} min={2015} max={currentYear + 1} />
              <WeekPicker week={selectedWeek} onWeekSelect={setSelectedWeek} min={1} max={52} />
            </>
          )}

          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${statusFilter === s ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s === 'all' ? 'All statuses' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Receivable" value={fmt(totals.pending)} colorClass="border-red-500"     sub="Accounts pending collection" />
        <KpiCard label="Total Loaned"     value={fmt(totals.loaned)}  colorClass="border-blue-500"    sub="Total disbursed" />
        <KpiCard label="Total Collected"  value={fmt(totals.paid)}    colorClass="border-emerald-500" sub="Payments received" />
        <KpiCard label="Unpaid Loans"     value={totals.unpaid}       colorClass="border-orange-500"  sub="Loans still pending" />
      </div>

      {/* Recovery rate */}
      {totals.loaned > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              <i className="fas fa-tachometer-alt text-blue-600 mr-2" />
              Overall Recovery Rate
            </span>
            <span className="text-sm font-bold text-gray-800">{((totals.paid / totals.loaned) * 100).toFixed(1)}%</span>
          </div>
          <ProgressBar pct={(totals.paid / totals.loaned) * 100} />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Collected: {fmt(totals.paid)}</span>
            <span>Pending: {fmt(totals.pending)}</span>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-900 text-blue-900 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ═══════ OVERVIEW ═══════ */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-800">Debt Breakdown by Operator</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{operators.length} operators</span>
              </div>

              {operators.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <i className="fas fa-users-slash text-4xl mb-3 block" />
                  <div className="text-sm">No loans match the current filters</div>
                </div>
              )}

              {operators.map(op => {
                const isOpen = expandedOps.has(op.operator_id);
                return (
                  <div key={op.operator_id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleOp(op.operator_id)}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(op.operator_name)}
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1 items-center">
                        <div className="col-span-2 md:col-span-1">
                          <div className="font-semibold text-gray-800 text-sm">{op.operator_name}</div>
                          <div className="text-xs text-gray-400">{op.loans.length} loan{op.loans.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-gray-400">Loaned</div>
                          <div className="font-semibold text-blue-700">{fmt(op.total_loaned)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-gray-400">Paid</div>
                          <div className="font-semibold text-emerald-600">{fmt(op.total_paid)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-gray-400">Pending</div>
                          <div className="font-bold text-red-600">{fmt(op.total_pending)}</div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <ProgressBar pct={op.payment_percentage} />
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-gray-400 text-xs ml-2 flex-shrink-0`} />
                    </div>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-2">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Loans — {op.operator_name}
                        </div>
                        {op.loans.map(loan => {
                          const s = statusStyle(loan.status);
                          return (
                            <div key={loan.id_loan} className="bg-white rounded-xl border border-gray-200 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                      {loan.status}
                                    </span>
                                    <span className="text-xs text-gray-400">#{loan.id_loan}</span>
                                  </div>
                                  <div className="text-sm font-semibold text-gray-700 truncate">{loan.description || 'No description'}</div>
                                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                                    <span>Created: {fmtDate(loan.created_at)}</span>
                                    <span>By: <span className="font-medium text-gray-600">{loan.created_by_name}</span></span>
                                    <span>Updated: {fmtDate(loan.updated_at)}</span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-base font-extrabold text-gray-800">{fmt(loan.total_amount_to_pay)}</div>
                                  <div className="text-xs text-emerald-600 font-medium">Paid: {fmt(loan.total_paid)}</div>
                                  <div className="text-xs text-red-600 font-bold">Due: {fmt(loan.remaining_amount)}</div>
                                </div>
                              </div>
                              <div className="mt-2">
                                <ProgressBar pct={parseFloat(loan.payment_percentage)} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════ LOAN HISTORY ═══════ */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-bold text-gray-800">All Loans</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{filteredLoans.length} records</span>
              </div>

              {/* Status pills */}
              <div className="flex gap-2 flex-wrap">
                {(['unpaid', 'paid', 'canceled'] as const).map(st => {
                  const count  = loans.filter(l => l.status === st).length;
                  const amount = loans.filter(l => l.status === st).reduce((s, l) => s + parseFloat(l.total_amount_to_pay), 0);
                  const s = statusStyle(st);
                  return (
                    <div key={st} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {st}: {count} · {fmt(amount)}
                    </div>
                  );
                })}
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <th className="text-left py-3 px-4 font-semibold">#</th>
                      <th className="text-left py-3 px-4 font-semibold">Operator</th>
                      <th className="text-left py-3 px-4 font-semibold">Description</th>
                      <th className="text-left py-3 px-4 font-semibold">Created by</th>
                      <th className="text-right py-3 px-4 font-semibold">Total</th>
                      <th className="text-right py-3 px-4 font-semibold">Paid</th>
                      <th className="text-right py-3 px-4 font-semibold">Remaining</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold min-w-[120px]">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan, idx) => {
                      const s = statusStyle(loan.status);
                      return (
                        <tr key={loan.id_loan} className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${idx % 2 !== 0 ? 'bg-gray-50/50' : ''}`}>
                          <td className="py-3 px-4 text-gray-400 text-xs">#{loan.id_loan}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {initials(loan.operator_name)}
                              </div>
                              <span className="font-medium text-gray-800 text-xs whitespace-nowrap">{loan.operator_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-xs">{loan.description || '—'}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{loan.created_by_name}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-800">{fmt(loan.total_amount_to_pay)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600">{fmt(loan.total_paid)}</td>
                          <td className="py-3 px-4 text-right font-bold text-red-600">{fmt(loan.remaining_amount)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {loan.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(loan.created_at)}</td>
                          <td className="py-3 px-4 min-w-[120px]"><ProgressBar pct={parseFloat(loan.payment_percentage)} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-200 font-bold text-blue-900">
                      <td colSpan={4} className="py-3 px-4 text-sm">Total ({filteredLoans.length} loans)</td>
                      <td className="py-3 px-4 text-right">{fmt(filteredLoans.reduce((s, l) => s + parseFloat(l.total_amount_to_pay), 0))}</td>
                      <td className="py-3 px-4 text-right text-emerald-700">{fmt(filteredLoans.reduce((s, l) => s + parseFloat(l.total_paid), 0))}</td>
                      <td className="py-3 px-4 text-right text-red-700">{fmt(filteredLoans.reduce((s, l) => s + parseFloat(l.remaining_amount), 0))}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ═══════ WEEKLY ═══════ */}
          {activeTab === 'weekly' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-800">Loans by Week</h3>
              {weeklyMap.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <i className="fas fa-calendar-times text-4xl mb-3 block" />
                  <div className="text-sm">No data for this period</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {weeklyMap.map(([week, val]) => (
                    <div key={week} className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                          <i className="fas fa-calendar text-white text-xs" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-700">{week}</div>
                          <div className="text-xs text-gray-400">{val.count} loan{val.count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="font-extrabold text-blue-800">{fmt(val.loaned)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
        <i className="fas fa-info-circle text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Click any operator in the <strong>Overview</strong> tab to expand their individual loan details.
          Use the status filter buttons to isolate unpaid, paid, or canceled loans.
        </p>
      </div>
    </div>
  );
};

export default LoansSummary;