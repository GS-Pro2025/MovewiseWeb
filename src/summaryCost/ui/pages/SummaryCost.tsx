/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SummaryCostService } from '../../data/SummaryCostService';
import { PaginatedOrderSummaryResult } from '../../domain/OrderSummaryModel';
import { SummaryCostParams } from '../../data/SummaryCostRepository';
import WeekPicker from '../../../components/WeekPicker';
import YearPicker from '../../../components/YearPicker';
import SummaryCostDataTable from '../components/SummaryCostDataTable';

const getISOWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const SummaryCost: React.FC = () => {
  const { t } = useTranslation();
  const today = new Date();

  const [year,         setYear]         = useState<number>(today.getFullYear());
  const [week,         setWeek]         = useState<number>(getISOWeek(today));
  const [mode,         setMode]         = useState<'single_week' | 'week_range'>('single_week');
  const [startWeek,    setStartWeek]    = useState<number>(getISOWeek(today));
  const [endWeek,      setEndWeek]      = useState<number>(getISOWeek(today));
  const [summaryCost,  setSummaryCost]  = useState<PaginatedOrderSummaryResult | null>(null);
  const [isLoading,    setIsLoading]    = useState<boolean>(true);
  const [page,         setPage]         = useState<number>(0);
  const [rowsPerPage,  setRowsPerPage]  = useState<number>(25);
  const [searchTerm,   setSearchTerm]   = useState<string>('');

  const summaryCostService = useMemo(() => new SummaryCostService(), []);

  const fetchSummaryCost = useCallback(async (pageNum?: number, pageSize?: number, search?: string) => {
    try {
      setIsLoading(true);
      const params: SummaryCostParams = {
        page: (pageNum ?? page) + 1,
        pageSize: pageSize ?? rowsPerPage,
        year, mode, onlyPaid: false,
        search: search?.trim() ? search.trim() : undefined
      };
      if (mode === 'single_week') { params.numberWeek = week; }
      else { params.startWeek = startWeek; params.endWeek = endWeek; }
      const response = await summaryCostService.getSummaryCost(params);
      setSummaryCost(response);
    } catch (error) {
      console.error('Error fetching summary cost:', error);
      setSummaryCost(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, year, week, mode, startWeek, endWeek, summaryCostService]);

  useEffect(() => { fetchSummaryCost(0, 25); }, [fetchSummaryCost]);

  const handleWeekChange        = useCallback((v: number) => { setWeek(v);      setPage(0); fetchSummaryCost(0, rowsPerPage, searchTerm); }, [rowsPerPage, searchTerm, fetchSummaryCost]);
  const handleYearChange        = useCallback((v: number) => { setYear(v);      setPage(0); fetchSummaryCost(0, rowsPerPage, searchTerm); }, [rowsPerPage, searchTerm, fetchSummaryCost]);
  const handleStartWeekChange   = useCallback((v: number) => { setStartWeek(v); setPage(0); fetchSummaryCost(0, rowsPerPage, searchTerm); }, [rowsPerPage, searchTerm, fetchSummaryCost]);
  const handleEndWeekChange     = useCallback((v: number) => { setEndWeek(v);   setPage(0); fetchSummaryCost(0, rowsPerPage, searchTerm); }, [rowsPerPage, searchTerm, fetchSummaryCost]);
  const handleSearchChange      = useCallback((s: string) => { setSearchTerm(s); setPage(0); fetchSummaryCost(0, rowsPerPage, s); }, [rowsPerPage, fetchSummaryCost]);
  const handlePageChange        = useCallback((p: number) => { setPage(p); fetchSummaryCost(p, rowsPerPage, searchTerm); }, [rowsPerPage, searchTerm, fetchSummaryCost]);
  const handleRowsPerPageChange = useCallback((r: number) => { setRowsPerPage(r); setPage(0); fetchSummaryCost(0, r, searchTerm); }, [searchTerm, fetchSummaryCost]);

  const handleContextMenu     = (event: React.MouseEvent, row: any) => { event.preventDefault(); console.log('Context menu for:', row); };
  const handleActionsMenuClick = (event: React.MouseEvent, row: any) => { event.stopPropagation(); console.log('Actions menu for:', row); };

  const totalPages   = summaryCost ? Math.ceil(summaryCost.count / rowsPerPage) : 0;
  const isLastPage   = page >= totalPages - 1;
  const isFirstPage  = page === 0;

  // Shared style helpers for pagination buttons
  const paginationBtnStyle = (disabled: boolean) => ({
    borderColor: disabled ? '#d1d5db' : '#0B2863',
    color:       disabled ? '#d1d5db' : '#0B2863',
    backgroundColor: disabled ? '#f3f4f6' : 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  const paginationHoverEnter = (e: React.MouseEvent<HTMLButtonElement>, disabled: boolean) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = '#F09F52';
      e.currentTarget.style.color = '#fff';
    }
  };
  const paginationHoverLeave = (e: React.MouseEvent<HTMLButtonElement>, disabled: boolean) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = '#0B2863';
    }
  };

  return (
    <div className="container mx-auto p-4">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0B2863' }}>
          {t('summaryCost.title')}
        </h1>
        <p className="text-gray-600 text-sm">{t('summaryCost.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-4" style={{ borderColor: '#0B2863' }}>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('summaryCost.filters.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#0B2863', '--tw-ring-color': '#0B2863' } as any}
          />
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>
              {t('summaryCost.filters.timeFilters')}
            </span>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1">
        
            <YearPicker year={year} onYearSelect={handleYearChange} min={2015} max={new Date().getFullYear() + 2} className="w-auto" />
          </div>

          {/* Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">{t('summaryCost.filters.mode')}</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'single_week' | 'week_range')}
              className="appearance-none border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 w-40"
              style={{ borderColor: '#0B2863' }}
            >
              <option value="single_week">{t('summaryCost.filters.modeSingleWeek')}</option>
              <option value="week_range">{t('summaryCost.filters.modeWeekRange')}</option>
            </select>
          </div>

          {/* Week Pickers */}
          {mode === 'single_week' ? (
            <div className="flex flex-col gap-1">
              
              <WeekPicker week={week} onWeekSelect={handleWeekChange} min={1} max={53} className="w-auto" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
               
                <WeekPicker week={startWeek} onWeekSelect={handleStartWeekChange} min={1} max={53} className="w-60" />
              </div>
              <div className="flex flex-col gap-1">
                
                <WeekPicker week={endWeek} onWeekSelect={handleEndWeekChange} min={startWeek} max={53} className="w-60" />
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-1 ml-4">
          <div className="text-xs font-medium text-gray-700">{t('summaryCost.filters.summary')}</div>
          <div className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#f8fafc', color: '#0B2863' }}>
            {mode === 'single_week'
              ? t('summaryCost.filters.summaryWeek',  { year, week })
              : t('summaryCost.filters.summaryRange', { year, start: startWeek, end: endWeek })}
          </div>
        </div>
      </div>

      {/* Table */}
      <SummaryCostDataTable
        data={summaryCost}
        loading={isLoading}
        searchTerm={searchTerm}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onContextMenu={handleContextMenu}
        onActionsMenuClick={handleActionsMenuClick}
      />

      {/* Pagination */}
      {summaryCost && (
        <div className="mt-4">
          <div className="mb-4 p-3 bg-gray-50 border rounded-lg" style={{ borderColor: '#0B2863' }}>
            <span className="text-sm font-medium" style={{ color: '#0B2863' }}>
              {t('summaryCost.pagination.totalRecords', {
                count: summaryCost.count,
                page: page + 1,
                total: totalPages
              })}
            </span>
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-lg border" style={{ borderColor: '#0B2863' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handlePageChange(Math.max(0, page - 1))}
                disabled={isFirstPage}
                className="px-4 py-2 border rounded-lg text-sm font-medium transition-colors"
                style={paginationBtnStyle(isFirstPage)}
                onMouseEnter={(e) => paginationHoverEnter(e, isFirstPage)}
                onMouseLeave={(e) => paginationHoverLeave(e, isFirstPage)}
              >
                {t('summaryCost.pagination.previous')}
              </button>

              <span className="text-sm font-medium" style={{ color: '#0B2863', minWidth: '100px', textAlign: 'center' }}>
                {t('summaryCost.pagination.page', { page: page + 1 })}
              </span>

              <button
                onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
                disabled={isLastPage}
                className="px-4 py-2 border rounded-lg text-sm font-medium transition-colors"
                style={paginationBtnStyle(isLastPage)}
                onMouseEnter={(e) => paginationHoverEnter(e, isLastPage)}
                onMouseLeave={(e) => paginationHoverLeave(e, isLastPage)}
              >
                {t('summaryCost.pagination.next')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: '#0B2863' }}>
                {t('summaryCost.pagination.recordsPerPage')}
              </label>
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#0B2863', '--tw-ring-color': '#0B2863' } as any}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCost;