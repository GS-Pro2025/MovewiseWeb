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

//  Modelo para órdenes actualizadas por OCR
export interface UpdatedOrderOCR {
  key_ref: string;
  orders_updated: number;
  income: number;
  expense?: number;
  key?: string;
  amount_added?: string;
  type?: string;
  new_income?: string;
  new_expense?: string;
}

// Modelo para órdenes parseadas
export interface ParsedOrder {
  OrderNumber: string;
  ShipperName: string;
  CommissionAmount: string;
}

// Modelo para órdenes duplicadas
export interface DuplicatedOrder {
  key_ref: string;
  count: number;
  total_amount: string;
  amount_per_order: string;
  type: string;
}

export interface ProcessDocaiResponse {
  message?: string;
  ocr_text?: string;
  success?: boolean;
  order_key?: string | null;
  parsed_orders?: ParsedOrder[];
  update_result?: {
    updated_orders?: UpdatedOrderOCR[];
    not_found_orders?: string[];
    total_updated?: number;
    total_not_found?: number;
    duplicated_orders?: DuplicatedOrder[];
    total_duplicated?: number;
  };
}

export interface OCRResult {
  name: string;
  success: boolean;
  message: string;
  ocr_text?: string;
  order_key?: string | null;
  parsed_orders?: ParsedOrder[];
  data?: {
    updated_orders?: UpdatedOrderOCR[];
    not_found_orders?: string[];
    total_updated?: number;
    total_not_found?: number;
    duplicated_orders?: DuplicatedOrder[];
    total_duplicated?: number;
  };
}