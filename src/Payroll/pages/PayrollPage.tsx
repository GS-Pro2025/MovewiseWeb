import React, { useState, useEffect, useMemo } from 'react';
import {
  payrollService,
  AssignmentData,
  WeekInfo,
} from '../../service/PayrollService';
import { PayrollModal } from '../components/PayrollModal';
import LoaderSpinner from '../../componets/LoadingSpinner';

interface WeekAmounts { Mon?: number; Tue?: number; Wed?: number; Thu?: number; Fri?: number; Sat?: number; Sun?: number; }

interface OperatorRow extends WeekAmounts {
  code: string;
  name: string;
  lastName: string;
  role: string;
  cost: number;
  pay?: string | null;
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

/** Genera las fechas de la semana basado en la información de week_info */
function generateWeekDates(startDate: string, endDate: string): { [key in keyof WeekAmounts]?: string } {
  const dates: { [key in keyof WeekAmounts]?: string } = {};
  
  // El startDate ya debería ser el lunes, usar directamente
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const monday = new Date(startYear, startMonth - 1, startDay);
  
  console.log('Fecha de inicio (lunes):', startDate);
  console.log('Fecha de fin (domingo):', endDate);
  
  // Generar fechas de lunes a domingo en orden
  const dayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    
    const year = current.getFullYear();
    const month = (current.getMonth() + 1).toString().padStart(2, '0');
    const day = current.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    dates[dayKeys[i]] = dateStr;
    console.log(`${dayKeys[i]}: ${dateStr}`);
  }
  
  console.log('Fechas generadas:', dates);
  return dates;
}

