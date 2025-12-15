import { OrderSummary } from './OrderSummaryModel';

export interface SuperOrder {
  key_ref: string;
  orders: OrderSummary[];
  client: string;
  expense: number;
  fuelCost: number;
  workCost: number;
  driverSalaries: number;
  otherSalaries: number;
  bonus: number;
  totalIncome: number;
  totalCost: number;
  totalProfit: number;
  payStatus: number;
}