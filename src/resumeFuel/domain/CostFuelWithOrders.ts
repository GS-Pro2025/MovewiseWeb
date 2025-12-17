import { Truck } from './TruckModel';

// Orden dentro de un CostFuel
export interface OrderCostFuel {
  id: number;
  order_key: string;
  order_key_ref: string;
  order_date: string;
  order_location: string | null;
  client_name: string;
  cost_fuel_distributed: number;
  fuel_qty_distributed: number;
  distance_distributed: number;
  assigned_date: string | null;
  created_at: string;
}

// CostFuel con sus órdenes relacionadas
export interface CostFuelWithOrders {
  id_fuel: number;
  truck: Truck;
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  distance: number;
  date: string;
  image_url: string | null;
  order_cost_fuels: OrderCostFuel[];
  orders_count: number;
  created_at: string;
  updated_at: string;
}

// Datos agrupados por semana
export interface WeekData {
  week: number;
  year: number;
  total_cost_fuels: number;
  showing: number;
  cost_fuels: CostFuelWithOrders[];
}

// Respuesta completa del API
export interface WeeklyFuelDataResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  filters: {
    year: number;
    week: number | null;
    truck_id: number | null;
    page_size_per_week: number;
  };
  total_weeks: number;
  data: WeekData[];
}
