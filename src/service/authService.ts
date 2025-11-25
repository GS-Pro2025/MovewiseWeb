/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

interface LoginResponse {
  token: string;
  refresh_token: string;
  isAdmin: boolean;
}

interface RefreshResponse {
  token: string;
  refresh_token: string;
}

interface LoginResult {
  success: boolean;
  message: string;
  isAdmin?: boolean;
}

// Configuración de cookies más segura
const COOKIE_OPTIONS = {
  expires: 7, // 7 días para refresh token
  secure: import.meta.env.PROD, // Solo HTTPS en producción
  sameSite: 'strict' as const,
  path: '/'
};

const ACCESS_TOKEN_OPTIONS = {
  expires: 1, // 1 día para access token
  secure: import.meta.env.PROD,
  sameSite: 'strict' as const,
  path: '/'
};

export const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data: LoginResponse = await response.json();
      
      // Almacenar ambos tokens
      Cookies.set('authToken', data.token, ACCESS_TOKEN_OPTIONS);
      Cookies.set('refreshToken', data.refresh_token, COOKIE_OPTIONS);
      
      // Almacenar información del usuario
      Cookies.set('isAdmin', String(data.isAdmin), COOKIE_OPTIONS);
      
      return { 
        success: true, 
        message: 'Login successful',
        isAdmin: data.isAdmin 
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        message: errorData.message || 'Incorrect email or password' 
      };
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Sorry, connection lost' };
  }
};

export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = Cookies.get('refreshToken');
  
  if (!refreshToken) {
    console.warn('No refresh token available');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/refresh-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.ok) {
      const data: RefreshResponse = await response.json();
      
      // Actualizar ambos tokens
      Cookies.set('authToken', data.token, ACCESS_TOKEN_OPTIONS);
      Cookies.set('refreshToken', data.refresh_token, COOKIE_OPTIONS);
      
      console.log('Access token refreshed successfully');
      return true;
    } else {
      console.warn('Failed to refresh token:', response.status);
      logout(); // Si falla el refresh, cerrar sesión
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    logout();
    return false;
  }
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const token = Cookies.get('authToken');
    const refreshToken = Cookies.get('refreshToken');
    
    if (!token || !refreshToken) {
      return false;
    }

    // Verificar expiración del access token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const bufferTime = 60; // 1 minuto de buffer
      
      if (payload.exp && payload.exp < (currentTime + bufferTime)) {
        // Token está por expirar, intentar renovarlo
        console.log('Access token expiring soon, will refresh on next request');
        return true; // Seguimos autenticados, el refresh se hará automáticamente
      }
    } catch (jwtError) {
      console.warn('Token no es un JWT válido:', jwtError);
    }

    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const logout = (): void => {
  Cookies.remove('authToken');
  Cookies.remove('refreshToken');
  Cookies.remove('isAdmin');
  
  if (typeof window !== 'undefined') {
    // Dispatch evento para limpiar estado global si usas Redux/Zustand
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    window.location.href = '/login';
  }
};

export const getToken = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return Cookies.get('authToken');
};

export const getRefreshToken = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return Cookies.get('refreshToken');
};

export const isAdmin = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return Cookies.get('isAdmin') === 'true';
};

// Variable para evitar múltiples refresh simultáneos
let refreshPromise: Promise<boolean> | null = null;

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No access token available');
  }

  // Verificar si el token está por expirar y renovarlo antes de la petición
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const bufferTime = 60; // 1 minuto de buffer
    
    if (payload.exp && payload.exp < (currentTime + bufferTime)) {
      console.log('Token expiring soon, refreshing...');
      
      // Evitar múltiples refresh simultáneos
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }
      
      const refreshSuccess = await refreshPromise;
      refreshPromise = null; // Reset
      
      if (!refreshSuccess) {
        throw new Error('Failed to refresh token');
      }
    }
  } catch (jwtError) {
    console.warn('Error parsing JWT:', jwtError);
  }

  // Usar Headers para manejo seguro y case-insensitive de campos
  const headers = new Headers(init.headers as HeadersInit);
  const currentToken = getToken();
  if (currentToken) headers.set('Authorization', `Bearer ${currentToken}`);

  // Detectar FormData para no forzar Content-Type
  const bodyIsFormData = init.body instanceof FormData;
  if (!bodyIsFormData && !headers.has('content-type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, { ...init, headers });

  // Si aún así obtenemos 401, intentar refresh una vez más
  if (response.status === 401) {
    console.log('Received 401, attempting token refresh...');
    
    const refreshSuccess = await refreshAccessToken();
    
    if (refreshSuccess) {
      // Reintentar la petición original con el nuevo token
      const newToken = getToken();
      const retryHeaders = new Headers(init.headers as HeadersInit);
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
      const retryBodyIsFormData = init.body instanceof FormData;
      if (!retryBodyIsFormData && !retryHeaders.has('content-type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }

      return fetch(input, { ...init, headers: retryHeaders });
    } else {
      // Si el refresh falló, cerrar sesión
      logout();
      throw new Error('Session expired');
    }
  }

  return response;
}

// Helper para peticiones GET simples
export async function get(url: string): Promise<Response> {
  return fetchWithAuth(url, { method: 'GET' });
}

// Helper para peticiones POST
export async function post(url: string, data?: any): Promise<Response> {
  return fetchWithAuth(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Helper para peticiones PUT
export async function put(url: string, data?: any): Promise<Response> {
  return fetchWithAuth(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Helper para peticiones DELETE
export async function del(url: string): Promise<Response> {
  return fetchWithAuth(url, { method: 'DELETE' });
}