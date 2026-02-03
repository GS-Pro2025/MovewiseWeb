/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SummaryCostService } from '../../data/SummaryCostService';
import { PaginatedOrderSummaryResult } from '../../domain/OrderSummaryModel';
import { SummaryCostParams } from '../../data/SummaryCostRepository';
import WeekPicker from '../../../components/WeekPicker';
import YearPicker from '../../../components/YearPicker';
import SummaryCostDataTable from '../components/SummaryCostDataTable';

// Helper function to get ISO week
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
  const today = new Date();

  // Filter state initialized with current date (year + ISO week)
  const [year, setYear] = useState<number>(today.getFullYear());
  const [week, setWeek] = useState<number>(getISOWeek(today));
  const [mode, setMode] = useState<'single_week' | 'week_range'>('single_week');
  const [startWeek, setStartWeek] = useState<number>(getISOWeek(today));
  const [endWeek, setEndWeek] = useState<number>(getISOWeek(today));
  
  const [summaryCost, setSummaryCost] = useState<PaginatedOrderSummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Pagination and search state
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const summaryCostService = useMemo(() => new SummaryCostService(), []);

  const fetchSummaryCost = useCallback(async (pageNum?: number, pageSize?: number, search?: string) => {
    try {
      setIsLoading(true);
      
      const params: SummaryCostParams = {
        page: (pageNum ?? page) + 1, // API uses 1-based pagination
        pageSize: pageSize ?? rowsPerPage,
        year,
        mode,
        onlyPaid: false, // Always false as requested
        search: search?.trim() ? search.trim() : undefined
      };

      if (mode === 'single_week') {
        params.numberWeek = week;
      } else {
        params.startWeek = startWeek;
        params.endWeek = endWeek;
      }

      const response = await summaryCostService.getSummaryCost(params);
      setSummaryCost(response);
    } catch (error) {
      console.error('Error fetching summary cost:', error);
      setSummaryCost(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, year, week, mode, startWeek, endWeek, summaryCostService]);

  useEffect(() => {
    fetchSummaryCost(0, 25);
  }, [fetchSummaryCost]);

  const handleWeekChange = useCallback((newWeek: number) => {
    setWeek(newWeek);
    setPage(0); // Reset to first page when changing filters
    fetchSummaryCost(0, rowsPerPage, searchTerm);
  }, [rowsPerPage, searchTerm, fetchSummaryCost]);

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear);
    setPage(0); // Reset to first page when changing filters
    fetchSummaryCost(0, rowsPerPage, searchTerm);
  }, [rowsPerPage, searchTerm, fetchSummaryCost]);

  const handleStartWeekChange = useCallback((newStartWeek: number) => {
    setStartWeek(newStartWeek);
    setPage(0); // Reset to first page when changing filters
    fetchSummaryCost(0, rowsPerPage, searchTerm);
  }, [rowsPerPage, searchTerm, fetchSummaryCost]);

  const handleEndWeekChange = useCallback((newEndWeek: number) => {
    setEndWeek(newEndWeek);
    setPage(0); // Reset to first page when changing filters
    fetchSummaryCost(0, rowsPerPage, searchTerm);
  }, [rowsPerPage, searchTerm, fetchSummaryCost]);

  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
    setPage(0); // Reset to first page when searching
    fetchSummaryCost(0, rowsPerPage, search);
  }, [rowsPerPage, fetchSummaryCost]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    fetchSummaryCost(newPage, rowsPerPage, searchTerm);
  }, [rowsPerPage, searchTerm, fetchSummaryCost]);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing page size
    fetchSummaryCost(0, newRowsPerPage, searchTerm);
  }, [searchTerm, fetchSummaryCost]);


  const handleContextMenu = (event: React.MouseEvent, row: any) => {
    event.preventDefault();
    console.log('Context menu for:', row);
    // TODO: Implement context menu logic
  };

  const handleActionsMenuClick = (event: React.MouseEvent, row: any) => {
    event.stopPropagation();
    console.log('Actions menu for:', row);
    // TODO: Implement actions menu logic
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0B2863' }}>
          Summary Cost Management
        </h1>
        <p className="text-gray-600 text-sm">
          Manage summary costs for work orders by week and year
        </p>
      </div>

      {/* Time filters and search */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-4" style={{ borderColor: '#0B2863' }}>
        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by reference, customer, location, or cost..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#0B2863', '--tw-ring-color': '#0B2863' } as any}
          />
        </div>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>
              Time Filters:
            </span>
          </div>

          {/* Year Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Year:</label>
            <YearPicker
              year={year}
              onYearSelect={handleYearChange}
              min={2015}
              max={new Date().getFullYear() + 2}
              className="w-auto"
            />
          </div>

          {/* Mode Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Mode:</label>
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'single_week' | 'week_range')}
                className="appearance-none border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 w-40"
                style={{ borderColor: '#0B2863' }}
              >
                <option value="single_week">Single Week</option>
                <option value="week_range">Week Range</option>
              </select>
            </div>
          </div>

          {/* Week Pickers (same row) */}
          {mode === 'single_week' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Week:</label>
              <WeekPicker
                week={week}
                onWeekSelect={handleWeekChange}
                min={1}
                max={53}
                className="w-auto"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Start Week:</label>
                <WeekPicker
                  week={startWeek}
                  onWeekSelect={handleStartWeekChange}
                  min={1}
                  max={53}
                  className="w-60"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">End Week:</label>
                <WeekPicker
                  week={endWeek}
                  onWeekSelect={handleEndWeekChange}
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
          <div className="text-xs font-medium text-gray-700">Summary:</div>
          <div className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#f8fafc', color: '#0B2863' }}>
            {mode === 'single_week' 
              ? `Year ${year}, Week ${week}`
              : `Year ${year}, Weeks ${startWeek}-${endWeek}`
            }
          </div>
        </div>
      </div>

      {/* Summary Costs Table */}
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

      {/* Results info and pagination */}
      {summaryCost && (
        <div className="mt-4">
          {/* Results info */}
          <div className="mb-4 p-3 bg-gray-50 border rounded-lg" style={{ borderColor: '#0B2863' }}>
            <span className="text-sm font-medium" style={{ color: '#0B2863' }}>
              Total records: {summaryCost.count} | Showing page {page + 1} of {Math.ceil(summaryCost.count / rowsPerPage)}
            </span>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border" style={{ borderColor: '#0B2863' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handlePageChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg text-sm font-medium transition-colors"
                style={{
                  borderColor: page === 0 ? '#d1d5db' : '#0B2863',
                  color: page === 0 ? '#d1d5db' : '#0B2863',
                  backgroundColor: page === 0 ? '#f3f4f6' : 'transparent',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (page !== 0) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F09F52';
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== 0) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = '#0B2863';
                  }
                }}
              >
                ← Previous
              </button>

              <span className="text-sm font-medium" style={{ color: '#0B2863', minWidth: '100px', textAlign: 'center' }}>
                Page {page + 1}
              </span>

              <button
                onClick={() => handlePageChange(Math.min(Math.ceil(summaryCost.count / rowsPerPage) - 1, page + 1))}
                disabled={page >= Math.ceil(summaryCost.count / rowsPerPage) - 1}
                className="px-4 py-2 border rounded-lg text-sm font-medium transition-colors"
                style={{
                  borderColor: page >= Math.ceil(summaryCost.count / rowsPerPage) - 1 ? '#d1d5db' : '#0B2863',
                  color: page >= Math.ceil(summaryCost.count / rowsPerPage) - 1 ? '#d1d5db' : '#0B2863',
                  backgroundColor: page >= Math.ceil(summaryCost.count / rowsPerPage) - 1 ? '#f3f4f6' : 'transparent',
                  cursor: page >= Math.ceil(summaryCost.count / rowsPerPage) - 1 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (page < Math.ceil(summaryCost.count / rowsPerPage) - 1) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F09F52';
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page < Math.ceil(summaryCost.count / rowsPerPage) - 1) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = '#0B2863';
                  }
                }}
              >
                Next →
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: '#0B2863' }}>
                Records per page:
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