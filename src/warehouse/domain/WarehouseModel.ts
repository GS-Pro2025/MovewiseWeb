export interface WorkhouseCreationOrderData {
    date: string;
    status: string;
    person_id: number;
    job: number;
    customer_factory: number;
    dispatch_ticket?: string | null;
}
export interface WorkhousePerson {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}

export interface WorkhouseOrderData {
  key: string;
  key_ref: string;
  date: string;
  distance: number | null;
  expense: number | null;
  income: number | null;
  weight: number | null;
  status: string;
  payStatus: number | null;
  state_usa: string | null;
  person: WorkhousePerson;
  job: number;
  job_name: string;
  evidence: string | null;
  dispatch_ticket?: string | null;
  dispatch_ticket_url?: string | null;
  customer_factory: number;
  customer_factory_name: string;
}

export interface WorkHouseResponseData {
  count: number;
  next: string | null;
  previous: string | null;
  results: WorkhouseOrderData[];
}

export interface WorkHouseResponse {
  status: string;
  messDev: string;
  messUser: string;
  current_company_id: number;
  data: WorkHouseResponseData;
}