import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface TruckByOrder {
  id_truck: number;
  number_truck: string;
  type: string;
  name: string;
  status: boolean;
  category: string;
}

export interface TrucksByOrderResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: TruckByOrder[];
  order_key: string;
  total_trucks: number;
}

function getAuthHeaders() {
  const token = Cookies.get('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function handleAuthError(response: Response) {
  if (response.status === 401) {
    Cookies.remove('authToken');
    window.dispatchEvent(new Event('sessionExpired'));
    throw new Error('Session expired');
  }
}

export async function fetchTrucksByOrder(orderKey: string): Promise<TrucksByOrderResponse> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_URL_API}/trucks/by-order/${orderKey}/`, {
    method: 'GET',
    headers,
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Error fetching trucks by order');
  return await res.json();
}

/**
 * Obtiene todos los camiones activos de la empresa
 */
export async function fetchActiveTrucks(): Promise<TruckByOrder[]> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_URL_API}/trucks/?page=1&page_size=100`, {
    method: 'GET',
    headers,
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Error fetching active trucks');
  const response = await res.json();
  return response.results?.data || [];
}