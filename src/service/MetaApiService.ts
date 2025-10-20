/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface SendPdfWhatsappResponse {
  status: string;
  messDev: string;
  messUser: string;
  data?: any;
}

function getAuthHeaders(): Record<string, string> {
  const token = Cookies.get('authToken');
  return {
    'Authorization': `Bearer ${token}`,
  };
}

function handleAuthError(response: Response) {
  if (response.status === 401) {
    Cookies.remove('authToken');
    window.dispatchEvent(new Event('sessionExpired'));
    throw new Error('Session expired');
  }
}

export interface SendPdfWhatsappParams {
  pdfFile: File | Blob;
  to_number: string;
  caption?: string;
}

/**
 * Envía un PDF por WhatsApp usando el endpoint meta/send-pdf-whatsapp/
 * @param params { pdfFile, to_number, caption }
 */
export async function sendPdfToWhatsapp(params: SendPdfWhatsappParams): Promise<SendPdfWhatsappResponse> {
  const headers = getAuthHeaders();
  // No agregues Content-Type, fetch lo setea automáticamente con FormData
  const formData = new FormData();
  formData.append('pdf', params.pdfFile);
  formData.append('to_number', params.to_number);
  if (params.caption) formData.append('caption', params.caption);

  const res = await fetch(`${BASE_URL_API}/meta/send-pdf-whatsapp/`, {
    method: 'POST',
    headers,
    body: formData,
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Error sending PDF to WhatsApp');
  return await res.json();
}