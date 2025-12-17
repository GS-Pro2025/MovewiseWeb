/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';
import {
  AssignOrderToCostFuelRequest,
  RecentCostFuelByTruckResponse,
} from '../domain/AssignOrderToCostFuelModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface AssignOrderToCostFuelApiResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: any;
}

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
 * Repository para asignar órdenes a CostFuels existentes
 */
export class AssignOrderToCostFuelRepository {
  /**
   * Asigna una orden a un CostFuel existente
   * @param costFuelId ID del CostFuel al que se asignará la orden
   * @param request Datos de la asignación (order_key y assigned_date opcional)
   * @returns Respuesta con los detalles actualizados del CostFuel
   */
  static async assignOrderToCostFuel(
    costFuelId: number,
    request: AssignOrderToCostFuelRequest
  ): Promise<AssignOrderToCostFuelApiResponse> {
    const headers = getAuthHeaders();

    const response = await fetch(`${BASE_URL_API}/costfuels/${costFuelId}/assign-order/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    handleAuthError(response);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.messUser || error.messDev || 'Error al asignar la orden al CostFuel');
    }

    return response.json();
  }

  /**
   * Obtiene la lista de CostFuels disponibles para asignar
   * (Este método puede ser útil para mostrar las opciones en el modal)
   * @param filters Filtros opcionales (semana, año, etc.)
   * @returns Lista de CostFuels
   */
  static async getAvailableCostFuels(filters?: {
    week?: number;
    year?: number;
    truck_id?: number;
  }): Promise<any> {
    const headers = getAuthHeaders();

    const params = new URLSearchParams();
    if (filters?.week) params.append('week', filters.week.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.truck_id) params.append('truck_id', filters.truck_id.toString());

    const queryString = params.toString();
    const url = queryString 
      ? `${BASE_URL_API}/costfuels/?${queryString}`
      : `${BASE_URL_API}/costfuels/`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    handleAuthError(response);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.messUser || error.messDev || 'Error al obtener los CostFuels disponibles');
    }

    return response.json();
  }

  /**
   * Obtiene los CostFuels más recientes de un truck específico con paginación
   * @param truckId ID del truck
   * @param pageSize Número de registros por página (default: 5)
   * @param page Número de página (default: 1)
   * @returns Respuesta con CostFuels paginados
   */
  static async getRecentCostFuelsByTruck(
    truckId: number,
    pageSize: number = 5,
    page: number = 1
  ): Promise<RecentCostFuelByTruckResponse> {
    const headers = getAuthHeaders();

    const params = new URLSearchParams();
    params.append('page_size', pageSize.toString());
    params.append('page', page.toString());

    const response = await fetch(
      `${BASE_URL_API}/costfuels/recent-by-truck/${truckId}/?${params.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    handleAuthError(response);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.messUser || error.messDev || 'Error al obtener los CostFuels recientes');
    }

    return response.json();
  }
}

export default AssignOrderToCostFuelRepository;
