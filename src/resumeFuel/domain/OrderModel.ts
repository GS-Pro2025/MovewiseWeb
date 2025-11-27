import { Person } from './PersonModel';
import { FuelCost } from './FuelCostModel';
import { PaginatedResult } from '../../models/PaginatedResult';

export interface Order {
    key: string;
    key_ref: string;
    date: string;
    distance: number | null;
    weight: number | null; // Cambiar de string a number
    status: string;
    state_usa: string;
    person: Person;
    job: number;
    job_name: string;
    fuelCost: FuelCost[];
}

export type PaginatedOrderResult = PaginatedResult<Order>;