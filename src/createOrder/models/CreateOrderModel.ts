export interface Person {
  first_name: string;
  last_name: string;
  address: string;
  email: string;
  phone: string;
}

export interface CreateOrderModel {
  date: string;
  key_ref: string;
  address: string;
  state_usa: string;
  status: 'pending' | 'inactive' | 'finished' | string; 
  paystatus: number; 
  person: Person;
  weight: number;
  job: number; 
  customer_factory: number;
  dispatch_ticket?: string; 
}

export interface OrderState {
  code: string;
  name: string;
}

export interface CustomerFactoryModel {
    id_factory: number;
    name: string;
}

// OCR types
export interface OcrWarning {
  field: string;
  problem: string;
  ocr_value?: string;
  matched_to?: string;
  similarity?: number;
  suggestion?: string;
}

export interface OcrOrderBody {
  job: { id: number; name: string };
  key_ref?: string;
  date?: string;
  weight?: number;
  state_usa?: string;
  customer_factory?: { id: number; name: string };
  person: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string;
    address: string;
  };
}

export interface OcrPreviewResponse {
  parsed_raw: Record<string, string | null>;
  order_body: OcrOrderBody;
  warnings: OcrWarning[];
}

export interface OrderCreated{
  key: string;
  key_ref: string;
  date: string;
  distance: number | null;
  expense: number | null;
  income: number | null;
  weight: string;
  status: 'Pending' | 'Inactive' | 'Finished';
  payStatus: number | null;
  evidence: string | null;
  dispatch_ticket: string | null;
  dispatch_ticket_url: string | null;
  state_usa: string;
  person: Person;
  job: number; 
  job_name?: string; 
  customer_factory: number; 
  customer_factory_name?: string;
}