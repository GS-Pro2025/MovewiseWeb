export interface PlanModel {
  id_plan: number;
  name: string;
  price: string;
  duration_months: number;
}

export interface SubscriptionDetailsModel {
  id_subscription: number;
  plan: PlanModel;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | string;
  purchase_token: string | null;
}

export interface CompanyModel {
  id: number;
  license_number: string;
  name: string;
  address: string;
  zip_code: string;
  subscription: number;
  subscription_details: SubscriptionDetailsModel | null;
  created_at: string;
}
