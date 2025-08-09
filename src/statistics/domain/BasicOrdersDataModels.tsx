export interface OrderBasicData {
  key: string;
  key_ref: string;
  date: string;
  status: string;
  payStatus: string | null;
  income: number | null;
  expense: number | null;
  weight: number;
  state_usa: string;
  person_name: string;
  job_name: string;
  customer_factory_name: string;
}

export interface OrdersBasicDataResponse {
  status: string;
  messDev: string;
  messUser: string;
  count: number;
  data: OrderBasicData[];
}