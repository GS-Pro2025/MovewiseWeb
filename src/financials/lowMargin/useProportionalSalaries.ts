import { useEffect, useState } from 'react';
import { fetchOperatorsAssignedToOrder } from '../../addOperatorToOrder/data/repositoryOperators';
import type { OperatorAssigned } from '../../addOperatorToOrder/domain/OperatorModels';
import type { OrderSummary } from '../domain/OrderSummaryModel';
import { computeProportionalSalaries, type ProportionalSalary } from '../util/proportionalSalaryUtils';

const CONCURRENCY = 6;

/** Assignments by order key; survives tab switches. Cleared by `clearAssignmentsCache`. */
const cache = new Map<string, OperatorAssigned[]>();
export const clearAssignmentsCache = () => cache.clear();

export interface SalaryProgress {
  map: Map<string, ProportionalSalary> | null;
  done: number;
  total: number;
  failed: number;
}

/**
 * Loads each order's operators (a few requests at a time) and, once all are in,
 * splits day-rate salaries across orders by weight. `map` stays null until then,
 * so callers can show provisional numbers meanwhile.
 */
export const useProportionalSalaries = (orders: OrderSummary[], reloadToken: number): SalaryProgress => {
  const [state, setState] = useState<SalaryProgress>({ map: null, done: 0, total: 0, failed: 0 });

  useEffect(() => {
    let cancelled = false;
    const keys = orders.map(o => o.key);
    setState({ map: null, done: 0, total: keys.length, failed: 0 });
    if (keys.length === 0) return;

    let next = 0;
    let done = 0;
    let failed = 0;
    const failedKeys = new Set<string>();

    const worker = async () => {
      while (!cancelled) {
        const i = next++;
        if (i >= keys.length) return;
        const key = keys[i];
        if (!cache.has(key)) {
          try { cache.set(key, await fetchOperatorsAssignedToOrder(key)); }
          catch { failed++; failedKeys.add(key); }
        }
        done++;
        if (!cancelled && (done % 5 === 0 || done === keys.length)) setState(s => ({ ...s, done, failed }));
      }
    };

    Promise.all(Array.from({ length: Math.min(CONCURRENCY, keys.length) }, worker)).then(() => {
      if (cancelled) return;
      // Failed orders are left out so they keep the backend's own salary figures.
      const assigns = new Map<string, OperatorAssigned[]>();
      keys.forEach(k => { const v = cache.get(k); if (v && !failedKeys.has(k)) assigns.set(k, v); });
      setState({ map: computeProportionalSalaries(orders, assigns), done: keys.length, total: keys.length, failed });
    });

    return () => { cancelled = true; };
  }, [orders, reloadToken]);

  return state;
};
