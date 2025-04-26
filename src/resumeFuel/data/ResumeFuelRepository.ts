import { PaginatedOrderResult } from "../domain/OrderModel";
import Cookies from 'js-cookie';

export interface ResumeFuelRepositoryInterface {
    getResumeFuel(pages: number): Promise<PaginatedOrderResult>;
}

export class ResumeFuelRepository implements ResumeFuelRepositoryInterface {
    private baseUrl: string = 'http://127.0.0.1:8000';

    async getResumeFuel(pages: number): Promise<PaginatedOrderResult> {
        const token = Cookies.get('authToken');
        
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${this.baseUrl}/orders-with-costFuel/?page=${pages}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 403) {
            throw new Error('No tienes autorización para acceder a este recurso');
        }

        if (!response.ok) {
            throw new Error('Error al obtener los datos');
        }

        return await response.json();
    }
}