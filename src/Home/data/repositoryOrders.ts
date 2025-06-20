/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { UpdateOrderData } from '../domain/ModelOrderUpdate';
import Cookies from 'js-cookie';
import { OrderState } from '../domain/OrderState';
import { CustomerFactoryModel } from '../domain/CustomerFactoryModel';
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
    const response = await fetch(`${BASE_URL_API}/orders/${orderKey}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
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
  ): Promise<{ success: boolean; data?: unknown; errorMessage?: string }> {
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