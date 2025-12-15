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
  bonus: number;
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
  CommissionAmount?: string; // Legacy
  Amount?: string; // Nueva propiedad
}

// Modelo para órdenes duplicadas
export interface DuplicatedOrder {
  key_ref: string;
  count: number;
  total_amount: string;
  amount_per_order: string;
  type: string;
}

// Nuevo: Modelo para Other Transactions
export interface OtherTransaction {
  DocumentNumber: string;
  ItemDescription: string;
  Amount: string;
}

export interface ProcessDocaiResponse {
  message?: string;
  ocr_text?: string;
  success?: boolean;
  order_key?: string | null;
  parsed_orders?: ParsedOrder[];
  // Nueva estructura para Other Transactions
  other_transactions_data?: {
    processing_type: 'other_transactions';
    page_processed: number;
    document_date?: string;
    document_week?: number;
    parsed_transactions?: OtherTransaction[];
    save_summary?: {
      costs_created?: number;
      statements_created?: number;
      skipped_warehouse?: number;
      skipped_no_parentheses?: number;
      skipped_invalid_amount?: number;
      parsing_errors?: number;
      total_processed?: number;
      successfully_processed?: number;
    };
    status: 'completed' | 'failed';
    error?: string;
  };
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
  processMode?: 'save_only' | 'full_process';
  // Nueva estructura extendida
  processing_type?: 'regular_orders_only' | 'other_transactions' | 'mixed';
  other_transactions_page?: number;
  total_pages_scanned?: number;
  data?: {
    updated_orders?: Array<{
      key_ref: string;
      orders_updated: number;
      income: number;
      expense?: number;
      key?: string;
      amount_added?: string;
      type?: string;
      new_income?: string;
      new_expense?: string;
      factory?: string;
      orders_count?: number;
    }>;
    not_found_orders?: string[];
    total_updated?: number;
    total_not_found?: number;
    duplicated_orders?: Array<{
      key_ref: string;
      count: number;
      total_amount: string;
      amount_per_order: string;
      type: string;
    }>;
    total_duplicated?: number;
    statement_records_created?: number;
  };
  // Datos específicos de Other Transactions
  other_transactions_data?: {
    processing_type: 'other_transactions';
    page_processed: number;
    document_date?: string;
    document_week?: number;
    parsed_transactions?: OtherTransaction[];
    save_summary?: {
      costs_created?: number;
      statements_created?: number;
      skipped_warehouse?: number;
      skipped_no_parentheses?: number;
      skipped_invalid_amount?: number;
      parsing_errors?: number;
      total_processed?: number;
      successfully_processed?: number;
    };
    status: 'completed' | 'failed';
    error?: string;
  };
  ocr_text?: string;
  order_key?: string | null;
  parsed_orders?: Array<{
    OrderNumber: string;
    ShipperName: string;
    CommissionAmount?: string;
    Amount?: string;
  }>;
}