import { useState, useEffect, useCallback } from 'react';
import MonthlyTargetCard from './components/MonthlyTargetCard';
import StatsComparisonCard from './components/StatsComparisonCard';
import TruckStatistics from './TruckStatistics';
import PaymentStatusChart from './components/PaymentStatusChart';
import PaidUnpaidWeekRangeChart from './components/PaidUnpaidWeekRangeChart';
import { fetchOrdersCountWithComparison, fetchWeeklyProfitReport, fetchPaymentStatusWithComparison, fetchClientStatsWithComparison, fetchOrdersBasicDataList } from '../data/repositoryStatistics';
import { OrdersCountStats } from '../domain/OrdersCountModel';
import { PaymentStatusComparison } from '../domain/PaymentStatusModels';
import { ClientStatsComparison } from '../domain/OrdersWithClientModels';
import { OrdersBasicDataResponse } from '../domain/BasicOrdersDataModels';
import PayrollStatistics from './PayrollStatistics';
import { useNavigate } from 'react-router-dom';

interface StatItem {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface MonthlyTargetData {
  percent: number;
  change: number;
  target: string;
  revenue: string;
  today: string;
  totalExpenses: number;
  grandTotal: number;
  previousExpenses: number;
  previousGrandTotal: number;
  debt?: number;
}

const Statistics = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<'overview' | 'trucks' | 'payroll'>('overview');
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const now = new Date();
    return getWeekOfYear(now);
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  // 1. CAMBIAR statsData de readonly a mutable:
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [monthlyTargetData, setMonthlyTargetData] = useState<MonthlyTargetData>({
    percent: 0,
    change: 0,
    target: "$0",
    revenue: "$0",
    today: "$0",
    totalExpenses: 0,
    grandTotal: 0,
    previousExpenses: 0,
    previousGrandTotal: 0
  });
  const [ordersCountStats, setOrdersCountStats] = useState<OrdersCountStats | null>(null);
  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusComparison>({
    currentStats: {
      totalOrders: 0,
      paidOrders: 0,
      unpaidOrders: 0,
      paidPercentage: 0,
      unpaidPercentage: 0,
      totalIncome: 0,
      paidIncome: 0,
      unpaidIncome: 0
    },
    previousStats: {
      totalOrders: 0,
      paidOrders: 0,
      unpaidOrders: 0,
      paidPercentage: 0,
      unpaidPercentage: 0,
      totalIncome: 0,
      paidIncome: 0,
      unpaidIncome: 0
    },
    changes: {
      totalOrdersChange: 0,
      paidOrdersChange: 0,
      unpaidOrdersChange: 0,
      paidPercentageChange: 0
    }
  });
  const [clientStats, setClientStats] = useState<ClientStatsComparison>({
    currentStats: {
      totalClients: 0,
      activeClients: 0,
      totalFactories: 0,
      activeFactories: 0,
      topClients: [],
      topFactories: [],
      totalOrders: 0,
      averageOrdersPerClient: 0,
      averageOrdersPerFactory: 0
    },
    previousStats: {
      totalClients: 0,
      activeClients: 0,
      totalFactories: 0,
      activeFactories: 0,
      topClients: [],
      topFactories: [],
      totalOrders: 0,
      averageOrdersPerClient: 0,
      averageOrdersPerFactory: 0
    },
    changes: {
      totalClientsChange: 0,
      activeClientsChange: 0,
      totalFactoriesChange: 0,
      totalOrdersChange: 0
    }
  });
  // NUEVO: Estado para datos básicos de órdenes
  const [basicOrdersData, setBasicOrdersData] = useState<OrdersBasicDataResponse | null>(null);
  console.log('Orders Count Stats:', ordersCountStats);
  console.log('ClientStats', clientStats);
  console.log('basicOrdersData', basicOrdersData);
  
