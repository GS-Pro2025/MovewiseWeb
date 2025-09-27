/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Cookies from 'js-cookie';

export async function processDocaiStatement(pdf_file: File): Promise<{
  success?: boolean;
  message?: string;
  ocr_text?: string;
  order_key?: string | null;
  parsed_orders?: Array<{
    OrderNumber: string;
    ShipperName: string;
    CommissionAmount: string;
  }>;
  update_result?: {
    updated_orders?: Array<{
      key_ref: string;
      orders_updated: number;
      expense?: number;
      income?: number;
      key?: string;
      amount_added?: string;
      type?: string;
      new_income?: string;
      new_expense?: string;
      factory?: string; // ← Agregar este campo
      orders_count?: number; // ← Agregar este campo
    }>;
    not_found_orders?: string[];
    total_updated?: number;
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
}> {
  const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';
  const url = `${BASE_URL_API}/api/utilities/pdf/process_pdf_and_update_order/`;
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
        message: result.message || 'Error processing statement',
      };
    }
    
    // Mapear update_summary (nueva estructura) a update_result (estructura esperada)
    let mappedUpdateResult = undefined;
    if (result.update_summary) {
      const summary = result.update_summary;
      mappedUpdateResult = {
        updated_orders: summary.updated_orders?.map((order: any) => ({
          key_ref: order.key_ref,
          orders_updated: order.orders_count || 1,
          expense: order.type === 'expense' ? Math.abs(parseFloat(order.amount_added)) : parseFloat(order.new_expense || '0'),
          income: order.type === 'income' ? parseFloat(order.amount_added) : parseFloat(order.new_income || '0'),
          key: order.key,
          amount_added: order.amount_added,
          type: order.type,
          new_income: order.new_income,
          new_expense: order.new_expense,
          factory: order.factory, // ← Campo del cliente/compañía
          orders_count: order.orders_count
        })) || [],
        not_found_orders: summary.not_found_orders || [],
        total_updated: summary.total_updated || 0,
        total_not_found: summary.total_not_found || 0,
        duplicated_orders: summary.duplicated_orders || [],
        total_duplicated: summary.total_duplicated || 0
      };
    }

    return {
      success: true,
      message: result.message,
      ocr_text: result.ocr_text,
      order_key: result.order_key,
      parsed_orders: result.parsed_orders,
      update_result: mappedUpdateResult,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Network or server error',
    };
  }
}