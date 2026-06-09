/* eslint-disable @typescript-eslint/no-explicit-any */
import { UpdateOrderData } from '../domain/ModelOrderUpdate';
import Cookies from 'js-cookie';
import { OrderState } from '../domain/OrderState';
import { CustomerFactoryModel } from '../domain/CustomerFactoryModel';
import { OrderCountPerDayResponse } from '../domain/OrderCount';
const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function updateOrder(
  orderKey: string,
  orderData: UpdateOrderData
): Promise<{ success: boolean; data?: unknown; errorMessage?: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const payload = { ...orderData };
    if (payload.dispatch_ticket && payload.dispatch_ticket.startsWith('http')) {
      delete payload.dispatch_ticket;
    }
    const response = await fetch(`${BASE_URL_API}/orders/${orderKey}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || 'Error updating the order' };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
}

export async function fetchOrderStates(): Promise<OrderState[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/orders-states/`;
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

export async function fetchJobs(): Promise<{ id: number; name: string }[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/jobs/`;
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
    throw new Error(`Error fetching jobs: ${response.statusText}`);
  }

  return await response.json();
}

export async function fetchCustomerFactories(): Promise<CustomerFactoryModel[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/customer-factories/`;
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
    throw new Error(`Error fetching customer factories: ${response.statusText}`);
  }

  return await response.json();
}

  export async function finishOrderRepo(
    orderKey: string,
    image?: File
  ): Promise<{ success: boolean; data?: string[]; errorMessage?: string }> {
    const token = Cookies.get('authToken');
    if (!token) {
      window.location.href = '/login';
      throw new Error('No hay token de autenticación');
    }

    const formData = new FormData();
    if (image) {
      formData.append('image', image);
    }
    formData.append('status', 'finished');

    try {
      const response = await fetch(`${BASE_URL_API}/orders/status/${orderKey}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, errorMessage: data.messDev || 'Error finishing the order' };
      }

      return { success: true, data };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err?.message || 'An unexpected error occurred',
      };
    }
}


export interface DeleteOrderResponse {
  message: string;
}

export const deleteOrder = async (key: string): Promise<{ success: boolean; data?: DeleteOrderResponse; errorMessage?: string }> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/orders/${key}/deleteWithStatus/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || 'Error deleting the order' };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
};


export async function fetchOrdersCountPerDay(
  year: number,
  month: number
): Promise<{ success: boolean; data?: OrderCountPerDayResponse; errorMessage?: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/orders-count-orders-per-day/${year}/${month}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || 'Error fetching orders count per day' };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
}

export const getRegisteredLocations = async (): Promise<{ success: boolean; data?: string[]; errorMessage?: string }> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/orders-registered-locations/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: result.messDev || 'Error fetching registered locations' };
    }

    // Aquí extraemos solo el array de ubicaciones
    return { success: true, data: Array.isArray(result.data) ? result.data : [] };
  } catch (error: any) {
    console.error("Error fetching registered locations:", error);
    return { success: false, errorMessage: error?.message || 'An unexpected error occurred' };
  }
};

// ── Evidence endpoints ───────────────────────────────────────────────────────
// NOTE: GET /orders/<pk>/ returns 405. Evidences are loaded from the orders
// list response (fetchOrdersReport) which already includes evidences[].
// The dialog receives them as initialEvidences prop and updates locally.

import { OrderEvidence } from '../domain/ModelOrdersReport';

export async function addOrderEvidence(
  orderKey: string,
  file: File
): Promise<{ success: boolean; data?: OrderEvidence; errorMessage?: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const formData = new FormData();
  formData.append('evidence', file);

  try {
    const response = await fetch(`${BASE_URL_API}/orders/${orderKey}/evidences/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || data.error || 'Error uploading evidence' };
    }

    return { success: true, data: data.data };
  } catch (err: any) {
    return { success: false, errorMessage: err?.message || 'An unexpected error occurred' };
  }
}

export async function deleteOrderEvidence(
  orderKey: string,
  evidenceId: number
): Promise<{ success: boolean; errorMessage?: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/orders/${orderKey}/evidences/${evidenceId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Error deleting evidence';
      try {
        const data = await response.json();
        errorMessage = data.messDev || data.error || errorMessage;
      } catch { /* no body */ }
      return { success: false, errorMessage };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, errorMessage: err?.message || 'An unexpected error occurred' };
  }
}

export const deleteOrderAbsolute = async (orderKey: string): Promise<{ success: boolean; data?: any; errorMessage?: string }> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/order-delete/${orderKey}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Si el backend responde con algún contenido, lo parseamos
    let data = null;
    try {
      data = await response.json();
    } catch {
      // Puede que no haya body
    }

    if (!response.ok) {
      return { success: false, errorMessage: data?.messDev || 'Error deleting the order' };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
};