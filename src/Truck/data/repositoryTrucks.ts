// data/repositoryTrucks.ts
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface Truck {
  id_truck: number;
  number_truck: string;
  type: string;
  name: string;
  category: string;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TruckFormData {
  number_truck: string;
  type: string;
  name: string;
  category: string;
}

export interface TruckResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    status: string;
    messDev: string;
    messUser: string;
    data: Truck[];
  };
  current_company_id: number;
}

export async function fetchTrucks(page = 1, pageSize = 10): Promise<TruckResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = new URL(`${BASE_URL_API}/trucks/`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('page_size', pageSize.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching trucks:', error);
    throw error;
  }
}

export async function createTruck(data: TruckFormData): Promise<Truck> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/trucks/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al crear el camión');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating truck:', error);
    throw error;
  }
}

export async function updateTruck(truckId: number, data: TruckFormData): Promise<Truck> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/trucks/${truckId}/update/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar el camión');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating truck:', error);
    throw error;
  }
}

export async function deleteTruck(truckId: number): Promise<void> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/trucks/${truckId}/delete/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al eliminar el camión');
    }
  } catch (error) {
    console.error('Error deleting truck:', error);
    throw error;
  }
}