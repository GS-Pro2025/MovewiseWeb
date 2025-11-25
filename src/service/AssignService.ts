/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchWithAuth } from "./authService";

const API_BASE: string =
  import.meta.env.VITE_URL_BASE ?? "http://127.0.0.1:8000";

/**
 * PATCH /assigns/{id}/update/
 * @param id        — Assignment ID to update.
 * @param payload   — Partial assignment data to update.
 * @returns         — Parsed JSON response.
 */
export async function updateAssign(
  id: number,
  payload: Record<string, any>
): Promise<any> {
  const url = `${API_BASE}/assigns/${id}/update/`;

  // Si el payload tiene 'bonus', renómbralo a 'additional_costs'
  const newPayload = { ...payload };
  if ("bonus" in newPayload) {
    newPayload.additional_costs = newPayload.bonus;
    delete newPayload.bonus;
  }

  const res: Response = await fetchWithAuth(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newPayload),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }

  return await res.json();
}