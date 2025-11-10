/* eslint-disable @typescript-eslint/no-explicit-any */
/* Consumer para /statements/by-week/ */
import Cookies from 'js-cookie';
import { StatementsByWeekResponse } from '../domain/statementModels';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

/**
 * Fetch statements by week with optional year and pagination.
 * GET {{BASE_URL_API}}/statements/by-week/?week=30&year=2025&page_size=20&page=1
 */
export async function fetchStatementsByWeek(
  week: number,
  year?: number,
  page: number = 1,
  pageSize: number = 20
): Promise<StatementsByWeekResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No auth token');
  }

  try {
    const params = new URLSearchParams();
    params.append('week', String(week));
    if (year !== undefined) params.append('year', String(year));
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const url = `${BASE_URL_API}/statements/by-week/?${params.toString()}`;
    console.log('Fetching statements by week from URL:', url);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Error fetching statements: ${res.status} ${res.statusText} ${text}`);
    }

    const body: StatementsByWeekResponse = await res.json();

    // Basic validation
    if (!Array.isArray(body.results)) {
      throw new Error('Invalid response shape: results is not an array');
    }

    return body;
  } catch (error) {
    console.error('Error in fetchStatementsByWeek:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default {
  fetchStatementsByWeek,
};