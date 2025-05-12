import { ExtraCostResponse } from '../domain/ExtraCostModel';
import Cookies from 'js-cookie';

export interface ExtraCostRepositoryInterface {
    getExtraCosts(): Promise<ExtraCostResponse>;
}

export class ExtraCostRepository implements ExtraCostRepositoryInterface {
    private baseUrl: string = 'http://127.0.0.1:8000';

    async getExtraCosts(): Promise<ExtraCostResponse> {
        const token = Cookies.get('authToken');
        
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        try {
            const response = await fetch(`${this.baseUrl}/workcost-with-orders/6114d114da7a4caeb36a27ab34fa8e3d/?page_size=10&page=1`, {
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