import React, { useEffect, useState, useCallback } from 'react';
import ResumeFuelTable from '../components/ResumeFuelTable';
import { ResumeFuelService } from '../../data/ResumeFuelServices';
import { WeeklyFuelDataResponse } from '../../domain/CostFuelWithOrders';
import YearPicker from '../../../components/YearPicker';
import WeekPicker from '../../../components/WeekPicker';
import CreateCostFuelDialog from '../../../addFuelCostToOrder/ui/CreateCostFuelDialog';
import { Plus } from 'lucide-react';

const ResumeFuel: React.FC = () => {
  const [resumeFuel, setResumeFuel] = useState<WeeklyFuelDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  
  const resumeFuelServices = new ResumeFuelService();

  const fetchResumeFuel = useCallback(async (week?: number, year?: number) => {
    try {
      setIsLoading(true);
      const response = await resumeFuelServices.getResumeFuel({
        year: year ?? currentYear,
        week: week ?? currentWeek,
        page_size: 100
      });
      setResumeFuel(response);
    } catch (error) {
      console.error('Error fetching resume fuel:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeek, currentYear]);

  useEffect(() => {
    // Get current week
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
    
    setCurrentWeek(weekNumber);
    fetchResumeFuel(weekNumber, now.getFullYear());
  }, []);

  const handleWeekChange = useCallback((week: number) => {
    setCurrentWeek(week);
    fetchResumeFuel(week, currentYear);
  }, [currentYear, fetchResumeFuel]);

  const handleYearChange = useCallback((year: number) => {
    setCurrentYear(year);
    fetchResumeFuel(currentWeek, year);
  }, [currentWeek, fetchResumeFuel]);

  // Calculate totals from all cost_fuels
  const totals = resumeFuel?.data.reduce((acc, weekData) => {
    weekData.cost_fuels.forEach(costFuel => {
      acc.totalFuelCost += costFuel.cost_fuel;
      acc.totalFuelQty += costFuel.fuel_qty;
      acc.totalDistance += costFuel.distance;
      acc.totalCostFuels += 1;
    });
    return acc;
  }, { totalFuelCost: 0, totalFuelQty: 0, totalDistance: 0, totalCostFuels: 0 });
  
  return (
    <div className="container mx-auto p-4">
      {/* Week/Year selector */}
      <div className="mb-6 bg-white rounded-xl p-4 shadow-md border" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center gap-4 flex-wrap justify-between">
          {/* Create Button */}
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md flex items-center gap-2"
            style={{ backgroundColor: '#0B2863', color: 'white' }}
          >
            <Plus size={18} />
            Create Fuel Cost
          </button>
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
          </div>

          {/* Data summary */}
          {!isLoading && resumeFuel && totals && (
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <span className="text-gray-500 font-medium">Total Fuel Records: </span>
                <span className="font-bold text-gray-900">{totals.totalCostFuels}</span>
              </div>
              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-blue-600 font-medium">Total Cost: </span>
                <span className="font-bold" style={{ color: '#0B2863' }}>
                  ${totals.totalFuelCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-green-50 px-3 py-2 rounded-lg">
                <span className="text-green-600 font-medium">Total Fuel: </span>
                <span className="font-bold text-green-700">{totals.totalFuelQty.toFixed(1)} gl</span>
              </div>
              <div className="bg-purple-50 px-3 py-2 rounded-lg">
                <span className="text-purple-600 font-medium">Total Distance: </span>
                <span className="font-bold text-purple-700">{totals.totalDistance.toLocaleString('en-US')} mi</span>
              </div>
              <div className="bg-indigo-100 px-3 py-2 rounded-lg" style={{ backgroundColor: '#E0E7FF' }}>
                <span className="font-bold" style={{ color: '#0B2863' }}>
                  Year {currentYear}, Week {currentWeek}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ResumeFuelTable 
        data={resumeFuel} 
        isLoading={isLoading}
      />

      {/* Create Fuel Cost Dialog */}
      <CreateCostFuelDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false);
          fetchResumeFuel(currentWeek, currentYear);
        }}
      />
    </div>
  )
}

export default ResumeFuel
