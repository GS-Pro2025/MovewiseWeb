export interface Son {
  name: string;
  birth_date: string;
  gender: 'M' | 'F';
}

export interface Operator {
  id_operator: number;
  number_licence: string;
  code: string;
  n_children: number;
  size_t_shift: string;
  name_t_shift: string;
  salary: string;
  photo: string | null;
  license_front: string | null;
  license_back: string | null;
  status: 'active' | 'inactive';
  first_name: string;
  last_name: string;
  birth_date: string;
  type_id: string;
  id_number: string;
  address: string;
  phone: string;
  email: string;
  id_company: number;
  sons: Son[];
}

export interface OperatorsResponse {
  count: number;
  results: Operator[];
  current_company_id: number;
}