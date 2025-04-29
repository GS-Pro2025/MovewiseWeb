import { Summary } from './SummaryModel';
import { PaginatedResult } from '../../models/PaginatedResult';

export interface OrderSummary {
    key: string;
    key_ref: string;
    client: string;
    date: string;
    state: string;
    summary: Summary;
}

export type PaginatedOrderSummaryResult = PaginatedResult<OrderSummary>;