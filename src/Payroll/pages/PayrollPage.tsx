import { useState, useEffect } from 'react';
import {
  payrollService,
  ApiResponse,
  AssignmentData,
  WeekInfo,
} from '../../service/PayrollService';
import { PayrollModal } from '../components/PayrollModal';

/* ---------- Types ---------- */
interface WeekAmounts {
  Mon?: number;
  Tue?: number;
  Wed?: number;
  Thu?: number;
  Fri?: number;
  Sat?: number;
  Sun?: number;
}

interface OperatorRow extends WeekAmounts {
  code: string;
  name: string;
  lastName: string;  // Agregamos lastName
  role: string;
  cost: number;      // Agregamos cost
  pay: string;       // Agregamos pay (para el indicador ✓ o ⚠️)
  total?: number;
  additionalBonuses?: number; // Agregamos el campo para bonos adicionales
  grandTotal?: number; // Agregamos el campo para el total general
}

const weekdayKeys: (keyof WeekAmounts)[] = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

/* ---------- Utils ---------- */
const dayKeyFromDate = (iso: string): keyof WeekAmounts =>
  (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
    new Date(iso).getDay()
  ] ?? 'Mon') as keyof WeekAmounts;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    n,
  );

const addAmount = (prev: number | undefined, salary: number, bonus: number) => {
  console.log(salary + "salary" + bonus + "bonus" + prev);
  
  
  return (prev || 0) + (salary || 0) + (bonus || 0);
};


/* ==================================================== */

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<OperatorRow[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [week, setWeek] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now.getTime() - start.getTime()) / 604800000); // ms in a week
  });
  const [selectedOperator, setSelectedOperator] = useState<OperatorRow | null>(null);

  /* ---------- Fetch ---------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      const res: ApiResponse = await payrollService(week, page);

      const map = new Map<string, OperatorRow>();

      res.data.forEach((d: AssignmentData) => {
        const key = d.code;
        const day = dayKeyFromDate(d.date);

        if (!map.has(key)) {
          map.set(key, {
            code: d.code,
            name: d.first_name,
            lastName: d.last_name,  // Agregamos lastName separado
            role: d.role,
            cost: d.salary,        // Usamos el salary como cost
            pay: '⚠️',             // Por defecto usamos warning
            total: 0,
            additionalBonuses: 0,
            grandTotal: 0
          });
        }
        const row = map.get(key)!;
        

        row[day] = addAmount(row[day], d.salary, 0);
        // Aseguramos que los valores sean números válidos
        const currentTotal = Number(row.total || 0);
        const currentSalary = Number(d.salary || 0);
        const currentBonus = Number(d.bonus || 0);

        row.total = currentTotal + currentSalary;
        row.additionalBonuses = (row.additionalBonuses || 0) + currentBonus;
        row.grandTotal = Number(row.total) + Number(row.additionalBonuses);
        
        console.log(d.salary + "salary" );
      });

      setGrouped(Array.from(map.values()));
      setWeekInfo(res.week_info);

      const { count, page_size } = res.pagination;
      setPages(Math.ceil(count / page_size));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [week, page]);

  /* ---------- Handlers ---------- */
  const prev = () => page > 1 && setPage(p => p - 1);
  const next = () => page < pages && setPage(p => p + 1);
  const changeWeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const w = parseInt(e.target.value, 10);
    if (w >= 1 && w <= 53) {
      setWeek(w);
      setPage(1);
    }
  };

  
  

  const handleRowClick = (operator: OperatorRow) => {
    setSelectedOperator(operator);
  };

  /* ---------- Render ---------- */
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Operators Payroll</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <label htmlFor="weekInput" className="mr-2">
            Week:
          </label>
          <input
            id="weekInput"
            type="number"
            min="1"
            max="53"
            value={week}
            onChange={changeWeek}
            className="border rounded px-2 py-1 w-20"
          />
        </div>
        {weekInfo && (
          <span className="text-sm text-gray-600">
            Period: {weekInfo.start_date} → {weekInfo.end_date}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading data…</div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <div className="mb-2 text-right">
              <span className="text-sm text-gray-600">Count Days: 5</span>
            </div>
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Pay</th>
                  <th className="py-2 px-4 border-b text-left">Code</th>
                  <th className="py-2 px-4 border-b text-left">Cost</th>
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Last Name</th>
                  {weekdayKeys.map(day => (
                    <th key={day} className="py-2 px-4 border-b text-right">
                      {day}
                    </th>
                  ))}
                  <th className="py-2 px-4 border-b text-right">Additional Bonuses</th>
                  <th className="py-2 px-4 border-b text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {grouped.length ? (
                  grouped.map(r => (
                    <tr 
                      key={r.code} 
                      className="hover:bg-gray-50 cursor-pointer" 
                      onClick={() => handleRowClick(r)}
                    >
                      <td className="py-2 px-4 border-b">{r.pay || '⚠️'}</td>
                      <td className="py-2 px-4 border-b">{r.code}</td>
                      <td className="py-2 px-4 border-b">${r.cost || 0}</td>
                      <td className="py-2 px-4 border-b">{r.name}</td>
                      <td className="py-2 px-4 border-b">{r.lastName}</td>
                      {weekdayKeys.map(day => (
                        <td key={day} className="py-2 px-4 border-b text-right">
                          {r[day] ? formatCurrency(r[day]!) : '—'}
                        </td>
                      ))}
                      <td className="py-2 px-4 border-b text-right">
                        {formatCurrency(r.additionalBonuses ?? 0)}
                      </td>
                      <td className="py-2 px-4 border-b text-right font-semibold">
                        {formatCurrency(r.grandTotal ?? 0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
              
              
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Page {page} / {pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={prev}
                disabled={page <= 1}
                className={`px-3 py-1 border rounded ${
                  page <= 1
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={next}
                disabled={page >= pages}
                className={`px-3 py-1 border rounded ${
                  page >= pages
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
      <PayrollModal
        isOpen={!!selectedOperator}
        onClose={() => setSelectedOperator(null)}
        operatorData={selectedOperator}
      />
    </div>
  );
}
