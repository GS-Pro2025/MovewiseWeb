import Cookies from 'js-cookie';

const API_URL = 
        import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

interface LoginResponse {
  token?: string;
  message?: string;
}

interface LoginResult {
  success: boolean;
  message: string;
}

export const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data: LoginResponse = await response.json();
    if (response.ok && data.token) {
      Cookies.set('authToken', data.token, { expires: 1 });
      return { success: true, message: 'Login exitoso' };
    } else {
      return { success: false, message: data.message || 'Credenciales incorrectas' };
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Error de conexión con el servidor' };
  }
};

export const isAuthenticated = (): boolean => {
  const token = Cookies.get('authToken');
  return !!token;
};
