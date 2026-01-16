import React, { useRef, useEffect } from 'react';
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { 
  Calendar, 
  MapPin, 
  X,
  Filter,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  ClipboardList,
  Target,
  Activity,
  Search,
  Globe,
  ArrowRight
} from 'lucide-react';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';

import type { TableData } from '../domain/TableData';

interface TableFiltersProps {
  week: number;
  year: number;
  weekdayFilter: string;
  locationFilter: string;
  locations: string[];
  weekRange: { start: string; end: string };
  onWeekChange: (week: number) => void;
  onYearChange: (year: number) => void;
  onWeekdayChange: (weekday: string) => void;
  onLocationChange: (location: string) => void;
  onCalendarOpen: () => void;
  data: TableData[];
  filteredData: TableData[];
  globalSearch: string;
  onGlobalSearchChange: (search: string) => void;
  onGlobalSearchSubmit: () => void;
  onGlobalSearchClear: () => void;
  globalSearchLoading: boolean;
  isGlobalSearchActive: boolean;
  locationString: string;
  country: string;
  setCountry: (country: string) => void;
  state: string;
  setState: (state: string) => void;
  city: string;
  setCity: (city: string) => void;
  locationStep: "country" | "state" | "city";
  setLocationStep: (step: "country" | "state" | "city") => void;
  countries: { country: string }[];
  states: { name: string }[];
  cities: string[];
  setCities: (cities: string[]) => void;
  setStates: (states: { name: string }[]) => void;
}

const weekDays = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
  'Thursday', 'Friday', 'Saturday'
];

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
  gray: '#6b7280',
  lightGray: '#9CA3AF',
  grayBg: '#f3f4f6'
};

type LocationOption = { country: string } | { name: string } | string;

