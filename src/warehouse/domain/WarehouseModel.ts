export interface WorkhouseCreationOrderData {
    date: string;
    status: string;
    person_id: number;
    job: number;
    customer_factory: number;
    state_usa: string;
    dispatch_ticket?: string | null;
}
export interface WorkhousePerson {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}
export interface Person {
    email: string;
    first_name: string;
    last_name: string;
    phone: number;
    address: string;
};
export interface WorkhouseOrderData {
  key: string;
  key_ref: string;
  date: string;
  distance: number | undefined;
  expense: number | undefined;
  income: number | undefined;
  weight: string;
  status: string | undefined;
  payStatus: number | undefined;
  state_usa: string;
  person: Person;
  job: number |  undefined;
  dispatch_ticket?: string | undefined;
  customer_factory: number | undefined;
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