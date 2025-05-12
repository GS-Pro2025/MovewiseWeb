import { Order } from '../../resumeFuel/domain/OrderModel';

export interface ExtraCost {
    id_workCost: number;
    order: Order;
    name: string;
    cost: string;
    type: string;
    id_order: string;
}

export interface ExtraCostResponse {
    current_company_id: number;
    count: number;
    next: string | null;
    previous: string | null;
    results: {
        current_company_id: number;
        results: ExtraCost[];
    };
}