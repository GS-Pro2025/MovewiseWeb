/* eslint-disable @typescript-eslint/no-explicit-any */
import { CustomerFactoryModel } from "../domain/CustomerFactoryModel";
import { OperatorAssigned } from "../domain/OperatorModels";
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


export const fetchWorkhouseOrders = async (
  page: number,
  pageSize: number,
  number_week: number,
  year: number
) => {
  const token = Cookies.get("authToken");
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(
      `${BASE_URL_API}/workhouse/?number_week=${number_week}&year=${year}&page=${page}&page_size=${pageSize}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

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

export async function fetchOperatorsInOrder(orderKey: string): Promise<OperatorAssigned[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/assigns/order/${orderKey}/operators/`;
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
    throw new Error(`Error fetching operators in order: ${response.statusText}`);
  }

  // Se espera que el backend retorne un array de operadores asignados
  return await response.json();
}