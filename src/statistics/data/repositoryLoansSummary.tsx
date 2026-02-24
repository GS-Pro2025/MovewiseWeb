// data/repositoryLoansSummary.ts
import Cookies from 'js-cookie';
import { LoanRecord, LoansSummaryFilters } from '../domain/LoansSummaryModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export const fetchCompanyLoansSummary = async (
  filters?: LoansSummaryFilters
): Promise<LoanRecord[]> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No authentication token');
  }

  const params = new URLSearchParams();
  if (filters?.weeks)      params.append('weeks', filters.weeks.toString());
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date)   params.append('end_date', filters.end_date);
  if (filters?.status)     params.append('status', filters.status);

  const qs = params.toString();
  const url = `${BASE_URL_API}/loans/${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 403) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error fetching loans: ${response.statusText}`);
  }

  const data: LoanRecord[] = await response.json();
  return data;
};