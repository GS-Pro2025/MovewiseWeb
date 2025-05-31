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
}

export interface OrderState {
  code: string;
  name: string;
}

export interface CustomerFactoryModel {
    id_factory: number;
    name: string;
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