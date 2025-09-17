import { OrdersReportResponse } from '../domain/ModelOrdersReport';
import Cookies from 'js-cookie';

const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function fetchOrdersReport(
  page: number = 1,
  number_week: number,
  year: number,
  page_size: number = 5,
  search?: string // Nuevo parámetro opcional
): Promise<OrdersReportResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  // Construir URL con parámetros
  const params = new URLSearchParams({
    page_size: page_size.toString(),
    page: page.toString(),
  });

  // Si hay search, SOLO mandar search y paginación
  if (search && search.trim()) {
    params.append('search', search.trim());
  } else {
    // Si NO hay search, mandar los filtros normales
    params.append('number_week', number_week.toString());
    params.append('year', year.toString());
  }

  const url = `${BASE_URL_API}/assigns/list-report/?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 403) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`);
  }

  return await response.json();
}
