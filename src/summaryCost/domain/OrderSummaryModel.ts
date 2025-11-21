import { Summary } from './SummaryModel';
import { PaginatedResult } from '../../models/PaginatedResult';

export interface OrderSummary {
    key: string;
    key_ref: string;
    client: string;
    // Campo adicional devuelto por el endpoint
    customer_name?: string;
    // Id de la fábrica que también llega en la respuesta
    customer_factory_id?: number;
    date: string;
    state: string;
    status?: string;
    payStatus?: number | null;
    income?: number | null;
    // mantengo summary con los nuevos campos opcionales
    summary: Summary;
    // otros campos opcionales que podrían aparecer
    // location?: string;
    // job?: string;
    // weight?: number;
}

export type PaginatedOrderSummaryResult = PaginatedResult<OrderSummary>;