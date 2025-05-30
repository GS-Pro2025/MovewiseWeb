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
  code: string;
  salary: number;
  first_name: string;
  last_name: string;
  bonus: number | null;
  rol: string;
  address: string;
  company_id: number;
  company_name: string;
  email: string;
  identification: string;
  license_back: string | null;
  license_front: string | null;
  n_children: number;
  name_t_shift: string;
  number_licence: string;
  phone: number;
  photo: string | null;
  size_t_shift: string;
  status: string;
  additional_costs: number | null;
}

export interface OperatorAvailable {
  id: number;
  id_assign: number;
  assigned_at: string;
  code: string;
  salary: number;
  first_name: string;
  last_name: string;
  bonus: number | null;
  rol: string;
  address: string;
  company_id: number;
  company_name: string;
  email: string;
  identification: string;
  license_back: string | null;
  license_front: string | null;
  n_children: number;
  name_t_shift: string;
  number_licence: string;
  phone: number;
  photo: string | null;
  size_t_shift: string;
  status: string;
  additional_costs: number | null;
}
export interface Vehicle {
  id_truck: number;
  number_truck: string;
  type: string;
  name: string;
  status: boolean;
  category: string;
}

export interface OperatorsAvaliableAPIResponse {
  count: number;
  current_company_id: number;
  results: OperatorAvailable[];
}