import { fetchWithAuth } from '../../service/authService';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

/**
 * DELETE /costfuels/{id_fuel}/delete/
 * Deletes the cost fuel record with the given id.
 */
export async function deleteCostFuel(idFuel: number): Promise<void> {
  const res = await fetchWithAuth(`${BASE_URL_API}/costfuels/${idFuel}/delete/`, {
    method: 'DELETE',
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.messUser || body.messDev || `Error ${res.status}`);
  }
}
