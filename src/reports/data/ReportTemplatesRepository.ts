import Cookies from 'js-cookie';
import type { ReportTemplate, ReportTemplateCreateInput } from '../domain/ReportModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

function getAuthHeaders(): HeadersInit {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No auth token');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401 || response.status === 403) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function listTemplates(): Promise<ReportTemplate[]> {
  const response = await fetch(`${BASE_URL_API}/report-templates/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ReportTemplate[]>(response);
}

export async function createTemplate(data: ReportTemplateCreateInput): Promise<ReportTemplate> {
  const response = await fetch(`${BASE_URL_API}/report-templates/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<ReportTemplate>(response);
}

export async function updateTemplate(
  id: number,
  data: ReportTemplateCreateInput,
): Promise<ReportTemplate> {
  const response = await fetch(`${BASE_URL_API}/report-templates/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<ReportTemplate>(response);
}

export async function deleteTemplate(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL_API}/report-templates/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (response.status === 401 || response.status === 403) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (response.status !== 204 && !response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || `HTTP ${response.status}`);
  }
}
