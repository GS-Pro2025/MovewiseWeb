import { useState, useEffect, useRef, useCallback } from 'react';
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

// Helper para validar parámetros
const isValidWeekParams = (startWeek: number | undefined, endWeek: number | undefined, year: number | undefined): boolean => {
  if (startWeek === undefined || endWeek === undefined || year === undefined) return false;
  if (typeof startWeek !== 'number' || typeof endWeek !== 'number' || typeof year !== 'number') return false;
  if (isNaN(startWeek) || isNaN(endWeek) || isNaN(year)) return false;
  if (startWeek < 1 || startWeek > 53 || endWeek < 1 || endWeek > 53) return false;
  if (startWeek > endWeek) return false;
  if (year < 2000 || year > 2100) return false;
  return true;
};

// Helper para calcular semana actual ISO
const getCurrentISOWeek = (): number => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const usePaidUnpaidData = (initialYear: number, initialStartWeek: number, initialEndWeek: number) => {
  // Calcular defaults seguros
  const currentYear = new Date().getFullYear();
  const currentWeek = getCurrentISOWeek();
  
  // Función para obtener valor seguro
  const getSafeYear = (val: number | undefined | null): number => {
    if (typeof val === 'number' && !isNaN(val) && val >= 2000 && val <= 2100) return val;
    return currentYear;
  };
  
  const getSafeWeek = (val: number | undefined | null, defaultVal: number): number => {
    if (typeof val === 'number' && !isNaN(val) && val >= 1 && val <= 53) return val;
    return Math.max(1, Math.min(53, defaultVal));
  };

  // Valores iniciales seguros
  const safeInitialYear = getSafeYear(initialYear);
  const safeInitialStartWeek = getSafeWeek(initialStartWeek, Math.max(1, currentWeek - 5));
  const safeInitialEndWeek = getSafeWeek(initialEndWeek, currentWeek);

  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<PaidUnpaidChartData[]>([]);
  const [rawData, setRawData] = useState<OrdersPaidUnpaidWeekRangeResponse | null>(null);
  
  const [year, setYear] = useState<number>(safeInitialYear);
  const [startWeek, setStartWeek] = useState<number>(safeInitialStartWeek);
  const [endWeek, setEndWeek] = useState<number>(safeInitialEndWeek);
  const [pendingStartWeek, setPendingStartWeek] = useState<number>(safeInitialStartWeek);
  const [pendingEndWeek, setPendingEndWeek] = useState<number>(safeInitialEndWeek);
  
  const [dataMode, setDataMode] = useState<DataMode>({
    type: 'range',
    startWeek: safeInitialStartWeek,
    endWeek: safeInitialEndWeek,
    year: safeInitialYear
  });

  const initialLoadDone = useRef(false);
  const isLoadingRef = useRef(false);

  // Refs para mantener valores actuales - inicializados con valores seguros
  const yearRef = useRef<number>(safeInitialYear);
  const startWeekRef = useRef<number>(safeInitialStartWeek);
  const endWeekRef = useRef<number>(safeInitialEndWeek);

  // Actualizar refs cuando cambian los valores de estado
  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  useEffect(() => {
    startWeekRef.current = startWeek;
  }, [startWeek]);

  useEffect(() => {
    endWeekRef.current = endWeek;
  }, [endWeek]);

  // Sincronizar pending values y dataMode
  useEffect(() => {
    setPendingStartWeek(startWeek);
    setPendingEndWeek(endWeek);
    
    setDataMode({
      type: 'range',
      startWeek,
      endWeek,
      year
    });
  }, [startWeek, endWeek, year]);

  const loadPaidUnpaidData = useCallback(async (mode?: DataMode) => {
    // Evitar llamadas concurrentes
    if (isLoadingRef.current) {
      console.debug('loadPaidUnpaidData: already loading, skipping');
      return;
    }

    // Si no se pasa mode, construir uno con los valores actuales de los refs
    // Asegurarse de que los valores sean válidos
    const sw = mode?.startWeek ?? startWeekRef.current;
    const ew = mode?.endWeek ?? endWeekRef.current;
    const yr = mode?.year ?? yearRef.current;

    const currentMode: DataMode = mode || {
      type: 'range',
      startWeek: sw,
      endWeek: ew,
      year: yr
    };
    
    console.debug('loadPaidUnpaidData called with mode:', currentMode);

    // Validación para modo range
    if (currentMode.type === 'range') {
      const validateSW = currentMode.startWeek;
      const validateEW = currentMode.endWeek;
      const validateYR = currentMode.year;

      if (!isValidWeekParams(validateSW, validateEW, validateYR)) {
        console.error('loadPaidUnpaidData: invalid parameters', {
          startWeek: validateSW,
          endWeek: validateEW,
          year: validateYR
        });
        setError('Invalid week or year parameters');
        return;
      }
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      let data: OrdersPaidUnpaidWeekRangeResponse;
      
      if (currentMode.type === 'historic') {
        data = await fetchOrdersPaidUnpaidHistoric();
      } else {
        // Ya validamos arriba, así que sabemos que estos valores son válidos
        data = await fetchOrdersPaidUnpaidWeekRange(
          currentMode.startWeek!, 
          currentMode.endWeek!, 
          currentMode.year
        );
      }
      
      const processedData = processPaidUnpaidChartData(data);
      
      setRawData(data);
      setChartData(processedData);
      
      if (mode) {
        setDataMode(mode);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading paid/unpaid data';
      setError(errorMessage);
      console.error('Error loading paid/unpaid data:', err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // Sin dependencias - usa refs

  const switchToHistoricMode = useCallback(() => {
    const newMode: DataMode = {
      type: 'historic',
      year: yearRef.current
    };
    loadPaidUnpaidData(newMode);
  }, [loadPaidUnpaidData]);

  const switchToRangeMode = useCallback(() => {
    const sw = startWeekRef.current;
    const ew = endWeekRef.current;
    const yr = yearRef.current;
    
    if (!isValidWeekParams(sw, ew, yr)) {
      setError('Invalid week parameters for range mode');
      return;
    }
    const newMode: DataMode = {
      type: 'range',
      startWeek: sw,
      endWeek: ew,
      year: yr
    };
    loadPaidUnpaidData(newMode);
  }, [loadPaidUnpaidData]);

  // Effect para cargar datos iniciales - solo una vez con valores seguros ya calculados
  useEffect(() => {
    if (!initialLoadDone.current) {
      // Usar los valores safe que ya calculamos al inicio del hook
      if (isValidWeekParams(safeInitialStartWeek, safeInitialEndWeek, safeInitialYear)) {
        initialLoadDone.current = true;
        
        const initialMode: DataMode = {
          type: 'range',
          startWeek: safeInitialStartWeek,
          endWeek: safeInitialEndWeek,
          year: safeInitialYear
        };
        
        console.debug('Initial load with safe params:', initialMode);
        loadPaidUnpaidData(initialMode);
      } else {
        console.error('Initial params are still invalid after safety checks:', {
          safeInitialStartWeek,
          safeInitialEndWeek,
          safeInitialYear
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Effect para recargar datos cuando cambian year, startWeek o endWeek
  useEffect(() => {
    if (initialLoadDone.current && !isLoadingRef.current) { 
      if (isValidWeekParams(startWeek, endWeek, year)) {
        console.debug('Week/Year changed, reloading data:', { year, startWeek, endWeek });
        loadPaidUnpaidData({
          type: 'range',
          startWeek,
          endWeek,
          year
        });
      }
    }
  }, [startWeek, endWeek, year]);

  const handleTryAgain = useCallback(() => {
    setError(null);
    const sw = startWeekRef.current;
    const ew = endWeekRef.current;
    const yr = yearRef.current;
    
    if (isValidWeekParams(sw, ew, yr)) {
      loadPaidUnpaidData({
        type: 'range',
        startWeek: sw,
        endWeek: ew,
        year: yr
      });
    }
  }, [loadPaidUnpaidData]);

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