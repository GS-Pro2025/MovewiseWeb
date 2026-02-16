import Cookies from 'js-cookie';
import { CompanyLoansSummaryResponse, LoansSummaryFilters } from '../domain/LoansSummaryModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

/**
 * Obtiene el resumen de préstamos de la empresa
 * @param filters - Filtros opcionales: weeks, start_date, end_date
 */
export const fetchCompanyLoansSummary = async (
  filters?: LoansSummaryFilters
): Promise<CompanyLoansSummaryResponse> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const params = new URLSearchParams();
    
    if (filters?.weeks) {
      params.append('weeks', filters.weeks.toString());
    }
    if (filters?.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date);
    }

    const queryString = params.toString();
    const url = `${BASE_URL_API}/loans/company-summary/${queryString ? `?${queryString}` : ''}`;

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error fetching loans summary: ${response.statusText}`);
    }

    const data: CompanyLoansSummaryResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching company loans summary:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener el resumen de préstamos'
    );
  }
};
