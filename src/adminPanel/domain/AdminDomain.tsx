
export interface AdminUser {
  user_name: string;
  person: {
    email: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    phone: string;
    address: string;
    id_number: string;
    type_id: string;
    id_company: number;
  };
  photo: string | null;
  created_at: string;
  updated_at: string;
  is_active_user: boolean;
  person_id: number;
}

export interface CompanyUsersResponse {
  message: string;
  company_id: number;
  total_users: number;
  data: AdminUser[];
}