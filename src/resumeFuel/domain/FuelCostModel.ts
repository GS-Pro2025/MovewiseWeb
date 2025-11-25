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
    created_at?: string;
    updated_at?: string;
}