import { PaginatedOrderSummaryResult } from "../domain/OrderSummaryModel";
import Cookies from 'js-cookie';

export interface SummaryCostParams {
    page?: number;
    pageSize?: number;
    mode?: 'single_week' | 'week_range';
    numberWeek?: number;
    startWeek?: number;
    endWeek?: number;
    year?: number;
    onlyPaid?: boolean;
}

export interface SummaryCostRepositoryInterface {
    getSummaryCost(params: SummaryCostParams): Promise<PaginatedOrderSummaryResult>;
}

export class SummaryCostRepository implements SummaryCostRepositoryInterface {
    private baseUrl: string =
        import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

    async getSummaryCost(params: SummaryCostParams): Promise<PaginatedOrderSummaryResult> {
        const token = Cookies.get('authToken');
        
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        // Construir query params
        const queryParams = new URLSearchParams();
        
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('page_size', params.pageSize.toString());
        if (params.year !== undefined) queryParams.append('year', params.year.toString());
        if (params.mode !== undefined) queryParams.append('mode', params.mode);
        if (params.numberWeek !== undefined) queryParams.append('number_week', params.numberWeek.toString());
        if (params.startWeek !== undefined) queryParams.append('start_week', params.startWeek.toString());
        if (params.endWeek !== undefined) queryParams.append('end_week', params.endWeek.toString());

        // Always set only_paid to false as requested by backend contract
        queryParams.append('only_paid', String(params.onlyPaid === true));

        try {
            const response = await fetch(`${this.baseUrl}/summary-list/?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 403) {
                Cookies.remove('authToken');
                window.location.href = '/login';
                throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }

            if (!response.ok) {
                throw new Error('Error al obtener los datos');
            }

            const json = await response.json();
            // backend devuelve wrapper { status, messDev, data: { count, results... } }
            // devolvemos solo el objeto `data` que espera el frontend
            return json.data as PaginatedOrderSummaryResult;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error en la solicitud');
        }
    }
}