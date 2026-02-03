/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompanyModel } from '../domain/CompanyModel';
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface UpdateCompanyData {
  license_number?: string;
  name?: string;
  address?: string;
  zip_code?: string;
  subscription?: number;
  logo_upload?: string | null; // Base64 encoded image or null/empty to remove
}

export async function getMyCompany(): Promise<{ success: boolean; data?: CompanyModel; errorMessage?: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/companies/my-company/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Manejar sesión expirada
    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        errorMessage: data.error || data.messDev || 'Error fetching company information' 
      };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
}

export async function updateCompany(
  companyId: number,
  companyData: UpdateCompanyData
): Promise<{ success: boolean; data?: CompanyModel; errorMessage?: string }> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/companies/${companyId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        errorMessage: data.error || data.messDev || 'Error updating company information' 
      };
    }

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }
}
