export interface UpdateOrderData {
  key: string;
  state_usa: string;
  date: string | null;
  key_ref: string;
  person: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
  };
  job?: number;
  weight: string;
  distance?: number;
  expense?: number;
  income?: number;
  status?: string;
  payStatus?: number;
  customer_factory?: number;
  dispatch_ticket?: string;
}

export interface person {
    email: string;
    first_name: string;
    last_name: string;
    phone: number;
    address: string;
};

export interface UpdateOrderModalProps {
  visible?: boolean;
  onClose?: () => void;
  orderData: {
    key: string;
    state_usa: string;
    date: string | null;
    key_ref: string;
    person: {
      first_name: string;
      last_name: string;
      email: string;
      phone: number;
      address: string;
    };
    job?: number;
    weight: string;
    distance?: number;
    expense?: string;
    income?: string;
    status?: string;
    payStatus?: number;
    customer_factory?: number;
    dispatch_ticket?: string;
  };
}


export interface ErrorResponse {
  data: null;
  messDev: string;
  messUser: string;
  status: string;
}

export interface UpdatePaymentData{
  expense: number;
  income: number;
  payStatus: number;
}