import React, { useState, useEffect, useMemo } from 'react';
import {
  payrollService,
  AssignmentData,
  WeekInfo,
} from '../../service/PayrollService';
import { PayrollModal } from '../components/PayrollModal';

interface WeekAmounts { Mon?: number; Tue?: number; Wed?: number; Thu?: number; Fri?: number; Sat?: number; Sun?: number; }

interface OperatorRow extends WeekAmounts {
  code: string;
  name: string;
  lastName: string;
  role: string;
  cost: number;
  pay?: number | null;
  total?: number;
  additionalBonuses?: number;
  grandTotal?: number;
  assignmentIds: (number | string)[];
  paymentIds: (number | string)[];
}

const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Devuelve el número de semana ISO para una fecha dada */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const dayKeyFromDate = (iso: string): keyof WeekAmounts =>
  (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso).getDay()] ?? 'Mon') as keyof WeekAmounts;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<OperatorRow[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [week, setWeek] = useState(() => getISOWeek(new Date()));
  const [selectedOperator, setSelectedOperator] = useState<OperatorRow | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Función para obtener todos los datos de todas las páginas
      const fetchAllAssignments = async (week: number): Promise<{ data: AssignmentData[], week_info: WeekInfo }> => {
        let allData: AssignmentData[] = [];
        let currentPage = 1;
        let weekInfo: WeekInfo;
        
        do {
          const response = await payrollService(week, currentPage);
          allData = [...allData, ...response.data];
          weekInfo = response.week_info;
          
          // Si no hay página siguiente, terminar
          if (!response.pagination.next) {
            break;
          }
          
          currentPage++;
        } while (true);
        
        return { data: allData, week_info: weekInfo! };
      };
      
      const { data: allData, week_info } = await fetchAllAssignments(week);

      const map = new Map<string, OperatorRow>();

      // 1) Llenar días trabajados y bonos, sin acumular salario diario aquí
      allData.forEach(d => {
        const key = d.code;
        const day = dayKeyFromDate(d.date);
        const assignId = d.id_assign;
        const payId = d.id_payment;

        if (!map.has(key)) {
          map.set(key, {
            code: d.code,
            name: d.first_name,
            lastName: d.last_name,
            role: d.role,
            cost: d.salary,
            pay: payId ?? null,
            total: 0,
            additionalBonuses: 0,
            grandTotal: 0,
            assignmentIds: [assignId],
            paymentIds: payId != null ? [payId] : [],
          });
        } else {
          const ex = map.get(key)!;
          ex.assignmentIds.push(assignId);
          if (payId != null) ex.paymentIds.push(payId);
        }

        const row = map.get(key)!;
        row[day] = d.salary || 0;
        row.additionalBonuses = (row.additionalBonuses || 0) + Number(d.bonus || 0);
      });

      // 2) Calcular total diario por días trabajados y grandTotal con bonos
      const operators = Array.from(map.values()).map(row => {
        const daysWorked = weekdayKeys.filter(day => row[day] != null && row[day]! > 0).length;
        row.total = daysWorked * row.cost;
        row.grandTotal = (row.total || 0) + (row.additionalBonuses || 0);
        return row;
      });

      setGrouped(operators);

      // Usar la información de semana que viene del API
      setWeekInfo(week_info);

      setWeekInfo(response.week_info);

      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [week]);

  const handleModalClose = () => {
    setSelectedOperator(null);
    fetchData();
  };

  const totalGrand = useMemo(
    () => grouped.reduce((sum, r) => sum + (r.grandTotal || 0), 0),
    [grouped]
  );
  const countDays = useMemo(
    () => weekdayKeys.filter(day => grouped.some(r => r[day] != null)).length,
    [grouped]
  );

  const changeWeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const w = parseInt(e.target.value, 10);
    if (!isNaN(w) && w >= 1 && w <= 53) {
      setWeek(w);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Operators Payroll</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <label htmlFor="weekInput" className="mr-2">Week:</label>
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
          <div className="overflow-x-auto mb-2 text-right space-x-4">
            <span className="text-sm text-gray-600">Count Days: {countDays}</span>
            <span className="text-sm text-gray-600">Total Grand Total: {formatCurrency(totalGrand)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Pay</th>
                  <th className="py-2 px-4 border-b text-left">Code</th>
                  <th className="py-2 px-4 border-b text-left">Cost</th>
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Last Name</th>
                  {weekdayKeys.map(day => (
                    <th key={day} className="py-2 px-4 border-b text-right">{day}</th>
                  ))}
                  <th className="py-2 px-4 border-b text-right">Additional Bonuses</th>
                  <th className="py-2 px-4 border-b text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {grouped.length ? grouped.map(r => (
                  <tr key={r.code} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOperator(r)}>
                    <td className="py-2 px-4 border-b text-center">{r.pay != null ? '✅' : '⚠️'}</td>
                    <td className="py-2 px-4 border-b">{r.code}</td>
                    <td className="py-2 px-4 border-b">{formatCurrency(r.cost)}</td>
                    <td className="py-2 px-4 border-b">{r.name}</td>
                    <td className="py-2 px-4 border-b">{r.lastName}</td>
                    {weekdayKeys.map(day => (
                      <td key={day} className="py-2 px-4 border-b text-right">
                        {r[day] ? formatCurrency(r[day]!) : '—'}
                      </td>
                    ))}
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(r.additionalBonuses || 0)}</td>
                    <td className="py-2 px-4 border-b text-right font-semibold">{formatCurrency(r.grandTotal || 0)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={11} className="py-4 text-center text-gray-500">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      <PayrollModal
        isOpen={!!selectedOperator}
        onClose={handleModalClose}
        operatorData={selectedOperator!}
        periodStart={weekInfo?.start_date!}
        periodEnd={weekInfo?.end_date!}
      />
    </div>
  );
}