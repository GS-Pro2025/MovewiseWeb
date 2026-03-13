import { Loan, LoanStatus } from '../domain/LoanModels';
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

/* ── auth helper ── */
const getToken = (): string => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  return token;
};

const handleAuthError = (status: number) => {
  if (status === 403) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
};

/* ════════════════════════════════════════════════════════════════
   LOAN PAYMENTS HISTORY
   GET /loans/{loanId}/payments/
════════════════════════════════════════════════════════════════ */
export interface LoanPaymentRecord {
  id_payment: number;
  loan: number;
  amount: string;
  payment_method: string;
  payment_method_display: string;
  notes: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  missing_amount: string;
  loan_total: string;
}

export const fetchLoanPayments = async (loanId: number): Promise<LoanPaymentRecord[]> => {
  const token = getToken();
  const response = await fetch(`${BASE_URL_API}/loans/${loanId}/payments/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  handleAuthError(response.status);
  if (response.status === 404) throw new Error('Préstamo no encontrado');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

/* ════════════════════════════════════════════════════════════════
   REST OF EXISTING FUNCTIONS (unchanged)
════════════════════════════════════════════════════════════════ */

export const fetchLoansByOperator = async (
  operatorId: number,
  status?: LoanStatus
): Promise<Loan[]> => {
  const token = getToken();
  let url = `${BASE_URL_API}/loans/operator/${operatorId}/`;
  if (status) url += `?status=${status}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  handleAuthError(response.status);
  if (response.status === 404) throw new Error('Operador no encontrado');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export interface CreateLoanData {
  operator: number;
  total_amount_to_pay: string;
  description: string;
}

export const createLoan = async (loanData: CreateLoanData): Promise<Loan> => {
  const token = getToken();
  const response = await fetch(`${BASE_URL_API}/loans/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(loanData),
  });

  handleAuthError(response.status);
  if (response.status === 400) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error de validación al crear el préstamo');
  }
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export interface CreateLoanPaymentData {
  loan_id: number;
  amount: string;
  payment_method: string;
  notes: string;
}

export const createLoanPayment = async (paymentData: CreateLoanPaymentData): Promise<LoanPaymentRecord> => {
  const token = getToken();
  const response = await fetch(`${BASE_URL_API}/loans/payment/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });

  handleAuthError(response.status);
  if (response.status === 400) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error de validación al registrar el pago');
  }
  if (response.status === 404) throw new Error('Préstamo no encontrado');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateLoanStatus = async (loanId: number, status: string): Promise<Loan> => {
  const token = getToken();
  const response = await fetch(`${BASE_URL_API}/loans/${loanId}/status/`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  handleAuthError(response.status);
  if (response.status === 400) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Transición de estado inválida');
  }
  if (response.status === 404) throw new Error('Préstamo no encontrado');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};