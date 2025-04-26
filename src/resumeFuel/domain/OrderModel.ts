import { Person } from './PersonModel';
import { FuelCost } from './FuelCostModel';
import { PaginatedResult } from '../../models/PaginatedResult';

export interface Order {
    key: string;
    key_ref: string;
    date: string;
    distance: number | null;
    weight: string;
    status: string;
    state_usa: string;
    person: Person;
    job: number;
    fuelCost: FuelCost[];
}
// Tipo específico para la paginación de órdenes
export type PaginatedOrderResult = PaginatedResult<Order>;