import { OrderSummary } from "./OrderSummaryModel";

export interface SuperOrder {
  key_ref: string;
  orders: OrderSummary[];
  client: string;
  expense: number;
  fuelCost: number;
  workCost: number;
  driverSalaries: number;
  otherSalaries: number;
  totalIncome: number;
  totalCost: number;
  totalProfit: number;
  payStatus: number;
}

// Modelo para órdenes actualizadas por OCR (sin payStatus)
export interface UpdatedOrderOCR {
  key_ref: string;
  orders_updated: number;
  income: number;
  expense?: number;
}

export interface ProcessDocaiResponse {
  message?: string;
  ocr_text?: string;
  success?: boolean;
  order_key?: string | null;
  update_result?: {
    updated_orders?: UpdatedOrderOCR[];
    not_found_orders?: string[];
    total_updated?: number;
    total_not_found?: number;
  };
}

export interface OCRResult {
  name: string;
  success: boolean;
  message: string;
  ocr_text?: string;
  order_key?: string | null;
  data?: {
    updated_orders?: UpdatedOrderOCR[];
    not_found_orders?: string[];
    total_updated?: number;
    total_not_found?: number;
  };
}