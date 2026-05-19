// ─── Config ───────────────────────────────────────────────────────────────────

export interface ReportConfig {
  report_type: 'orders' | 'operators';

  // orders
  order_fields?: string[];
  include_person?: boolean;
  person_fields?: string[];
  include_job?: boolean;
  include_customer_factory?: boolean;
  include_assigns?: boolean;
  assign_fields?: string[];
  include_costfuel?: boolean;
  include_tools?: boolean;
  status_filter?: string | null;
  pay_status_filter?: 0 | 1 | null;

  // operators
  operator_fields?: string[];
  include_assignments?: boolean;
  assignment_fields?: string[];
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface ReportTemplate {
  id: number;
  name: string;
  description: string | null;
  report_type: 'orders' | 'operators';
  config: ReportConfig;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ReportTemplateCreateInput {
  name: string;
  description?: string | null;
  report_type: 'orders' | 'operators';
  config: ReportConfig;
}

// ─── Generate ─────────────────────────────────────────────────────────────────

export interface GenerateRequest {
  template_id?: number;
  config?: ReportConfig;
  start_date: string;
  end_date: string;
  page_size?: number;
}

export interface ReportResult {
  report_type: 'orders' | 'operators';
  date_range: { start: string; end: string };
  total_records: number;
  data: Record<string, unknown>[];
}

// ─── Field metadata ───────────────────────────────────────────────────────────

export const ORDER_FIELDS = [
  'key', 'key_ref', 'date', 'income', 'expense',
  'weight', 'distance', 'status', 'payStatus', 'state_usa', 'address',
] as const;

export const ASSIGN_FIELDS = [
  'operator_name', 'operator_code', 'rol', 'salary', 'salary_type',
  'hourly_salary', 'truck_number', 'assigned_at', 'start_time', 'end_time', 'additional_costs',
] as const;

export const PERSON_FIELDS = [
  'first_name', 'last_name', 'phone', 'email', 'id_number',
] as const;

export const OPERATOR_FIELDS = [
  'code', 'first_name', 'last_name', 'id_number',
  'status', 'salary_type', 'salary', 'hourly_salary',
] as const;

export const ASSIGNMENT_FIELDS = [
  'order_key_ref', 'order_date', 'rol', 'salary', 'salary_type',
  'hourly_salary', 'truck_number', 'assigned_at', 'additional_costs',
] as const;

/** Human-readable column header for any field key */
export const FIELD_LABELS: Record<string, string> = {
  key: 'Key',
  key_ref: 'Order #',
  date: 'Date',
  income: 'Income',
  expense: 'Expense',
  weight: 'Weight',
  distance: 'Distance',
  status: 'Status',
  payStatus: 'Paid',
  state_usa: 'Location',
  address: 'Address',
  operator_name: 'Operator',
  operator_code: 'Code',
  rol: 'Role',
  salary: 'Salary',
  salary_type: 'Salary Type',
  hourly_salary: 'Hourly Salary',
  truck_number: 'Truck',
  assigned_at: 'Assigned At',
  start_time: 'Start Time',
  end_time: 'End Time',
  additional_costs: 'Additional Costs',
  first_name: 'First Name',
  last_name: 'Last Name',
  phone: 'Phone',
  email: 'Email',
  id_number: 'ID Number',
  cost_fuel_distributed: 'Fuel Cost',
  fuel_qty_distributed: 'Fuel (gal)',
  distance_distributed: 'Distance',
  tool_name: 'Tool',
  quantity: 'Qty',
  describe: 'Description',
  code: 'Code',
  order_key_ref: 'Order #',
  order_date: 'Order Date',
};

export const DEFAULT_ORDER_CONFIG: ReportConfig = {
  report_type: 'orders',
  order_fields: ['key_ref', 'date', 'income', 'expense', 'status', 'payStatus'],
  include_person: false,
  person_fields: [],
  include_job: false,
  include_customer_factory: false,
  include_assigns: false,
  assign_fields: [],
  include_costfuel: false,
  include_tools: false,
  status_filter: null,
  pay_status_filter: null,
};

export const DEFAULT_OPERATOR_CONFIG: ReportConfig = {
  report_type: 'operators',
  operator_fields: ['code', 'first_name', 'last_name', 'status', 'salary_type', 'salary'],
  include_assignments: false,
  assignment_fields: [],
  status_filter: null,
};
