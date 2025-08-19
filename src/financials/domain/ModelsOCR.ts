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

export interface ProcessDocaiResponse {
  message?: string;
  ocr_content?: string;
  success?: boolean;
  data?: {
    updated_orders?: Array<{
      key_ref: string;
      orders_updated: number;
      income: number;
      payStatus: number;
    }>;
    not_found_orders?: string[];
    total_updated?: number;
    total_not_found?: number;
  };
}

export interface OCRResult {
  name: string;
  success: boolean;
  message: string;
  data?: {
    updated_orders?: Array<{
      key_ref: string;
      orders_updated: number;
      income: number;
      payStatus: number;
    }>;
    not_found_orders?: string[];
    total_updated?: number;
    total_not_found?: number;
  };
}