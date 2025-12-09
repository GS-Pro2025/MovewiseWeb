import Cookies from 'js-cookie';
import {
  CreateExtraIncomeRequest,
  UpdateExtraIncomeRequest,
  ExtraIncomeListResponse,
  ExtraIncomeResponse,
  ExtraIncomeDeleteResponse,
  AdjustExtraIncomeValueResponse,
} from '../domain/ExtraIncomeModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';
const ENDPOINT = '/extra-income/';

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

/**
 * Obtiene todos los ingresos extras
 * @param mode - 'single_week' o 'week_range'
 * @param numberWeek - número de semana (para single_week)
 * @param startWeek - semana inicial (para week_range)
 * @param endWeek - semana final (para week_range)
 * @param year - año
 * @param pageSize - cantidad de resultados por página
 */
export async function getExtraIncomes(options: {
  mode?: 'single_week' | 'week_range';
  numberWeek?: number;
  startWeek?: number;
  endWeek?: number;
  year?: number;
  pageSize?: number;
}): Promise<ExtraIncomeListResponse> {
  const headers = getAuthHeaders();
  
  const params = new URLSearchParams();
  if (options.mode) params.append('mode', options.mode);
  if (options.numberWeek !== undefined) params.append('number_week', String(options.numberWeek));
  if (options.startWeek !== undefined) params.append('start_week', String(options.startWeek));
  if (options.endWeek !== undefined) params.append('end_week', String(options.endWeek));
  if (options.year !== undefined) params.append('year', String(options.year));
  if (options.pageSize !== undefined) params.append('page_size', String(options.pageSize));

  const url = `${BASE_URL_API}${ENDPOINT}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  handleAuthError(response);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.messUser || error.messDev || 'Error fetching extra incomes');
  }

  return response.json();
}

/**
 * Obtiene un ingreso extra por ID
 */
export async function getExtraIncomeById(id: number): Promise<ExtraIncomeResponse> {
  const headers = getAuthHeaders();

  const response = await fetch(`${BASE_URL_API}${ENDPOINT}${id}/`, {
    method: 'GET',
    headers,
  });

  handleAuthError(response);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.messUser || error.messDev || 'Error fetching extra income');
  }

  return response.json();
}

/**
 * Crea un nuevo ingreso extra
 */
export async function createExtraIncome(
  data: CreateExtraIncomeRequest
): Promise<ExtraIncomeResponse> {
  const headers = getAuthHeaders();

  const response = await fetch(`${BASE_URL_API}${ENDPOINT}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  handleAuthError(response);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.messUser || error.messDev || 'Error creating extra income');
  }

  return response.json();
}

/**
 * Actualiza un ingreso extra (PATCH)
 */
export async function updateExtraIncome(
  id: number,
  data: UpdateExtraIncomeRequest
): Promise<ExtraIncomeResponse> {
  const headers = getAuthHeaders();

  const response = await fetch(`${BASE_URL_API}${ENDPOINT}${id}/`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  handleAuthError(response);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.messUser || error.messDev || 'Error updating extra income');
  }

  // PATCH puede retornar 200 con data o directamente el objeto
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const responseData = await response.json();
    // Si viene envuelto en estructura con status, extraer data
    if (responseData.data) {
      return responseData;
    }
    // Si viene directamente el objeto, envolverlo
    return {
      status: 'success',
      messDev: 'Extra income updated',
      messUser: 'Registro actualizado',
      current_company_id: 1,
      data: responseData
    };
  }

  throw new Error('Invalid response format from server');
}

/**
 * Elimina un ingreso extra (soft delete - marca como inactivo)
 */
export async function deleteExtraIncome(id: number): Promise<ExtraIncomeDeleteResponse> {
  const headers = getAuthHeaders();

  const response = await fetch(`${BASE_URL_API}${ENDPOINT}${id}/`, {
    method: 'DELETE',
    headers,
  });

  handleAuthError(response);

  // 204 No Content - Eliminación exitosa sin respuesta body
  if (response.status === 204) {
    return {
      status: 'success',
      messDev: 'Extra income deleted',
      messUser: 'Registro eliminado',
      current_company_id: 1,
      data: null
    };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.messUser || error.messDev || 'Error deleting extra income');
  }

  // En caso de que retorne con body (200 o similar)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  // Fallback para respuesta exitosa sin body
  return {
    status: 'success',
    messDev: 'Extra income deleted',
    messUser: 'Registro eliminado',
    current_company_id: 1,
    data: null
  };
}

/**
 * Calcula el total de ingresos extras en un rango de fechas
 */
export async function getTotalExtraIncomes(options: {
  mode?: 'single_week' | 'week_range';
  numberWeek?: number;
  startWeek?: number;
  endWeek?: number;
  year?: number;
}): Promise<number> {
  try {
    const response = await getExtraIncomes({
      ...options,
      pageSize: 1000, // Obtener todos
    });
    
    return response.data.reduce((total, income) => total + income.value, 0);
  } catch (error) {
    console.error('Error calculating total extra incomes:', error);
    return 0;
  }
}

/**
 * Ajusta el valor de un ingreso extra (suma o resta)
 * @param id - ID del ingreso extra
 * @param mode - 'add' para sumar o 'subtract' para restar
 * @param adjustment - cantidad a ajustar
 */
export async function adjustExtraIncomeValue(
  id: number,
  mode: 'add' | 'subtract',
  adjustment: number
): Promise<AdjustExtraIncomeValueResponse> {
  const headers = getAuthHeaders();

  const url = `${BASE_URL_API}${ENDPOINT}${id}/adjust-value/?mode=${mode}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ adjustment }),
  });

  handleAuthError(response);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.messUser || error.messDev || `Error adjusting extra income value`);
  }

  const responseData = await response.json();
  return responseData;
}