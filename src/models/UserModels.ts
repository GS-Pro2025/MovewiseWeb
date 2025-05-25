export interface Person {
  email: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: number;
  address: string;
  id_number: string;
  type_id: string;
  id_company: number;
}

export interface UserProfile {
  user_name: string;
  person: Person;
  created_at: string;
  updated_at: string;
}