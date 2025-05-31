import Cookies from "js-cookie";
import { CreateOrderModel } from "../models/CreateOrderModel";

const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function createOrder(
  orderData: CreateOrderModel
): Promise<{ success: boolean; data?: unknown; errorMessage?: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/orders/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, errorMessage: data.messDev || 'Error creating the order' };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      errorMessage: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}