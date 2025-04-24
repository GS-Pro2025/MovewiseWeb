import { PaginatedResult } from "../../models/PaginatedResult";
import { Person } from "./PersonModel";

export interface OrderResult {
    key: string;
    key_ref: string;
    date: string;
    distance: number | null;
    weight: string;
    status: string;
    state_usa: string;
    person: Person;
    job: number;
    fuelCost: any[];
}
// Tipo específico para la paginación de órdenes
export type PaginatedOrderResult = PaginatedResult<OrderResult>;