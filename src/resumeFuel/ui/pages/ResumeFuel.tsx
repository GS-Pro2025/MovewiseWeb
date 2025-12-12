import React, { useEffect, useState, useCallback } from 'react';
import ResumeFuelTable from '../components/ResumeFuelTable';
import { ResumeFuelService } from '../../data/ResumeFuelServices';
import { PaginatedOrderResult } from '../../domain/OrderModel';
import YearPicker from '../../../components/YearPicker';
import WeekPicker from '../../../components/WeekPicker';

const ResumeFuel: React.FC = () => {
  const [resumeFuel, setResumeFuel] = useState<PaginatedOrderResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const resumeFuelServices = new ResumeFuelService();

  const fetchResumeFuel = useCallback(async (week?: number, year?: number, pageNum?: number, pageSize?: number, search?: string) => {
    try {
      setIsLoading(true);
      const response = await resumeFuelServices.getResumeFuel({
        page: (pageNum ?? page) + 1, // API uses 1-based pagination
        pageSize: pageSize ?? rowsPerPage,
        mode: 'single_week',
        numberWeek: week ?? currentWeek,
        year: year ?? currentYear,
        search: search?.trim() ? search.trim() : undefined
      });
      setResumeFuel(response);
    } catch (error) {
      console.error('Error fetching resume fuel:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, currentWeek, currentYear]);

  useEffect(() => {
    // Get current week
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
    
    setCurrentWeek(weekNumber);
    fetchResumeFuel(weekNumber, now.getFullYear(), 0, 25);
  }, [fetchResumeFuel]);

  const handleWeekChange = useCallback((week: number) => {
    setCurrentWeek(week);
    setPage(0); // Reset to first page when changing filters
    fetchResumeFuel(week, currentYear, 0, rowsPerPage, searchTerm);
  }, [currentYear, rowsPerPage, searchTerm, fetchResumeFuel]);

  const handleYearChange = useCallback((year: number) => {
    setCurrentYear(year);
    setPage(0); // Reset to first page when changing filters
    fetchResumeFuel(currentWeek, year, 0, rowsPerPage, searchTerm);
  }, [currentWeek, rowsPerPage, searchTerm, fetchResumeFuel]);

  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
    setPage(0); // Reset to first page when searching
    fetchResumeFuel(currentWeek, currentYear, 0, rowsPerPage, search);
  }, [currentWeek, currentYear, rowsPerPage, fetchResumeFuel]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    fetchResumeFuel(currentWeek, currentYear, newPage, rowsPerPage, searchTerm);
  }, [currentWeek, currentYear, rowsPerPage, searchTerm, fetchResumeFuel]);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing page size
    fetchResumeFuel(currentWeek, currentYear, 0, newRowsPerPage, searchTerm);
  }, [currentWeek, currentYear, searchTerm, fetchResumeFuel]);
  
  return (
    <div className="container mx-auto p-4">
      {/* Week/Year selector and search */}
      <div className="mb-6 bg-white rounded-xl p-4 shadow-md border" style={{ borderColor: '#0B2863' }}>
        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by reference, driver, location, status, or cost..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#0B2863', '--tw-ring-color': '#0B2863' } as any}
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <YearPicker
                year={currentYear}
                onYearSelect={handleYearChange}
                min={2020}
                max={new Date().getFullYear() + 2}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Week</label>
              <WeekPicker
                week={currentWeek}
                onWeekSelect={handleWeekChange}
                min={1}
                max={53}
                className="w-full"
              />
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#0B2863' }}></div>
              <span>Loading fuel data...</span>
            </div>
          )}

          {/* Data summary */}
          {!isLoading && resumeFuel && (
            <div className="flex items-center gap-4 text-xs text-gray-600 ml-auto">
              <span className="bg-gray-100 px-2 py-1 rounded">
                Total orders: {resumeFuel.count || 0}
              </span>
              <span className="bg-blue-100 px-2 py-1 rounded" style={{ color: '#0B2863' }}>
                Year {currentYear}, Week {currentWeek}
              </span>
            </div>
          )}
        </div>
      </div>

      <ResumeFuelTable 
        data={resumeFuel} 
        isLoading={isLoading}
        searchTerm={searchTerm}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  )
}

export default ResumeFuel
