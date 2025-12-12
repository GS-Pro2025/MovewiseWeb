import { PaginatedOrderResult } from "../domain/OrderModel";
import { fetchWithAuth } from '../../service/authService';

export interface ResumeFuelParams {
    page?: number;
    pageSize?: number;
    mode?: 'single_week' | 'week_range';
    numberWeek?: number;
    startWeek?: number;
    endWeek?: number;
    year?: number;
    search?: string;
}

export interface ResumeFuelRepositoryInterface {
    getResumeFuel(params: ResumeFuelParams): Promise<PaginatedOrderResult>;
}

export class ResumeFuelRepository implements ResumeFuelRepositoryInterface {
    private baseUrl: string = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

    async getResumeFuel(params: ResumeFuelParams): Promise<PaginatedOrderResult> {
        // Build query params
        const queryParams = new URLSearchParams();
        
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('page_size', params.pageSize.toString());
        if (params.year !== undefined) queryParams.append('year', params.year.toString());
        if (params.mode !== undefined) queryParams.append('mode', params.mode);
        if (params.numberWeek !== undefined) queryParams.append('number_week', params.numberWeek.toString());
        if (params.startWeek !== undefined) queryParams.append('start_week', params.startWeek.toString());
        if (params.endWeek !== undefined) queryParams.append('end_week', params.endWeek.toString());
        if (params.search !== undefined) queryParams.append('search', params.search);

        try {
            const response = await fetchWithAuth(
                `${this.baseUrl}/orders-with-costFuel/?${queryParams.toString()}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Normalize response: backend returns { status, ..., data: { count, results, ... } }
            const body = await response.json().catch(() => null);
            if (!body) throw new Error('Empty response body from orders-with-costFuel');
            
            // If wrapped in "data", return data (paginated)
            if (body.data && (body.data.results || body.data.count !== undefined)) {
                return body.data as PaginatedOrderResult;
            }

            // If the API already returned the paginated data at root level
            if (body.results || body.count !== undefined) {
                return body as PaginatedOrderResult;
            }

            // Unexpected format: throw to detect during development
            throw new Error('Unexpected response shape from orders-with-costFuel');
        } catch (error) {
            console.error('Error in getResumeFuel:', error);
            throw error;
        }
    }
}