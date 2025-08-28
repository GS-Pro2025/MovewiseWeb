/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrdersCountResponse, OrderCountDay, OrdersCountStats } from '../domain/OrdersCountModel';
import { WeeklyPaymentStatusResponse, PaymentStatusStats, PaymentStatusComparison } from '../domain/PaymentStatusModels';
import { OrdersWithClientResponse, WeeklyClientStats, ClientStats, ClientStatsComparison, FactoryStats } from '../domain/OrdersWithClientModels';
import Cookies from 'js-cookie';
import { OrdersBasicDataResponse } from '../domain/BasicOrdersDataModels';
import { OrdersPaidUnpaidWeekRangeResponse, WeeklyCount } from '../domain/OrdersPaidUnpaidModels';
import { OperatorWeeklyRanking } from '../domain/OperatorWeeklyRankingModels';
import { HistoricalJobWeightData, HistoricalJobWeightRequest, HistoricalJobWeightResponse, ProcessedHistoricalData, WeightRange } from '../domain/HistoricalJobWeightModels';

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

// Función para obtener datos de órdenes pagas/no pagas
export async function fetchWeeklyPaymentStatus(year: number, week: number): Promise<WeeklyPaymentStatusResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/order/weekly-paid-unpaid/?year=${year}&week=${week}`;
    const response = await fetch(url, {
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
      throw new Error(`Error fetching weekly payment status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching weekly payment status:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener el estado de pagos semanal'
    );
  }
}

// Función para procesar estadísticas de pagos
export function processPaymentStatusStats(data: WeeklyPaymentStatusResponse): PaymentStatusStats {
  const totalOrders = data.paid_orders.length + data.unpaid_orders.length;
  const paidOrders = data.paid_orders.length;
  const unpaidOrders = data.unpaid_orders.length;

  const paidPercentage = totalOrders > 0 ? Number(((paidOrders / totalOrders) * 100).toFixed(1)) : 0;
  const unpaidPercentage = totalOrders > 0 ? Number(((unpaidOrders / totalOrders) * 100).toFixed(1)) : 0;

  const paidIncome = data.paid_orders.reduce((sum, order) => sum + order.income, 0);
  const unpaidIncome = data.unpaid_orders.reduce((sum, order) => sum + order.income, 0);
  const totalIncome = paidIncome + unpaidIncome;

  return {
    totalOrders,
    paidOrders,
    unpaidOrders,
    paidPercentage,
    unpaidPercentage,
    totalIncome,
    paidIncome,
    unpaidIncome
  };
}

// Función para obtener comparación de pagos con semana anterior
export async function fetchPaymentStatusWithComparison(
  year: number, 
  week: number
): Promise<PaymentStatusComparison> {
  const { year: prevYear, week: prevWeek } = getPreviousWeek(year, week);
  
  const [currentData, previousData] = await Promise.all([
    fetchWeeklyPaymentStatus(year, week),
    fetchWeeklyPaymentStatus(prevYear, prevWeek)
  ]);

  const currentStats = processPaymentStatusStats(currentData);
  const previousStats = processPaymentStatusStats(previousData);

  const changes = {
    totalOrdersChange: calculatePercentageChange(currentStats.totalOrders, previousStats.totalOrders),
    paidOrdersChange: calculatePercentageChange(currentStats.paidOrders, previousStats.paidOrders),
    unpaidOrdersChange: calculatePercentageChange(currentStats.unpaidOrders, previousStats.unpaidOrders),
    paidPercentageChange: calculatePercentageChange(currentStats.paidPercentage, previousStats.paidPercentage)
  };

  return {
    currentStats,
    previousStats,
    changes
  };
}

// NUEVA: Función para obtener órdenes semanales with cliente
export async function fetchWeeklyOrdersWithClient(year: number, week: number): Promise<OrdersWithClientResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/orders-weekly-with-client/?year=${year}&week=${week}`;
    const response = await fetch(url, {
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
      throw new Error(`Error fetching weekly orders with client: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching weekly orders with client:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener las órdenes semanales con cliente'
    );
  }
}

