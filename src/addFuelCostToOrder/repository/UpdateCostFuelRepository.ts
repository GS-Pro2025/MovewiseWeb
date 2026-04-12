import { fetchWithAuth } from '../../service/authService';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface UpdateCostFuelRequest {
  cost_fuel?: number;
  cost_gl?: number;
  fuel_qty?: number;
  distance?: number;
  orders?: string[];
}

/**
 * PUT /costfuels/{id_fuel}/
 * Updates cost_fuel, fuel_qty, distance and/or orders.
 * Orders are redistributed automatically by the backend.
 */
export async function updateCostFuel(
  idFuel: number,
  payload: UpdateCostFuelRequest
): Promise<void> {
  const res = await fetchWithAuth(`${BASE_URL_API}/costfuels/${idFuel}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.messUser || body.messDev || `Error ${res.status}`);
  }
}
