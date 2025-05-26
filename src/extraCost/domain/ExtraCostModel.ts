export interface ExtraCost {
  id_workCost: number;
  order: {
    key: string;
    key_ref: string;
    date: string;
    weight: string;
    status: string;
    state_usa: string;
    person: {
      email: string;
      first_name: string;
      last_name: string;
    };
    job: number;
    distance: number | null;
    expense: number | null;
    income: number | null;
    payStatus: string | null;
    evidence: string | null;
    dispatch_ticket: string | null;
    dispatch_ticket_url: string | null;
  };
  name: string;
  cost: string;
  type: string;
  id_order: string;
}

export interface ExtraCostResponse {
  current_company_id: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    current_company_id: number;
    results: ExtraCost[];
  };
}