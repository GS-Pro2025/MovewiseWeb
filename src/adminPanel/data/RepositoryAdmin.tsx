/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompanyUsersResponse } from "../domain/AdminDomain";
import Cookies from "js-cookie";

// ✅ Usar la misma variable de entorno que repositoryAssign
const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function getCompanyUsers(): Promise<CompanyUsersResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/users/company/`;

  console.log('🔍 Debug Info:');
  console.log('BASE_URL_API:', BASE_URL_API);
  console.log('Full URL:', url);
  console.log('Token:', token ? 'Present' : 'Missing');

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🌐 Response Info:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    // ✅ Manejo del 403 igual que en repositoryAssign
    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error('Error al obtener los usuarios de la compañía');
    }

    const data = await response.json();
    console.log('✅ Parsed JSON:', data);
    return data;

  } catch (error: any) {
    console.error('🚨 Fetch Error:', error);
    throw error;
  }
}

export async function requestDeactivation(personId: number): Promise<{ message: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/user/request-deactivation/${personId}/`, {
      method: "POST",
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
      throw new Error('Error al solicitar la desactivación');
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting deactivation:', error);
    throw error;
  }
}

export async function confirmDeactivation(personId: number, code: string): Promise<{ message: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/user/confirm-deactivation/${personId}/`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error('Error al confirmar la desactivación');
    }

    return await response.json();
  } catch (error) {
    console.error('Error confirming deactivation:', error);
    throw error;
  }
}

export async function reactivateAdmin(personId: number): Promise<{ message: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/user/reactivate-admin/${personId}/`, {
      method: "POST",
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
      throw new Error('Error al reactivar el administrador');
    }

    return await response.json();
  } catch (error) {
    console.error('Error reactivating admin:', error);
    throw error;
  }
}