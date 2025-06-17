/* eslint-disable @typescript-eslint/no-explicit-any */
import { CustomerFactoryModel } from "../domain/CustomerFactoryModel";
import { WorkhouseCreationOrderData, WorkHouseResponse } from "../domain/WarehouseModel";
import Cookies from "js-cookie"; // Asegúrate de tener esta dependencia

const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';



export const createWorkhouseOrder = async (orderData: WorkhouseCreationOrderData) => {
    const token = Cookies.get("authToken");
    if (!token) {
        window.location.href = '/login';
        throw new Error('No hay token de autenticación');
    }
    
    try {
        const response = await fetch(`${BASE_URL_API}/workhouse/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        });
    
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.messDev || 'Error creating workhouse order');
        }
    
        return await response.json();
    } catch (err: any) {
        throw new Error(err.message || 'An unexpected error occurred');
    }
};


export const fetchWorkhouseOrders = async (page: number, pageSize: number) => {
  const token = Cookies.get("authToken");
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/workhouse/?page=${page}&page_size=${pageSize}`, {
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
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { messDev: 'Respuesta no es JSON' };
      }
      throw new Error(errorData.messDev || 'Error fetching workhouse orders');
    }

    // Ajuste: extrae los datos de response.data
    const apiResponse: WorkHouseResponse = await response.json();
    return apiResponse.data;
  } catch (err: any) {
    throw new Error(err.message || 'An unexpected error occurred');
  }
};



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