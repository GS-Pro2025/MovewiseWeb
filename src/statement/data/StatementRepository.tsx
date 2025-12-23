/* eslint-disable @typescript-eslint/no-explicit-any */
/* Consumer para /statements/by-week/ */
import { StatementsByWeekResponse, StatementRecord } from '../domain/StatementModels';
import { fetchWithAuth, logout } from '../../service/authService';

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
  try {
    const params = new URLSearchParams();
    params.append('week', String(week));
    if (year !== undefined) params.append('year', String(year));
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const url = `${BASE_URL_API}/statements/by-week/?${params.toString()}`;
    console.log('Fetching statements by week from URL:', url);

    const res = await fetchWithAuth(url, { method: 'GET' });

    if (res.status === 401 || res.status === 403) {
      // Auth issue: force logout and redirect
      logout();
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

/**
 * Update the `state` field of a StatementRecord.
 * Allowed values: "Exists" | "Not_exists" | "Processed"
 * PATCH {{BASE_URL_API}}/statements/{pk}/state/   (expects { state })
 */
export async function updateStatementState(
  pk: number,
  newState: 'Exists' | 'Not_exists' | 'Processed'
): Promise<StatementRecord> {
  const allowed = ['Exists', 'Not_exists', 'Processed'];
  if (!allowed.includes(newState)) {
    throw new Error('Invalid state value');
  }

  const url = `${BASE_URL_API}/statements/${pk}/state/`;

  try {
    const res = await fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({ state: newState }),
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Failed to update state: ${res.status} ${res.statusText} ${txt}`);
    }

    const payload = await res.json().catch(() => null);
    // backend examples return { status: 'success', data: { ... }, message: '...' }
    if (payload && payload.data) {
      return payload.data as StatementRecord;
    }

    // fallback: return raw payload if it matches StatementRecord shape
    return payload as StatementRecord;
  } catch (error) {
    console.error(`Error updating statement ${pk} state:`, error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Verify Statement Records by checking if they have matching Orders
 * POST {{BASE_URL_API}}/statements/verify/
 * Note: company_id is automatically extracted from JWT token
 */
export async function verifyStatementRecords(
  statementRecordIds: number[]
): Promise<any> {
  const url = `${BASE_URL_API}/statements/verify/`;

  try {
    const res = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({
        statement_record_ids: statementRecordIds,
      }),
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Failed to verify statements: ${res.status} ${res.statusText} ${txt}`);
    }

    const payload = await res.json().catch(() => null);
    return payload;
  } catch (error) {
    console.error('Error verifying statements:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Bulk update Statement Record states
 * POST {{BASE_URL_API}}/statements/bulk-update-state/
 */
export async function bulkUpdateStatementStates(
  updates: Array<{ statement_record_id: number; new_state: string }>
): Promise<any> {
  const url = `${BASE_URL_API}/statements/bulk-update-state/`;

  try {
    const res = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Failed to update states: ${res.status} ${res.statusText} ${txt}`);
    }

    const payload = await res.json().catch(() => null);
    return payload;
  } catch (error) {
    console.error('Error updating statement states:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Apply Statement amounts to Orders
 * POST {{BASE_URL_API}}/statements/apply-to-orders/
 * Note: company_id is automatically extracted from JWT token
 */
export async function applyStatementToOrders(
  statementRecordId: number,
  action: 'auto' | 'overwrite' | 'add',
  orderIds?: string[]
): Promise<any> {
  const url = `${BASE_URL_API}/statements/apply-to-orders/`;

  try {
    const body: any = {
      statement_record_id: statementRecordId,
      action: action,
    };

    if (orderIds && orderIds.length > 0) {
      body.order_ids = orderIds;
    }

    const res = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Failed to apply statement to orders: ${res.status} ${res.statusText} ${txt}`);
    }

    const payload = await res.json().catch(() => null);
    return payload;
  } catch (error) {
    console.error('Error applying statement to orders:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default {
  fetchStatementsByWeek,
  updateStatementState,
  verifyStatementRecords,
  bulkUpdateStatementStates,
  applyStatementToOrders,
};