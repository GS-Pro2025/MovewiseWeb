

import Cookies from 'js-cookie';
import { OperatorAssigned, OperatorAvailable, OperatorsAvaliableAPIResponse } from '../domain/OperatorModels';

const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function fetchOperatorsAssignedToOrder(orderKey: string): Promise<OperatorAssigned[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/assigns/order/${orderKey}/operators/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los operadores asignados a la orden');
    }

    const operators = await response.json();
    // Asegurar que todos los operadores tengan los nuevos campos
    return operators.map((op: any) => ({
      ...op,
      start_time: op.start_time || null,
      end_time: op.end_time || null,
      location_start: op.location_start || null,
      location_end: op.location_end || null,
      status_order: op.status_order || 'pending',
    }));
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }
}

export async function fetchAvailableOperators(page: number, pageSize: number): Promise<OperatorAvailable[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  console.log('BASE_URL_API', BASE_URL_API);
  console.log('Token', token);
  try {
    const response = await fetch(`${BASE_URL_API}/operators/?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los operadores disponibles');
    }
    console.log('Status:', response.status);
    console.log('Response:', await response.clone().text());
    const data: OperatorsAvaliableAPIResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching available operators:', error);
    throw error;
  }
}
export async function fetchFreelancesOperators(): Promise<OperatorAvailable[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/list-operators-freelance/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Intenta leer el body para ver si es el error esperado
      const errorBody = await response.json();
      if (
        errorBody &&
        errorBody.error === "No existe la página solicitada"
      ) {
        // Devuelve array vacío si es el error esperado
        return [];
      }
      throw new Error('Error al obtener los operadores freelance disponibles');
    }
    const data: OperatorsAvaliableAPIResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching freelance operators:', error);
    throw error;
  }
}