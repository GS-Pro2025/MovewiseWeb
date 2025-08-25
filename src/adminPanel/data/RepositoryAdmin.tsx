/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompanyUsersResponse } from "../domain/AdminDomain";
import Cookies from "js-cookie";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function getCompanyUsers(): Promise<CompanyUsersResponse> {
  const token: string | undefined = Cookies.get("authToken");
  const url = `${API_BASE}/users/company/`;

  console.log('🔍 Debug Info:');
  console.log('API_BASE:', API_BASE);
  console.log('Full URL:', url);
  console.log('Token:', token ? 'Present' : 'Missing');

  try {
    const res: Response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });

    console.log('🌐 Response Info:');
    console.log('Status:', res.status);
    console.log('Status Text:', res.statusText);
    console.log('Content-Type:', res.headers.get('content-type'));

    // Leer la respuesta como texto primero
    const responseText = await res.text();
    console.log('📄 Raw Response (first 500 chars):', responseText.substring(0, 500));

    if (!res.ok) {
      console.error(`❌ API Error ${res.status}:`, responseText);
      
      // Si es un error del servidor, mostrar más info
      if (res.status >= 500) {
        throw new Error(`Server Error ${res.status}: The endpoint may not be implemented or there's a server issue`);
      }
      
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      
      // Intentar parsear como JSON si es posible
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Si no es JSON válido, usar el texto como está
        errorMessage = responseText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Verificar que el content-type sea JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('⚠️ Response is not JSON, content-type:', contentType);
      throw new Error('Server returned non-JSON response. Check if the endpoint exists.');
    }

    // Intentar parsear como JSON
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Parsed JSON:', data);
      return data;
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('Response was:', responseText);
      throw new Error('Server returned invalid JSON response');
    }

  } catch (error: any) {
    console.error('🚨 Fetch Error:', error);
    
    // Si es un error de red o CORS
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Check if the API server is running and accessible');
    }
    
    throw error;
  }
}
export async function requestDeactivation(personId: number): Promise<{ message: string }> {
  const token: string | undefined = Cookies.get("authToken");
  const url = `${API_BASE}/user/request-deactivation/${personId}/`;

  const res: Response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  return await res.json();
}

export async function confirmDeactivation(personId: number, code: string): Promise<{ message: string }> {
  const token: string | undefined = Cookies.get("authToken");
  const url = `${API_BASE}/user/confirm-deactivation/${personId}/`;

  const res: Response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  return await res.json();
}

export async function reactivateAdmin(personId: number): Promise<{ message: string }> {
  const token: string | undefined = Cookies.get("authToken");
  const url = `${API_BASE}/user/reactivate-admin/${personId}/`;

  console.log('🔄 Reactivating admin for person_id:', personId);

  const res: Response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Reactivate admin error:', errorText);
    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  return await res.json();
}

export function useDeactivationState() {
  const [deactivationState, setDeactivationState] = useState<{
    personId: number | null;
    step: 'idle' | 'pending' | 'confirming';
    code: string;
  }>({
    personId: null,
    step: 'idle',
    code: '',
  });

  return { deactivationState, setDeactivationState };
}