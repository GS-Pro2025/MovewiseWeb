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

import type { TableData } from '../domain/TableData';

interface TableFiltersProps {
  week: number;
  weekdayFilter: string;
  locationFilter: string;
  locations: string[];
  weekRange: { start: string; end: string };
  onWeekChange: (week: number) => void;
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
  weekdayFilter,
  locationFilter,
  weekRange,
  onWeekChange,
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
      {/* Statistics Panel - Más compacto */}
      <div className="rounded-xl shadow-md border p-3 mb-3" style={{ borderColor: COLORS.primary }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-base font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
              <BarChart3 size={18} />
              {isGlobalSearchActive ? 'Global Search Results' : `Week ${week} Statistics`}
            </h4>
            <p className="text-xs text-gray-600">
              {isGlobalSearchActive 
                ? `Results for "${globalSearch}"`
                : `${weekRange.start} → ${weekRange.end}`
              }
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          {/* Total Orders */}
          <div 
            className="rounded-lg p-2 border shadow-sm transition-all duration-200 hover:shadow-md"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: COLORS.primary }}
              >
                <ClipboardList size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold truncate" style={{ color: COLORS.primary }}>
                  {weeklyStats.totalOrders.toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-gray-600 truncate">
                  {isGlobalSearchActive ? 'Total Found' : 'Total'}
                </div>
              </div>
            </div>
          </div>

          {/* Finished Orders */}
          <div 
            className="rounded-lg p-2 border shadow-sm transition-all duration-200 hover:shadow-md"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: COLORS.success }}
              >
                <CheckCircle size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <div className="text-lg font-bold truncate" style={{ color: COLORS.success }}>
                    {weeklyStats.finishedOrders.toLocaleString()}
                  </div>
                  {weeklyStats.totalOrders > 0 && (
                    <div className="text-xs text-gray-500">
                      ({Math.round((weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100)}%)
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold text-gray-600 truncate">
                  Finished
                </div>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div 
            className="rounded-lg p-2 border shadow-sm transition-all duration-200 hover:shadow-md"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: COLORS.secondary }}
              >
                <Clock size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <div className="text-lg font-bold truncate" style={{ color: COLORS.secondary }}>
                    {weeklyStats.pendingOrders.toLocaleString()}
                  </div>
                  {weeklyStats.totalOrders > 0 && (
                    <div className="text-xs text-gray-500">
                      ({Math.round((weeklyStats.pendingOrders / weeklyStats.totalOrders) * 100)}%)
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold text-gray-600 truncate">
                  Pending
                </div>
              </div>
            </div>
          </div>

          {/* Inactive Orders */}
          <div 
            className="rounded-lg p-2 border shadow-sm transition-all duration-200 hover:shadow-md"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: COLORS.error }}
              >
                <XCircle size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <div className="text-lg font-bold truncate" style={{ color: COLORS.error }}>
                    {weeklyStats.inactiveOrders.toLocaleString()}
                  </div>
                  {weeklyStats.totalOrders > 0 && (
                    <div className="text-xs text-gray-500">
                      ({Math.round((weeklyStats.inactiveOrders / weeklyStats.totalOrders) * 100)}%)
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold text-gray-600 truncate">
                  Inactive
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar - Más compacto */}
        {weeklyStats.totalOrders > 0 && (
          <div className="mt-3 p-2 rounded-lg border shadow-sm" style={{ borderColor: COLORS.primary }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: COLORS.primary }}>
                <Target size={14} />
                {isGlobalSearchActive ? 'Results Progress' : `Week ${week} Progress`}
              </span>
              <span className="text-xs font-semibold" style={{ color: COLORS.success }}>
                {Math.round((weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <CheckCircle size={10} />
                {weeklyStats.finishedOrders}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {weeklyStats.pendingOrders}
              </span>
              <span className="flex items-center gap-1">
                <XCircle size={10} />
                {weeklyStats.inactiveOrders}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Filter Card - Más compacto */}
      <div className="rounded-xl shadow-md border p-3 mb-3 week-dropdown-container" style={{ borderColor: COLORS.primary }} ref={dropdownRef}>
        {/* Header - Más compacto */}
        <div className="flex items-center space-x-2 mb-3">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: COLORS.primary }}
          >
            <ClipboardList size={16} style={{ color: COLORS.secondary }} />
          </div>
          <h2 className="text-base font-bold" style={{ color: COLORS.primary }}>
            FILTERS & SEARCH
          </h2>
        </div>

        {/* Global Search Section - Más compacto */}
        <div className="mb-4">
          <div 
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border shadow-sm"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold" style={{ color: COLORS.primary }}>
                <div className="flex items-center gap-1.5">
                  <Globe size={14} />
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
                  size={14} 
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10"
                  style={{ color: COLORS.primary }}
                />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => onGlobalSearchChange(e.target.value)}
                  onKeyPress={handleGlobalSearchKeyPress}
                  placeholder="Search by order ref, person name, job, or location..."
                  className="w-full pl-8 pr-3 py-2 border rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
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
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
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
                    <Search size={14} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Search
                  </>
                )}
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-600">
              <strong>Tip:</strong> Enter order ref, name, job, or location
            </div>
          </div>
        </div>

        {/* Regular Filters - Más compacto */}
        {!isGlobalSearchActive && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

            {/* Weekday Select Card - Estilo consistente con Autocomplete */}
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
            <div className="flex flex-col justify-between">
              <label className="block text-xs font-bold mb-2" style={{ color: COLORS.primary }}>
                <div className="flex items-center gap-1.5">
                  <BarChart3 size={14} />
                  Quick Actions
                </div>
              </label>
              <button
                onClick={onCalendarOpen}
                className="w-full px-3 py-2 border rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-md flex items-center justify-center space-x-1.5"
                style={{ 
                  borderColor: COLORS.secondary,
                  backgroundColor: COLORS.secondary,
                  color: 'white'
                }}
              >
                <Calendar size={16} />
                <span>Calendar View</span>
              </button>
            </div>
          </div>
        )}

        {/* Period Display Section - Más compacto */}
        {!isGlobalSearchActive && (
          <div 
            className="mt-3 rounded-lg p-3 border"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div 
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Calendar size={14} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.primary }}>
                    Current Period
                  </h3>
                  <p className="text-xs text-gray-600">Active date range</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div 
                  className="px-3 py-1.5 rounded-lg border font-bold text-xs shadow-sm"
                  style={{ 
                    borderColor: COLORS.secondary,
                    color: COLORS.primary
                  }}
                >
                  {weekRange.start}
                </div>
                <ArrowRight 
                  size={16} 
                  style={{ color: COLORS.primary }}
                />
                <div 
                  className="px-3 py-1.5 rounded-lg border font-bold text-xs shadow-sm"
                  style={{ 
                    borderColor: COLORS.secondary,
                    color: COLORS.primary
                  }}
                >
                  {weekRange.end}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Search Indicator - Más compacto */}
        {isGlobalSearchActive && (
          <div 
            className="mt-4 rounded-lg p-3 border"
            style={{ 
              borderColor: COLORS.primary,
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Globe size={14} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.primary }}>
                    Global Search Results
                  </h3>
                  <p className="text-xs text-gray-600">Results for "{globalSearch}"</p>
                </div>
              </div>
              
              <div 
                className="px-3 py-1.5 rounded-lg border font-bold text-xs shadow-sm"
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

        {/* Active Filters Summary - Más compacto */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: COLORS.primary }}>
              <Filter size={14} />
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
                Week {week}
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