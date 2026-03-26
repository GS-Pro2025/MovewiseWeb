// src/extraCost/domain/ExtraCostModel.ts

export interface ExtraCost {
  id_workCost: number;
  order: {
    key: string;
    key_ref: string;
    date: string;
    weight: string;
    status: string;
    state_usa: string;
    address: string;
    person: {
      email: string | null;
      first_name: string;
      last_name: string;
      phone: string;
      address: string;
    };
    job: number;
    job_name: string;
    customer_factory: number;
    customer_factory_name: string;
    distance: number | null;
    expense: string | null;
    income: string | null;
    payStatus: number | null;
    evidence: string | null;
    dispatch_ticket: string | null;
    dispatch_ticket_url: string | null;
    created_by: string | null;
  };
  name: string;
  cost: string;
  type: string;
  id_order: string;
  image: string | null;
  image_url: string | null;
}

export interface CreateExtraCostDTO {
  name: string;
  cost: number;
  type: string;
  id_order: string;
  image?: string | null;
}

export interface ExtraCostResponse {
  current_company_id: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: ExtraCost[];
}

// Interface TableData completa
export interface TableData {
  id: string;
  key_ref: string;
  firstName: string;
  lastName: string;
  email: string | null;  // ✅ Permitir null
  phone: string;          // ✅ Mantener como string (en ExtraCost es string, no null)
  company: string;
  customer_factory: number;
  city: string;
  state: string;
  weekday: string;
  dateReference: string;
  job: string;
  job_id: number;
  weight: string;
  truckType: string;
  distance: number;
  expense: number;
  income: number;
  totalCost: number;
  week: number;
  payStatus: number;
  status: "finished" | "pending" | "inactive";
  created_by: string | null;
  operators: string[];
  dispatch_ticket: string;
  // Campos específicos de ExtraCost
  extraCostName: string;
  extraCostType: string;
  extraCostCost: number;
}

// Función para normalizar el status
const normalizeStatus = (status: string): "finished" | "pending" | "inactive" => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'finished':
    case 'completed':
    case 'done':
      return 'finished';
    case 'inactive':
    case 'cancelled':
    case 'canceled':
      return 'inactive';
    case 'pending':
    case 'in_progress':
    case 'active':
    default:
      return 'pending';
  }
};

// Función para calcular la semana ISO
const getWeekOfYear = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export function mapExtraCostToTableData(extraCosts: ExtraCost[]): TableData[] {
  return extraCosts.map(cost => {
    const orderDate = new Date(cost.order.date);
    
    // Calcular totalCost sumando el costo del extraCost
    const extraCostAmount = parseFloat(cost.cost) || 0;
    const orderExpense = parseFloat(cost.order.expense || "0");
    const orderIncome = parseFloat(cost.order.income || "0");
    
    return {
      id: cost.id_order,
      key_ref: cost.order.key_ref,
      firstName: cost.order.person.first_name,
      lastName: cost.order.person.last_name,
      email: cost.order.person.email,  // ✅ Puede ser null, permitido
      phone: cost.order.person.phone,   // ✅ string, no null
      company: cost.order.customer_factory_name || "N/A",
      customer_factory: cost.order.customer_factory,
      city: cost.order.address || "N/A",
      state: cost.order.state_usa,
      weekday: orderDate.toLocaleDateString('es-ES', { weekday: 'long' }),
      dateReference: orderDate.toLocaleDateString(),
      job: String(cost.order.job),
      job_id: cost.order.job,
      weight: cost.order.weight,
      truckType: "N/A",
      distance: cost.order.distance || 0,
      expense: orderExpense,
      income: orderIncome,
      totalCost: extraCostAmount,  // ✅ El totalCost es el valor del extraCost
      week: getWeekOfYear(orderDate),
      payStatus: cost.order.payStatus === 1 ? 1 : 0,  // ✅ Comparar con número
      status: normalizeStatus(cost.order.status),
      created_by: cost.order.created_by || null,
      operators: [],
      dispatch_ticket: cost.order.dispatch_ticket || "",
      // Campos específicos de ExtraCost
      extraCostName: cost.name,
      extraCostType: cost.type,
      extraCostCost: extraCostAmount
    };
  });
}