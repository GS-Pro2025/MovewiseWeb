import { UpdateOrderData } from "../domain/ModelOrderUpdate";
import { WorkhouseOrderData } from "../domain/WarehouseModel";

export function parseWarehouseToUpdateOrder(order: WorkhouseOrderData | null | undefined): UpdateOrderData | null {
    if (!order) return null;
    const result: UpdateOrderData = {
    key: order.key,
    key_ref: order.key_ref,
    date: order.date ?? "",
    weight: order.weight !== undefined && order.weight !== null ? String(order.weight) : "",
    state_usa: order.state_usa ?? "",
    person: {
      first_name: order.person?.first_name ?? "",
      last_name: order.person?.last_name ?? "",
      email: order.person?.email ?? "",
      phone: order.person?.phone !== undefined && order.person?.phone !== null ? String(order.person.phone) : "",
      address: order.person?.address ?? "",
    },
  };

  if (order.job !== undefined) result.job = order.job;
  if (order.distance !== undefined) result.distance = order.distance;
  if (order.expense !== undefined) result.expense = order.expense;
  if (order.income !== undefined) result.income = order.income;
  if (order.status !== undefined) result.status = order.status;
  if (order.payStatus !== undefined) result.payStatus = order.payStatus;
  if (order.customer_factory !== undefined) result.customer_factory = order.customer_factory;
  if (order.dispatch_ticket !== undefined) result.dispatch_ticket = order.dispatch_ticket;

  return result;
}
