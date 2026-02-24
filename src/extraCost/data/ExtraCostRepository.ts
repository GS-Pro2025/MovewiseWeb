import { 
    ExtraCostResponse, 
    ExtraCost, 
    CreateExtraCostDTO 
  } from '../domain/ExtraCostModel';
  
  import Cookies from 'js-cookie';
  
  export interface ExtraCostParams {
    page?: number;
    pageSize?: number;
    search?: string;
  }
  
  export interface ExtraCostRepositoryInterface {
    getExtraCosts(params: ExtraCostParams): Promise<ExtraCostResponse>;
    createExtraCost(data: CreateExtraCostDTO): Promise<ExtraCost>;
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
  
      const queryParams = new URLSearchParams();
  
      if (params.page !== undefined)
        queryParams.append('page', params.page.toString());
  
      if (params.pageSize !== undefined)
        queryParams.append('page_size', params.pageSize.toString());
  
      if (params.search?.trim())
        queryParams.append('search', params.search.trim());
  
      const response = await fetch(
        `${this.baseUrl}/workcost-with-orders/?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.status === 403) {
        Cookies.remove('authToken');
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
  
      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }
  
      return await response.json();
    }
  
    async createExtraCost(data: CreateExtraCostDTO): Promise<ExtraCost> {
      const token = Cookies.get('authToken');
  
      if (!token) {
        window.location.href = '/login';
        throw new Error('No hay token de autenticación');
      }
  
      const response = await fetch(`${this.baseUrl}/workcost/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (response.status === 403) {
        Cookies.remove('authToken');
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear el costo extra');
      }
  
      return await response.json();
    }
  }