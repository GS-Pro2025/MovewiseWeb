import Cookies from 'js-cookie';
import { 
  TruckWeeklySummaryResponse, 
  TruckWeeklySummaryData, 
  TruckByWeekResponse, 
  TruckByWeekData,
  TrucksListResponse,
  Truck
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