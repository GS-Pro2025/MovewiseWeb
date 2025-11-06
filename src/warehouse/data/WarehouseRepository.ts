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
    
        // Leer respuesta como texto primero para manejo de errores
        const rawText = await response.text().catch(() => '');
        let responseData: any = null;
        try {
            responseData = rawText ? JSON.parse(rawText) : null;
        } catch (e) {
            console.warn('createWorkhouseOrder: response is not valid JSON, raw text:', rawText, e);
        }

        if (response.status === 403) {
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (response.ok) {
            return responseData;
        }

        // Manejo estructurado de errores según la documentación de la API
        if (response.status === 400) {
            const errorType = responseData?.error_type;
            const messUser = responseData?.messUser;
            const errors = responseData?.errors;
            
            if (errorType === 'ValidationError') {
                if (errors) {
                    // Error de validación con campos específicos
                    const fieldErrors = Object.entries(errors)
                        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                        .join('; ');
                    throw new Error(`Validation error: ${fieldErrors}`);
                } else {
                    // Error de validación general (CompanyMissing, NoSuperAdminAndNoPersonId)
                    throw new Error(messUser || 'Validation error occurred');
                }
            }
            
            // Otros errores 400
            throw new Error(messUser || responseData?.messDev || 'Bad request error');
        }

        if (response.status === 404) {
            const messUser = responseData?.messUser;
            throw new Error(messUser || 'Customer factory not found');
        }

        if (response.status === 500) {
            const messUser = responseData?.messUser;
            throw new Error(messUser || 'Internal server error occurred');
        }

        // Otros códigos de error
        throw new Error(responseData?.messUser || responseData?.messDev || `HTTP error! status: ${response.status}`);
    
    } catch (error: any) {
        console.error('Error creating workhouse order:', error);
        // Si ya es un error estructurado, re-lanzarlo
        if (error.message) {
            throw error;
        }
        throw new Error('An unexpected error occurred while creating the workhouse order');
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