/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchWithAuth, logout } from "./authService";

export interface AssignmentData {
  id_assign: number;
  date: string;
  code: string;
  salary: number;
  first_name: string;
  last_name: string;
  email: string; 
  bonus: number | null;
  role: string;
  id_payment: string | null;
  operator_phone: string | null;
}

export interface WeekInfo {
  week_number: number;
  year: number;
  start_date: string;
  end_date: string;
}

export interface Pagination {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
}

export interface ApiResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: AssignmentData[];
  week_info: WeekInfo;
  pagination: Pagination;
}

export interface PaymentData {
  id_pay: number;
  value: string;
  date_payment: string;
  bonus: string;
  status: string;
  date_start: string;
  date_end: string;
  expense: string | null;
}

const API_BASE: string =
  import.meta.env.VITE_URL_BASE ?? "http://127.0.0.1:8000";

/**
 * GET /assign/list-assign-operator
 * @param numberWeek — ISO week number (1–53).
 * @param page       — Page (starts at 1; default 1).
 * @returns          — Parsed JSON response.
 */
export async function payrollService(
  numberWeek: number,
  year: number = 1,
  location: string = "",
): Promise<ApiResponse> {
  const url = `${API_BASE}/list-assign-operator?number_week=${numberWeek}&year=${year}&location=${location}`;
  const res: Response = await fetchWithAuth(url, { method: "GET" });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
    }
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }

  return (await res.json()) as ApiResponse;
}

// Payload for creating a payment
export interface CreatePaymentPayload {
  id_assigns: number[];
  value: number;
  bonus: number;
  status: string;
  date_start: string;
  date_end: string;
}

/**
 * POST /assign/create-payment/
 * @param payload  — Payment details including assignment IDs, amounts, and dates.
 * @returns        — Parsed JSON response.
 */
export async function createPayment(
  payload: CreatePaymentPayload,
): Promise<ApiResponse> {
  const url = `${API_BASE}/assign/create-payment/`;
  const res: Response = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
    }
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }

  return (await res.json()) as ApiResponse;
}

/**
 * GET /payments/{id}/
 * @param paymentId — ID del pago a obtener.
 * @returns         — Parsed JSON response con los detalles del pago.
 */
export async function getPaymentById(
  paymentId: number | string,
): Promise<PaymentData> {
  const url = `${API_BASE}/payments/${paymentId}/`;
  const res: Response = await fetchWithAuth(url, { method: "GET" });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
    }
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }

  return (await res.json()) as PaymentData;
}

export async function cancelPayments(assign_ids: number[]): Promise<{ status: string; message: string }> {
  const url = `${API_BASE}/assign/cancel-payments/`;
  const res: Response = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify({ assign_ids }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
    }
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }

  return await res.json();
}
