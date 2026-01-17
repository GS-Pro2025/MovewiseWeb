export interface AssignmentResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: Assignment[];
}

export interface Assignment {
  id: number;
  operator: number;
  order: string;
  data_order: DataOrder;
  truck: number | null;
  assigned_at: string;
  rol: string;
  additional_costs: number | null;
  start_time: string | null;
  end_time: string | null;
  location_start: string | null;
  location_end: string | null;
  status_order: string;
}

export interface DataOrder {
  key: string;
  key_ref: string;
  date: string;
  distance: number;
  expense: string;
  income: string;
  weight: string;
  status: string;
  payStatus: number;
  state_usa: string;
  id_company: number;
  person: Person;
  job: number;
  assign: number[];
}

export interface Person {
  first_name: string;
  last_name: string;
  email: string;
}

export interface CreateAssignmentData {
    operator: number;
    truck?: number | null;
    order: string;
    assigned_at: string;
    additional_costs: string;
    rol: string;
}