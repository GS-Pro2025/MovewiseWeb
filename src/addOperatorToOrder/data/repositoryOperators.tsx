

import Cookies from 'js-cookie';
import { Operator } from '../domain/OperatorModels';

const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function fetchOperatorsAssignedToOrder(orderKey: string): Promise<Operator[]> {
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

    return await response.json();
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }
}

export async function fetchAvailableOperators(): Promise<Operator[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/operators/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener los operadores disponibles');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching available operators:', error);
    throw error;
  }
}