export const TableFilters: React.FC<TableFiltersProps> = ({
  week,
  year,
  weekdayFilter,
  locationFilter,
  weekRange,
  onWeekChange,
  onYearChange,
  onWeekdayChange,
  onCalendarOpen,
  data = [],
  globalSearch,
  onGlobalSearchChange,
  onGlobalSearchSubmit,
  onGlobalSearchClear,
  globalSearchLoading,
  isGlobalSearchActive,
  locationString,
  country,
  setCountry,
  state,
  setState,
  city,
  setCity,
  locationStep,
  setLocationStep,
  countries,
  states,
  cities,
  setCities,
  setStates,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  let options: LocationOption[] = [];
  let getOptionLabel: (option: LocationOption) => string = () => "";
  let label = "";
  let value: LocationOption | null = null;

  if (locationStep === "country") {
    options = countries;
    getOptionLabel = (o: LocationOption) => {
      if (typeof o === 'object' && 'country' in o) {
        return o.country;
      }
      return '';
    };
    label = "Country";
    value = countries.find((c) => c.country === country) || null;
  } else if (locationStep === "state") {
    options = states;
    getOptionLabel = (o: LocationOption) => {
      if (typeof o === 'object' && 'name' in o) {
        return o.name;
      }
      return '';
    };
    label = "State";
    value = states.find((s) => s.name === state) || null;
  } else if (locationStep === "city") {
    options = cities;
    getOptionLabel = (o: LocationOption) => {
      if (typeof o === 'string') {
        return o;
      }
      return '';
    };
    label = "City";
    value = city || null;
  }

  const weeklyStats = React.useMemo(() => {
    if (isGlobalSearchActive) {
      const totalOrders = data.length;
      const finishedOrders = data.filter(item => item.status === 'finished').length;
      const pendingOrders = data.filter(item => item.status === 'pending').length;
      const inactiveOrders = data.filter(item => item.status === 'inactive').length;
      
      return {
        totalOrders,
        finishedOrders,
        pendingOrders,
        inactiveOrders
      };
    }

    const weekData = data.filter(item => item.week === week);
    
    const totalOrders = weekData.length;
    const finishedOrders = weekData.filter(item => item.status === 'finished').length;
    const pendingOrders = weekData.filter(item => item.status === 'pending').length;
    const inactiveOrders = weekData.filter(item => item.status === 'inactive').length;
    
    return {
      totalOrders,
      finishedOrders,
      pendingOrders,
      inactiveOrders
    };
  }, [data, week, isGlobalSearchActive]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
      }
      
      .week-dropdown-container {
        z-index: 9999 !important;
        position: relative;
      }
      
      .week-dropdown {
        z-index: 10000 !important;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleGlobalSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !globalSearchLoading && globalSearch.trim()) {
      onGlobalSearchSubmit();
    }
  };

  return (
    <div>
      {/* Statistics Panel - Solo Progress Bar */}
      <div className="rounded-xl shadow-md border p-3 mb-2" style={{ borderColor: COLORS.primary }}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
            <BarChart3 size={16} />
            {isGlobalSearchActive ? 'Global Search Results' : `Week ${week} Statistics`}
          </h4>
          <span className="text-xs text-gray-600">
            {isGlobalSearchActive 
              ? `Results for "${globalSearch}"`
              : `${weekRange.start} → ${weekRange.end}`
            }
          </span>
        </div>
        
        {weeklyStats.totalOrders > 0 && (
          <div className="p-3 rounded-lg border shadow-sm" style={{ borderColor: COLORS.primary }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold flex items-center gap-1" style={{ color: COLORS.primary }}>
                  <Target size={14} />
                  {isGlobalSearchActive ? 'Results Progress' : `Week ${week} Progress`}
                </span>
                <span className="text-xs font-semibold" style={{ color: COLORS.success }}>
                  {Math.round((weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100)}% Complete
                </span>
              </div>
              <span className="text-xs font-bold" style={{ color: COLORS.primary }}>
                Total: {weeklyStats.totalOrders.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="transition-all duration-500"
                  style={{ 
                    width: `${(weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100}%`,
                    backgroundColor: COLORS.success
                  }}
                ></div>
                <div 
                  className="transition-all duration-500"
                  style={{ 
                    width: `${(weeklyStats.pendingOrders / weeklyStats.totalOrders) * 100}%`,
                    backgroundColor: COLORS.secondary
                  }}
                ></div>
                <div 
                  className="transition-all duration-500"
                  style={{ 
                    width: `${(weeklyStats.inactiveOrders / weeklyStats.totalOrders) * 100}%`,
                    backgroundColor: COLORS.error
                  }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold mt-2">
              <span className="flex items-center gap-1" style={{ color: COLORS.success }}>
                <CheckCircle size={12} />
                Finished: {weeklyStats.finishedOrders} ({Math.round((weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100)}%)
              </span>
              <span className="flex items-center gap-1" style={{ color: COLORS.secondary }}>
                <Clock size={12} />
                Pending: {weeklyStats.pendingOrders} ({Math.round((weeklyStats.pendingOrders / weeklyStats.totalOrders) * 100)}%)
              </span>
              <span className="flex items-center gap-1" style={{ color: COLORS.error }}>
                <XCircle size={12} />
                Inactive: {weeklyStats.inactiveOrders} ({Math.round((weeklyStats.inactiveOrders / weeklyStats.totalOrders) * 100)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Filter Card */}
      <div className="rounded-xl shadow-md border p-3 mb-3 week-dropdown-container" style={{ borderColor: COLORS.primary }} ref={dropdownRef}>
        {/* Header */}
        <div className="flex items-center space-x-2 mb-3">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: COLORS.primary }}
          >
            <ClipboardList size={16} style={{ color: COLORS.secondary }} />
          </div>
          <h2 className="text-sm font-bold" style={{ color: COLORS.primary }}>
            FILTERS & SEARCH
          </h2>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
          {/* Global Search */}
          <div className="lg:col-span-2 relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold" style={{ color: COLORS.primary }}>
                <div className="flex items-center gap-1.5">
                  <Globe size={12} />
                  Global Search
                </div>
              </label>
              {isGlobalSearchActive && (
                <button
                  onClick={onGlobalSearchClear}
                  className="p-0.5 rounded transition-colors"
                  style={{ backgroundColor: COLORS.error, color: 'white' }}
                  title="Clear global search"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search 
                  size={12} 
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10"
                  style={{ color: COLORS.primary }}
                />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => onGlobalSearchChange(e.target.value)}
                  onKeyPress={handleGlobalSearchKeyPress}
                  placeholder="Search order, name, job, location..."
                  className="w-full pl-7 pr-2 py-1.5 border rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ 
                    borderColor: COLORS.primary,
                    backgroundColor: 'white',
                    color: COLORS.primary
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                  }}
                  disabled={globalSearchLoading}
                />
              </div>
              
              <button
                onClick={onGlobalSearchSubmit}
                disabled={globalSearchLoading || !globalSearch.trim()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                  globalSearchLoading || !globalSearch.trim()
                    ? 'cursor-not-allowed'
                    : 'text-white hover:shadow-md'
                }`}
                style={{
                  backgroundColor: globalSearchLoading || !globalSearch.trim() ? '#d1d5db' : COLORS.primary,
                  color: globalSearchLoading || !globalSearch.trim() ? COLORS.gray : 'white'
                }}
              >
                {globalSearchLoading ? (
                  <>
                    <Search size={12} className="animate-spin" />
                  </>
                ) : (
                  <>
                    <Search size={12} />
                  </>
                )}
              </button>
            </div>
          </div>

          {!isGlobalSearchActive && (
            <>
            {/* Year Input Card */}
            <div className="relative">
              <YearPicker
                year={year}
                onYearSelect={onYearChange}
                min={2015}
                max={new Date().getFullYear() + 2}
              />
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ backgroundColor: year ? COLORS.success : COLORS.error }}
              ></div>
            </div>

            {/* Week Input Card */}
            <div className="relative">
              <WeekPicker
                week={week}
                onWeekSelect={onWeekChange}
                min={1}
                max={53}
              />
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ backgroundColor: week ? COLORS.success : COLORS.error }}
              ></div>
            </div>

            {/* Weekday Select Card */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold" style={{ color: COLORS.primary }}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Weekday
                  </div>
                </label>
                {weekdayFilter && (
                  <button
                    onClick={() => onWeekdayChange('')}
                    className="p-0.5 rounded transition-colors"
                    style={{ backgroundColor: COLORS.error, color: 'white' }}
                    title="Clear weekday filter"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <Autocomplete
                options={weekDays}
                value={weekdayFilter || null}
                onChange={(_, newValue) => {
                  onWeekdayChange(newValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select weekday"
                    size="small"
                    className="bg-white rounded-lg"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '0.5rem',
                        backgroundColor: 'white',
                        fontSize: '0.875rem',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                )}
                disableClearable={false}
              />
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ backgroundColor: weekdayFilter ? COLORS.success : COLORS.error }}
              ></div>
            </div>

            {/* Location Input Card */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold" style={{ color: COLORS.primary }}>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    Location
                  </div>
                </label>
                {locationString && (
                  <button
                    onClick={() => {
                      setCountry("");
                      setState("");
                      setCity("");
                      setStates([]);
                      setCities([]);
                      setLocationStep("country");
                    }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors duration-200 flex items-center gap-1 px-1.5 py-0.5 hover:bg-red-50 rounded border border-red-200"
                    title="Clear location"
                  >
                    <X size={10} />
                    Clear
                  </button>
                )}
              </div>
              <Autocomplete
                options={options}
                getOptionLabel={getOptionLabel}
                value={value}
                onChange={(_, newValue) => {
                  if (newValue === null) {
                    if (locationStep === "city") {
                      setCity("");
                      setLocationStep("state");
                    } else if (locationStep === "state") {
                      setState("");
                      setLocationStep("country");
                    } else if (locationStep === "country") {
                      setCountry("");
                    }
                  } else {
                    if (locationStep === "country" && typeof newValue === 'object' && 'country' in newValue) {
                      setCountry(newValue.country);
                    } else if (locationStep === "state" && typeof newValue === 'object' && 'name' in newValue) {
                      setState(newValue.name);
                    } else if (locationStep === "city" && typeof newValue === 'string') {
                      setCity(newValue);
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={label}
                    placeholder={`Select ${label.toLowerCase()}`}
                    size="small"
                    className="bg-white rounded-lg"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '0.5rem',
                        backgroundColor: 'white',
                        fontSize: '0.875rem',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  getOptionLabel(option) === getOptionLabel(value)
                }
                disableClearable={false}
                disabled={locationStep === "state" && !country}
              />
              {locationString && (
                <div className="mt-2 p-1.5 bg-purple-50 rounded border border-purple-200">
                  <p className="text-purple-700 font-medium text-xs">
                    <span className="font-bold">{locationString}</span>
                  </p>
                </div>
              )}
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ backgroundColor: locationString ? COLORS.success : COLORS.error }}
              ></div>
            </div>

            {/* Calendar Button Card */}
            <div className="flex flex-col justify-end">
              <button
                onClick={onCalendarOpen}
                className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-md flex items-center justify-center space-x-1.5"
                style={{ 
                  borderColor: COLORS.secondary,
                  backgroundColor: COLORS.secondary,
                  color: 'white'
                }}
              >
                <Calendar size={14} />
                <span>Calendar</span>
              </button>
            </div>
            </>
          )}
          </div>

        {/* Period Display Section - Compacto */}
        {!isGlobalSearchActive && (
          <div 
            className="rounded-lg p-2 border flex items-center justify-between"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center space-x-2">
              <div 
                className="p-1 rounded-lg"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Calendar size={12} className="text-white" />
              </div>
              <span className="font-bold text-xs" style={{ color: COLORS.primary }}>
                Year {year} - Week {week}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div 
                className="px-2 py-1 rounded-lg border font-bold text-xs"
                style={{ 
                  borderColor: COLORS.secondary,
                  color: COLORS.primary
                }}
              >
                {weekRange.start}
              </div>
              <ArrowRight 
                size={12} 
                style={{ color: COLORS.primary }}
              />
              <div 
                className="px-2 py-1 rounded-lg border font-bold text-xs"
                style={{ 
                  borderColor: COLORS.secondary,
                  color: COLORS.primary
                }}
              >
                {weekRange.end}
              </div>
            </div>
          </div>
        )}

        {/* Active Search Indicator */}
        {isGlobalSearchActive && (
          <div 
            className="mt-3 rounded-lg p-2 border"
            style={{ 
              borderColor: COLORS.primary,
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="p-1 rounded-lg"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Globe size={12} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs" style={{ color: COLORS.primary }}>
                    Global Search Results
                  </h3>
                  <p className="text-xs text-gray-600">"{globalSearch}"</p>
                </div>
              </div>
              
              <div 
                className="px-2 py-1 rounded-lg border font-bold text-xs"
                style={{ 
                  borderColor: COLORS.primary,
                  backgroundColor: COLORS.primary,
                  color: 'white'
                }}
              >
                {weeklyStats.totalOrders} results
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold flex items-center gap-1" style={{ color: COLORS.primary }}>
              <Filter size={12} />
              Active Filters
            </h4>
            <span className="text-xs text-gray-500">
              {[
                isGlobalSearchActive && 'Global Search',
                !isGlobalSearchActive && week && 'Week', 
                !isGlobalSearchActive && weekdayFilter && 'Day', 
                !isGlobalSearchActive && locationFilter && 'Location'
              ].filter(Boolean).length} active
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {isGlobalSearchActive && (
              <div 
                className="px-2 py-1 rounded-full text-xs font-bold text-white border shadow-sm flex items-center gap-1"
                style={{ backgroundColor: COLORS.primary, borderColor: COLORS.primary }}
              >
                <Globe size={10} />
                Global: "{globalSearch.length > 20 ? globalSearch.substring(0, 20) + '...' : globalSearch}"
              </div>
            )}
            {!isGlobalSearchActive && week && (
              <div 
                className="px-2 py-1 rounded-full text-xs font-bold text-[#0B2863] border shadow-sm flex items-center gap-1"
                style={{ borderColor: COLORS.primary }}
              >
                <Calendar size={10} />
                Year {year} - Week {week}
              </div>
            )}
            {weekdayFilter && (
              <div 
                className="px-2 py-1 rounded-full text-xs font-bold text-[#0B2863] border shadow-sm flex items-center gap-1"
                style={{ borderColor: COLORS.primary }}
              >
                <Calendar size={10} />
                {weekdayFilter}
              </div>
            )}
            {locationFilter && (
              <div 
                className="px-2 py-1 rounded-full text-xs font-bold text-[#0B2863] border shadow-sm flex items-center gap-1"
                style={{ borderColor: COLORS.primary }}
              >
                <MapPin size={10} />
                {locationFilter}
              </div>
            )}
            {!isGlobalSearchActive && (!week && !weekdayFilter && !locationFilter) && (
              <div 
                className="px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1"
                style={{ 
                  backgroundColor: COLORS.grayBg,
                  borderColor: '#d1d5db',
                  color: COLORS.gray
                }}
              >
                <Activity size={10} />
                No active filters
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};