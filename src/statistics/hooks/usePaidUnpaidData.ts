import { useState, useEffect } from 'react';
import { fetchOrdersPaidUnpaidWeekRange, processPaidUnpaidChartData } from '../data/repositoryStatistics';
import { PaidUnpaidChartData, OrdersPaidUnpaidWeekRangeResponse } from '../domain/OrdersPaidUnpaidModels';

export const usePaidUnpaidData = (initialYear: number, initialStartWeek: number, initialEndWeek: number) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<PaidUnpaidChartData[]>([]);
  const [rawData, setRawData] = useState<OrdersPaidUnpaidWeekRangeResponse | null>(null);
  
  // Estados para los filtros
  const [year, setYear] = useState<number>(initialYear);
  const [startWeek, setStartWeek] = useState<number>(initialStartWeek);
  const [endWeek, setEndWeek] = useState<number>(initialEndWeek);

  const [pendingStartWeek, setPendingStartWeek] = useState<number>(startWeek);
  const [pendingEndWeek, setPendingEndWeek] = useState<number>(endWeek);

  // Actualiza los valores pendientes cuando cambian los definitivos
  useEffect(() => {
    setPendingStartWeek(startWeek);
    setPendingEndWeek(endWeek);
  }, [startWeek, endWeek]);

  const loadPaidUnpaidData = async () => {
    if (startWeek > endWeek) {
      setError('Start week cannot be greater than end week');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchOrdersPaidUnpaidWeekRange(startWeek, endWeek, year);
      const processedData = processPaidUnpaidChartData(data);
      
      setRawData(data);
      setChartData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading paid/unpaid data');
      console.error('Error loading paid/unpaid data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaidUnpaidData();
  }, [year, startWeek, endWeek]);

  const handleTryAgain = () => {
    setError(null);
    loadPaidUnpaidData();
  };

  return {
    loading,
    error,
    chartData,
    rawData,
    year,
    startWeek,
    endWeek,
    pendingStartWeek,
    pendingEndWeek,
    setYear,
    setStartWeek,
    setEndWeek,
    setPendingStartWeek,
    setPendingEndWeek,
    loadPaidUnpaidData,
    handleTryAgain,
  };
};