  function getWeekOfYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 4));
    const yearStartDayNum = yearStart.getUTCDay() || 7;
    yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  const getWeekRange = useCallback((year: number, week: number): { start: string; end: string } => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
    const endDate = new Date(startDate.getTime() + 6 * 86400000);

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }, []);

  // NUEVO: Cargar datos de profit semanal
  const loadStatistics = useCallback(async (week: number, year: number) => {
    if (activeSection !== 'overview') return;

    try {
      setLoading(true);
      setError(null);

      const weekRange = getWeekRange(year, week);
      console.log('Loading statistics for week:', week, 'year:', year, 'range:', weekRange);
      const previousWeek = week > 1 ? week - 1 : 53;
      const previousYear = week > 1 ? year : year - 1;

      // 1. Cargar métricas de órdenes
      const { currentStats, comparison } = await fetchOrdersCountWithComparison(year, week);
      setOrdersCountStats(currentStats);

      // NUEVO: 1.5. Cargar datos básicos de órdenes
      const basicData = await fetchOrdersBasicDataList(year, week);
      setBasicOrdersData(basicData);

      // 2. Cargar profit semanal actual y anterior
      const currentWeekProfits = await fetchWeeklyProfitReport(year, week);
      const previousWeekProfits = await fetchWeeklyProfitReport(previousYear, previousWeek);

      const currentNetProfit = currentWeekProfits.reduce((sum, o) => sum + o.net_profit, 0);
      const previousNetProfit = previousWeekProfits.reduce((sum, o) => sum + o.net_profit, 0);

      const currentExpenses = currentWeekProfits.reduce((sum, o) => sum + o.total_expenses, 0);
      const previousExpenses = previousWeekProfits.reduce((sum, o) => sum + o.total_expenses, 0);

      // Si el profit es negativo, el grandTotal es 0 y la deuda es el valor absoluto del profit negativo
      const grandTotal = currentNetProfit > 0 ? currentNetProfit : 0;
      const debt = currentNetProfit < 0 ? Math.abs(currentNetProfit) : 0;

      const netProfitChange = previousNetProfit !== 0
        ? ((currentNetProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100
        : 0;

      // Si el grandTotal es 0, la barra no crece
      const targetPercent = previousNetProfit !== 0 && grandTotal > 0
        ? Math.min((grandTotal / previousNetProfit) * 100, 200)
        : 0;
        
      // Si el profit de la semana anterior es 0 entonces el target es 0
      const safePreviousNetProfit = previousNetProfit > 0 ? previousNetProfit : 0;

      const monthlyTargetData: MonthlyTargetData = {
        percent: targetPercent,
        change: Number(netProfitChange.toFixed(1)),
        target: `$${(safePreviousNetProfit / 1000).toFixed(1)}K`, 
        revenue: `$${(grandTotal / 1000).toFixed(1)}K`,
        today: `$${(grandTotal / 7).toFixed(0)}`,
        totalExpenses: currentExpenses,
        grandTotal: grandTotal,
        previousExpenses: previousExpenses,
        previousGrandTotal: previousNetProfit,
        debt
      };

      setMonthlyTargetData(monthlyTargetData);

      // 3. Cargar datos de payment status
      const paymentComparison = await fetchPaymentStatusWithComparison(year, week);
      setPaymentStatusData(paymentComparison);

      // 4. Cargar estadísticas de clientes
      const clientComparison = await fetchClientStatsWithComparison(year, week);
      setClientStats(clientComparison);

      // 5. ACTUALIZADO: Crear statsData con todos los datos
      const realStatsData: StatItem[] = [
        {
          label: 'Total Orders (Week)',
          value: currentStats.totalOrders,
          change: comparison.totalOrdersChange,
          icon: 'fa-box',
          color: 'green'
        },
        {
          label: 'Avg Orders/Day',
          value: currentStats.averagePerDay,
          change: comparison.averagePerDayChange,
          icon: 'fa-chart-line',
          color: 'blue'
        },
        {
          label: 'Peak Day Orders',
          value: currentStats.peakDay?.count || 0,
          change: comparison.peakDayChange,
          icon: 'fa-arrow-up',
          color: 'purple'
        },
        {
          label: 'Active Days (Week)',
          value: currentStats.daysWithOrders,
          change: comparison.activeDaysChange,
          icon: 'fa-calendar-check',
          color: 'orange'
        },
        {
          label: 'Unique Clients',
          value: clientComparison.currentStats.totalClients,
          change: clientComparison.changes.totalClientsChange,
          icon: 'fa-users',
          color: 'blue'
        },
        {
          label: 'Customer Factories',
          value: clientComparison.currentStats.totalFactories,
          change: clientComparison.changes.totalFactoriesChange,
          icon: 'fa-industry',
          color: 'red'
        }
      ];

      setStatsData(realStatsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading statistics');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [getWeekRange, activeSection]);

  // NUEVO: Handler para navegar a la página de breakdown
  const handleOrderCardClick = () => {
    navigate(`/order-breakdown?year=${selectedYear}&week=${selectedWeek}`);
  };

  useEffect(() => {
    loadStatistics(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear, loadStatistics]);

  const handleWeekChange = (week: number) => {
    if (week >= 1 && week <= 53) {
      setSelectedWeek(week);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const weekRange = getWeekRange(selectedYear, selectedWeek);
  const availableYears = getAvailableYears();

  if (error && activeSection === 'overview') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Statistics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadStatistics(selectedWeek, selectedYear)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Título principal */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Statistics Dashboard</h1>
        <p className="text-gray-600">Monitor your business performance and key metrics</p>
      </div>

      {/* NUEVO: Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          {/* Tabs de navegación */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                activeSection === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fas fa-chart-line mr-2"></i>
              Business Overview
            </button>
            <button
              onClick={() => setActiveSection('trucks')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                activeSection === 'trucks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fas fa-truck mr-2"></i>
              Vehicle Logistics
            </button>
            <button
              onClick={() => setActiveSection('payroll')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                activeSection === 'payroll'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fas fa-users mr-2"></i>
              Payroll Analytics
            </button>
          </div>

          {/* Info del período (solo para overview) */}
          {activeSection === 'overview' && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <i className="fas fa-calendar-alt"></i>
                Period: {weekRange.start} → {weekRange.end}
              </span>
              <span className="flex items-center gap-2 text-blue-600">
                <i className="fas fa-chart-line"></i>
                vs Previous Week
              </span>
              <button
                onClick={() => loadStatistics(selectedWeek, selectedYear)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Filtros solo para overview */}
        {activeSection === 'overview' && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Week:</label>
              <input
                type="number"
                min="1"
                max="53"
                value={selectedWeek}
                onChange={(e) => handleWeekChange(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content basado en la sección activa */}
      {activeSection === 'overview' && (
        <>
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <i className="fas fa-spinner animate-spin text-blue-600 text-xl"></i>
                <span className="text-gray-600">Loading statistics...</span>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="flex justify-center">
                  <MonthlyTargetCard
                    percent={monthlyTargetData.percent}
                    change={monthlyTargetData.change}
                    target={monthlyTargetData.target}
                    revenue={monthlyTargetData.revenue}
                    today={monthlyTargetData.today}
                    totalExpenses={monthlyTargetData.totalExpenses}
                    grandTotal={monthlyTargetData.grandTotal}
                    previousExpenses={monthlyTargetData.previousExpenses}
                    previousGrandTotal={monthlyTargetData.previousGrandTotal}
                  />
                </div>

                <div className="xl:col-span-1">
                  <StatsComparisonCard
                    title="Business Metrics"
                    stats={statsData}
                    onStatClick={handleOrderCardClick}
                  />
                </div>

                {/* Payment Status Chart - ocupa toda la fila */}
                <div className="xl:col-span-2">
                  <PaymentStatusChart
                    currentStats={paymentStatusData.currentStats}
                    previousStats={paymentStatusData.previousStats}
                    changes={paymentStatusData.changes}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Paid/Unpaid Week Range Chart - Sección adicional */}
              <div className="mt-8">
                <PaidUnpaidWeekRangeChart
                  initialYear={selectedYear}
                  initialStartWeek={Math.max(1, selectedWeek - 5)}
                  initialEndWeek={Math.min(53, selectedWeek + 5)}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Trucks Section */}
      {activeSection === 'trucks' && (
        <TruckStatistics
          initialWeek={selectedWeek}
          initialYear={selectedYear}
        />
      )}

      {/* Payroll Section */}
      {activeSection === 'payroll' && (
        <PayrollStatistics />
      )}
        
    </div>
  );
};

export default Statistics;