//Función para procesar estadísticas de clientes
export function processClientStats(data: OrdersWithClientResponse): WeeklyClientStats {
  if (!data.data || data.data.length === 0) {
    return {
      totalClients: 0,
      activeClients: 0,
      totalFactories: 0,
      activeFactories: 0,
      topClients: [],
      topFactories: [],
      totalOrders: 0,
      averageOrdersPerClient: 0,
      averageOrdersPerFactory: 0
    };
  }

  // Agrupar órdenes por cliente
  const clientMap = new Map<string, ClientStats>();
  // Agrupar órdenes por factory
  const factoryMap = new Map<string, FactoryStats>();
  
  data.data.forEach((order) => {
    const clientName = order.client_name || 'Unknown Client';
    const factoryName = order.customer_factory || 'Unknown Factory';
    
    // Procesar estadísticas del cliente
    if (!clientMap.has(clientName)) {
      clientMap.set(clientName, {
        clientName,
        totalOrders: 0,
        factoriesServed: [],
        uniqueFactories: 0
      });
    }
    
    const client = clientMap.get(clientName)!;
    client.totalOrders += 1;
    
    // Agregar factory si no está en la lista
    if (!client.factoriesServed.includes(factoryName)) {
      client.factoriesServed.push(factoryName);
    }
    client.uniqueFactories = client.factoriesServed.length;

    // Procesar estadísticas de la factory
    if (!factoryMap.has(factoryName)) {
      factoryMap.set(factoryName, {
        factoryName,
        totalOrders: 0,
        clientsServed: [],
        uniqueClients: 0
      });
    }
    
    const factory = factoryMap.get(factoryName)!;
    factory.totalOrders += 1;
    
    // Agregar cliente si no está en la lista
    if (!factory.clientsServed.includes(clientName)) {
      factory.clientsServed.push(clientName);
    }
    factory.uniqueClients = factory.clientsServed.length;
  });

  const clients = Array.from(clientMap.values());
  const factories = Array.from(factoryMap.values());
  
  const activeClients = clients.filter(c => c.totalOrders > 0).length;
  const activeFactories = factories.filter(f => f.totalOrders > 0).length;
  
  // Top clientes por número de órdenes
  const topClients = clients
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5);

  // Top factories por número de órdenes
  const topFactories = factories
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5);

  const totalOrders = data.total_orders || data.data.length;
  const averageOrdersPerClient = activeClients > 0 ? totalOrders / activeClients : 0;
  const averageOrdersPerFactory = activeFactories > 0 ? totalOrders / activeFactories : 0;

  return {
    totalClients: clients.length,
    activeClients,
    totalFactories: factories.length,
    activeFactories,
    topClients,
    topFactories,
    totalOrders,
    averageOrdersPerClient: Number(averageOrdersPerClient.toFixed(2)),
    averageOrdersPerFactory: Number(averageOrdersPerFactory.toFixed(2))
  };
}

// ACTUALIZADA: Función para obtener comparación de estadísticas de clientes
export async function fetchClientStatsWithComparison(
  year: number, 
  week: number
): Promise<ClientStatsComparison> {
  const { year: prevYear, week: prevWeek } = getPreviousWeek(year, week);
  
  const [currentData, previousData] = await Promise.all([
    fetchWeeklyOrdersWithClient(year, week),
    fetchWeeklyOrdersWithClient(prevYear, prevWeek)
  ]);

  const currentStats = processClientStats(currentData);
  const previousStats = processClientStats(previousData);

  const changes = {
    totalClientsChange: calculatePercentageChange(currentStats.totalClients, previousStats.totalClients),
    activeClientsChange: calculatePercentageChange(currentStats.activeClients, previousStats.activeClients),
    totalFactoriesChange: calculatePercentageChange(currentStats.totalFactories, previousStats.totalFactories),
    totalOrdersChange: calculatePercentageChange(currentStats.totalOrders, previousStats.totalOrders)
  };

  return {
    currentStats,
    previousStats,
    changes
  };
}

