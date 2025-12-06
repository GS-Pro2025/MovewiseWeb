import { Truck } from './TruckModel';

export interface FuelCost {
    id_fuel: number;
    order: string;
    truck: Truck;
    cost_fuel: number;
    cost_gl: number;
    fuel_qty: number;
    identifier_1: string;
    distance: number;
    image: string | null;
    image_url: string | null;
    created_at?: string;
    updated_at?: string;
}