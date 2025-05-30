export interface Person {
  email: string;
  first_name: string;
  last_name: string;
  phone: number;
  address: string;
}

export interface Operator {
  id_operator: number;
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
