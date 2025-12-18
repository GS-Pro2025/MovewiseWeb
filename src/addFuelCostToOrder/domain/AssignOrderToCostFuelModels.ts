// Request model for assigning an order to an existing CostFuel
export interface AssignOrderToCostFuelRequest {
  order_key: string;
  assigned_date?: string; // opcional, formato YYYY-MM-DD
}

// Response model
export interface AssignOrderToCostFuelResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  data: CostFuelDetailData;
}

export interface CostFuelDetailData {
  id_fuel: number;
  orders: OrderInCostFuel[];
  truck: TruckInfo;
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  distance: number;
  date: string;
  image: string | null;
  image_url: string | null;
  order_cost_fuels: OrderCostFuelDetail[];
  orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderInCostFuel {
  key: string;
  key_ref: string;
  date: string;
  distance: number | null;
  expense: number | null;
  income: number | null;
  weight: string | null;
  status: string;
  payStatus: number;
  evidence: string | null;
  dispatch_ticket: string | null;
  dispatch_ticket_url: string | null;
  state_usa: string | null;
  person: PersonInfo;
  job: number;
  job_name: string;
  customer_factory: number;
  customer_factory_name: string;
  created_by: string | null;
}

export interface PersonInfo {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}

export interface TruckInfo {
  id_truck: number;
  number_truck: string;
  type: string;
  name: string;
  status: boolean;
  category: string;
}

export interface OrderCostFuelDetail {
  id: number;
  order: string;
  order_key: string;
  cost_fuel: number;
  cost_fuel_distributed: number;
  fuel_qty_distributed: number;
  distance_distributed: number;
  assigned_date: string;
  created_at: string;
}

// Models para endpoint de CostFuels recientes por truck
export interface RecentCostFuelByTruckResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  pagination: PaginationInfo;
  data: RecentCostFuelData[];
}

export interface PaginationInfo {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export interface RecentCostFuelData {
  id_fuel: number;
  truck: TruckInfo;
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  distance: number;
  date: string;
  image_url: string | null;
  order_cost_fuels: OrderCostFuelRecentDetail[];
  orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderCostFuelRecentDetail {
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

// Models para endpoint de CostFuels por orden
export interface CostFuelsByOrderResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  data: CostFuelByOrderData[];
}

export interface CostFuelByOrderData {
  id_fuel: number;
  truck: number;
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  distance: number;
  date: string;
  image: string | null;
  image_url: string | null;
  orders_count: number;
  created_at: string;
  updated_at: string;
  order_cost_fuels?: OrderCostFuelDetail[];
}