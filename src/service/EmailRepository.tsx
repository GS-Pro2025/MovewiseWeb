/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchWithAuth, logout } from './authService';

const BASE_URL_API  = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface SendPdfEmailResult {
  success: boolean;
  data?: any;
  errorMessage?: string;
}

/**
 * Send an email with a PDF attachment.
 * pdfFile: File object for the PDF
 * body: email body (HTML/text)
 * subject: email subject
 * to: comma separated string or array of recipient emails
 */
export async function sendPdfEmail(
  pdfFile: File,
  body: string,
  subject: string,
  to: string | string[]
): Promise<SendPdfEmailResult> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    formData.append('body', body);
    formData.append('subject', subject);
    const toValue = Array.isArray(to) ? to.join(',') : to;
    formData.append('to', toValue);

    const response = await fetchWithAuth(`${BASE_URL_API}/api/utilities/email/send_pdf/`, {
      method: 'POST',
      // no Content-Type aquí — fetchWithAuth detecta FormData y no fuerza application/json
      body: formData,
    });

    // handle auth expiration
    if (response.status === 401 || response.status === 403) {
      // logout (borra tokens y redirige)
      logout();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return { success: false, errorMessage: data?.messDev || data?.message || 'Error sending email' };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, errorMessage: err?.message || 'An unexpected error occurred' };
  }
}

export default { sendPdfEmail };
