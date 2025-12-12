import { ExtraCostResponse } from '../domain/ExtraCostModel';
import Cookies from 'js-cookie';

export interface ExtraCostParams {
    page?: number;
    pageSize?: number;
    mode?: 'single_week' | 'week_range';
    numberWeek?: number;
    startWeek?: number;
    endWeek?: number;
    year?: number;
    search?: string;
}

export interface ExtraCostRepositoryInterface {
    getExtraCosts(params: ExtraCostParams): Promise<ExtraCostResponse>;
}

export class ExtraCostRepository implements ExtraCostRepositoryInterface {
    private baseUrl: string =
        import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

    async getExtraCosts(params: ExtraCostParams): Promise<ExtraCostResponse> {
        const token = Cookies.get('authToken');
        
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        // Construir query params
        const queryParams = new URLSearchParams();
        
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('page_size', params.pageSize.toString());
        if (params.mode !== undefined) queryParams.append('mode', params.mode);
        if (params.numberWeek !== undefined) queryParams.append('number_week', params.numberWeek.toString());
        if (params.startWeek !== undefined) queryParams.append('start_week', params.startWeek.toString());
        if (params.endWeek !== undefined) queryParams.append('end_week', params.endWeek.toString());
        if (params.year !== undefined) queryParams.append('year', params.year.toString());
        if (params.search !== undefined) queryParams.append('search', params.search);

        try {
            const response = await fetch(`${this.baseUrl}/workcost-with-orders/?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 403) {
                Cookies.remove('authToken');
                window.location.href = '/login';
                throw new Error('Sesión expirada');
            }

            if (!response.ok) {
                throw new Error('Error al obtener los datos');
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error en la solicitud');
        }
    }
}