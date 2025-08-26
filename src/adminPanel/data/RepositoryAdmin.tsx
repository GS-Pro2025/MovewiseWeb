/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompanyUsersResponse } from "../domain/AdminDomain";
import Cookies from "js-cookie";

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function getCompanyUsers(): Promise<CompanyUsersResponse> {
  const token = Cookies.get('authToken');
  
  // 🔍 Debug temporal
  console.log('🚀 Environment debug:');
  console.log('VITE_URL_BASE:', import.meta.env.VITE_URL_BASE);
  console.log('BASE_URL_API:', BASE_URL_API);
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
  
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/users/company/`;
  console.log('📡 Final URL:', url);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('🌐 Response status:', response.status);
  console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));

  // ✅ Solo manejar 403 en funciones GET como en repositoryOrders
  if (response.status === 403) {
    console.log('🔒 403 Forbidden - removing token and redirecting');
    
    // 🔍 Debug: intentar ver la respuesta de error
    try {
      const errorResponse = await response.text();
      console.log('❌ 403 Error response:', errorResponse);
    } catch (e) {
      console.log('❌ Could not read error response');
    }
    
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Non-OK response:', response.status, errorText);
    throw new Error(`Error fetching data: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Success response:', data);
  return data;
}

export async function requestDeactivation(personId: number): Promise<{ success: boolean; data?: { message: string }; errorMessage?: string }> {
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

    const data = await response.json();

    // ✅ NO redirigir al login automáticamente en POST/PATCH como en repositoryOrders
    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || 'Error requesting deactivation' };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
}

export async function confirmDeactivation(personId: number, code: string): Promise<{ success: boolean; data?: { message: string }; errorMessage?: string }> {
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

    const data = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || 'Error confirming deactivation' };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
}

export async function reactivateAdmin(personId: number): Promise<{ success: boolean; data?: { message: string }; errorMessage?: string }> {
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

    const data = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || 'Error reactivating admin' };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
}