/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrdersCountResponse, OrderCountDay, OrdersCountStats } from '../domain/OrdersCountModel';
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

// NUEVA: Función para obtener datos por semana directamente
export const fetchOrdersCountByWeek = async (
  year: number, 
  week: number
): Promise<OrdersCountResponse> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/orders-count-orders-per-day/${year}/?filter_type=week&week=${week}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error(`Error fetching weekly orders count: ${response.statusText}`);
    }

    const data: OrdersCountResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weekly orders count:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener el conteo de órdenes semanal'
    );
  }
};

// NUEVA: Función para obtener la semana anterior
export const getPreviousWeek = (year: number, week: number): { year: number; week: number } => {
  if (week === 1) {
    // Si es la primera semana del año, ir a la última semana del año anterior
    // Calcular cuántas semanas tiene el año anterior
    const lastWeekOfPrevYear = getWeeksInYear(year - 1);
    return { year: year - 1, week: lastWeekOfPrevYear };
  }
  return { year, week: week - 1 };
};

// NUEVA: Función para calcular cuántas semanas tiene un año
const getWeeksInYear = (year: number): number => {
  const lastDay = new Date(year, 11, 31); // 31 de diciembre
  const lastWeek = getWeekOfYear(lastDay);
  return lastWeek;
};

// NUEVA: Función para obtener semana del año
const getWeekOfYear = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// ACTUALIZADA: Función para procesar estadísticas semanales
export const processOrdersCountStats = (
  ordersData: OrderCountDay[]
): OrdersCountStats => {
  if (!ordersData || ordersData.length === 0) {
    return {
      totalOrders: 0,
      averagePerDay: 0,
      peakDay: null,
      lowDay: null,
      daysWithOrders: 0,
      totalDaysInPeriod: 7,
    };
  }

  const totalOrders = ordersData.reduce((sum, day) => sum + day.count, 0);
  const daysWithOrders = ordersData.length;
  
  // Promedio sobre 7 días de la semana
  const averagePerDay = totalOrders / 7;
  
  const peakDay = ordersData.reduce((max, day) => 
    day.count > (max?.count || 0) ? day : max
  );
  
  const lowDay = ordersData.reduce((min, day) => 
    day.count < (min?.count || Infinity) ? day : min
  );

  return {
    totalOrders,
    averagePerDay: Number(averagePerDay.toFixed(2)),
    peakDay,
    lowDay,
    daysWithOrders,
    totalDaysInPeriod: 7,
  };
};

// NUEVA: Función para calcular el cambio porcentual
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

// ACTUALIZADA: Función para obtener estadísticas con comparación SEMANAL
export const fetchOrdersCountWithComparison = async (
  year: number, 
  week: number
): Promise<{ 
  currentStats: OrdersCountStats; 
  previousStats: OrdersCountStats;
  comparison: {
    totalOrdersChange: number;
    averagePerDayChange: number;
    peakDayChange: number;
    activeDaysChange: number;
  };
  currentFilter: any;
  previousFilter: any;
}> => {
  // Obtener la semana actual y anterior
  const { year: prevYear, week: prevWeek } = getPreviousWeek(year, week);
  
  console.log(`Comparing weeks: current week ${week}/${year} vs previous week ${prevWeek}/${prevYear}`);
  
  // Hacer ambas peticiones en paralelo
  const [currentResponse, previousResponse] = await Promise.all([
    fetchOrdersCountByWeek(year, week),
    fetchOrdersCountByWeek(prevYear, prevWeek)
  ]);
  
  console.log('Current week response:', currentResponse);
  console.log('Previous week response:', previousResponse);
  
  // Procesar estadísticas
  const currentStats = processOrdersCountStats(currentResponse.data);
  const previousStats = processOrdersCountStats(previousResponse.data);
  
  console.log('Current week stats:', currentStats);
  console.log('Previous week stats:', previousStats);
  
  // Calcular comparaciones
  const comparison = {
    totalOrdersChange: calculatePercentageChange(currentStats.totalOrders, previousStats.totalOrders),
    averagePerDayChange: calculatePercentageChange(currentStats.averagePerDay, previousStats.averagePerDay),
    peakDayChange: calculatePercentageChange(
      currentStats.peakDay?.count || 0, 
      previousStats.peakDay?.count || 0
    ),
    activeDaysChange: calculatePercentageChange(currentStats.daysWithOrders, previousStats.daysWithOrders)
  };
  
  return { 
    currentStats, 
    previousStats, 
    comparison,
    currentFilter: currentResponse.filter,
    previousFilter: previousResponse.filter
  };
};

// MANTENEMOS las funciones anteriores para compatibilidad
export const getMonthFromWeek = (year: number, week: number): number => {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
  const weekDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
  return weekDate.getMonth() + 1;
};
export interface WeeklyOrderProfit {
  order_id: string;
  operator_payments: number;
  total_expenses: number;
  costfuel_expenses: number;
  order_expense: number;
  additional_costs: number;
  total_cost: number;
  income: number;
  net_profit: number;
}

export async function fetchWeeklyProfitReport(year: number, week: number): Promise<WeeklyOrderProfit[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const url = `${BASE_URL_API}/assign/weekly-profit-report/?year=${year}&week=${week}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Error fetching weekly profit report');
  return await response.json();
}