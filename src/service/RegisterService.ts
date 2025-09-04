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
  id_plan: number;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: any;
  errorMessage?: string;
}

export const registerWithCompany = async (
  registerData: RegisterCompanyData
): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${BASE_URL_API}/registerWithCompany/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        errorMessage: data.detail || data.message || 'Error during registration',
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
    return {
      success: false,
      errorMessage: err?.message || 'An unexpected error occurred during registration',
    };
  }
};