/** Formatear fecha para mostrar en header */
function formatDateForHeader(dateStr: string): string {
  // Parsear la fecha correctamente sin problemas de timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  console.log(`formatDateForHeader: input=${dateStr}, parsed date=${date}, month=${date.getMonth() + 1}, day=${date.getDate()}`);
  
  const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
  const dayStr = date.getDate().toString().padStart(2, '0');
  
  return `${monthStr}/${dayStr}`;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<OperatorRow[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [weekDates, setWeekDates] = useState<{ [key in keyof WeekAmounts]?: string }>({});
  const [week, setWeek] = useState(() => getISOWeek(new Date()));
  const [selectedOperator, setSelectedOperator] = useState<OperatorRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      console.log('Todos los datos:', allData);
      
      // Generar mapeo de fechas para los encabezados
      const dates = generateWeekDates(week_info.start_date, week_info.end_date);
      setWeekDates(dates);
      
      const map = new Map<string, OperatorRow>();

      // PASO 1: Crear la estructura básica de cada operador y obtener bonus único
      allData.forEach(d => {
        const key = d.code;
        const assignId = d.id_assign;
        const payId = d.id_payment;

        if (!map.has(key)) {
          // Al crear el operador por primera vez, tomar el bonus del primer registro
          map.set(key, {
            code: d.code,
            name: d.first_name,
            lastName: d.last_name,
            role: d.role,
            cost: d.salary,
            pay: payId ? payId.toString() : null, 
            total: 0,
            additionalBonuses: Number(d.bonus || 0), // Solo tomar el bonus una vez
            grandTotal: 0,
            assignmentIds: [assignId],
            paymentIds: payId != null ? [payId] : [],
          });
        } else {
          const ex = map.get(key)!;
          ex.assignmentIds.push(assignId);
          if (payId != null && !ex.paymentIds.includes(payId)) {
            ex.paymentIds.push(payId);
          }
          // NO acumular bonus aquí - solo se toma una vez por operador
        }
      });

      // PASO 2: Función para buscar si un operador trabajó en una fecha específica
      const findWorkDay = (operatorCode: string, targetDate: string): number | null => {
        // Buscar en todos los datos si este operador trabajó en esta fecha
        const workRecord = allData.find(d => {
          const dataDate = d.date.split('T')[0]; // "2025-05-19T00:00:00Z" -> "2025-05-19"
          return d.code === operatorCode && dataDate === targetDate;
        });
        
        return workRecord ? workRecord.salary : null;
      };

      // PASO 3: Mapear cada día de la semana para cada operador
      const operators = Array.from(map.values()).map(row => {
        console.log(`Mapeando días para ${row.name} ${row.lastName} (${row.code})`);
        console.log(`Bonus para ${row.code}: ${row.additionalBonuses}`);
        
        // Para cada día de la semana, buscar si trabajó
        weekdayKeys.forEach(dayKey => {
          const dateForThisDay = dates[dayKey];
          if (dateForThisDay) {
            const salary = findWorkDay(row.code, dateForThisDay);
            if (salary !== null) {
              row[dayKey] = salary;
              console.log(`  ${dayKey} (${dateForThisDay}): ${salary}`);
            }
          }
        });

        // Calcular totales
        const daysWorked = weekdayKeys.filter(day => row[day] != null && row[day]! > 0).length;
        row.total = daysWorked * row.cost;
        row.grandTotal = (row.total || 0) + (row.additionalBonuses || 0);
        
        console.log(`Total para ${row.code}: Días=${daysWorked}, Salario=${row.total}, Bonus=${row.additionalBonuses}, Gran Total=${row.grandTotal}`);
        
        return row;
      });

      setGrouped(operators);
      setWeekInfo(week_info);
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

  // Filtrar operadores basado en el término de búsqueda
  const filteredOperators = useMemo(() => {
    if (!searchTerm.trim()) {
      return grouped;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = grouped.filter(operator => 
      operator.code.toLowerCase().includes(term) ||
      operator.name.toLowerCase().includes(term) ||
      operator.lastName.toLowerCase().includes(term)
    );
    
    console.log(`Búsqueda: "${searchTerm}", Total: ${grouped.length}, Filtrados: ${filtered.length}`);
    return filtered;
  }, [grouped, searchTerm]);

  // Totales para los operadores filtrados
  const filteredTotalGrand = useMemo(
    () => filteredOperators.reduce((sum, r) => sum + (r.grandTotal || 0), 0),
    [filteredOperators]
  );

  // Contadores de pago para operadores filtrados
  const paymentStats = useMemo(() => {
    const paidOperators = filteredOperators.filter(r => r.pay != null);
    const unpaidOperators = filteredOperators.filter(r => r.pay == null);
    
    const paidAmount = paidOperators.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
    const unpaidAmount = unpaidOperators.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
    
    return { 
      paid: paidOperators.length, 
      unpaid: unpaidOperators.length, 
      total: paidOperators.length + unpaidOperators.length,
      paidAmount,
      unpaidAmount
    };
  }, [filteredOperators]);

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
        <div className="flex items-center">
          <label htmlFor="searchInput" className="mr-2">Search:</label>
          <input
            id="searchInput"
            type="text"
            placeholder="Search by code, name, or last name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-1 w-64"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="ml-2 text-gray-500 hover:text-gray-700"
              title="Clear search"
            >
              ✕
            </button>
          )}
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
        <div className="flex justify-center items-center py-8" style={{ height: '400px' }}>
          <div style={{ transform: 'scale(0.5)' }}>
            <LoaderSpinner />
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{countDays}</div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Working Days</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                <div className="text-2xl font-bold text-green-600">
                  {filteredOperators.length}
                  {filteredOperators.length !== grouped.length && (
                    <span className="text-lg text-gray-400"> / {grouped.length}</span>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {searchTerm ? 'Filtered Operators' : 'Total Operators'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{paymentStats.paid}</div>
                    <div className="text-xs text-green-600">Paid</div>
                  </div>
                  <div className="text-gray-400">/</div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{paymentStats.unpaid}</div>
                    <div className="text-xs text-red-600">Pending</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mt-1">Payment Status</div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(paymentStats.unpaidAmount)}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Pending Amount
                  {paymentStats.unpaid > 0 && (
                    <div className="text-xs text-red-500 mt-1">
                      {paymentStats.unpaid} operator{paymentStats.unpaid !== 1 ? 's' : ''} pending
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(filteredTotalGrand)}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Grand Total
                  {searchTerm && (
                    <div className="text-xs text-gray-400 mt-1">
                      Full Total: {formatCurrency(totalGrand)}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                  {weekdayKeys.map(day => {
                    const dateStr = weekDates[day];
                    const displayDate = dateStr ? formatDateForHeader(dateStr) : day;
                    console.log(`Columna ${day}: fecha=${dateStr}, display=${displayDate}`);
                    return (
                      <th key={day} className="py-2 px-4 border-b text-right">
                        {displayDate}
                      </th>
                    );
                  })}
                  <th className="py-2 px-4 border-b text-right">Additional Bonuses</th>
                  <th className="py-2 px-4 border-b text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperators.length ? filteredOperators.map(r => (
                  <tr key={r.code} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOperator(r)}>
                    <td className="py-2 px-4 border-b text-center">{r.pay != null ? '✅' : '⚠️'}</td>
                    <td className="py-2 px-4 border-b">{r.code}</td>
                    <td className="py-2 px-4 border-b">{formatCurrency(r.cost)}</td>
                    <td className="py-2 px-4 border-b">{r.name}</td>
                    <td className="py-2 px-4 border-b">{r.lastName}</td>
                    {weekdayKeys.map(day => {
                      const value = r[day];
                      
                      return (
                        <td key={day} className="py-2 px-4 border-b text-right">
                          {value ? formatCurrency(value) : '—'}
                        </td>
                      );
                    })}
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(r.additionalBonuses || 0)}</td>
                    <td className="py-2 px-4 border-b text-right font-semibold">{formatCurrency(r.grandTotal || 0)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={weekdayKeys.length + 7} className="py-4 text-center text-gray-500">
                      {searchTerm ? `No operators found matching "${searchTerm}"` : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {selectedOperator && weekInfo && (
        <PayrollModal
          isOpen={!!selectedOperator}
          onClose={handleModalClose}
          operatorData={selectedOperator}
          periodStart={weekInfo.start_date}
          periodEnd={weekInfo.end_date}
        />
      )}
    </div>
  );
}