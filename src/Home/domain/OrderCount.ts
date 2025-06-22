export interface OrderCountPerDay {
  date: string;
  count: number;
}

export interface OrderCountPerDayResponse {
  messUser: string;
  messDev: string;
  data: OrderCountPerDay[];
}