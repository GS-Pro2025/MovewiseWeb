/* eslint-disable @typescript-eslint/no-explicit-any */
import { UpdatePaymentData } from "../domain/ModelOrderUpdate";
import { PaginatedOrderSummaryResult } from "../domain/OrderSummaryModel";
import Cookies from 'js-cookie';

export interface SummaryCostRepositoryInterface {
    getSummaryCost(pageNumber: number, week: number, year: number): Promise<PaginatedOrderSummaryResult>;
}

export class SummaryCostRepository implements SummaryCostRepositoryInterface {
    private baseUrl: string =
        import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

    async getSummaryCost(pageNumber: number, week: number, year: number): Promise<PaginatedOrderSummaryResult> {
        const token = Cookies.get('authToken');
        
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }
        console.log(`Fetching summary cost for week ${week}, year ${year}, page ${pageNumber + 1}`);
        try {
            const response = await fetch(`${this.baseUrl}/summary-list-financial/?number_week=${week}&year=${year}&page=${pageNumber + 1}&page_size=100`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 403) {
                Cookies.remove('authToken');
                window.location.href = '/login';
                throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }

            if (!response.ok) {
                throw new Error('Error al obtener los datos');
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error en la solicitud');
        }
    }
    
}
const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function updateOrder(
  orderKey: string,
  orderData: UpdatePaymentData
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred',
    };
  }

}
  /**
   * expected body 
   * {
      "key_ref": "key1",
      "expense": 100.50,
      "income": 200.75
    }
   */

export async function payByKey_ref(
    key_ref: string,
    expense: number,
    income: number
  ): Promise<{ success: boolean; data?: unknown; errorMessage?: string }> {

    const token = Cookies.get('authToken');
    if (!token) {
      window.location.href = '/login';
      throw new Error('No hay token de autenticación');
    }

    try {
      const response = await fetch(`${BASE_URL_API}/orders-payByKey_ref/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key_ref, expense, income }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, errorMessage: data.messDev || 'Error processing payment' };
      }

      return { success: true, data };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err?.message || 'An unexpected error occurred',
      };
    }
  }