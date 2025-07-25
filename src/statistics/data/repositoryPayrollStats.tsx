/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';
import { payrollService } from '../../service/PayrollService';

export interface PayrollWeekStats {
  totalExpenses: number;
  grandTotal: number;
  totalOperators: number;
  paidOperators: number;
  unpaidOperators: number;
}

const API_BASE: string = import.meta.env.VITE_URL_BASE ?? "http://127.0.0.1:8000";

export async function fetchPayrollStatsForWeek(
  week: number, 
  year: number, 
  location: string = ""
): Promise<PayrollWeekStats> {
  try {
    // Reutilizar el servicio existente de payroll
    const response = await payrollService(week, year, location);
    
    // Procesar los datos similar a como lo haces en PayrollPage
    const operators = new Map<string, any>();
    
    // Agrupar operadores por código
    response.data.forEach((d) => {
      const key = d.code;
      if (!operators.has(key)) {
        operators.set(key, {
          code: d.code,
          total: 0,
          additionalBonuses: 0,
          expense: 0,
          grandTotal: 0,
          paymentIds: d.id_payment ? [d.id_payment] : [],
        });
      } else {
        const ex = operators.get(key)!;
        if (d.id_payment && !ex.paymentIds.includes(d.id_payment)) {
          ex.paymentIds.push(d.id_payment);
        }
      }
      
      const ex = operators.get(key)!;
      ex.additionalBonuses += Number(d.bonus) || 0;
    });

    // Obtener expenses de los payments
    const operatorArray = Array.from(operators.values());
    const uniquePaymentIds = new Set<string>();
    
    operatorArray.forEach(operator => {
      operator.paymentIds.forEach((payId: string) => {
        if (payId) uniquePaymentIds.add(payId);
      });
    });

    // Cargar expenses (simplificado - en producción usarías getPaymentById)
    const paymentCache = new Map<string, number>();
    
    for (const paymentId of uniquePaymentIds) {
      try {
        const token = Cookies.get('authToken');
        const res = await fetch(`${API_BASE}/payments/${paymentId}/`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          }
        });
        
        if (res.ok) {
          const paymentData = await res.json();
          paymentCache.set(paymentId, Number(paymentData.expense) || 0);
        }
      } catch (error) {
        console.error(`Error loading payment ${paymentId}:`, error);
        paymentCache.set(paymentId, 0);
      }
    }

    // Calcular totales finales
    let totalExpenses = 0;
    let grandTotal = 0;
    let paidOperators = 0;
    let unpaidOperators = 0;

    operatorArray.forEach(operator => {
      // Calcular expense total del operador
      let operatorExpense = 0;
      const processedPayments = new Set<string>();
      
      operator.paymentIds.forEach((payId: string) => {
        if (!processedPayments.has(payId)) {
          operatorExpense += paymentCache.get(payId) || 0;
          processedPayments.add(payId);
        }
      });
      
      operator.expense = operatorExpense;
      
      // Calcular días trabajados y total
      const daysWorked = 5; // Simplificado, podrías calcularlo basado en los datos reales
      operator.total = daysWorked * 100; // Simplificado
      
      // Grand total = total + bonuses - expenses
      operator.grandTotal = (operator.total || 0) + (operator.additionalBonuses || 0) - (operator.expense || 0);
      
      // Sumar a totales globales
      totalExpenses += operator.expense || 0;
      grandTotal += operator.grandTotal || 0;
      
      // Contar pagados vs no pagados
      if (operator.paymentIds.length > 0) {
        paidOperators++;
      } else {
        unpaidOperators++;
      }
    });

    return {
      totalExpenses,
      grandTotal,
      totalOperators: operatorArray.length,
      paidOperators,
      unpaidOperators
    };
    
  } catch (error) {
    console.error('Error fetching payroll stats:', error);
    throw new Error('Failed to fetch payroll statistics');
  }
}