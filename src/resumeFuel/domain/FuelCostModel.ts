import { Truck } from './TruckModel';

export interface FuelCost {
    id_fuel: number;
    cost_fuel: number;
    cost_gl: number;
    fuel_qty: number;
    distance: number;
    truck: Truck;
}