import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

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
      // Configuración más robusta de cookies
      Cookies.set('authToken', data.token, { 
        expires: 1,
        secure: true,
        sameSite: 'strict'
      });
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
  // Verificación más robusta para SSR/hidratación
  if (typeof window === 'undefined') {
    return false; // En el servidor, siempre false
  }
  
  try {
    const token = Cookies.get('authToken');
    
    if (!token) {
      return false;
    }

    // Opcional: Verificar expiración del token JWT
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        logout(); // Token expirado, remover
        return false;
      }
    } catch (jwtError) {
      // Si no es un JWT válido, pero existe el token, mantenerlo
      console.warn('Token no es un JWT válido, pero se mantiene');
    }

    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const logout = (): void => {
  Cookies.remove('authToken');
  // Opcional: Limpiar otros datos del usuario
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getToken = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return Cookies.get('authToken');
};