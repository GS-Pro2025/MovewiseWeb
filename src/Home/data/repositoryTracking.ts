import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface ActiveOperatorLocation {
  operator_id: number;
  name: string;
  photo: string | null;
  is_admin: boolean;
  latitude: string;
  longitude: string;
  address: string;
  assignment_id: number | null;
  order_id: number | null;
  last_seen: string; // ISO 8601
}

function getAuthHeaders(): HeadersInit {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No auth token');
  }
  return { Authorization: `Bearer ${token}` };
}

export async function fetchActiveOperatorLocations(): Promise<ActiveOperatorLocation[]> {
  const response = await fetch(`${BASE_URL_API}/operator-locations/active/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error fetching operator locations: ${response.status}`);
  }
  return response.json() as Promise<ActiveOperatorLocation[]>;
}

export async function fetchOrderOperatorLocations(
  orderId: string
): Promise<ActiveOperatorLocation[]> {
  const response = await fetch(
    `${BASE_URL_API}/operator-locations/by-order/${orderId}/`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) {
    throw new Error(`Error fetching order locations: ${response.status}`);
  }
  return response.json() as Promise<ActiveOperatorLocation[]>;
}
