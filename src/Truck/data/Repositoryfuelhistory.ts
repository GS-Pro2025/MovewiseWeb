// trucks/data/repositoryFuelHistory.ts
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FuelRecord {
  id_fuel: number;
  truck: number;
  cost_fuel: number;
  cost_gl: number;
  fuel_qty: number;
  distance: number;
  date: string;
  image: string | null;
  image_url: string | null;
  orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface FuelHistoryResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  data: FuelRecord[];
  // opcionales — el backend puede añadirlos en el futuro
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// ─── Repository ────────────────────────────────────────────────────────────────

export async function fetchFuelHistoryByTruck(
  truckId: number,
  page = 1,
  pageSize = 20
): Promise<FuelHistoryResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No auth token');
  }

  const url = new URL(`${BASE_URL_API}/costfuels/by-truck/${truckId}`);
  url.searchParams.append('page', String(page));
  url.searchParams.append('page_size', String(pageSize));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 403) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.messUser || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}