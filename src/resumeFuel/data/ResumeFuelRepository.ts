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
}

export interface ResumeFuelRepositoryInterface {
    getResumeFuel(params: ResumeFuelParams): Promise<PaginatedOrderResult>;
}

export class ResumeFuelRepository implements ResumeFuelRepositoryInterface {
    private baseUrl: string = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

    async getResumeFuel(params: ResumeFuelParams): Promise<PaginatedOrderResult> {
        // Construir query params
        const queryParams = new URLSearchParams();
        
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('page_size', params.pageSize.toString());
        if (params.year !== undefined) queryParams.append('year', params.year.toString());
        if (params.mode !== undefined) queryParams.append('mode', params.mode);
        if (params.numberWeek !== undefined) queryParams.append('number_week', params.numberWeek.toString());
        if (params.startWeek !== undefined) queryParams.append('start_week', params.startWeek.toString());
        if (params.endWeek !== undefined) queryParams.append('end_week', params.endWeek.toString());

        try {
            const response = await fetchWithAuth(
                `${this.baseUrl}/orders-with-costFuel/?${queryParams.toString()}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Normalizar respuesta: backend devuelve { status, ..., data: { count, results, ... } }
            const body = await response.json().catch(() => null);
            if (!body) throw new Error('Empty response body from orders-with-costFuel');
            
            // Si viene envuelto en "data", devolver data (paginado)
            if (body.data && (body.data.results || body.data.count !== undefined)) {
                return body.data as PaginatedOrderResult;
            }

            // Si la API ya devolvió el paginado en la raíz
            if (body.results || body.count !== undefined) {
                return body as PaginatedOrderResult;
            }

            // Forma inesperada: lanzar para detectar en front durante desarrollo
            throw new Error('Unexpected response shape from orders-with-costFuel');
        } catch (error) {
            console.error('Error in getResumeFuel:', error);
            throw error;
        }
    }
}