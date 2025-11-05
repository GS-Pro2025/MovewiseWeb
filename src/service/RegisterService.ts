/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export interface RegisterCompanyData {
  company: {
    license_number: string;
    name: string;
    address: string;
    zip_code: string;
  };
  user: {
    user_name: string;
    password: string;
    person: {
      email: string;
      first_name: string;
      last_name: string;
      birth_date: string;
      phone: string;
      address: string;
      id_number: string;
      type_id: string;
    };
  };
  id_plan?: number; // Opcional ya que la API usa FREE PLAN por defecto
}

// Interfaces para errores estructurados
export interface ValidationErrors {
  company?: {
    license_number?: string[];
    name?: string[];
    address?: string[];
    zip_code?: string[];
  };
  user?: {
    user_name?: string[];
    password?: string[];
    person?: {
      email?: string[];
      first_name?: string[];
      last_name?: string[];
      id_number?: string[];
      type_id?: string[];
      birth_date?: string[];
      phone?: string[];
      address?: string[];
    };
  };
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: any;
  errorMessage?: string;
  validationErrors?: ValidationErrors;
}

export const registerWithCompany = async (
  registerData: RegisterCompanyData
): Promise<RegisterResponse> => {
  try {
    // Remover id_plan del payload ya que la API usa FREE PLAN automáticamente
    const { id_plan, ...payloadData } = registerData;
    console.log("id_plan", id_plan);
    const response = await fetch(`${BASE_URL_API}/registerWithCompany/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejar errores de validación estructurados (400)
      if (response.status === 400 && data.errors) {
        return {
          success: false,
          errorMessage: data.detail || 'Validation errors occurred',
          validationErrors: data.errors,
          data
        };
      }

      // Manejar otros errores (500, etc.)
      return {
        success: false,
        errorMessage: data.detail || data.message || `HTTP ${response.status}: Registration failed`,
        data
      };
    }

    return {
      success: true,
      message: data.message || 'Registration successful',
      data
    };
  } catch (err: any) {
    console.error('Registration error:', err);
    
    // Diferenciar entre errores de red y otros errores
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      return {
        success: false,
        errorMessage: 'Network error: Unable to connect to the server. Please check your connection and try again.',
      };
    }

    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred during registration',
    };
  }
};