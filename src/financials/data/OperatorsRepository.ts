/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function getOperatorsByKeyRef(
  keyRef: string
): Promise<{ success: boolean; data?: any[]; errorMessage?: string }> {
  const token = Cookies.get('authToken');
  
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/operators-by-key-ref/${keyRef}/`, {
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

    const data = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || 'Error loading operators' };
    }

    return { success: true, data: data.results || data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
}