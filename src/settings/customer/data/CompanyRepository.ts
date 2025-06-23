import Cookies from 'js-cookie';
import { CustomerModel } from '../domain/companyModel';


export interface CustomerFactoriesRepositoryInterface {
    getAll(): Promise<CustomerModel[]>;
    create(name: string): Promise<CustomerModel>;
    delete(id: number): Promise<void>;
}


export class CustomerFactoriesRepository implements CustomerFactoriesRepositoryInterface {
    private baseUrl: string =
        import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000'; 

    private async fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
        const token = Cookies.get('authToken'); 
        if (!token) {
            window.location.href = '/login'; 
            throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers 
        };

        try {
            const response = await fetch(url, {
                ...options, 
                headers,
            });

            if (response.status === 403) {
                
                Cookies.remove('authToken');
                window.location.href = '/login';
                throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }

            if (!response.ok) {
                
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || 'Error en la solicitud');
            }

            return response;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error en la solicitud de red');
        }
    }

    async getAll(): Promise<CustomerModel[]> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/customer-factories/`, {
            method: 'GET',
        });
        return await response.json();
    }

    async create(name: string): Promise<CustomerModel> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/customer-factories/`, {
            method: 'POST',
            body: JSON.stringify({ name }), 
        });
        return await response.json();
    }

    async delete(id: number): Promise<void> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/customer-factory/${id}/delete/`, {
            method: 'PATCH',            
        });
        if (response.status === 204 || response.status === 200) { 
            return;
        }
        throw new Error('Error al eliminar la compañía');
    }
}
