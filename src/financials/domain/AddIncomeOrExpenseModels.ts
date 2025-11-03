export interface AddAmountRequest {
  amount: number;
  key_ref: string;
}

export interface UpdatedItem {
  key: string;
  key_ref: string;
  // la respuesta puede incluir income o expense según el endpoint
  income?: number;
  expense?: number;
}

export interface AddAmountResponse {
  updated: UpdatedItem[];
}