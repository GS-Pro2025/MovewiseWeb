// Interfaces del dominio para registrar operadores

export type IdentificationType =
  | 'passport'
  | 'drivers_license'
  | 'green_card'
  | 'id_number'
  | 'phone'
  | 'email'
  | 'sons'
  | 'photo'
  | 'license_front'
  | 'license_back'
  | 'zipcode';

export interface Son {
  name: string;
  birth_date: string; // formato 'yyyy-mm-dd'
  gender: 'M' | 'F' | 'O' | string;
}

export interface RegistryOperator {
  number_licence: string;
  code: string;
  n_children: number;
  size_t_shirt: string;
  name_t_shirt: string;
  salary: number;
  status: string;
  first_name: string;
  last_name: string;
  address: string;
  birth_date: string; // formato 'yyyy-mm-dd'
  type_id: IdentificationType;
  sons?: Son[]; // ejemplo: [{"name":"Hijo Uno","birth_date":"2015-06-15","gender":"M"}, ...]
  // Campos opcionales relacionados a identificaciones / medios (urls/base64/valores)
  phone?: string;
  email?: string;
  id_number?: string;
  passport?: string;
  drivers_license?: string;
  green_card?: string;
  photo?: string; // foto del operador
  license_front?: string; // imagen front de la licencia
  license_back?: string; // imagen back de la licencia
  zipcode?: string;
}