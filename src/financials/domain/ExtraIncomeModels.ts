/* eslint-disable @typescript-eslint/no-explicit-any */

// Modelo para crear ingreso extra
export interface CreateExtraIncomeRequest {
  value: number;
  description: string;
  type: string;
  date: string; // formato: YYYY-MM-DD
}

// Modelo para actualizar ingreso extra
export interface UpdateExtraIncomeRequest {
  value?: number;
  description?: string;
  type?: string;
  date?: string;
  is_active?: boolean;
}

// Modelo para respuesta de ingreso extra individual
export interface ExtraIncome {
  id: number;
  value: number;
  description: string;
  type: string;
  date: string;
  is_active: boolean;
  updated_at: string;
}

// Modelo para respuesta paginada de ingresos extras
export interface ExtraIncomeListResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  count: number;
  next: string | null;
  previous: string | null;
  data: ExtraIncome[];
}

// Modelo para respuesta de crear/actualizar ingreso extra
export interface ExtraIncomeResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  data: ExtraIncome;
}

// Modelo para respuesta de eliminar
export interface ExtraIncomeDeleteResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  data: null;
}