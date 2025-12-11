import { useState, useEffect, useCallback } from 'react';
import { fetchTrucksList, fetchTruckWeeklyData } from '../data/repositoryTruck';
import { Truck } from '../domain/TruckModels';
import { CreateTruckDialog } from './components/CreateTruckDialog';
import { TruckContextMenu } from './components/TruckContextMenu';
import LoaderSpinner from "../../components/Login_Register/LoadingSpinner";
import YearPicker from "../../components/YearPicker";
import WeekPicker from "../../components/WeekPicker";
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
  console.log("availableTrucks", availableTrucks);
  // Nuevos estados para gestión de trucks
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
    truck: TruckWeeklyStats | null;
  }>({
    show: false,
    position: { x: 0, y: 0 },
    truck: null
  });

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
      
      // Actualizar solo si los trucks han cambiado
      setAvailableTrucks(prevTrucks => {
        if (JSON.stringify(prevTrucks) !== JSON.stringify(allTrucks)) {
          return allTrucks;
        }
        return prevTrucks;
      });

      console.log('Available trucks:', allTrucks);

      // 2. Obtener datos semanales de cada truck en paralelo
      const truckStatsPromises = allTrucks.map(async (truck) => {
        try {
          // Pasar el week al repositorio
          const weeklyData = await fetchTruckWeeklyData(truck.id_truck, year, week);
          
          console.log(`Truck ${truck.id_truck} weekly data:`, weeklyData);
          
          // Buscar datos de la semana específica en el array
          const weekData = weeklyData.find(w => w.week === week);
          
          if (weekData) {
            // Truck activo en esta semana
            const totalCost = weekData.total_cost_fuel + weekData.total_cost_gl;
            const costPerKm = weekData.total_distance > 0 
              ? totalCost / weekData.total_distance 
              : 0;

            return {
              truckId: truck.id_truck,
              truckName: truck.name,
              truckNumber: truck.number_truck,
              truckType: truck.type,
              totalCost: Number(totalCost.toFixed(2)),
              totalFuel: Number(weekData.total_fuel_qty.toFixed(2)),
              totalDistance: Number(weekData.total_distance.toFixed(2)),
              ordersCount: weekData.records_count,
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
        trucksData: allTruckStats.sort((a, b) => b.totalCost - a.totalCost)
      };

      setWeeklyStats(overview);
      console.log(' Weekly truck stats loaded:', overview);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading truck statistics');
      console.error('Error loading truck statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Dependencias vacías para evitar re-renders

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    loadWeeklyTruckStats(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear, loadWeeklyTruckStats]);

  // Cerrar menú contextual al hacer click fuera - MOVER AQUÍ ARRIBA
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  // Handlers para filtros
  const handleWeekChange = (week: number) => {
    if (week >= 1 && week <= 53) {
      setSelectedWeek(week);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
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

  // Función para manejar click derecho en truck
  const handleTruckRightClick = (e: React.MouseEvent, truck: TruckWeeklyStats) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      position: { x: e.clientX, y: e.clientY },
      truck
    });
  };

  // Función para cerrar menú contextual
  const closeContextMenu = () => {
    setContextMenu({ show: false, position: { x: 0, y: 0 }, truck: null });
  };

  // Función cuando se crea un truck
  const handleTruckCreated = (truck: Truck) => {
    console.log("truck created", truck);
    // Recargar estadísticas
    loadWeeklyTruckStats(selectedWeek, selectedYear);
  };

  // Función cuando se actualiza un truck
  const handleTruckUpdated = (truck: Truck) => {
    console.log("truck updated", truck);
    // Recargar estadísticas
    loadWeeklyTruckStats(selectedWeek, selectedYear);
  };

  // Función cuando se elimina un truck
  const handleTruckDeleted = (truckId: number) => {
    console.log("truck deleted", truckId);
    loadWeeklyTruckStats(selectedWeek, selectedYear);
  };

  const weekRange = getWeekRange(selectedYear, selectedWeek);

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
      {/* Título y filtros - ACTUALIZADO */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Weekly Vehicle Logistics</h2>
            <p className="text-gray-600">Monitor vehicle usage and operational costs</p>
          </div>

          {/* Filtros y botón Add Truck */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              <i className="fas fa-plus"></i>
              Add Truck
            </button>

            {/* Year Picker */}
            <div style={{ minWidth: 140 }}>
              <YearPicker
                year={selectedYear}
                onYearSelect={handleYearChange}
                min={2020}
                max={new Date().getFullYear() + 1}
              />
            </div>

            {/* Week Picker */}
            <div style={{ minWidth: 140 }}>
              <WeekPicker
                week={selectedWeek}
                onWeekSelect={handleWeekChange}
                min={1}
                max={53}
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

      {/* Loading state - UPDATED to use LoaderSpinner */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <LoaderSpinner />
            <span className="text-gray-600 font-medium">Loading vehicle statistics...</span>
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

          {/* Tabla de vehículos - ACTUALIZADA con click derecho */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Vehicle Performance Details</h3>
              <p className="text-sm text-gray-600">Detailed breakdown by vehicle (right-click for options)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Distance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {weeklyStats.trucksData.map((truck) => (
                    <tr 
                      key={truck.truckId} 
                      className="hover:bg-gray-50 cursor-context-menu"
                      onContextMenu={(e) => handleTruckRightClick(e, truck)}
                    >
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

      {/* Dialogs */}
      <CreateTruckDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onTruckCreated={handleTruckCreated}
      />

      {contextMenu.show && contextMenu.truck && (
        <TruckContextMenu
          truck={contextMenu.truck}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onTruckUpdated={handleTruckUpdated}
          onTruckDeleted={handleTruckDeleted}
        />
      )}
    </div>
  );
};

export default TruckStatistics;