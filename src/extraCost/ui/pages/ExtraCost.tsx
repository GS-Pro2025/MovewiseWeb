/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ExtraCostService } from '../../data/ExtraCostService';
import { ExtraCostResponse } from '../../domain/ExtraCostModel';
import WeekPicker from '../../../components/WeekPicker';
import YearPicker from '../../../components/YearPicker';
import { ExtraCostParams } from '../../data/ExtraCostRepository';
import ExtraCostDataTable from '../components/ExtraCostDataTable';

// función helper para semana ISO
const getISOWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const ExtraCostPage: React.FC = () => {
  const today = new Date();

  // Filter state inicializado con fecha actual (año + semana ISO)
  const [year, setYear] = useState<number>(today.getFullYear());
  const [week, setWeek] = useState<number>(getISOWeek(today));
  const [mode, setMode] = useState<'single_week' | 'week_range'>('single_week');
  const [startWeek, setStartWeek] = useState<number>(getISOWeek(today));
  const [endWeek, setEndWeek] = useState<number>(getISOWeek(today));
  
  const [extraCosts, setExtraCosts] = useState<ExtraCostResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Pagination state
  const [page] = useState(0);
  const [rowsPerPage] = useState(25);
  
  const extraCostService = useMemo(() => new ExtraCostService(), []);
  
  const fetchExtraCosts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const params: ExtraCostParams = {
        page: page + 1, // API usa 1-based pagination
        pageSize: rowsPerPage,
        year,
        mode
      };

      if (mode === 'single_week') {
        params.numberWeek = week;
      } else {
        params.startWeek = startWeek;
        params.endWeek = endWeek;
      }

      const response = await extraCostService.getExtraCosts(params);
      setExtraCosts(response);
    } catch (error) {
      console.error('Error fetching extra costs:', error);
      setExtraCosts(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, year, week, mode, startWeek, endWeek, extraCostService]);

  useEffect(() => {
    fetchExtraCosts();
  }, [fetchExtraCosts]);

  const handleFinishOrder = (orderId: string) => {
    console.log('Finishing order:', orderId);
    // Implement finish order logic here
  };

  const handleContextMenu = (event: React.MouseEvent, row: any) => {
    event.preventDefault();
    console.log('Context menu for:', row);
    // Implement context menu logic here
  };

  const handleActionsMenuClick = (event: React.MouseEvent, row: any) => {
    event.stopPropagation();
    console.log('Actions menu for:', row);
    // Implement actions menu logic here
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0B2863' }}>
          Extra Costs Management
        </h1>
        <p className="text-gray-600 text-sm">
          Gestiona los costos extra asociados a las órdenes de trabajo por semana y año
        </p>
      </div>

      {/* Filtros de tiempo */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-4" style={{ borderColor: '#0B2863' }}>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>
              Filtros de Tiempo:
            </span>
          </div>

          {/* Year Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Año:</label>
            <YearPicker
              year={year}
              onYearSelect={setYear}
              min={2015}
              max={new Date().getFullYear() + 2}
              className="w-40"
            />
          </div>

          {/* Mode Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Modo:</label>
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'single_week' | 'week_range')}
                className="appearance-none border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 w-40"
                style={{ borderColor: '#0B2863' }}
              >
                <option value="single_week">Semana Individual</option>
                <option value="week_range">Rango de Semanas</option>
              </select>
            </div>
          </div>

          {/* Week Pickers (misma fila) */}
          {mode === 'single_week' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Semana:</label>
              <WeekPicker
                week={week}
                onWeekSelect={setWeek}
                min={1}
                max={53}
                className="w-60"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Semana Inicial:</label>
                <WeekPicker
                  week={startWeek}
                  onWeekSelect={setStartWeek}
                  min={1}
                  max={53}
                  className="w-60"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Semana Final:</label>
                <WeekPicker
                  week={endWeek}
                  onWeekSelect={setEndWeek}
                  min={startWeek}
                  max={53}
                  className="w-60"
                />
              </div>
            </>
          )}
        </div>

        {/* Summary info */}
        <div className="flex flex-col gap-1 ml-4">
          <div className="text-xs font-medium text-gray-700">Resumen:</div>
          <div className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#f8fafc', color: '#0B2863' }}>
            {mode === 'single_week' 
              ? `Año ${year}, Semana ${week}`
              : `Año ${year}, Semanas ${startWeek}-${endWeek}`
            }
          </div>
        </div>
      </div>

      {/* Tabla de Extra Costs */}
      <ExtraCostDataTable 
        data={extraCosts} 
        loading={isLoading}
        onFinishOrder={handleFinishOrder}
        onContextMenu={handleContextMenu}
        onActionsMenuClick={handleActionsMenuClick}
      />

      {/* Información de resultados */}
      {extraCosts && (
        <div className="mt-4 p-3 bg-gray-50 border rounded-lg" style={{ borderColor: '#0B2863' }}>
          <span className="text-sm font-medium" style={{ color: '#0B2863' }}>
            Total de registros: {extraCosts.count} | Mostrando página {page + 1}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExtraCostPage;