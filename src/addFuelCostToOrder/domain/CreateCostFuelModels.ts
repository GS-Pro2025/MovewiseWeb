/**
 * Modelos para crear un nuevo registro de costo de combustible
 */

export interface CreateCostFuelRequest {
  truck: number;
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  distance: number;
  date?: string; // Opcional, por defecto fecha actual
  orders?: string[]; // Opcional, array de order keys (UUIDs)
  image?: string; // Opcional, base64 string
}

export interface CreateCostFuelResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: {
    id_fuel: number;
    truck: number;
    cost_fuel: number;
    cost_gl: number;
    fuel_qty: number;
    distance: number;
    date: string;
    image_url?: string;
  };
}
