import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';
import LoaderSpinner from '../../components/Login_Register/LoadingSpinner';
import { fetchOrdersReport } from '../../Home/data/repositoryOrdersReport';
import { OrderReportResult } from '../../Home/domain/ModelOrdersReport';
import { fetchOperators } from '../../operators/data/RepositoryOperators';
import { Avatar } from '../../pettyCash/ui/components/Avatar';
import { isoWeekMonday } from '../../pettyCash/domain/PettyCashModels';
import { getISOWeek } from '../../Payroll/util/PayrollUtil';
import { fmtDay } from '../../pettyCash/ui/format';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_I18N: Record<typeof DAYS[number], string> = {
  Mon: 'monday', Tue: 'tuesday', Wed: 'wednesday', Thu: 'thursday', Fri: 'friday', Sat: 'saturday', Sun: 'sunday',
};
type Day = typeof DAYS[number];

interface DayOrder {
  id_assign: number;
  orderKey: string;
  keyRef: string;
  customer: string;
  job: string;
  place: string;
  locationStart: string | null;
  locationEnd: string | null;
  status: string;
  start: string | null;
  end: string | null;
  role: string;
}

interface OperatorWeek {
  code: string;
  name: string;
  days: Record<Day, DayOrder[]>;
  total: number;
}

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

/** All orders of the week; the report is paginated, so follow it to the end. */
const fetchAllWeekOrders = async (week: number, year: number): Promise<OrderReportResult[]> => {
  const all: OrderReportResult[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetchOrdersReport(page, week, year, PAGE_SIZE);
    all.push(...res.results);
    if (!res.next) break;
  }
  return all;
};

/** Weekday key of a YYYY-MM-DD(THH…) string, in local time (no timezone shift). */
const dayOf = (iso: string): Day | null => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return DAYS[(new Date(y, m - 1, d).getDay() + 6) % 7];
};

const emptyDays = (): Record<Day, DayOrder[]> => ({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] });

const groupByOperator = (orders: OrderReportResult[]): OperatorWeek[] => {
  const map = new Map<string, OperatorWeek>();
  for (const o of orders) {
    for (const op of o.operators ?? []) {
      const day = dayOf(op.date || o.date);
      if (!day) continue;
      let row = map.get(op.code);
      if (!row) {
        row = { code: op.code, name: `${op.first_name} ${op.last_name}`.trim(), days: emptyDays(), total: 0 };
        map.set(op.code, row);
      }
      row.days[day].push({
        id_assign: op.id_assign, orderKey: o.key, keyRef: o.key_ref,
        customer: o.customer_factory_name, job: o.job_name, status: o.status,
        place: [o.city, o.state_usa].filter(Boolean).join(', '),
        locationStart: op.location_start, locationEnd: op.location_end,
        start: op.start_time, end: op.end_time, role: op.role,
      });
      row.total += 1;
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export default function WeeklyOperatorsReport() {
  const { t } = useTranslation();
  const [week, setWeek] = useState(() => getISOWeek(new Date()));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderReportResult[]>([]);
  const [photos, setPhotos] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOperators().then(r => setPhotos(Object.fromEntries(r.results.map(o => [o.code, o.photo])))).catch(() => undefined);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchAllWeekOrders(week, year)
      .then(r => { if (alive) { setOrders(r); setError(null); } })
      .catch(e => { if (alive) { setOrders([]); setError(e instanceof Error ? e.message : String(e)); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [week, year]);

  const rows = useMemo(() => groupByOperator(orders), [orders]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? rows.filter(r => `${r.name} ${r.code}`.toLowerCase().includes(term)) : rows;
  }, [rows, search]);

  const monday = isoWeekMonday(year, week);
  const dayDate = (i: number) => {
    const [y, m, d] = monday.split('-').map(Number);
    return new Date(y, m - 1, d + i).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };
  const totalAssignments = filtered.reduce((s, r) => s + r.total, 0);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0B2863]">{t('weeklyReport.title')}</h1>
        <p className="text-sm text-gray-500">{t('weeklyReport.subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <span className="block text-xs font-semibold text-gray-600 mb-1">{t('weeklyReport.week')}</span>
          <div className="flex items-center gap-2">
            <WeekPicker week={week} onWeekSelect={setWeek} min={1} max={53} />
            <YearPicker year={year} onYearSelect={setYear} />
          </div>
        </div>
        <label className="block flex-1 min-w-[220px]">
          <span className="block text-xs font-semibold text-gray-600 mb-1">{t('weeklyReport.search')}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('weeklyReport.searchPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0B2863]/30 focus:border-[#0B2863]" />
        </label>
        <div className="flex gap-6 text-sm">
          <div><div className="text-xs text-gray-400 uppercase">{t('weeklyReport.operators')}</div><div className="text-xl font-bold text-gray-800">{filtered.length}</div></div>
          <div><div className="text-xs text-gray-400 uppercase">{t('weeklyReport.assignments')}</div><div className="text-xl font-bold text-gray-800">{totalAssignments}</div></div>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      {loading ? <LoaderSpinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#0B2863] text-white text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 sticky left-0 bg-[#0B2863] z-10 min-w-[220px]">{t('weeklyReport.operator')}</th>
                {DAYS.map((d, i) => (
                  <th key={d} className="text-left px-3 py-3 min-w-[160px]">
                    <div>{t(`weekdays.${DAY_I18N[d]}`)}</div>
                    <div className="font-normal opacity-70 normal-case">{dayDate(i)}</div>
                  </th>
                ))}
                <th className="px-3 py-3 text-right">{t('weeklyReport.total')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">{t('weeklyReport.empty')}</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.code} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 sticky left-0 bg-white z-[1]">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} photo={photos[r.code]} size={36} />
                      <div>
                        <div className="font-semibold text-gray-800">{r.name}</div>
                        <div className="text-xs text-gray-400">{r.code}</div>
                      </div>
                    </div>
                  </td>
                  {DAYS.map(d => (
                    <td key={d} className="px-3 py-3">
                      <div className="flex flex-col gap-1.5">
                        {r.days[d].map(o => (
                          <div key={o.id_assign}
                            title={[o.customer, o.job, o.place, o.locationStart && `${o.locationStart}${o.locationEnd ? ` → ${o.locationEnd}` : ''}`, o.role, [o.start, o.end].filter(Boolean).join(' → ')].filter(Boolean).join('\n')}
                            className="rounded-lg border border-blue-100 bg-blue-50/60 px-2 py-1">
                            <div className="text-xs font-semibold text-[#0B2863] truncate">{o.keyRef}</div>
                            <div className="text-[11px] text-gray-500 truncate">{o.customer}</div>
                            {o.place && (
                              <div className="text-[11px] text-gray-500 truncate">
                                <i className="fas fa-map-marker-alt mr-1 text-[#F09F52]" />{o.place}
                              </div>
                            )}
                          </div>
                        ))}
                        {r.days[d].length === 0 && <span className="text-gray-300">—</span>}
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-bold text-[#0B2863]">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">
        {fmtDay(monday)} · <Link to="/app/payroll" className="text-[#0B2863] hover:underline">{t('weeklyReport.goPayroll')}</Link>
      </p>
    </div>
  );
}
