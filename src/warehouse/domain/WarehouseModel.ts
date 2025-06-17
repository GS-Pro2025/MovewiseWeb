export interface WorkhouseCreationOrderData {
    date: string;
    status: string;
    person_id: number;
    job: number;
    customer_factory: number;
    dispatch_ticket?: string | null;
}

export interface WorkhouseOrderData {
  key: string;
  key_ref: string;
  date: string;
  distance: number;
  expense: number;
  income: number;
  weight: number;
  status: string;
  payStatus: number;
  state_usa: string;
  person: number;
  job: number;
  job_name: string;
  evidence: string;
  dispatch_ticket?: string | null;
  customer_factory: number;
  customer_factory_name: string;
}

export interface WorkHouseResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WorkhouseOrderData[];
}