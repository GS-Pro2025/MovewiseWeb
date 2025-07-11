export interface Person {
  email: string;
  first_name: string;
  last_name: string;
  phone: number;
  address: string;
}

export interface Operator {
  id_assign: number;
  date: string;
  code: string;
  salary: number;
  first_name: string;
  last_name: string;
  bonus: number | null;
  role: string;
}

export interface Vehicle {
  id_truck: number;
  number_truck: string;
  type: string;
  name: string;
  status: boolean;
  category: string;
}

export interface SummaryCost {
  expense: number;
  rentingCost: number;
  fuelCost: number;
  workCost: number;
  driverSalaries: number;
  otherSalaries: number;
  customer_factory: number;
  totalCost: number;
}

export interface OrderReportResult {
  key: string;
  key_ref: string;
  date: string;
  distance: number | null;
  expense: number | string | null;
  income: number | string | null;
  weight: string;
  status: string;
  payStatus: number | string | null;
  evidence: string | null;
  dispatch_ticket: string | null;
  dispatch_ticket_url: string | null;
  state_usa: string;
  person: Person;
  job: number;
  job_name: string;
  customer_factory: number;
  customer_factory_name: string;
  operators: Operator[];
  vehicles: Vehicle[];
  summaryCost: SummaryCost;
  created_by: string | null;
}

export interface OrdersReportResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrderReportResult[];
}