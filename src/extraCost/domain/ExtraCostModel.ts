import { TableData } from '../../Home/domain/TableData';

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
  results: ExtraCost[];
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
    
    return {
      id: cost.id_order,
      key_ref: cost.order.key_ref,
      firstName: cost.order.person.first_name,
      lastName: cost.order.person.last_name,
      email: cost.order.person.email,
      phone: 'N/A', // No disponible en ExtraCost
      company: 'N/A', // No disponible en ExtraCost
      customer_factory: 0, // Valor por defecto, se puede ajustar según necesidades
      city: 'N/A', // No disponible en ExtraCost
      state: cost.order.state_usa,
      weekday: orderDate.toLocaleDateString('es-ES', { weekday: 'long' }),
      dateReference: orderDate.toLocaleDateString(),
      job: String(cost.order.job),
      job_id: cost.order.job,
      weight: cost.order.weight,
      truckType: 'N/A', // No disponible en ExtraCost
      distance: cost.order.distance || 0,
      expense: cost.order.expense || 0,
      income: cost.order.income || 0,
      totalCost: parseFloat(cost.cost),
      week: getWeekOfYear(orderDate),
      payStatus: cost.order.payStatus === 'paid' ? 1 : 0,
      status: normalizeStatus(cost.order.status),
      created_by: null, // No disponible en ExtraCost
      operators: [], // No disponible en ExtraCost
      dispatch_ticket: cost.order.dispatch_ticket || '', // Agregado para cumplir con TableData
      // Propiedades adicionales específicas de ExtraCost
      extraCostName: cost.name,
      extraCostType: cost.type,
      extraCostCost: parseFloat(cost.cost)
    };
  });
}