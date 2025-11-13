/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface FreelanceOperator {
  id_operator: number;
  code?: string;
  first_name?: string;
  last_name?: string;
  salary?: string;
  phone?: string | null;
  id_company?: number | null;
  status?: string;
  [key: string]: any;
}

export interface FreelanceOperatorsResponse {
  count: number;
  next: string | null;
  results: FreelanceOperator[];
  current_company_id?: number | null;
  message?: string;
}

/**
 * Fetch freelance operators (paginated)
 * @param page default 1
 * @param page_size default 10
 */
export const fetchFreelanceOperators = async (
  page = 1,
  page_size = 10
): Promise<FreelanceOperatorsResponse> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/list-operators-freelance/?page=${page}&page_size=${page_size}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Session expired / forbidden handling
    if (res.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP error! status: ${res.status} - ${txt}`);
    }

    const payload: FreelanceOperatorsResponse = await res.json();
    return payload;
  } catch (error) {
    console.error('Error fetching freelance operators:', error);
    throw error;
  }
};

/**
 * Create a freelance operator (multipart/form-data)
 * Endpoint: POST {{base_url_api}}/operators/create-freelance/
 * Fields (multipart): first_name, last_name, id_number, phone, address, number_licence, salary, type_id
 */
export const createFreelanceOperator = async (payload: {
  first_name: string;
  last_name: string;
  id_number: string;
  phone?: string;
  address?: string;
  number_licence?: string;
  salary?: string;
  type_id?: string;
  id_company?: number | null;
}): Promise<FreelanceOperator> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/operators/create-freelance/`;
  const form = new FormData();

  form.append('first_name', payload.first_name);
  form.append('last_name', payload.last_name);
  form.append('id_number', payload.id_number);
  if (payload.phone) form.append('phone', payload.phone);
  if (payload.address) form.append('address', payload.address);
  if (payload.number_licence) form.append('number_licence', payload.number_licence);
  if (payload.salary) form.append('salary', payload.salary);
  if (payload.type_id) form.append('type_id', payload.type_id);
  if (payload.id_company !== undefined && payload.id_company !== null) {
    form.append('company_id', String(payload.id_company));
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // NOT setting Content-Type so browser sets multipart/form-data boundary
      },
      body: form,
    });

    if (res.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      const body = contentType.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => '');
      const msg = typeof body === 'string' ? body : JSON.stringify(body);
      throw new Error(`HTTP error! status: ${res.status} - ${msg}`);
    }

    const created: FreelanceOperator = await res.json();
    return created;
  } catch (error) {
    console.error('Error creating freelance operator:', error);
    throw error;
  }
};