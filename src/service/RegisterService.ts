/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';

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

// Nueva interfaz para la respuesta de verificación de licencia
export interface CheckLicenseResponse {
  status: boolean;
  exists: boolean;
  message: string;
  company_name: string | null;
  license_number: string;
}

// Helper function to normalize backend errors to frontend structure
function normalizeValidationErrors(backendErrors: any): ValidationErrors {
  const normalized: ValidationErrors = {};

  // Si hay errores de company directamente
  if (backendErrors.company) {
    normalized.company = {};
    Object.keys(backendErrors.company).forEach(key => {
      const value = backendErrors.company[key];
      // Convertir string a array si es necesario
      normalized.company![key as keyof typeof normalized.company] = 
        Array.isArray(value) ? value : [value];
    });
  }

  // Si hay errores de user directamente
  if (backendErrors.user) {
    normalized.user = {};
    Object.keys(backendErrors.user).forEach(key => {
      if (key === 'person' && typeof backendErrors.user.person === 'object') {
        // Manejar errores anidados de person
        normalized.user!.person = {};
        Object.keys(backendErrors.user.person).forEach(personKey => {
          const value = backendErrors.user.person[personKey];
          (normalized.user!.person as any)[personKey] = 
            Array.isArray(value) ? value : [value];
        });
      } else {
        // Errores de user de primer nivel (user_name, password, etc.)
        const value = backendErrors.user[key];
        (normalized.user as any)[key] = Array.isArray(value) ? value : [value];
      }
    });
  }

  // Si hay errores de 'person' directamente (sin user parent)
  // Este es el caso que está ocurriendo: { "person": { "email": "..." } }
  if (backendErrors.person && !backendErrors.user) {
    normalized.user = { person: {} };
    Object.keys(backendErrors.person).forEach(key => {
      const value = backendErrors.person[key];
      (normalized.user!.person as any)[key] = 
        Array.isArray(value) ? value : [value];
    });
  }

  // Si hay errores de primer nivel que coinciden con campos de user
  // (user_name, password, etc.)
  const userLevelFields = ['user_name', 'password'];
  userLevelFields.forEach(field => {
    if (backendErrors[field]) {
      if (!normalized.user) normalized.user = {};
      const value = backendErrors[field];
      (normalized.user as any)[field] = Array.isArray(value) ? value : [value];
    }
  });

  return normalized;
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
        // Normalizar errores del backend al formato esperado por el frontend
        const normalizedErrors = normalizeValidationErrors(data.errors);
        
        return {
          success: false,
          errorMessage: data.detail || 'Validation errors occurred',
          validationErrors: normalizedErrors,
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

// Nuevo servicio para verificar disponibilidad de licencia
export const checkCompanyLicense = async (
  licenseNumber: string
): Promise<CheckLicenseResponse> => {
  try {
    const response = await fetch(
      `${BASE_URL_API}/check-company-license/?license_number=${encodeURIComponent(licenseNumber)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP ${response.status}: License check failed`);
    }

    return data;
  } catch (err: any) {
    console.error('License check error:', err);
    
    // En caso de error de red, asumir que está disponible para no bloquear el registro
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      return {
        status: false,
        exists: false,
        message: 'Network error: Unable to verify license availability. Please try again.',
        company_name: null,
        license_number: licenseNumber
      };
    }

    throw err;
  }
};


export interface ValidateCompanyResponse {
  status: boolean;
  valid: boolean;
  company?: {
    license_number: string;
    name: string;
    address: string;
    zip_code: string;
  };
  license_exists?: boolean;
  message?: string;
  zip_code_normalized?: string;
  errors?: any;
  data?: any;
  errorMessage?: string;
}

/**
 * Validate company payload endpoint client
 * POST { company: { license_number, name, address, zip_code } }
 * Returns 200 with validation result or 400 with errors.
 * Just used in company update form.
 */
export const validateCompanyPayload = async (
  companyPayload: {
    license_number: string;
    name: string;
    address: string;
    zip_code: string;
  }
): Promise<ValidateCompanyResponse> => {
  try {
    const token = Cookies.get('authToken');
    const response = await fetch(`${BASE_URL_API}/check-company-payload/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ company: companyPayload }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400 && data.errors) {
        return {
          status: false,
          valid: false,
          errors: data.errors,
          data,
        };
      }
      return {
        status: false,
        valid: false,
        errorMessage: data.detail || data.message || `HTTP ${response.status}: Validation failed`,
        data,
      };
    }

    return {
      status: true,
      valid: data.valid ?? true,
      company: data.company ?? companyPayload,
      license_exists: data.license_exists ?? false,
      message: data.message,
      zip_code_normalized: data.zip_code_normalized,
      data,
    };
  } catch (err: any) {
    console.error('Company validation error:', err);
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      return {
        status: false,
        valid: false,
        errorMessage: 'Network error: Unable to connect to the server. Please try again.',
      };
    }
    return {
      status: false,
      valid: false,
      errorMessage: err?.message || 'Unexpected error during company validation',
    };
  }
};