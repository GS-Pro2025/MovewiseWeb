// NUEVOS MODELOS PARA EL ENDPOINT DE TRUCKS
export interface Truck {
  id_truck: number;
  number_truck: string;
  type: string;
  name: string;
  status: boolean;
  category: string;
}

export interface TrucksListData {
  status: string;
  messDev: string;
  messUser: string;
  data: Truck[];
}

export interface TrucksListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TrucksListData;
  current_company_id: number;
}

// MODELOS EXISTENTES PARA WEEKLY SUMMARY
export interface WeeklyTruckData {
  week_number: number;
  week_start: string;
  week_end: string;
  total_cost: number;
  total_fuel_qty: number;
  total_distance: number;
  record_count: number;
  orders: string[];
}

export interface AnnualTruckTotals {
  total_cost: number;
  total_fuel_qty: number;
  total_distance: number;
  total_records: number;
  weeks_with_data: number;
}

export interface TruckWeeklySummaryData {
  year: number;
  truck_id: number;
  annual_totals: AnnualTruckTotals;
  weekly_data: WeeklyTruckData[];
}

export interface TruckWeeklySummaryResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: TruckWeeklySummaryData;
}

// MODELOS PARA BY-TRUCK-WEEK
export interface WeekInfo {
  week_number: number;
  year: number;
  week_start: string;
  week_end: string;
  order_date: string;
}

export interface FuelRecord {
  id_fuel: number;
  order: string;
  truck: number;
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  distance: number;
  week_info: WeekInfo;
}

export interface WeeklySummaryItem {
  week_number: number;
  week_start: string;
  week_end: string;
  total_cost: number;
  total_fuel_qty: number;
  total_distance: number;
  record_count: number;
  orders: string[];
}

export interface TruckByWeekSummary {
  year: number;
  truck_id: number;
  total_records: number;
  weekly_summary: WeeklySummaryItem[];
}

export interface TruckByWeekData {
  status: string;
  messDev: string;
  messUser: string;
  summary: TruckByWeekSummary;
  data: FuelRecord[];
}

export interface TruckByWeekResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TruckByWeekData;
}

// MODELOS PARA ESTADÍSTICAS PROCESADAS
export interface TruckBasicInfo {
  id: number;
  name: string;
  number: string;
  type: string;
  category: string;
  status: boolean;
}

export interface TruckStats {
  truckId: number;
  truckName: string;
  year: number;
  
  // Datos anuales
  annualTotalCost: number;
  annualTotalFuel: number;
  annualTotalDistance: number;
  annualTotalRecords: number;
  weeksWithData: number;
  
  // Promedios
  averageCostPerWeek: number;
  averageFuelPerWeek: number;
  averageDistancePerWeek: number;
  averageOrdersPerWeek: number;
  
  // Eficiencia
  costPerKm: number;
  fuelPerKm: number;
  
  // Datos semanales completos
  weeklyData: WeeklyTruckData[];
}

export interface TrucksComparisonStats {
  totalTrucks: number;
  activeTrucks: number;
  
  // Totales globales
  totalCost: number;
  totalFuel: number;
  totalDistance: number;
  totalOrders: number;
  
  // Promedios globales
  averageCostPerTruck: number;
  averageFuelPerTruck: number;
  averageDistancePerTruck: number;
  
  // Rankings
  topTruckByCost: TruckStats | null;
  topTruckByDistance: TruckStats | null;
  topTruckByEfficiency: TruckStats | null;
  
  // Lista de todos los trucks
  trucksData: TruckStats[];
}

export interface TruckStatsFilters {
  year: number;
  truckId?: number;
  location?: string;
  weekStart?: number;
  weekEnd?: number;
}