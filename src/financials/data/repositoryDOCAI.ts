/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Cookies from 'js-cookie';

export async function processDocaiStatement(pdf_file: File): Promise<{
  success?: boolean;
  message?: string;
  ocr_text?: string;
  order_key?: string | null;
  update_result?: {
    updated_orders?: Array<{
      key_ref: string;
      orders_updated: number;
      expense?: number;
      income?: number;
    }>;
    not_found_orders?: string[];
    total_updated?: number;
    total_not_found?: number;
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
    // Mapear los campos reales del backend
    return {
      success: true,
      message: result.message,
      ocr_text: result.ocr_text,
      order_key: result.order_key,
      update_result: result.update_result,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Network or server error',
    };
  }
}