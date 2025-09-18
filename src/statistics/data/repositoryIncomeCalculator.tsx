import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface IncomeRegressionResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: {
    weight: number;
    job_id: number;
    predicted_income: number;
  };
}

export async function fetchPredictedIncome(
  jobName: string,
  weight: number
): Promise<IncomeRegressionResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const params = new URLSearchParams({
    job_name: jobName,
    weight: weight.toString(),
  });

  const url = `${BASE_URL_API}/orders-linearRegresion-income/?${params.toString()}`;

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

  if (!response.ok) {
    throw new Error(`Error fetching predicted income: ${response.statusText}`);
  }

  return await response.json();
}