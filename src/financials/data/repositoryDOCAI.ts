/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Cookies from 'js-cookie';

export type ProcessMode = 'save_only' | 'full_process';

export interface DocaiProcessResult {
  success?: boolean;
  message?: string;
  process_mode?: ProcessMode;
  data?: {
    document_date?: string;
    parsed_orders?: Array<{
      OrderNumber: string;
      ShipperName: string;
      CommissionAmount: string;
    }>;
    // Para modo full_process
    update_summary?: {
      updated_orders?: Array<{
        key_ref: string;
        key: string;
        amount_added: string;
        type: string;
        new_income: string;
        new_expense: string;
        factory: string;
        orders_count: number;
      }>;
      total_updated?: number;
      statement_records_created?: number;
      not_found_orders?: string[];
      total_not_found?: number;
      duplicated_orders?: Array<{
        key_ref: string;
        count: number;
        total_amount: string;
        amount_per_order: string;
        type: string;
      }>;
      total_duplicated?: number;
    };
    // Para modo save_only
    save_summary?: {
      statement_records_created?: number;
      records_by_status?: {
        saved: number;
        not_exists: number;
        exists: number;
      };
    };
  };
  // Campos legacy para compatibilidad
  ocr_text?: string;
  order_key?: string | null;
  update_result?: any;
}

export async function processDocaiStatement(
  pdf_file: File, 
  processMode: ProcessMode = 'full_process'
): Promise<DocaiProcessResult> {
  const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';
  const url = `${BASE_URL_API}/api/utilities/pdf/process_pdf_and_update_order/?process_mode=${processMode}`;
  const token = Cookies.get('authToken');
  
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const formData = new FormData();
  formData.append('pdf_file', pdf_file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: result.error || result.message || 'Error processing statement',
      };
    }

    // Mapear la respuesta a la estructura esperada
    const docaiResult: DocaiProcessResult = {
      success: true,
      message: result.message,
      process_mode: result.process_mode || processMode,
      data: result.data,
    };

    // Para compatibilidad con el código existente, mapear update_summary a update_result
    if (result.data?.update_summary) {
      docaiResult.update_result = {
        updated_orders: result.data.update_summary.updated_orders?.map((order: any) => ({
          key_ref: order.key_ref,
          orders_updated: order.orders_count || 1,
          expense: order.type === 'expense' ? Math.abs(parseFloat(order.amount_added)) : parseFloat(order.new_expense || '0'),
          income: order.type === 'income' ? parseFloat(order.amount_added) : parseFloat(order.new_income || '0'),
          key: order.key,
          amount_added: order.amount_added,
          type: order.type,
          new_income: order.new_income,
          new_expense: order.new_expense,
          factory: order.factory,
          orders_count: order.orders_count
        })) || [],
        not_found_orders: result.data.update_summary.not_found_orders || [],
        total_updated: result.data.update_summary.total_updated || 0,
        total_not_found: result.data.update_summary.total_not_found || 0,
        duplicated_orders: result.data.update_summary.duplicated_orders || [],
        total_duplicated: result.data.update_summary.total_duplicated || 0
      };
    }

    return docaiResult;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Network or server error',
    };
  }
}