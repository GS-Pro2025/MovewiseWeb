import type { OrderSummary } from '../domain/OrderSummaryModel';
import type { OperatorAssigned } from '../../addOperatorToOrder/domain/OperatorModels';

export interface ProportionalSalary {
  driverSalariesProportional: number;
  otherSalariesProportional: number;
}

/**
 * Computes proportional salary distribution for each order based on weight.
 *
 * When a salary_type='day' operator works on multiple orders the same day,
 * their daily salary (stored in full on each Assign) is redistributed
 * proportionally by each order's weight across all orders worked that day.
 *
 * Hourly operators (salary_type='hour' or null) are kept as-is because
 * their salary is already specific to each assignment.
 *
 * Edge case: if ALL orders for an operator on a given day have weight=0,
 * an equal split is applied instead of proportional.
 *
 * @param orders            - All OrderSummary items for the current week
 * @param assignmentsByOrder - Map from order.key → OperatorAssigned[] for that order
 * @returns Map from order.key → { driverSalariesProportional, otherSalariesProportional }
 */
export function computeProportionalSalaries(
  orders: OrderSummary[],
  assignmentsByOrder: Map<string, OperatorAssigned[]>,
): Map<string, ProportionalSalary> {
  // Build order weight lookup: order.key → weight
  const orderWeights = new Map<string, number>();
  for (const order of orders) {
    orderWeights.set(order.key, order.weight ?? 0);
  }

  // Group all assignments by (operatorId, date) across every order
  type AssignEntry = {
    orderKey: string;
    salary: number;
    salary_type: string | null | undefined;
    rol: string;
  };
  const operatorDayGroups = new Map<string, AssignEntry[]>();

  for (const [orderKey, operators] of assignmentsByOrder.entries()) {
    for (const op of operators) {
      // Normalize date: take only the YYYY-MM-DD part in case it includes time
      const date = op.assigned_at ? op.assigned_at.split('T')[0] : '';
      const groupKey = `${op.id}_${date}`;

      if (!operatorDayGroups.has(groupKey)) {
        operatorDayGroups.set(groupKey, []);
      }
      operatorDayGroups.get(groupKey)!.push({
        orderKey,
        salary: op.salary ?? 0,
        salary_type: op.salary_type,
        rol: op.rol,
      });
    }
  }

  // Initialize result map with zero values for every order that has assignments
  const result = new Map<string, ProportionalSalary>();
  for (const key of assignmentsByOrder.keys()) {
    result.set(key, { driverSalariesProportional: 0, otherSalariesProportional: 0 });
  }

  // Distribute each operator-day group across its orders
  for (const entries of operatorDayGroups.values()) {
    for (const entry of entries) {
      const current = result.get(entry.orderKey);
      if (!current) continue;

      let proportionalSalary: number;

      if (entry.salary_type === 'day') {
        // Redistribute proportionally by weight
        const totalWeight = entries.reduce(
          (sum, e) => sum + (orderWeights.get(e.orderKey) ?? 0),
          0,
        );
        const orderWeight = orderWeights.get(entry.orderKey) ?? 0;

        if (totalWeight > 0) {
          proportionalSalary = entry.salary * (orderWeight / totalWeight);
        } else {
          // All weights are 0 → equal split
          proportionalSalary = entry.salary / entries.length;
        }
      } else {
        // salary_type='hour' or null/undefined → already per-assignment, no redistribution
        proportionalSalary = entry.salary;
      }

      if (entry.rol === 'driver') {
        current.driverSalariesProportional += proportionalSalary;
      } else {
        current.otherSalariesProportional += proportionalSalary;
      }
    }
  }

  return result;
}
