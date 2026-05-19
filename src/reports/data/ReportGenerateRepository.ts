import Cookies from 'js-cookie';
import type { GenerateRequest, ReportResult } from '../domain/ReportModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export async function generateReport(request: GenerateRequest): Promise<ReportResult> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No auth token');
  }

  const response = await fetch(`${BASE_URL_API}/report/generate/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (response.status === 401 || response.status === 403) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    // Surface first error message from API (may be nested under a field key)
    const firstValue = Object.values(body)[0];
    const message =
      typeof firstValue === 'string'
        ? firstValue
        : body?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<ReportResult>;
}
