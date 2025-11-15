/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE: string = import.meta.env.VITE_URL_BASE ?? "http://127.0.0.1:8000";

export interface IDType {
  value: string;
  label: string;
}

export interface IDTypesResponse {
  status: string;
  messUser: string;
  messdev: string;
  data: IDType[];
}

/**
 * GET /person-id-types/
 * @returns Promise with ID types response
 */
export async function getPersonIDTypes(): Promise<IDTypesResponse> {
  const url = `${API_BASE}/person-id-types/`;

  const res: Response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }

  return await res.json();
}