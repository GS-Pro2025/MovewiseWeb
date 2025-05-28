export interface UpdateOrderData {
key_ref: string;
date: string;
distance: number;
expense: string;
income: string;
weight: string;
status: string;
payStatus: number;
state_usa: string;
customer_factory: number;
person: person;
job: number;
dispatch_ticket?: string; // optional property
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
