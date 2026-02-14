import { Loan, LoanStatus } from '../domain/LoanModels';
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export const fetchLoansByOperator = async (
  operatorId: number,
  status?: LoanStatus
): Promise<Loan[]> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    let url = `${BASE_URL_API}/loans/operator/${operatorId}/`;
    if (status) {
      url += `?status=${status}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (response.status === 404) {
      throw new Error('Operador no encontrado');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Loan[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching loans by operator:', error);
    throw error;
  }
};

export interface CreateLoanData {
  operator: number;
  total_amount_to_pay: string;
  description: string;
}

export const createLoan = async (loanData: CreateLoanData): Promise<Loan> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/loans/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loanData),
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (response.status === 400) {
      const errorData = await response.json();
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      throw new Error('Error de validación al crear el préstamo');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Loan = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw error;
  }
};

export interface CreateLoanPaymentData {
  loan_id: number;
  amount: string;
  payment_method: string;
  notes: string;
}

export const createLoanPayment = async (paymentData: CreateLoanPaymentData): Promise<any> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/loans/payment/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (response.status === 400) {
      const errorData = await response.json();
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      throw new Error('Error de validación al registrar el pago');
    }

    if (response.status === 404) {
      throw new Error('Préstamo no encontrado');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating loan payment:', error);
    throw error;
  }
};

export const updateLoanStatus = async (loanId: number, status: string): Promise<Loan> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/loans/${loanId}/status/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (response.status === 400) {
      const errorData = await response.json();
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      throw new Error('Transición de estado inválida');
    }

    if (response.status === 404) {
      throw new Error('Préstamo no encontrado');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Loan = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating loan status:', error);
    throw error;
  }
};
