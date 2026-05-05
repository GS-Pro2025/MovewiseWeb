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

// Convierte un string base64 "data:image/jpeg;base64,..." a un File real
const base64ToFile = (base64: string, filename = 'image.jpg'): File => {
  const [header, data] = base64.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const ext = mime.split('/')[1] ?? 'jpg';
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], `${filename}.${ext}`, { type: mime });
};

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

    // ✅ El backend espera multipart/form-data, no JSON
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('cost', String(data.cost));
    formData.append('type', data.type);
    formData.append('id_order', data.id_order);

    // Solo adjuntar imagen si existe
    if (data.image) {
      const file = base64ToFile(data.image);
      formData.append('image', file);
    }

    console.log('📦 FormData enviado al backend:');
    formData.forEach((value, key) => {
      if (key === 'image') {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.type}, ${value.size}B)` : value);
      } else {
        console.log(`  ${key}:`, value);
      }
    });

    const response = await fetch(`${this.baseUrl}/workcost/`, {
      method: 'POST',
      headers: {
        // ✅ SIN Content-Type — el browser lo setea automáticamente
        // con el boundary correcto para multipart/form-data
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend error:', errorData);
      throw new Error(
        typeof errorData === 'object'
          ? JSON.stringify(errorData)
          : 'Error al crear el costo extra'
      );
    }

    return await response.json();
  }

  async updateExtraCost(workCostId: number, data: { name: string; cost: number; type: string }): Promise<ExtraCost> {
    const token = Cookies.get('authToken');
    if (!token) {
      window.location.href = '/login';
      throw new Error('No hay token de autenticación');
    }
    const response = await fetch(`${this.baseUrl}/workcost/${workCostId}/`, {
      method: 'PATCH',
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
      const err = await response.json().catch(() => ({}));
      // Soporta { messUser: "..." } y errores de validación DRF { field: ["msg"] }
      const message =
        err.messUser ||
        (typeof err === 'object' && !Array.isArray(err)
          ? Object.entries(err)
              .map(([field, msgs]) =>
                `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
              )
              .join(' | ')
          : null) ||
        'Error al actualizar el costo extra';
      throw new Error(message);
    }
    return response.json();
  }

  async updateReceipt(workCostId: number, imageFile: File): Promise<ExtraCost> {
    const token = Cookies.get('authToken');
    if (!token) {
      window.location.href = '/login';
      throw new Error('No hay token de autenticación');
    }
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await fetch(`${this.baseUrl}/workcost/${workCostId}/receipt/`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.messUser || 'Error al actualizar el recibo');
    }
    return response.json();
  }

  async deleteExtraCost(workCostId: number): Promise<void> {
    const token = Cookies.get('authToken');
    if (!token) {
      window.location.href = '/login';
      throw new Error('No hay token de autenticación');
    }
    const response = await fetch(`${this.baseUrl}/workcost/${workCostId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
    if (response.status !== 204 && !response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.messUser || 'Error al eliminar el costo extra');
    }
  }
}