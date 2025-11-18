import React from 'react';
import { CalendarDays, FileText, DollarSign, TrendingUp, TrendingDown, Filter, Calendar } from 'lucide-react';
import { WeekSummary } from '../domain/StatementModels';
import WeekPicker from '../../components/WeekPicker';
 
interface StatementFiltersProps {
  week: number;
  year: number;
  weekRange: { start: string; end: string };
  stateFilter: string;
  shipperFilter: string;
  companyFilter: string;
  onWeekChange: (week: number) => void;
  onYearChange: (year: number) => void;
  onStateFilterChange: (state: string) => void;
  onShipperFilterChange: (shipper: string) => void;
  onCompanyFilterChange: (company: string) => void;
  weekSummary: WeekSummary | null;
  totalRecords: number;
}

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  gray: '#6b7280',
};

export const StatementFilters: React.FC<StatementFiltersProps> = ({
  week,
  year,
  weekRange,
  stateFilter,
  shipperFilter,
  companyFilter,
  onWeekChange,
  onYearChange,
  onStateFilterChange,
  onShipperFilterChange,
  onCompanyFilterChange,
  weekSummary,
  totalRecords
}) => {
  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getStateChipColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'processed':
        return COLORS.success;
      case 'exists':
        return COLORS.warning;
      case 'not_exists':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const formatStateName = (state: string): string => {
    switch (state.toLowerCase()) {
      case 'not_exists':
        return 'Not Exists';
      case 'exists':
        return 'Exists';
      case 'processed':
        return 'Processed';
      default:
        return state;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4 mb-4 overflow-hidden" style={{ borderColor: COLORS.primary }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={18} className="flex-shrink-0" style={{ color: COLORS.primary }} />
        <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: COLORS.primary }}>
          Statement Records - Week {week}, {year}
        </h3>
      </div>
      
      {/* Week and Year Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div className="relative w-full">
        <label className="block text-xs font-bold mb-1" style={{ color: COLORS.primary }}>
            Week
          </label>
          <WeekPicker
            week={week}
            onWeekSelect={onWeekChange}
            min={1}
            max={53}
          />
        </div>
        
        <div className="w-full">
          <label className="block text-xs font-bold mb-1" style={{ color: COLORS.primary }}>
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value) || new Date().getFullYear())}
            min={2020}
            max={2030}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ borderColor: COLORS.primary }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div className="col-span-1 sm:col-span-2 flex items-center gap-2 p-2 rounded-lg border overflow-hidden" style={{ borderColor: COLORS.secondary }}>
          <Calendar size={14} className="flex-shrink-0" style={{ color: COLORS.secondary }} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: COLORS.gray }}>
              Date Range:
            </span>
            <span className="text-xs font-bold truncate" style={{ color: COLORS.primary }}>
              {weekRange.start} → {weekRange.end}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t my-3" style={{ borderColor: COLORS.primary }}></div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-2">
        <Filter size={14} className="flex-shrink-0" style={{ color: COLORS.primary }} />
        <h4 className="text-xs sm:text-sm font-bold" style={{ color: COLORS.primary }}>Filters</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="w-full">
          <label className="block text-xs font-bold mb-1 truncate" style={{ color: COLORS.primary }}>
            Filter by State
          </label>
          <input
            type="text"
            value={stateFilter}
            onChange={(e) => onStateFilterChange(e.target.value)}
            placeholder="Enter state..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ borderColor: COLORS.primary }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div className="w-full">
          <label className="block text-xs font-bold mb-1 truncate" style={{ color: COLORS.primary }}>
            Filter by Shipper
          </label>
          <input
            type="text"
            value={shipperFilter}
            onChange={(e) => onShipperFilterChange(e.target.value)}
            placeholder="Enter shipper name..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ borderColor: COLORS.primary }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div className="w-full">
          <label className="block text-xs font-bold mb-1 truncate" style={{ color: COLORS.primary }}>
            Filter by Company
          </label>
          <input
            type="text"
            value={companyFilter}
            onChange={(e) => onCompanyFilterChange(e.target.value)}
            placeholder="Enter company name..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ borderColor: COLORS.primary }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div className="border-t my-3" style={{ borderColor: COLORS.primary }}></div>

      {/* Week Summary Statistics */}
      {weekSummary && (
        <div>
          <h4 className="text-xs sm:text-sm font-bold mb-3" style={{ color: COLORS.primary }}>
            Week Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-lg p-2 sm:p-3 border-2 shadow-sm" style={{ borderColor: COLORS.primary }}>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="flex-shrink-0" style={{ color: COLORS.primary }} />
                <span className="text-xs font-semibold truncate" style={{ color: COLORS.gray }}>
                  Records
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold truncate" style={{ color: COLORS.primary }}>
                {totalRecords}
              </p>
            </div>
            
            <div className="rounded-lg p-2 sm:p-3 border-2 shadow-sm" style={{ borderColor: COLORS.success }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="flex-shrink-0" style={{ color: COLORS.success }} />
                <span className="text-xs font-semibold truncate" style={{ color: COLORS.gray }}>
                  Income
                </span>
              </div>
              <p className="text-sm sm:text-lg font-bold truncate" style={{ color: COLORS.success }}>
                {formatCurrency(weekSummary.total_income)}
              </p>
            </div>
            
            <div className="rounded-lg p-2 sm:p-3 border-2 shadow-sm" style={{ borderColor: COLORS.error }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={16} className="flex-shrink-0" style={{ color: COLORS.error }} />
                <span className="text-xs font-semibold truncate" style={{ color: COLORS.gray }}>
                  Expense
                </span>
              </div>
              <p className="text-sm sm:text-lg font-bold truncate" style={{ color: COLORS.error }}>
                {formatCurrency(weekSummary.total_expense)}
              </p>
            </div>
            
            <div className="rounded-lg p-2 sm:p-3 border-2 shadow-sm" style={{ borderColor: parseFloat(weekSummary.net_amount) >= 0 ? COLORS.success : COLORS.error }}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="flex-shrink-0" style={{ color: parseFloat(weekSummary.net_amount) >= 0 ? COLORS.success : COLORS.error }} />
                <span className="text-xs font-semibold truncate" style={{ color: COLORS.gray }}>
                  Net
                </span>
              </div>
              <p className="text-sm sm:text-lg font-bold truncate" style={{ color: parseFloat(weekSummary.net_amount) >= 0 ? COLORS.success : COLORS.error }}>
                {formatCurrency(weekSummary.net_amount)}
              </p>
            </div>
          </div>

          {/* State Breakdown */}
          {weekSummary.state_breakdown && Object.keys(weekSummary.state_breakdown).length > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-gray-50 overflow-hidden">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.gray }}>
                Status Breakdown:
              </p>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {Object.entries(weekSummary.state_breakdown).map(([state, count]) => (
                  <span 
                    key={state}
                    className="px-2 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                    style={{ backgroundColor: getStateChipColor(state) }}
                  >
                    {formatStateName(state)}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};