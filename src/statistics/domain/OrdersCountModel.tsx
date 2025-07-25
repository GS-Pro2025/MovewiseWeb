// Modelo para un día específico con su conteo
export interface OrderCountDay {
  date: string; // formato: "YYYY-MM-DD"
  count: number;
}

// Modelo para la respuesta completa del API
export interface OrdersCountResponse {
  messUser: string;
  messDev: string;
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