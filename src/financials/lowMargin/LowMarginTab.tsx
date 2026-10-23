import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronDown, ChevronRight, Download, RefreshCw, Search, Users } from 'lucide-react';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';
import LoaderSpinner from '../../components/Login_Register/LoadingSpinner';
import { SummaryCostRepository } from '../data/SummaryCostRepository';
import type { OrderSummary } from '../domain/OrderSummaryModel';
import { clearAssignmentsCache, useProportionalSalaries } from './useProportionalSalaries';
import { fetchLowMargin, LowMarginKpis, LowMarginServerError, LowMarginUnavailableError, lowMarginBackend } from './lowMarginRepository';
import { groupRows, inPeriod, isAtRisk, LowMarginRow, PeriodType, periodBounds, rowFromOrder, severityOf, toCsv, weekRequestsFor } from './lowMarginUtils';

const PRIMARY = '#092962';
const STORAGE_KEY = 'lowMarginThreshold';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const pct = (n: number | null) => (n === null ? '—' : `${n.toFixed(1)}%`);

type Scope = 'week' | 'period';
type GroupBy = 'reference' | 'order';
type IncomeFilter = 'all' | 'with' | 'without';
type SortKey = 'margin' | 'profit' | 'income' | 'cost';

const PAGE_SIZE = 50;

const useDebounced = <T,>(value: T, ms = 350): T => {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
};

const matchesIncome = (r: LowMarginRow, f: IncomeFilter): boolean =>
  f === 'all' || (f === 'with' ? r.income > 0 : r.income <= 0);

const loadThreshold = (): number => {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    return v > 0 && v <= 100 ? v : 25;
  } catch { return 25; }
};