export async function fetchOrdersBasicDataList(year: number, week: number): Promise<OrdersBasicDataResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  const url = `${BASE_URL_API}/orders-basic-data-list/?year=${year}&week=${week}`;
  const response = await fetch(url, {
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
    throw new Error(`Error fetching orders basic data list: ${response.statusText}`);
  }

  return await response.json();
}

// Función para obtener órdenes pagadas/no pagadas por rango de semanas
export async function fetchOrdersPaidUnpaidWeekRange(
  startWeek: number, 
  endWeek: number, 
  year: number
): Promise<OrdersPaidUnpaidWeekRangeResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/orders-paidUnpaidWeekRange/?start_week=${startWeek}&end_week=${endWeek}&year=${year}`;
    
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
      throw new Error(`Error fetching paid/unpaid orders week range: ${response.statusText}`);
    }

    const data: OrdersPaidUnpaidWeekRangeResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching paid/unpaid orders week range:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener las órdenes pagadas/no pagadas por rango de semanas'
    );
  }
}

// Función para procesar datos del gráfico paid unpaid orders
export function processPaidUnpaidChartData(data: OrdersPaidUnpaidWeekRangeResponse) {
  return data.weekly_counts.map((week: WeeklyCount) => ({
    week: week.week,
    paid: week.paid,
    unpaid: week.unpaid,
    total: week.paid + week.unpaid,
    paidPercentage: week.paid + week.unpaid > 0 ? (week.paid / (week.paid + week.unpaid)) * 100 : 0,
    unpaidPercentage: week.paid + week.unpaid > 0 ? (week.unpaid / (week.paid + week.unpaid)) * 100 : 0
  }));
}

// Función para obtener ranking semanal de operadores
export async function fetchWeeklyOperatorRanking(year: number, week: number): Promise<OperatorWeeklyRanking[]> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  const url = `${BASE_URL_API}/assign/weekly-operator-ranking/?year=${year}&week=${week}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Error fetching weekly operator ranking');
  return await response.json();
}

// Función para obtener datos históricos de job weight
export async function fetchHistoricalJobWeight(ranges: WeightRange[]): Promise<HistoricalJobWeightResponse> {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    const url = `${BASE_URL_API}/orders-historic-jobweigth/?mode=historic`;
    
    const requestBody: HistoricalJobWeightRequest = { ranges };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (response.status === 403) {
      Cookies.remove('authToken');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      throw new Error(`Error fetching historical job weight data: ${response.statusText}`);
    }

    const data: HistoricalJobWeightResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching historical job weight data:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener los datos históricos de job weight'
    );
  }
}

// Función para procesar datos históricos
export function processHistoricalJobWeightData(data: HistoricalJobWeightResponse): ProcessedHistoricalData[] {
  if (!data.data || data.data.length === 0) {
    return [];
  }

  // Agrupar por rango de peso
  const rangeMap = new Map<string, HistoricalJobWeightData[]>();
  
  data.data.forEach(item => {
    if (!rangeMap.has(item.weight_range)) {
      rangeMap.set(item.weight_range, []);
    }
    rangeMap.get(item.weight_range)!.push(item);
  });

  // Procesar cada rango
  const processedData: ProcessedHistoricalData[] = [];
  
  rangeMap.forEach((rangeData, weightRange) => {
    const totalOrdersInRange = rangeData.reduce((sum, item) => sum + item.orders_count, 0);
    const rangePercentage = data.total_orders > 0 ? (totalOrdersInRange / data.total_orders) * 100 : 0;
    
    const jobs = rangeData
      .filter(item => item.job !== null && item.orders_count > 0)
      .map(item => ({
        jobName: item.job || 'Unknown',
        averageIncome: item.average_income,
        ordersCount: item.orders_count,
        percentage: totalOrdersInRange > 0 ? (item.orders_count / totalOrdersInRange) * 100 : 0
      }))
      .sort((a, b) => b.ordersCount - a.ordersCount);

    processedData.push({
      weightRange,
      jobs,
      totalOrdersInRange,
      rangePercentage
    });
  });

  return processedData.sort((a, b) => b.totalOrdersInRange - a.totalOrdersInRange);
}
