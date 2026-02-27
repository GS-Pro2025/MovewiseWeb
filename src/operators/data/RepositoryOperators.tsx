/* eslint-disable @typescript-eslint/no-explicit-any */
import { Operator, OperatorsResponse } from '../domain/OperatorsModels';
import { InactiveOperatorsResponse } from '../domain/OperatorsModels';
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export const fetchOperators = async (): Promise<OperatorsResponse> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/operators/?page=1&page_size=1000`, {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OperatorsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }
};

export const fetchInactiveOperators = async (): Promise<InactiveOperatorsResponse> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/list-operators-inactive/?page=1&page_size=1000`, {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: InactiveOperatorsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching inactive operators:', error);
    throw error;
  }
};

export const activateOperator = async (id_operator: number): Promise<void> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/operators-activate/${id_operator}/`, {
      method: 'PATCH',
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error activating operator:', error);
    throw error;
  }
};

export const deleteOperator = async (id_operator: number): Promise<void> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/operators/${id_operator}/delete/`, {
      method: 'DELETE',
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting operator:', error);
    throw error;
  }
};

export const updateOperator = async (id_operator: number, operatorData: Partial<Operator> | FormData): Promise<void> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    // Determinar si los datos son FormData o un objeto regular
    const isFormData = operatorData instanceof FormData;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    // Solo agregar Content-Type si NO es FormData (el navegador lo maneja automáticamente para FormData)
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL_API}/operators/update/${id_operator}/`, {
      method: 'PATCH',
      headers,
      body: isFormData ? operatorData : JSON.stringify(operatorData),
    });

    // Leer texto crudo para poder parsear mensajes personalizados de la API
    const rawText = await response.text().catch(() => '');
    let payload: any = null;
    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      console.warn('updateOperator: response is not valid JSON, raw text:', rawText, e);
      payload = rawText;
    }

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (response.ok) {
      // éxito, nada más que hacer (los llamadores refrescan la lista)
      return;
    }

    // Manejo detallado de errores 400 (validación / integridad / estructurados)
    if (response.status === 400) {
      // lanzar el payload (expected { message, errors, ... }) para que el llamador lo muestre
      const err = payload ?? { message: 'Validation error', status: 400 };
      console.error('updateOperator: validation/business error', err);
      throw err;
    }

    // Otros errores -> incluir rawText para facilitar debugging
    throw new Error(`HTTP error! status: ${response.status} - ${rawText}`);
  } catch (error) {
    console.error('Error updating operator:', error);
    throw error;
  }
};

export const addChildToOperator = async (childData: {
  operator: number;
  name: string;
  birth_date: string;
  gender: string;
}): Promise<void> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/sons/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(childData),
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error adding child to operator:', error);
    throw error;
  }
};

export const createOperator = async (formData: FormData): Promise<Operator> => {
  console.log('createOperator: preparing to send FormData');

  // Loguear contenido FormData (archivos con nombre/tamaño/tipo)
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`FormData entry -> ${key}: File(name=${value.name}, size=${value.size}, type=${value.type})`);
    } else {
      console.log(`FormData entry -> ${key}:`, value);
    }
  }

  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/operators/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO Content-Type: dejar que el navegador añada boundary
      },
      body: formData,
    });

    console.log('createOperator: received response', response.status);

    // Leer texto crudo (para poder ver body aunque no sea JSON)
    const rawText = await response.text().catch(() => '');
    let payload: any = null;
    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      console.warn('createOperator: response is not valid JSON, raw text:', rawText, e);
    }

    console.log('createOperator: parsed payload:', payload ?? rawText);

    if (response.status === 201 || response.ok) {
      return payload as Operator;
    }

    if (response.status === 400) {
      // lanzar el payload (validation errors) para que el llamador lo muestre
      const err = payload ?? { message: 'Validation error', status: 400 };
      console.error('createOperator: validation/business error', err);
      throw err;
    }

    throw new Error(`HTTP error! status: ${response.status} - ${rawText}`);
  } catch (error) {
    console.error('createOperator: unexpected error', error);
    throw error;
  }
};

export const changeOperatorPassword = async (
  code: string,
  newPassword: string
): Promise<{ message: string }> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const response = await fetch(`${BASE_URL_API}/operator/change-password/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        new_password: newPassword,
      }),
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.messDev || 'Error changing operator password');
    }

    return data;
  } catch (error) {
    console.error('Error changing operator password:', error);
    throw error;
  }
};