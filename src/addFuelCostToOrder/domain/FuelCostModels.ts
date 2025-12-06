export interface FuelCostRequest {
  order: string;         // UUID
  truck: number;         // Truck ID
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  identifier_1: string;
  distance: number;
  image?: string;
}

export interface FuelCostResponse {
  id_fuel: number;
  order: string;
  truck: number;
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  identifier_1: string;
  distance: number;
  created_at?: string;
  updated_at?: string;
}