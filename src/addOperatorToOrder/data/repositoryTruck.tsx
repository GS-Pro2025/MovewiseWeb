import Cookies from 'js-cookie';
import { Truck, TrucksAPIResponse } from '../domain/TruckModels';

const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function fetchTrucks(): Promise<Truck[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/trucks/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los camiones');
    }
    
    const data: TrucksAPIResponse = await response.json();
    return data.results.data;
  } catch (error) {
    console.error('Error fetching trucks:', error);
    throw error;
  }
}