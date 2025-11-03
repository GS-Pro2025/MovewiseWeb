import React, { useState, useRef, useEffect } from 'react';
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { 
  Calendar, 
  MapPin, 
  ChevronDown,
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
  Globe
} from 'lucide-react';

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
  // AGREGAR: nuevas props para la lógica de ubicación del payroll
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
  primary: '#0B2863',      // Azul principal
  secondary: '#F09F52',    // Naranja
  success: '#22c55e',      // Verde (validaciones)
  error: '#ef4444',        // Rojo (validaciones)
  gray: '#6b7280',
  lightGray: '#9CA3AF',
  grayBg: '#f3f4f6'
};

// AGREGAR: Tipos para las opciones de location
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
  // AGREGAR: nuevos props para ubicación
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
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'select' | 'input'>('select');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // AGREGAR: Lógica para opciones y labels dinámicos según el paso
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWeekDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);

  const handleWeekSelect = (selectedWeek: number) => {
    onWeekChange(selectedWeek);
    setShowWeekDropdown(false);
  };

  const handleWeekInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWeek = parseInt(event.target.value, 10);
    if (newWeek >= 1 && newWeek <= 53) {
      onWeekChange(newWeek);
    }
  };

  const handleWeekKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowWeekDropdown(true);
    } else if (e.key === 'Escape') {
      setShowWeekDropdown(false);
    } else if (e.key === 'Enter') {
      setShowWeekDropdown(!showWeekDropdown);
    }
  };

  const handleGlobalSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !globalSearchLoading && globalSearch.trim()) {
      onGlobalSearchSubmit();
    }
  };

  return (
    <div>
      {/* Statistics Panel */}
      <div className="rounded-2xl shadow-lg border-2 p-6 mb-6" style={{ borderColor: COLORS.primary }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
              <BarChart3 size={20} />
              {isGlobalSearchActive ? 'Global Search Results' : `Week ${week} Statistics`}
            </h4>
            <p className="text-sm text-gray-600">
              {isGlobalSearchActive 
                ? `Global search results for "${globalSearch}" (no week/date filters applied)`
                : `Orders for ${weekRange.start} → ${weekRange.end}`
              }
            </p>
          </div>
          <div 
            className="px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
            style={{ backgroundColor: isGlobalSearchActive ? COLORS.primary : COLORS.secondary }}
          >
            <Activity size={12} />
            {isGlobalSearchActive ? 'Global Search' : 'Week Filter'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Orders */}
          <div 
            className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border-2 shadow-md text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            style={{ borderColor: COLORS.primary }}
          >
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.primary }}
            >
              <ClipboardList size={20} className="text-white" />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: COLORS.primary }}>
              {weeklyStats.totalOrders.toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-gray-600">
              {isGlobalSearchActive ? 'Total Found' : 'Total This Week'}
            </div>
          </div>

          {/* Finished Orders */}
          <div 
            className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 shadow-md text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            style={{ borderColor: COLORS.success }}
          >
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.success }}
            >
              <CheckCircle size={20} className="text-white" />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: COLORS.success }}>
              {weeklyStats.finishedOrders.toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-gray-600">
              {isGlobalSearchActive ? 'Finished Found' : 'Finished This Week'}
            </div>
            {weeklyStats.totalOrders > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100)}%
              </div>
            )}
          </div>

          {/* Pending Orders */}
          <div 
            className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 shadow-md text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            style={{ borderColor: COLORS.secondary }}
          >
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.secondary }}
            >
              <Clock size={20} className="text-white" />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: COLORS.secondary }}>
              {weeklyStats.pendingOrders.toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-gray-600">
              Pending This Week
            </div>
            {weeklyStats.totalOrders > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((weeklyStats.pendingOrders / weeklyStats.totalOrders) * 100)}%
              </div>
            )}
          </div>

          {/* Inactive Orders */}
          <div 
            className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-4 border-2 shadow-md text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            style={{ borderColor: COLORS.error }}
          >
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.error }}
            >
              <XCircle size={20} className="text-white" />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: COLORS.error }}>
              {weeklyStats.inactiveOrders.toLocaleString()}
            </div>
            <div className="text-sm font-semibold text-gray-600">
              Inactive This Week
            </div>
            {weeklyStats.totalOrders > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((weeklyStats.inactiveOrders / weeklyStats.totalOrders) * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {weeklyStats.totalOrders > 0 && (
          <div className="mt-4 p-4 bg-white rounded-xl border-2 shadow-md" style={{ borderColor: COLORS.primary }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
                <Target size={16} />
                {isGlobalSearchActive ? 'Search Results Progress' : `Week ${week} Progress`}
              </span>
              <span className="text-sm font-semibold" style={{ color: COLORS.success }}>
                {Math.round((weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100)}% Complete
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
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <CheckCircle size={12} />
                {weeklyStats.finishedOrders} finished
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {weeklyStats.pendingOrders} pending
              </span>
              <span className="flex items-center gap-1">
                <XCircle size={12} />
                {weeklyStats.inactiveOrders} inactive
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Filter Card */}
      <div className="rounded-2xl shadow-lg border-2 p-6 mb-6 week-dropdown-container" style={{ borderColor: COLORS.primary }}>
        {/* Header */}
        <div className="rounded-xl p-4 mb-6 -mx-2 -mt-2">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: COLORS.secondary }}
            >
              <ClipboardList size={20} style={{ color: COLORS.primary }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>
                FILTERS & SEARCH
              </h2>
            </div>
          </div>
        </div>

        {/* Global Search Section */}
        <div className="mb-6">
          <div 
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 shadow-md"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold" style={{ color: COLORS.primary }}>
                <div className="flex items-center gap-2">
                  <Globe size={16} />
                  Global Search
                </div>
              </label>
              {isGlobalSearchActive && (
                <button
                  onClick={onGlobalSearchClear}
                  className="p-1 rounded transition-colors"
                  style={{ backgroundColor: COLORS.error, color: 'white' }}
                  title="Clear global search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search 
                  size={16} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10"
                  style={{ color: COLORS.primary }}
                />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => onGlobalSearchChange(e.target.value)}
                  onKeyPress={handleGlobalSearchKeyPress}
                  placeholder="Search by order ref, person name, job, or location..."
                  className="w-full pl-10 pr-4 py-3 border-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
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
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  globalSearchLoading || !globalSearch.trim()
                    ? 'cursor-not-allowed'
                    : 'text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                }`}
                style={{
                  backgroundColor: globalSearchLoading || !globalSearch.trim() ? '#d1d5db' : COLORS.primary,
                  color: globalSearchLoading || !globalSearch.trim() ? COLORS.gray : 'white'
                }}
              >
                {globalSearchLoading ? (
                  <>
                    <Search size={16} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Search
                  </>
                )}
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-600">
              <strong>Search tips:</strong> Enter order reference (e.g., ORD-2025-001), person name, job type, or location
            </div>
          </div>
        </div>

        {/* Regular Filters - Only when NOT in global search mode */}
        {!isGlobalSearchActive && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Week Input Card */}
            <div 
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 shadow-md"
              style={{ borderColor: COLORS.primary }}
              ref={dropdownRef}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold" style={{ color: COLORS.primary }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    Week Number
                  </div>
                </label>
                <button
                  onClick={() => setViewMode(viewMode === 'select' ? 'input' : 'select')}
                  className="text-xs px-2 py-1 rounded-md border transition-colors duration-200"
                  style={{ 
                    backgroundColor: COLORS.secondary,
                    borderColor: COLORS.primary,
                    color: 'white'
                  }}
                  title={`Switch to ${viewMode === 'select' ? 'input' : 'dropdown'} view`}
                >
                  {viewMode === 'select' ? <Filter size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
              
              {viewMode === 'select' ? (
                <div className="relative">
                  <div
                    className="w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 font-bold text-center bg-white cursor-pointer flex items-center justify-between shadow-sm"
                    style={{ borderColor: COLORS.secondary }}
                    onClick={() => setShowWeekDropdown(!showWeekDropdown)}
                    onKeyDown={handleWeekKeyDown}
                    tabIndex={0}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{ color: COLORS.primary }}>Week {week}</span>
                    <ChevronDown 
                      size={16}
                      className={`transition-transform duration-200 ${showWeekDropdown ? 'rotate-180' : ''}`}
                      style={{ color: COLORS.secondary }}
                    />
                  </div>

                  {showWeekDropdown && (
                    <div className="week-dropdown mt-2 bg-white border-2 rounded-lg shadow-xl w-[350px]" style={{ borderColor: COLORS.primary }}>
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-semibold" style={{ color: COLORS.primary }}>Select week (1-53):</span>
                          <button
                            onClick={() => setShowWeekDropdown(false)}
                            className="p-1 rounded transition-colors"
                            style={{ backgroundColor: COLORS.error, color: 'white' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                        
                        <div className="flex gap-1 mb-3">
                          {[
                            { label: 'First', week: 1 },
                            { label: 'Q1', week: 13 },
                            { label: 'Mid', week: 26 },
                            { label: 'Q3', week: 39 },
                            { label: 'Last', week: 53 }
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={() => handleWeekSelect(item.week)}
                              className="text-xs px-2 py-1 rounded transition-colors"
                              style={{ 
                                backgroundColor: COLORS.secondary,
                                color: 'white'
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-9 gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                          {weeks.map((weekNum) => (
                            <button
                              key={weekNum}
                              onClick={() => handleWeekSelect(weekNum)}
                              className={`p-2 text-sm rounded-md border transition-all duration-200 font-medium hover:scale-105`}
                              style={{
                                backgroundColor: week === weekNum ? COLORS.success : '#f9fafb',
                                color: week === weekNum ? 'white' : COLORS.primary,
                                borderColor: week === weekNum ? COLORS.success : '#e5e7eb'
                              }}
                              onMouseEnter={(e) => {
                                if (week !== weekNum) {
                                  e.currentTarget.style.backgroundColor = COLORS.secondary;
                                  e.currentTarget.style.color = 'white';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (week !== weekNum) {
                                  e.currentTarget.style.backgroundColor = '#f9fafb';
                                  e.currentTarget.style.color = COLORS.primary;
                                }
                              }}
                              title={`Select week ${weekNum}`}
                            >
                              {weekNum}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={week}
                    onChange={handleWeekInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 font-bold text-center bg-white shadow-sm"
                    style={{ 
                      borderColor: COLORS.primary,
                      color: COLORS.primary
                    }}
                    placeholder="1-53"
                    onFocus={(e) => {
                      e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                </div>
              )}
              <div 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                style={{ backgroundColor: week ? COLORS.success : COLORS.error }}
              ></div>
            </div>

            {/* Weekday Select Card */}
            <div 
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 shadow-md"
              style={{ borderColor: COLORS.secondary }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold" style={{ color: COLORS.primary }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    Weekday Filter
                  </div>
                </label>
                {weekdayFilter && (
                  <button
                    onClick={() => onWeekdayChange('')}
                    className="p-1 rounded transition-colors"
                    style={{ backgroundColor: COLORS.error, color: 'white' }}
                    title="Clear weekday filter"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={weekdayFilter}
                  onChange={(e) => onWeekdayChange(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 rounded-lg text-sm font-semibold appearance-none bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ 
                    borderColor: COLORS.primary,
                    color: weekdayFilter ? COLORS.primary : COLORS.gray
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
                    e.target.style.transform = 'scale(1.02)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <option value="">All Weekdays</option>
                  {weekDays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  size={16} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                  style={{ color: COLORS.secondary }}
                />
                <div 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                  style={{ backgroundColor: weekdayFilter ? COLORS.success : COLORS.error }}
                ></div>
              </div>
            </div>

            {/* CAMBIAR: Location Input Card - usar lógica de PayrollControls */}
            <div 
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 shadow-md"
              style={{ borderColor: COLORS.primary }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold" style={{ color: COLORS.primary }}>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
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
                    className="text-xs text-red-500 hover:text-red-700 transition-colors duration-200 flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded-md border border-red-200"
                    title="Clear location"
                  >
                    <X size={12} />
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
                <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-purple-700 font-medium text-xs">
                    Selected: <span className="font-bold">{locationString}</span>
                  </p>
                </div>
              )}
              <div 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                style={{ backgroundColor: locationString ? COLORS.success : COLORS.error }}
              ></div>
            </div>

            {/* Calendar Button Card */}
            <div 
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 shadow-md flex flex-col justify-between"
              style={{ borderColor: COLORS.secondary }}
            >
              <label className="block text-sm font-bold mb-3" style={{ color: COLORS.primary }}>
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  Quick Actions
                </div>
              </label>
              <button
                onClick={onCalendarOpen}
                className="w-full px-4 py-3 border-2 rounded-lg text-sm font-bold transition-all duration-200 hover:shadow-lg flex items-center justify-center space-x-2"
                style={{ 
                  borderColor: COLORS.secondary,
                  backgroundColor: COLORS.secondary,
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(240, 159, 82, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Calendar size={18} />
                <span>Calendar View</span>
              </button>
            </div>
          </div>
        )}

        {/* Period Display Section */}
        {!isGlobalSearchActive && (
          <div 
            className="mt-6 rounded-xl p-4 border-2"
            style={{ 
              borderColor: COLORS.secondary,
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Calendar size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: COLORS.primary }}>
                    Current Period
                  </h3>
                  <p className="text-sm text-gray-600">Active date range for your data</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div 
                  className="px-4 py-2 rounded-xl border-2 font-bold text-sm shadow-md"
                  style={{ 
                    borderColor: COLORS.success,
                    backgroundColor: COLORS.success,
                    color: 'white'
                  }}
                >
                  {weekRange.start}
                </div>
                <div 
                  className="p-2 rounded-full"
                  style={{ backgroundColor: COLORS.secondary }}
                >
                  <span className="text-white font-bold">→</span>
                </div>
                <div 
                  className="px-4 py-2 rounded-xl border-2 font-bold text-sm shadow-md"
                  style={{ 
                    borderColor: COLORS.success,
                    backgroundColor: COLORS.success,
                    color: 'white'
                  }}
                >
                  {weekRange.end}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Search Indicator */}
        {isGlobalSearchActive && (
          <div 
            className="mt-6 rounded-xl p-4 border-2"
            style={{ 
              borderColor: COLORS.primary,
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Globe size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: COLORS.primary }}>
                    Global Search Results
                  </h3>
                  <p className="text-sm text-gray-600">Search results for "{globalSearch}"</p>
                </div>
              </div>
              
              <div 
                className="px-4 py-2 rounded-xl border-2 font-bold text-sm shadow-md"
                style={{ 
                  borderColor: COLORS.primary,
                  backgroundColor: COLORS.primary,
                  color: 'white'
                }}
              >
                {weeklyStats.totalOrders} results found
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
              <Filter size={16} />
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
          
          <div className="flex flex-wrap gap-2">
            {isGlobalSearchActive && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold text-white border-2 shadow-sm flex items-center gap-1"
                style={{ backgroundColor: COLORS.primary, borderColor: COLORS.primary }}
              >
                <Globe size={12} />
                Global: "{globalSearch.length > 20 ? globalSearch.substring(0, 20) + '...' : globalSearch}"
              </div>
            )}
            {!isGlobalSearchActive && week && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold text-white border-2 shadow-sm flex items-center gap-1"
                style={{ backgroundColor: COLORS.secondary, borderColor: COLORS.primary }}
              >
                <Calendar size={12} />
                Week {week}
              </div>
            )}
            {weekdayFilter && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold text-white border-2 shadow-sm flex items-center gap-1"
                style={{ backgroundColor: COLORS.secondary, borderColor: COLORS.primary }}
              >
                <Calendar size={12} />
                {weekdayFilter}
              </div>
            )}
            {locationFilter && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold text-white border-2 shadow-sm flex items-center gap-1"
                style={{ backgroundColor: COLORS.secondary, borderColor: COLORS.primary }}
              >
                <MapPin size={12} />
                {locationFilter}
              </div>
            )}
            {!isGlobalSearchActive && (!week && !weekdayFilter && !locationFilter) && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1"
                style={{ 
                  backgroundColor: COLORS.grayBg,
                  borderColor: '#d1d5db',
                  color: COLORS.gray
                }}
              >
                <Activity size={12} />
                No active filters - showing all data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};