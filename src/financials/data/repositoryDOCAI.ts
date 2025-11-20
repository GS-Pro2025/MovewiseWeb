/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Cookies from 'js-cookie';

export type ProcessMode = 'save_only' | 'full_process';

export interface OtherTransaction {
  DocumentNumber: string;
  ItemDescription: string;
  Amount: string;
}

export interface ParsedOrder {
  OrderNumber: string;
  ShipperName: string;
  Amount: string;
}

export interface UpdatedOrder {
  key_ref: string;
  key?: string;
  amount_added: string;
  type: string;
  new_income?: string;
  new_expense?: string;
  factory: string;
  orders_count?: number;
}

export interface DuplicatedOrder {
  key_ref: string;
  count: number;
  total_amount: string;
  amount_per_order: string;
  type: string;
}

export interface SaveSummary {
  statement_records_created?: number;
  records_by_status?: {
    saved: number;
    not_exists: number;
    exists: number;
  };
  // Para Other Transactions
  costs_created?: number;
  statements_created?: number;
  skipped_warehouse?: number;
  skipped_no_parentheses?: number;
  skipped_invalid_amount?: number;
  parsing_errors?: number;
  total_processed?: number;
  successfully_processed?: number;
}

export interface UpdateSummary {
  updated_orders?: UpdatedOrder[];
  total_updated?: number;
  statement_records_created?: number;
  not_found_orders?: string[];
  total_not_found?: number;
  duplicated_orders?: DuplicatedOrder[];
  total_duplicated?: number;
}

export interface RegularOrdersData {
  document_date?: string;
  parsed_orders?: ParsedOrder[];
  update_summary?: UpdateSummary;
  save_summary?: SaveSummary;
}

export interface OtherTransactionsData {
  processing_type: 'other_transactions';
  page_processed: number;
  document_date?: string;
  document_week?: number;
  parsed_transactions?: OtherTransaction[];
  save_summary?: SaveSummary;
  status: 'completed' | 'failed';
  error?: string;
  text_analyzed_length?: number;
  text_preview?: string;
}

export interface DocaiProcessResult {
  success?: boolean;
  message?: string;
  process_mode?: ProcessMode;
  processing_type?: 'regular_orders_only' | 'other_transactions' | 'mixed';
  other_transactions_page?: number;
  total_pages_scanned?: number;
  document_week?: number;
  regular_text_length?: number;
  
  // Para órdenes regulares (modo legacy y nuevo)
  data?: RegularOrdersData;
  regular_orders_data?: RegularOrdersData;
  
  // Para Other Transactions (nuevo)
  other_transactions_data?: OtherTransactionsData;
  
  // Campos legacy para compatibilidad
  ocr_text?: string;
  order_key?: string | null;
  update_result?: any;
}

export async function processDocaiStatement(
  pdf_file: File, 
  processMode: ProcessMode = 'full_process',
  week?: number,
  year?: number
): Promise<DocaiProcessResult> {
  const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';
  
  // Construir URL con parámetros
  let url = `${BASE_URL_API}/api/utilities/pdf/process_pdf_and_update_order/?process_mode=${processMode}`;
  
  if (week !== undefined) {
    url += `&week=${week}`;
  }
  
  if (year !== undefined) {
    url += `&year=${year}`;
  }
  
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
      processing_type: result.processing_type,
      other_transactions_page: result.other_transactions_page,
      total_pages_scanned: result.total_pages_scanned,
      document_week: result.document_week,
      regular_text_length: result.regular_text_length,
      data: result.data || result.regular_orders_data,
      regular_orders_data: result.regular_orders_data,
      other_transactions_data: result.other_transactions_data,
      // Agregar ocr_text para compatibilidad
      ocr_text: result.ocr_text,
    };

    // Para compatibilidad con el código existente, mapear update_summary a update_result
    const regularData = result.data || result.regular_orders_data;
    if (regularData?.update_summary) {
      docaiResult.update_result = {
        updated_orders: regularData.update_summary.updated_orders?.map((order: any) => ({
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
        not_found_orders: regularData.update_summary.not_found_orders || [],
        total_updated: regularData.update_summary.total_updated || 0,
        total_not_found: regularData.update_summary.total_not_found || 0,
        duplicated_orders: regularData.update_summary.duplicated_orders || [],
        total_duplicated: regularData.update_summary.total_duplicated || 0
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