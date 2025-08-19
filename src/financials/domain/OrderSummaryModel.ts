import { Summary } from './SummaryModel';
import { PaginatedResult } from '../../models/PaginatedResult';

export interface OrderSummary {
    key: string;
    key_ref: string;
    client: string;
    date: string;
    state: string;
    income: number;
    payStatus: number;
    location: string;
    job: string;
    weight: number;
    summary: Summary;
}

export type PaginatedOrderSummaryResult = PaginatedResult<OrderSummary>;