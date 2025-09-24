import { useState, useEffect } from 'react';
import { 
  fetchOrdersPaidUnpaidWeekRange, 
  fetchOrdersPaidUnpaidHistoric, 
  processPaidUnpaidChartData 
} from '../data/repositoryStatistics';
import { PaidUnpaidChartData, OrdersPaidUnpaidWeekRangeResponse } from '../domain/OrdersPaidUnpaidModels';

export interface DataMode {
  type: 'range' | 'historic';
  startWeek?: number;
  endWeek?: number;
  year: number;
}

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
  
  // Nuevo estado para el modo de datos
  const [dataMode, setDataMode] = useState<DataMode>({
    type: 'range',
    startWeek: initialStartWeek,
    endWeek: initialEndWeek,
    year: initialYear
  });

  // Actualiza los valores pendientes cuando cambian los definitivos
  useEffect(() => {
    setPendingStartWeek(startWeek);
    setPendingEndWeek(endWeek);
    
    // Actualizar dataMode cuando cambian los valores
    setDataMode({
      type: 'range',
      startWeek,
      endWeek,
      year
    });
  }, [startWeek, endWeek, year]);

  const loadPaidUnpaidData = async (mode?: DataMode) => {
    const currentMode = mode || dataMode;
    
    if (currentMode.type === 'range') {
      if (!currentMode.startWeek || !currentMode.endWeek || currentMode.startWeek > currentMode.endWeek) {
        setError('Invalid week range');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      let data: OrdersPaidUnpaidWeekRangeResponse;
      
      if (currentMode.type === 'historic') {
        data = await fetchOrdersPaidUnpaidHistoric();
      } else {
        data = await fetchOrdersPaidUnpaidWeekRange(
          currentMode.startWeek!, 
          currentMode.endWeek!, 
          currentMode.year
        );
      }
      
      const processedData = processPaidUnpaidChartData(data);
      
      setRawData(data);
      setChartData(processedData);
      
      // Actualizar dataMode si se pasó uno nuevo
      if (mode) {
        setDataMode(mode);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading paid/unpaid data');
      console.error('Error loading paid/unpaid data:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchToHistoricMode = () => {
    const newMode: DataMode = {
      type: 'historic',
      year // El año se mantiene por compatibilidad con el estado, pero no se usa en la API
    };
    loadPaidUnpaidData(newMode);
  };

  const switchToRangeMode = () => {
    const newMode: DataMode = {
      type: 'range',
      startWeek,
      endWeek,
      year
    };
    loadPaidUnpaidData(newMode);
  };

  // Effect para cargar datos iniciales
  useEffect(() => {
    loadPaidUnpaidData();
  }, []);

  // Effect para recargar automáticamente cuando cambian los parámetros
  useEffect(() => {
    // Solo recargar si no estamos ya cargando y los valores son válidos
    if (!loading && startWeek >= 1 && endWeek >= 1 && startWeek <= endWeek) {
      const newMode: DataMode = {
        type: 'range',
        startWeek,
        endWeek,
        year
      };
      loadPaidUnpaidData(newMode);
    }
  }, [year, startWeek, endWeek]); // Dependencias para auto-recarga

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
    dataMode,
    setYear,
    setStartWeek,
    setEndWeek,
    setPendingStartWeek,
    setPendingEndWeek,
    loadPaidUnpaidData,
    switchToHistoricMode,
    switchToRangeMode,
    handleTryAgain,
  };
};