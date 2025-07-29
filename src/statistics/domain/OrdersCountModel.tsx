// Modelo para un día específico con su conteo
export interface OrderCountDay {
  date: string; // formato: "YYYY-MM-DD"
  count: number;
}

// NUEVA: Modelo para la información del filtro
export interface OrdersCountFilter {
  type: "week" | "month";
  year: number;
  week?: number;
  month?: number;
  start_date: string;
  end_date: string;
}

// ACTUALIZADA: Modelo para la respuesta completa del API
export interface OrdersCountResponse {
  messUser: string;
  messDev: string;
  filter: OrdersCountFilter; 
  data: OrderCountDay[];
}

// Modelo para estadísticas procesadas 
export interface OrdersCountStats {
  totalOrders: number;
  averagePerDay: number;
  peakDay: OrderCountDay | null;
  lowDay: OrderCountDay | null;
  daysWithOrders: number;
  totalDaysInPeriod: number;
}