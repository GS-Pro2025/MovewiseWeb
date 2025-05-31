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
