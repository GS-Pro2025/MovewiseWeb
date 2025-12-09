import Cookies from "js-cookie";
import { createCost, Cost } from '../domain/ModelsCost';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

function getAuthHeaders() {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function handleAuthError(response: Response) {
  if (response.status === 403) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
}

export async function createCostApi(data: createCost): Promise<Cost> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_URL_API}/costs/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Error creating cost - Cost Description may already exist');
  return await res.json();
}

export async function listCostsApi(): Promise<Cost[]> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_URL_API}/costs/`, {
    method: 'GET',
    headers,
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Error fetching costs');
  return await res.json();
}

export async function updateCostAmountApi(
  id_cost: string,
  action: 'add' | 'subtract',
  amount: number
): Promise<Cost> {
  const headers = getAuthHeaders();
  const res = await fetch(
    `${BASE_URL_API}/costs/${id_cost}/update-amount/?action=${action}&amount=${amount}`,
    { method: 'POST', headers }
  );
  handleAuthError(res);
  if (!res.ok) throw new Error('Error updating cost amount');
  return await res.json();
}

export async function deleteCostApi(id_cost: string): Promise<void> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_URL_API}/costs/${id_cost}/`, {
    method: 'DELETE',
    headers,
  });
  handleAuthError(res);
  
  // 200 OK - Costo eliminado (desactivado)
  if (res.status === 200) {
    return;
  }

  // 204 No Content - Fallback si cambian el backend
  if (res.status === 204) {
    return;
  }
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Error deleting cost');
  }
}