/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';
import { CreateCostFuelRequest, CreateCostFuelResponse } from '../domain/CreateCostFuelModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

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
  if (response.status === 403 || response.status === 401) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
}

/**
 * Repository para crear nuevos registros de costo de combustible
 */
export class CreateCostFuelRepository {
  /**
   * Crea un nuevo registro de costo de combustible
   * @param request Datos del nuevo costfuel
   * @returns Respuesta con los detalles del costfuel creado
   */
  static async createCostFuel(
    request: CreateCostFuelRequest
  ): Promise<CreateCostFuelResponse> {
    const headers = getAuthHeaders();

    const response = await fetch(`${BASE_URL_API}/costfuels/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    handleAuthError(response);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.messUser || error.messDev || 'Error al crear el registro de combustible');
    }

    return response.json();
  }
}

export default CreateCostFuelRepository;
