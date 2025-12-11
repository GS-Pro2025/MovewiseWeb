/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';
import { 
  TruckWeeklySummaryResponse, 
  TruckWeeklySummaryData, 
  TruckByWeekResponse, 
  TruckByWeekData,
  TrucksListResponse,
  Truck,
  WeeklyFuelSummaryItem,
  WeeklyFuelSummaryResponse
} from '../domain/TruckModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

// NUEVA: Función para obtener la lista de todos los trucks
export async function fetchTrucksList(page: number = 1, pageSize: number = 50): Promise<Truck[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/trucks/?page=${page}&page_size=${pageSize}`;
    console.log('Fetching trucks list from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error(`Error fetching trucks list: ${response.statusText}`);
    }

    const apiResponse: TrucksListResponse = await response.json();
    
    if (apiResponse.results?.status !== 'success') {
      throw new Error(apiResponse.results?.messDev || 'Error en la respuesta del servidor');
    }

    return apiResponse.results.data;
  } catch (error) {
    console.error('Error fetching trucks list:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener la lista de trucks'
    );
  }
}

// Función para obtener el resumen semanal de un truck específico
export async function fetchTruckWeeklySummary(
  truckId: number,
  year: number
): Promise<TruckWeeklySummaryData> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/costfuels/weekly-summary/${truckId}/?year=${year}`;
    console.log('Fetching truck weekly summary from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error(`Error fetching truck weekly summary: ${response.statusText}`);
    }

    const apiResponse: TruckWeeklySummaryResponse = await response.json();
    
    if (apiResponse.status !== 'success') {
      throw new Error(apiResponse.messDev || 'Error en la respuesta del servidor');
    }

    return apiResponse.data;
  } catch (error) {
    console.error('Error fetching truck weekly summary:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener el resumen semanal del truck'
    );
  }
}

// Función para obtener los datos detallados de un truck en una semana específica
export async function fetchTruckByWeek(
  truckId: number,
  year: number,
  week: number
): Promise<TruckByWeekData> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/costfuels/by-truck-week/${truckId}/?year=${year}&week=${week}`;
    console.log('Fetching truck by week data from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error(`Error fetching truck by week data: ${response.statusText}`);
    }

    const apiResponse: TruckByWeekResponse = await response.json();
    
    if (apiResponse.results?.status !== 'success') {
      throw new Error(apiResponse.results?.messDev || 'Error en la respuesta del servidor');
    }

    return apiResponse.results;
  } catch (error) {
    console.error('Error fetching truck by week data:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener los datos del truck por semana'
    );
  }
}

export async function createTruck(payload: {
  number_truck: string;
  type: string;
  name: string;
  category: string;
}): Promise<Truck> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/trucks/`;
    console.log('Creating truck via URL:', url, 'payload:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    const apiResponse = await response.json();

    // Manejo de errores de validación retornados por la API
    if (!response.ok || apiResponse?.status === 'error') {
      // Estructura esperada de error:
      // { status: "error", messDev: "...", messUser: "...", data: { field: [ ... ] } }
      const err: any = new Error(apiResponse?.messUser || apiResponse?.messDev || response.statusText || 'Error creating truck');
      err.type = apiResponse?.status || 'error';
      err.messDev = apiResponse?.messDev;
      err.messUser = apiResponse?.messUser;
      err.validation = apiResponse?.data; // detalles por campo (p. ej. number_truck: [...])
      throw err;
    }

    // Éxito esperado:
    // { status: "success", messDev: "...", messUser: "...", data: { ...truck... } }
    if (apiResponse?.status === 'success' && apiResponse?.data) {
      return apiResponse.data as Truck;
    }

    throw new Error('Respuesta inesperada del servidor al crear truck.');
  } catch (error) {
    console.error('Error creating truck:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function deleteTruck(truckId: number): Promise<{ messUser?: string } | null> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/trucks/${truckId}/delete/`;
    console.log('Deleting truck via URL:', url);

    const response = await fetch(url, {
      method: 'DELETE',
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

    // Some 404 responses return a simple JSON with detail
    if (response.status === 404) {
      const body = await response.json().catch(() => ({}));
      const detail = body?.detail || 'Resource not found';
      const err: any = new Error(detail);
      err.detail = detail;
      throw err;
    }

    const apiResponse = await response.json().catch(() => null);

    // Expected success body:
    // { status: "success", messDev: "...", messUser: "...", data: null }
    if (response.ok && apiResponse?.status === 'success') {
      return { messUser: apiResponse.messUser };
    }

    // Unexpected/error body
    if (apiResponse?.detail) {
      const err: any = new Error(apiResponse.detail);
      err.detail = apiResponse.detail;
      throw err;
    }

    const message = apiResponse?.messUser || apiResponse?.messDev || response.statusText || 'Error deleting truck';
    const err: any = new Error(message);
    err.validation = apiResponse?.data;
    throw err;
  } catch (error) {
    console.error('Error deleting truck:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function updateTruck(
  truckId: number,
  payload: { type: string; name: string; category: string; }
): Promise<Truck> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/trucks/${truckId}/update/`;
    console.log('Updating truck via URL:', url, 'payload:', payload);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    // Manejo de 404 que puede devolver { detail: "No Truck matches the given query." }
    if (response.status === 404) {
      const body = await response.json().catch(() => ({}));
      const detail = body?.detail || 'Resource not found';
      const err: any = new Error(detail);
      err.detail = detail;
      throw err;
    }

    const apiResponse = await response.json().catch(() => null);

    // Manejo de errores de validación retornados por la API
    if (!response.ok || apiResponse?.status === 'error') {
      const err: any = new Error(apiResponse?.messUser || apiResponse?.messDev || response.statusText || 'Error updating truck');
      err.type = apiResponse?.status || 'error';
      err.messDev = apiResponse?.messDev;
      err.messUser = apiResponse?.messUser;
      err.validation = apiResponse?.data;
      throw err;
    }

    // Éxito esperado:
    // { status: "success", messDev: "...", messUser: "...", data: { ...truck... } }
    if (apiResponse?.status === 'success' && apiResponse?.data) {
      return apiResponse.data as Truck;
    }

    throw new Error('Respuesta inesperada del servidor al actualizar truck.');
  } catch (error) {
    console.error('Error updating truck:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Nueva función mejorada que devuelve datos por semana
export async function fetchTruckWeeklyData(
  truckId: number,
  year: number,
  week?: number
): Promise<WeeklyFuelSummaryItem[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    let url = `${BASE_URL_API}/costfuels/weekly-summary/${truckId}/?year=${year}`;
    
    // Agregar week si se proporciona
    if (week) {
      url += `&week=${week}`;
    }
    
    console.log('Fetching truck weekly data from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error(`Error fetching truck weekly data: ${response.statusText}`);
    }

    const apiResponse: WeeklyFuelSummaryResponse = await response.json();
    
    if (apiResponse.status !== 'success') {
      throw new Error(apiResponse.messDev || 'Error en la respuesta del servidor');
    }

    console.log('Truck weekly data retrieved:', {
      truckId: apiResponse.truck_id,
      year: apiResponse.year,
      itemsCount: apiResponse.data?.length || 0,
      data: apiResponse.data
    });

    return apiResponse.data || [];
  } catch (error) {
    console.error('Error fetching truck weekly data:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener los datos semanales del truck'
    );
  }
}