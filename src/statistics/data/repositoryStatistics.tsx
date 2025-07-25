import { OrdersCountResponse, OrderCountDay, OrdersCountStats } from '../domain/OrdersCountModel';
import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

// Función para obtener el conteo de órdenes por día (por MES, no por semana)
export const fetchOrdersCountPerDay = async (
  year: number, 
  month: number  // CAMBIO: ahora es month en lugar de week
): Promise<OrdersCountResponse> => {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }

  try {
    // CAMBIO: ahora usa month en lugar de week
    const url = `${BASE_URL_API}/orders-count-orders-per-day/${year}/${month}/`;
    
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
      throw new Error(`Error fetching orders count: ${response.statusText}`);
    }

    const data: OrdersCountResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching orders count:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener el conteo de órdenes'
    );
  }
};

// NUEVA: Función para convertir semana a mes
export const getMonthFromWeek = (year: number, week: number): number => {
  // Crear fecha del primer día de la semana
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
  const weekDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
  
  // Retornar el mes (1-12)
  return weekDate.getMonth() + 1;
};

// Función para procesar estadísticas considerando que son datos mensuales
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
  
  // CAMBIO: Calcular promedio sobre los días que realmente tienen datos
  const averagePerDay = daysWithOrders > 0 ? totalOrders / daysWithOrders : 0;
  
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
    totalDaysInPeriod: 7, // Mantenemos 7 para mostrar estadísticas de la semana
  };
};

// ACTUALIZADA: Función para obtener datos con estadísticas procesadas
export const fetchOrdersCountWithStats = async (
  year: number, 
  week: number
): Promise<{ response: OrdersCountResponse; stats: OrdersCountStats }> => {
  // Convertir semana a mes
  const month = getMonthFromWeek(year, week);
  
  // Obtener datos del mes completo
  const response = await fetchOrdersCountPerDay(year, month);
  
  // Procesar estadísticas
  const stats = processOrdersCountStats(response.data);
  
  return { response, stats };
};