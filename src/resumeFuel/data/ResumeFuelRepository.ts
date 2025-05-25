import { PaginatedOrderResult } from "../domain/OrderModel";
import Cookies from 'js-cookie';

export interface ResumeFuelRepositoryInterface {
    getResumeFuel(pages: number): Promise<PaginatedOrderResult>;
}

export class ResumeFuelRepository implements ResumeFuelRepositoryInterface {
    private baseUrl: string =
        import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

    async getResumeFuel(pages: number): Promise<PaginatedOrderResult> {
        const token = Cookies.get('authToken');
        
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        try {
            const response = await fetch(`${this.baseUrl}/orders-with-costFuel/?page=${pages}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 403) {
                // Si el token ha expirado o no es válido, redirigir al login
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