const Toggle = <T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) => (
  <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
    {options.map(o => (
      <button key={o.id} type="button" onClick={() => onChange(o.id)}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${value === o.id ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        style={value === o.id ? { backgroundColor: PRIMARY } : undefined}>
        {o.label}
      </button>
    ))}
  </div>
);

interface Props { initialWeek: number; initialYear: number; }

export default function LowMarginTab({ initialWeek, initialYear }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const repository = useMemo(() => new SummaryCostRepository(), []);

  const [scope, setScope] = useState<Scope>('week');
  const [groupBy, setGroupBy] = useState<GroupBy>('reference');
  const [week, setWeek] = useState(initialWeek);
  const [year, setYear] = useState(initialYear);
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [pYear, setPYear] = useState(today.getFullYear());
  const [pMonth, setPMonth] = useState(today.getMonth());
  const [pSemester, setPSemester] = useState(today.getMonth() < 6 ? 1 : 2);
  const [pFrom, setPFrom] = useState(`${today.getFullYear()}-01-01`);
  const [pTo, setPTo] = useState(todayIso);
  const [threshold, setThreshold] = useState(loadThreshold);
  const [search, setSearch] = useState('');
  const [incomeFilter, setIncomeFilter] = useState<IncomeFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('margin');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  // Prefer the server-side calculation; fall back to the browser if the endpoint does not exist.
  const [useServer, setUseServer] = useState(lowMarginBackend.supported !== false);
  const [serverData, setServerData] = useState<{ count: number; kpis: LowMarginKpis; rows: LowMarginRow[] } | null>(null);
  const [pageState, setPageState] = useState({ sig: '', page: 1 });
  const [serverFailure, setServerFailure] = useState<number | null>(null);
  const dSearch = useDebounced(search);
  const dThreshold = useDebounced(threshold);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, String(threshold)); } catch { /* storage unavailable */ } }, [threshold]);

  const bounds = useMemo(
    () => periodBounds({ type: periodType, year: pYear, month: pMonth, semester: pSemester, from: pFrom, to: pTo }),
    [periodType, pYear, pMonth, pSemester, pFrom, pTo],
  );
  const invalidRange = scope === 'period' && (!bounds.from || !bounds.to || bounds.from > bounds.to);

  useEffect(() => {
    if (useServer) { setOrders([]); return; }
    if (invalidRange) { setOrders([]); setLoading(false); return; }
    let alive = true;
    setLoading(true); setError(null); setExpanded(new Set());
    const req: Promise<OrderSummary[]> = scope === 'week'
      ? repository.getSummaryCost(0, week, year).then(r => r.results ?? [])
      : Promise.all(weekRequestsFor(bounds.from, bounds.to).map(w => repository.getSummaryCostRange(w.start, w.end, w.year)))
        .then(parts => {
          // Padded week ranges overlap: de-duplicate, then keep only orders inside the period.
          const byKey = new Map<string, OrderSummary>();
          parts.flatMap(r => r.results ?? []).forEach(o => byKey.set(o.key, o));
          return [...byKey.values()].filter(o => inPeriod(o.date, bounds.from, bounds.to));
        });
    req.then(r => { if (alive) setOrders(r); })
      .catch(e => { if (alive) { setOrders([]); setError(e instanceof Error ? e.message : String(e)); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [repository, scope, week, year, bounds, invalidRange, reload, useServer]);

  const filterSig = JSON.stringify([scope, week, year, bounds, dThreshold, groupBy, dSearch, sortKey, incomeFilter]);
  const page = pageState.sig === filterSig ? pageState.page : 1;

  useEffect(() => {
    if (!useServer) return;
    if (invalidRange) { setServerData(null); setLoading(false); return; }
    let alive = true;
    setLoading(true); setError(null); setExpanded(new Set());
    fetchLowMargin({
      ...(scope === 'week' ? { numberWeek: week, year } : { from: bounds.from, to: bounds.to }),
      threshold: dThreshold, groupBy, search: dSearch, income: incomeFilter, sort: sortKey, page, pageSize: PAGE_SIZE,
    })
      .then(r => { if (alive) { lowMarginBackend.supported = true; setServerData(r); } })
      .catch(e => {
        if (!alive) return;
        if (e instanceof LowMarginUnavailableError) { lowMarginBackend.supported = false; setUseServer(false); return; }
        // The endpoint crashed: keep the screen usable with the browser calculation until "Recalculate".
        if (e instanceof LowMarginServerError) { setServerFailure(e.status); setUseServer(false); return; }
        setServerData(null); setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [useServer, scope, week, year, bounds, invalidRange, dThreshold, groupBy, dSearch, incomeFilter, sortKey, page, reload]);

  const salaries = useProportionalSalaries(orders, reload);
  const calculating = !useServer && !loading && orders.length > 0 && salaries.map === null;

  const rows = useMemo(() => {
    const base = orders.map(o => rowFromOrder(o, salaries.map?.get(o.key)));
    const grouped = groupBy === 'reference' ? groupRows(base) : base;
    return grouped.filter(r => matchesIncome(r, incomeFilter));
  }, [orders, salaries.map, groupBy, incomeFilter]);

  const atRisk = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = rows.filter(r => isAtRisk(r, threshold) && (!term || `${r.key_ref} ${r.client}`.toLowerCase().includes(term)));
    const val = (r: LowMarginRow) => (sortKey === 'margin' ? (r.margin ?? -Infinity) : r[sortKey]);
    return list.sort((a, b) => (sortKey === 'margin' || sortKey === 'profit' ? val(a) - val(b) : val(b) - val(a)));
  }, [rows, threshold, search, sortKey]);

  const local = useMemo<LowMarginKpis>(() => {
    const losses = atRisk.filter(r => r.profit < 0);
    const incomeAtRisk = atRisk.reduce((s, r) => s + r.income, 0);
    const profitAtRisk = atRisk.reduce((s, r) => s + r.profit, 0);
    return {
      total: rows.length, atRisk: atRisk.length, lossCount: losses.length,
      lossTotal: losses.reduce((s, r) => s + r.profit, 0), incomeAtRisk,
      avgMargin: incomeAtRisk > 0 ? (profitAtRisk / incomeAtRisk) * 100 : null,
    };
  }, [atRisk, rows.length]);
  const kpis = useServer ? (serverData?.kpis ?? local) : local;
  // The server filters by income too; re-checking here keeps the list right if it ignores the parameter.
  const shown = useServer ? (serverData?.rows ?? []).filter(r => matchesIncome(r, incomeFilter)) : atRisk;
  const totalCount = useServer ? (serverData?.count ?? 0) : atRisk.length;
  const lastPage = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const exportCsv = () => {
    const blob = new Blob([toCsv(shown)], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `low-margin-${scope === 'week' ? `${year}-w${week}` : `${bounds.from}_${bounds.to}`}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const refresh = () => { clearAssignmentsCache(); lowMarginBackend.supported = null; setServerFailure(null); setUseServer(true); setReload(n => n + 1); };

  const sortOptions: { id: SortKey; label: string }[] = [
    { id: 'margin', label: t('lowMargin.sort.margin') },
    { id: 'profit', label: t('lowMargin.sort.profit') },
    { id: 'income', label: t('lowMargin.sort.income') },
    { id: 'cost', label: t('lowMargin.sort.cost') },
  ];

  const renderBreakdown = (r: LowMarginRow) => {
    const items = [
      { k: 'salaries', v: r.breakdown.salaries, c: 'bg-blue-500' },
      { k: 'expense', v: r.breakdown.expense, c: 'bg-orange-500' },
      { k: 'fuel', v: r.breakdown.fuel, c: 'bg-amber-400' },
      { k: 'work', v: r.breakdown.work, c: 'bg-violet-500' },
      { k: 'bonus', v: r.breakdown.bonus, c: 'bg-emerald-500' },
    ];
    return (
      <div className="space-y-3">
        {r.cost > 0 && (
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-200">
            {items.filter(i => i.v > 0).map(i => <div key={i.k} className={i.c} style={{ width: `${(i.v / r.cost) * 100}%` }} title={`${t(`lowMargin.cost.${i.k}`)}: ${money(i.v)}`} />)}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {items.map(i => (
            <div key={i.k} className="bg-white rounded-lg border border-gray-200 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className={`w-2 h-2 rounded-full ${i.c}`} />{t(`lowMargin.cost.${i.k}`)}</div>
              <div className="text-sm font-semibold text-gray-800">{money(i.v)}</div>
              <div className="text-[11px] text-gray-400">{r.income > 0 ? `${((i.v / r.income) * 100).toFixed(0)}% ${t('lowMargin.ofIncome')}` : ''}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="block text-xs font-semibold text-gray-600 mb-1">{t('lowMargin.scope.label')}</span>
            <Toggle value={scope} onChange={setScope} options={[{ id: 'week', label: t('lowMargin.scope.week') }, { id: 'period', label: t('lowMargin.scope.period') }]} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-600 mb-1">{t('lowMargin.groupBy.label')}</span>
            <Toggle value={groupBy} onChange={setGroupBy} options={[{ id: 'reference', label: t('lowMargin.groupBy.reference') }, { id: 'order', label: t('lowMargin.groupBy.order') }]} />
          </div>
          <div className="flex items-end gap-2">
            {scope === 'week' ? (
              <>
                <WeekPicker week={week} onWeekSelect={setWeek} min={1} max={53} />
                <YearPicker year={year} onYearSelect={setYear} />
              </>
            ) : (
              <>
                <select value={periodType} onChange={e => setPeriodType(e.target.value as PeriodType)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  {(['month', 'semester', 'year', 'range'] as PeriodType[]).map(p => <option key={p} value={p}>{t(`lowMargin.period.${p}`)}</option>)}
                </select>
                {periodType === 'month' && (
                  <select value={pMonth} onChange={e => setPMonth(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    {Array.from({ length: 12 }, (_, m) => (
                      <option key={m} value={m}>{new Date(2000, m, 1).toLocaleDateString(i18n.language, { month: 'long' })}</option>
                    ))}
                  </select>
                )}
                {periodType === 'semester' && (
                  <select value={pSemester} onChange={e => setPSemester(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={1}>{t('lowMargin.period.s1')}</option>
                    <option value={2}>{t('lowMargin.period.s2')}</option>
                  </select>
                )}
                {periodType === 'range' ? (
                  <>
                    <input type="date" value={pFrom} max={pTo || undefined} onChange={e => setPFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    <span className="text-gray-400 pb-2">→</span>
                    <input type="date" value={pTo} min={pFrom || undefined} onChange={e => setPTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </>
                ) : (
                  <YearPicker year={pYear} onYearSelect={setPYear} />
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[260px]">
            <span className="block text-xs font-semibold text-gray-600 mb-1">{t('lowMargin.threshold', { value: threshold })}</span>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={100} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="flex-1" style={{ accentColor: PRIMARY }} />
              <input type="number" min={1} max={100} value={threshold}
                onChange={e => { const v = Number(e.target.value); if (v >= 1 && v <= 100) setThreshold(v); }}
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-right" />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('lowMargin.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#092962]/20 focus:border-[#092962]" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-600 mb-1">{t('lowMargin.income.label')}</span>
            <Toggle value={incomeFilter} onChange={setIncomeFilter} options={[
              { id: 'all', label: t('lowMargin.income.all') },
              { id: 'with', label: t('lowMargin.income.with') },
              { id: 'without', label: t('lowMargin.income.without') },
            ]} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-600 mb-1">{t('lowMargin.sort.label')}</span>
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              {sortOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50" title={t('lowMargin.refresh')}><RefreshCw size={16} /></button>
            <button onClick={exportCsv} disabled={shown.length === 0} className="px-3 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-40" style={{ borderColor: PRIMARY, color: PRIMARY }}>
              <Download size={16} />CSV
            </button>
          </div>
        </div>
      </div>

      {!useServer && !loading && (
        serverFailure !== null ? (
          <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />{t('lowMargin.serverFailed', { status: serverFailure })}
          </div>
        ) : (
          <div className="mb-4 text-xs text-gray-500">{t('lowMargin.fallbackNote')}</div>
        )
      )}

      {/* Salary calculation status */}
      {calculating && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="text-sm text-blue-800 mb-2">{t('lowMargin.calculating', { done: salaries.done, total: salaries.total })}</div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{ width: `${salaries.total ? (salaries.done / salaries.total) * 100 : 0}%` }} /></div>
        </div>
      )}
      {salaries.failed > 0 && (
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />{t('lowMargin.failed', { count: salaries.failed })}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: t('lowMargin.kpi.atRisk'), value: `${kpis.atRisk} / ${kpis.total}`, tone: 'text-gray-800' },
          { label: t('lowMargin.kpi.losses'), value: `${kpis.lossCount} · ${money(kpis.lossTotal)}`, tone: kpis.lossTotal < 0 ? 'text-red-600' : 'text-gray-800' },
          { label: t('lowMargin.kpi.income'), value: money(kpis.incomeAtRisk), tone: 'text-gray-800' },
          { label: t('lowMargin.kpi.avgMargin'), value: pct(kpis.avgMargin), tone: kpis.avgMargin !== null && kpis.avgMargin < 0 ? 'text-red-600' : 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
            <div className="text-xs uppercase text-gray-400">{k.label}</div>
            <div className={`text-lg font-semibold ${k.tone}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {invalidRange ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">{t('lowMargin.invalidRange')}</div>
      ) : loading ? (
        <div className="flex justify-center items-center min-h-48"><LoaderSpinner /></div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white text-xs uppercase" style={{ backgroundColor: PRIMARY }}>
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="text-left px-3 py-3">{t('lowMargin.col.reference')}</th>
                <th className="text-right px-3 py-3">{t('lowMargin.col.income')}</th>
                <th className="text-right px-3 py-3">{t('lowMargin.col.cost')}</th>
                <th className="text-right px-3 py-3">{t('lowMargin.col.result')}</th>
                <th className="text-right px-3 py-3">{t('lowMargin.col.margin')}</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">{t('lowMargin.empty', { value: threshold })}</td></tr>
              )}
              {shown.map(r => {
                const open = expanded.has(r.id);
                const loss = severityOf(r) === 'loss';
                return (
                  <Fragment key={r.id}>
                    <tr onClick={() => toggle(r.id)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <td className="px-3 py-3 text-gray-400">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          {r.key_ref}
                          {r.noWeight && <span title={t('lowMargin.noWeight')} className="text-amber-500"><AlertTriangle size={14} /></span>}
                        </div>
                        <div className="text-xs text-gray-400">{r.client}{groupBy === 'reference' ? ` · ${t('lowMargin.orders', { count: r.orderCount })}` : r.date ? ` · ${r.date.slice(0, 10)}` : ''}</div>
                      </td>
                      <td className="px-3 py-3 text-right">{money(r.income)}</td>
                      <td className="px-3 py-3 text-right">{money(r.cost)}</td>
                      <td className={`px-3 py-3 text-right font-semibold ${loss ? 'text-red-600' : 'text-amber-600'}`}>{money(r.profit)}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${loss ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {r.margin === null ? t('lowMargin.noIncome') : pct(r.margin)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {groupBy === 'order' && (
                          <button onClick={e => { e.stopPropagation(); navigate(`/app/add-operators-to-order/${r.id}`); }}
                            className="text-gray-400 hover:text-[#092962]" title={t('lowMargin.viewOperators')}><Users size={16} /></button>
                        )}
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-gray-50 border-t border-gray-100">
                        <td />
                        <td colSpan={6} className="px-3 py-4 space-y-4">
                          {renderBreakdown(r)}
                          {r.children.length > 1 && (
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('lowMargin.ordersOfRef')}</div>
                              <div className="space-y-1">
                                {[...r.children].sort((a, b) => (a.margin ?? -Infinity) - (b.margin ?? -Infinity)).map(c => (
                                  <div key={c.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                                    <span className="text-gray-500 w-24 shrink-0">{c.date?.slice(0, 10) ?? '—'}</span>
                                    <span className="flex-1 text-gray-700">{money(c.income)} → {money(c.cost)}</span>
                                    <span className={`font-semibold ${c.profit < 0 ? 'text-red-600' : 'text-gray-700'}`}>{money(c.profit)} · {pct(c.margin)}</span>
                                    <button onClick={() => navigate(`/app/add-operators-to-order/${c.id}`)} className="text-gray-400 hover:text-[#092962]" title={t('lowMargin.viewOperators')}><Users size={14} /></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {r.children.length === 1 && (
                            <button onClick={() => navigate(`/app/add-operators-to-order/${r.children[0].id}`)} className="text-xs font-semibold flex items-center gap-1.5" style={{ color: PRIMARY }}>
                              <Users size={14} />{t('lowMargin.viewOperators')}
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {useServer && totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
              <span>{t('lowMargin.pageOf', { page, last: lastPage, count: totalCount })}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPageState({ sig: filterSig, page: page - 1 })} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40">←</button>
                <button disabled={page >= lastPage} onClick={() => setPageState({ sig: filterSig, page: page + 1 })} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
