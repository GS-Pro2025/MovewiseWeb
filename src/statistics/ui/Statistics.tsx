import { useState, useEffect, useCallback } from 'react';
import MonthlyTargetCard from './components/MonthlyTargetCard';
import StatsComparisonCard from './components/StatsComparisonCard';
import { fetchOrdersCountWithComparison } from '../data/repositoryStatistics';
import { OrdersCountStats } from '../domain/OrdersCountModel';

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
}

const Statistics = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros de semana y año
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const now = new Date();
    return getWeekOfYear(now);
  });
  
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  // Estados para los datos
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [monthlyTargetData, setMonthlyTargetData] = useState<MonthlyTargetData>({
    percent: 75.55,
    change: 10,
    target: "$20K",
    revenue: "$20K",
    today: "$3287"
  });
  const [ordersCountStats, setOrdersCountStats] = useState<OrdersCountStats | null>(null);
  console.log('Orders Count Stats:', ordersCountStats);
  // Función para obtener la semana del año (ISO)
  function getWeekOfYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const yearStartDayNum = yearStart.getUTCDay() || 7;
    yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // Función para obtener el rango de fechas de una semana
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

  // Función para cargar estadísticas CON COMPARACIÓN
  const loadStatistics = useCallback(async (week: number, year: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const weekRange = getWeekRange(year, week);
      console.log(`Loading statistics for week ${week} of ${year}:`, weekRange);
      
      //z Llamada con comparación del mes anterior
      const { currentStats, previousStats, comparison } = 
        await fetchOrdersCountWithComparison(year, week);
      
      console.log('Current month stats:', currentStats);
      console.log('Previous month stats:', previousStats);
      console.log('Comparison:', comparison);
      
      setOrdersCountStats(currentStats);
      
      const realStatsData: StatItem[] = [
        {
          label: 'Total Orders (Month)',
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
          label: 'Active Days (Month)',
          value: currentStats.daysWithOrders,
          change: comparison.activeDaysChange, 
          icon: 'fa-calendar-check',
          color: 'orange'
        },
      ];

      setStatsData(realStatsData);
      
      // Mantener datos mock para Monthly Target por ahora
      const mockMonthlyTarget: MonthlyTargetData = {
        percent: Number((Math.random() * 30 + 60).toFixed(2)),
        change: Number(((Math.random() - 0.5) * 20).toFixed(1)),
        target: "$20K",
        revenue: `$${(Math.random() * 5 + 18).toFixed(1)}K`,
        today: `$${(Math.random() * 2000 + 2000).toFixed(0)}`
      };

      setMonthlyTargetData(mockMonthlyTarget);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading statistics');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [getWeekRange]);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    loadStatistics(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear, loadStatistics]);

  // Handlers para cambiar filtros
  const handleWeekChange = (week: number) => {
    if (week >= 1 && week <= 53) {
      setSelectedWeek(week);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  // Función para obtener años disponibles
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

  if (error) {
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

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <i className="fas fa-calendar-alt"></i>
              Period: {weekRange.start} → {weekRange.end}
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
        </div>
      </div>

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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Monthly Target Card */}
          <div className="flex justify-center">
            <MonthlyTargetCard
              percent={monthlyTargetData.percent}
              change={monthlyTargetData.change}
              target={monthlyTargetData.target}
              revenue={monthlyTargetData.revenue}
              today={monthlyTargetData.today}
            />
          </div>

          {/* Stats Comparison */}
          <div className="xl:col-span-1">
            <StatsComparisonCard
              title="Business Metrics"
              stats={statsData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;