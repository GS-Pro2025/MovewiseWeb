import { FuelCostRequest, FuelCostResponse } from '../domain/FuelCostModels';
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface FuelCostApiResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: FuelCostResponse;
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

export async function createFuelCost(data: FuelCostRequest): Promise<FuelCostApiResponse> {
  const headers = getAuthHeaders();
  
  // Asegurar que orders sea un array
  const ordersArray = Array.isArray(data.order) ? data.order : [data.order];
  
  const fuelCostPayload = {
    orders: ordersArray,
    truck: data.truck,
    cost_fuel: data.cost_fuel,
    cost_gl: data.cost_gl,
    fuel_qty: data.fuel_qty,
    distance: data.distance,
    ...(data.image && { image: data.image }),
  };

  console.log('Sending fuel cost payload:', fuelCostPayload);
  
  const response = await fetch(`${BASE_URL_API}/costfuels/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fuelCostPayload),
  });

  handleAuthError(response);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.messUser || error.messDev || 'Error creating fuel cost');
  }

  return response.json();
}