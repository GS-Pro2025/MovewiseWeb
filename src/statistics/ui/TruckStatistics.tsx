import { useState, useEffect, useCallback } from 'react';
import { fetchTrucksList, fetchTruckWeeklySummary } from '../data/repositoryTruck';
import { Truck } from '../domain/TruckModels';

interface TruckWeeklyStats {
  truckId: number;
  truckName: string;
  truckNumber: string;
  truckType: string;
  totalCost: number;
  totalFuel: number;
  totalDistance: number;
  ordersCount: number;
  isActive: boolean;
  costPerKm: number;
  efficiency: 'high' | 'medium' | 'low';
}

interface WeeklyOverviewStats {
  totalVehiclesUsed: number;
  totalVehiclesAvailable: number;
  totalWeeklyCost: number;
  totalWeeklyFuel: number;
  totalWeeklyDistance: number;
  totalWeeklyOrders: number;
  averageCostPerVehicle: number;
  averageCostPerKm: number;
  utilizationRate: number; // % de vehículos utilizados
  trucksData: TruckWeeklyStats[];
}

interface TruckStatisticsProps {
  initialWeek?: number;
  initialYear?: number;
}

const TruckStatistics: React.FC<TruckStatisticsProps> = ({
  initialWeek,
  initialYear
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    if (initialWeek) return initialWeek;
    const now = new Date();
    return getWeekOfYear(now);
  });
  
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return initialYear || new Date().getFullYear();
  });

  // Estados para datos
  const [weeklyStats, setWeeklyStats] = useState<WeeklyOverviewStats | null>(null);
  const [availableTrucks, setAvailableTrucks] = useState<Truck[]>([]);
  console.log('TruckStatistics component initialized', availableTrucks)
  // Función helper para obtener semana del año
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

  // Función para determinar eficiencia basada en costo por km
  const getEfficiencyLevel = (costPerKm: number): 'high' | 'medium' | 'low' => {
    if (costPerKm === 0) return 'medium';
    if (costPerKm < 0.5) return 'high';
    if (costPerKm < 1.0) return 'medium';
    return 'low';
  };

  // Función principal para cargar estadísticas semanales
  const loadWeeklyTruckStats = useCallback(async (week: number, year: number) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Loading truck statistics for week ${week} of ${year}`);

      // 1. Obtener lista de todos los trucks disponibles
      const allTrucks = await fetchTrucksList();
      setAvailableTrucks(allTrucks);
      console.log('Available trucks:', allTrucks);

      // 2. Obtener datos semanales de cada truck en paralelo
      const truckStatsPromises = allTrucks.map(async (truck) => {
        try {
          const truckData = await fetchTruckWeeklySummary(truck.id_truck, year);
          
          // Buscar datos de la semana específica
          const weekData = truckData.weekly_data.find(w => w.week_number === week);
          
          if (weekData) {
            // Truck activo en esta semana
            const costPerKm = weekData.total_distance > 0 
              ? weekData.total_cost / weekData.total_distance 
              : 0;

            return {
              truckId: truck.id_truck,
              truckName: truck.name,
              truckNumber: truck.number_truck,
              truckType: truck.type,
              totalCost: weekData.total_cost,
              totalFuel: weekData.total_fuel_qty,
              totalDistance: weekData.total_distance,
              ordersCount: weekData.orders.length,
              isActive: true,
              costPerKm: Number(costPerKm.toFixed(4)),
              efficiency: getEfficiencyLevel(costPerKm)
            } as TruckWeeklyStats;
          } else {
            // Truck no activo en esta semana
            return {
              truckId: truck.id_truck,
              truckName: truck.name,
              truckNumber: truck.number_truck,
              truckType: truck.type,
              totalCost: 0,
              totalFuel: 0,
              totalDistance: 0,
              ordersCount: 0,
              isActive: false,
              costPerKm: 0,
              efficiency: 'medium' as const
            } as TruckWeeklyStats;
          }
        } catch (truckError) {
          console.error(`Error loading data for truck ${truck.id_truck}:`, truckError);
          // Retornar truck inactivo si hay error
          return {
            truckId: truck.id_truck,
            truckName: truck.name,
            truckNumber: truck.number_truck,
            truckType: truck.type,
            totalCost: 0,
            totalFuel: 0,
            totalDistance: 0,
            ordersCount: 0,
            isActive: false,
            costPerKm: 0,
            efficiency: 'medium' as const
          } as TruckWeeklyStats;
        }
      });

      const allTruckStats = await Promise.all(truckStatsPromises);

      // 3. Calcular estadísticas generales
      const activeTrucks = allTruckStats.filter(truck => truck.isActive);
      const totalVehiclesUsed = activeTrucks.length;
      const totalVehiclesAvailable = allTrucks.length;
      
      const totalWeeklyCost = activeTrucks.reduce((sum, truck) => sum + truck.totalCost, 0);
      const totalWeeklyFuel = activeTrucks.reduce((sum, truck) => sum + truck.totalFuel, 0);
      const totalWeeklyDistance = activeTrucks.reduce((sum, truck) => sum + truck.totalDistance, 0);
      const totalWeeklyOrders = activeTrucks.reduce((sum, truck) => sum + truck.ordersCount, 0);

      const averageCostPerVehicle = totalVehiclesUsed > 0 ? totalWeeklyCost / totalVehiclesUsed : 0;
      const averageCostPerKm = totalWeeklyDistance > 0 ? totalWeeklyCost / totalWeeklyDistance : 0;
      const utilizationRate = totalVehiclesAvailable > 0 
        ? (totalVehiclesUsed / totalVehiclesAvailable) * 100 
        : 0;

      const overview: WeeklyOverviewStats = {
        totalVehiclesUsed,
        totalVehiclesAvailable,
        totalWeeklyCost: Number(totalWeeklyCost.toFixed(2)),
        totalWeeklyFuel: Number(totalWeeklyFuel.toFixed(2)),
        totalWeeklyDistance: Number(totalWeeklyDistance.toFixed(2)),
        totalWeeklyOrders,
        averageCostPerVehicle: Number(averageCostPerVehicle.toFixed(2)),
        averageCostPerKm: Number(averageCostPerKm.toFixed(4)),
        utilizationRate: Number(utilizationRate.toFixed(1)),
        trucksData: allTruckStats.sort((a, b) => b.totalCost - a.totalCost) // Ordenar por costo descendente
      };

      setWeeklyStats(overview);
      console.log('Weekly truck stats loaded:', overview);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading truck statistics');
      console.error('Error loading truck statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    loadWeeklyTruckStats(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear, loadWeeklyTruckStats]);

  // Handlers para filtros
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

  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Truck Statistics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadWeeklyTruckStats(selectedWeek, selectedYear)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título y filtros */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Weekly Vehicle Logistics</h2>
            <p className="text-gray-600">Monitor vehicle usage and operational costs</p>
          </div>

          {/* Filtros */}
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

            <button
              onClick={() => loadWeeklyTruckStats(selectedWeek, selectedYear)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Información del período */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <i className="fas fa-calendar-alt"></i>
            Period: {weekRange.start} → {weekRange.end}
          </span>
          <span className="flex items-center gap-2">
            <i className="fas fa-truck"></i>
            Week {selectedWeek} of {selectedYear}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <i className="fas fa-spinner animate-spin text-blue-600 text-xl"></i>
            <span className="text-gray-600">Loading vehicle statistics...</span>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {!loading && weeklyStats && (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total vehículos utilizados */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Vehicles Used</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {weeklyStats.totalVehiclesUsed}
                    <span className="text-lg text-gray-500">/{weeklyStats.totalVehiclesAvailable}</span>
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {weeklyStats.utilizationRate}% utilization
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <i className="fas fa-truck text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>

            {/* Gastos totales */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Weekly Cost</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {formatCurrency(weeklyStats.totalWeeklyCost)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {formatCurrency(weeklyStats.averageCostPerVehicle)}/vehicle avg
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
                </div>
              </div>
            </div>

            {/* Órdenes atendidas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Orders Delivered</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {weeklyStats.totalWeeklyOrders}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    {weeklyStats.totalVehiclesUsed > 0 
                      ? (weeklyStats.totalWeeklyOrders / weeklyStats.totalVehiclesUsed).toFixed(1)
                      : 0} orders/vehicle
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <i className="fas fa-box text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>

            {/* Eficiencia */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Cost Efficiency</p>
                  <p className="text-3xl font-bold text-gray-800">
                    ${weeklyStats.averageCostPerKm.toFixed(2)}
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    per km average
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <i className="fas fa-chart-line text-orange-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de vehículos ACTUALIZADA */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Vehicle Performance Details</h3>
              <p className="text-sm text-gray-600">Detailed breakdown by vehicle</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Distance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {weeklyStats.trucksData.map((truck) => (
                    <tr key={truck.truckId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-lg mr-3">
                            <i className="fas fa-truck text-gray-600"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{truck.truckName}</div>
                            <div className="text-sm text-gray-500">{truck.truckNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {truck.truckType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          truck.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {truck.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(truck.totalCost)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {truck.totalDistance.toFixed(1)} km
                      </td>
                      <td className="px-6 py-4 text-right">
                        {truck.ordersCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm">${truck.costPerKm.toFixed(2)}/km</span>
                          <span className={`w-2 h-2 rounded-full ${
                            truck.efficiency === 'high' ? 'bg-green-500' :
                            truck.efficiency === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TruckStatistics;