export interface Person {
  email: string;
  first_name: string;
  last_name: string;
  phone: number;
  address: string;
}
export interface OperatorAssigned {
  id: number; 
  id_assign: number;
  assigned_at: string;
  number_licence: string;
  code: string;
  n_children: number;
  size_t_shift: string;
  name_t_shift: string;
  salary: number;
  photo: string | null;
  license_front: string | null;
  license_back: string | null;
  status: string;
  additional_costs: number | null;
  rol: string;
  first_name: string;
  last_name: string;
  identification: string;
  email: string;
  phone: number;
  address: string;
  company_id: number;
  company_name: string;
}
export interface OperatorAvailable {
  id_operator: number;
  number_licence: string;
  code: string;
  n_children: number;
  size_t_shift: string;
  name_t_shift: string;
  salary: string; // <-- string, no number
  photo: string | null;
  license_front: string | null;
  license_back: string | null;
  status: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  type_id: string;
  id_number: string;
  address: string;
  phone: string; // <-- string, no number
  email: string;
  id_company: number;
  sons: Son[];
  is_freelance: boolean;
}
export interface Son {
  name: string;
  birth_date: string;
  gender: string;
}

export interface OperatorsAvaliableAPIResponse {
  count: number;
  results: OperatorAvailable[];
  current_company_id: number;
}
export interface Vehicle {
  id_truck: number;
  number_truck: string;
  type: string;
  name: string;
  status: boolean;
  category: string;
}

