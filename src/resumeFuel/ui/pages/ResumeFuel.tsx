import React, { useEffect, useState } from 'react';
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
  
  const resumeFuelServices = new ResumeFuelService();

  const fetchResumeFuel = async (week?: number, year?: number) => {
    try {
      setIsLoading(true);
      const response = await resumeFuelServices.getResumeFuel({
        page: 1,
        pageSize: 50,
        mode: 'single_week',
        numberWeek: week || currentWeek,
        year: year || currentYear
      });
      setResumeFuel(response);
    } catch (error) {
      console.error('Error fetching resume fuel', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Obtener la semana actual
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
    
    setCurrentWeek(weekNumber);
    fetchResumeFuel(weekNumber, now.getFullYear());
  }, []);

  const handleWeekChange = (week: number) => {
    setCurrentWeek(week);
    fetchResumeFuel(week, currentYear);
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
    fetchResumeFuel(currentWeek, year);
  };
  
  return (
    <div className="container mx-auto p-4">
      {/* Week/Year selector */}
      <div className="mb-6 bg-white rounded-xl p-4 shadow-md border" style={{ borderColor: '#0B2863' }}>
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
      />
    </div>
  )
}

export default ResumeFuel
