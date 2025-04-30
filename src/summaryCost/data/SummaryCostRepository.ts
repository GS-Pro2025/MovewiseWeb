import { PaginatedOrderSummaryResult } from "../domain/OrderSummaryModel";
import Cookies from 'js-cookie';

export interface SummaryCostRepositoryInterface {
    getSummaryCost(pages: number): Promise<PaginatedOrderSummaryResult>;
}

export class SummaryCostRepository implements SummaryCostRepositoryInterface {
    private baseUrl: string = 'http://127.0.0.1:8000';

    async getSummaryCost(pages: number): Promise<PaginatedOrderSummaryResult> {
        const token = Cookies.get('authToken');
        
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        try {
            const response = await fetch(`${this.baseUrl}/summary-list/?page=${pages}`, {
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

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error en la solicitud');
        }
    }
}