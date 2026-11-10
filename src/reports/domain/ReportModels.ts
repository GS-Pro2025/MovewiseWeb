// ─── Rules ────────────────────────────────────────────────────────────────────

export type RuleLevel = 'order' | 'group';
export type RuleOp =
  | 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'ne' | 'between' | 'empty' | 'not_empty'
  | 'in' | 'contains';
export type GroupCombine = 'sum' | 'single';
export type RuleKind = 'number' | 'id' | 'text';

export interface ReportRule {
  field: string;
  op: RuleOp;
  /** number | text | [min, max] | list of ids/texts, depending on op */
  value?: string | number | (string | number)[];
  /** Compare against another numeric field (e.g. expense > income) instead of `value`. */
  value_field?: string;
  level: RuleLevel;
}

/** Fields a rule can target, and the level(s) they exist at. Mirrors the backend (ReportRules.py). */
export const RULE_FIELDS: Record<string, { kind: RuleKind; levels: RuleLevel[] }> = {
  income:           { kind: 'number', levels: ['order', 'group'] },
  expense:          { kind: 'number', levels: ['order', 'group'] },
  weight:           { kind: 'number', levels: ['order', 'group'] },
  distance:         { kind: 'number', levels: ['order', 'group'] },
  cost:             { kind: 'number', levels: ['order', 'group'] },
  profit:           { kind: 'number', levels: ['order', 'group'] },
  margin:           { kind: 'number', levels: ['order', 'group'] },
  salaries:         { kind: 'number', levels: ['order', 'group'] },
  order_count:      { kind: 'number', levels: ['group'] },
  customer_factory: { kind: 'id',     levels: ['order'] },
  job:              { kind: 'id',     levels: ['order'] },
  state_usa:        { kind: 'text',   levels: ['order'] },
  address:          { kind: 'text',   levels: ['order'] },
};

/** Operators that can compare a field against another field. */
export const COMPARE_OPS: RuleOp[] = ['lt', 'lte', 'gt', 'gte', 'eq', 'ne'];

export const RULE_OPS: Record<RuleKind, RuleOp[]> = {
  number: ['lt', 'lte', 'gt', 'gte', 'eq', 'ne', 'between', 'empty', 'not_empty'],
  id: ['eq', 'in'],
  text: ['contains', 'eq', 'in'],
};

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

  // rules (orders only)
  rules?: ReportRule[];
  rules_match?: 'all' | 'any';
  /** How income/expense of a reference are combined: add them up or take one (the max). */
  group_combine?: GroupCombine;

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
  // operators
  total_records?: number;
  // orders — super-order groups
  total_groups?: number;
  total_individual_orders?: number;
  data: Record<string, unknown>[];
}

// ─── Field metadata ───────────────────────────────────────────────────────────

export const ORDER_FIELDS = [
  'key', 'key_ref', 'date', 'income', 'expense',
  'weight', 'distance', 'status', 'payStatus', 'state_usa', 'address',
  // computed like Financials (salaries split by order weight)
  'cost', 'profit', 'margin', 'salaries',
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
  earnings: 'Earnings',
  ganancias: 'Earnings',
  net_income: 'Net Income',
  cost: 'Cost',
  profit: 'Result',
  margin: 'Margin %',
  salaries: 'Salaries (split)',
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
  rules: [],
  rules_match: 'all',
  group_combine: 'sum',
};

export const DEFAULT_OPERATOR_CONFIG: ReportConfig = {
  report_type: 'operators',
  operator_fields: ['code', 'first_name', 'last_name', 'status', 'salary_type', 'salary'],
  include_assignments: false,
  assignment_fields: [],
  status_filter: null,
};
