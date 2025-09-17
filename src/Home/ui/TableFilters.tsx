import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, ChevronDown, Box, X } from 'lucide-react';

// Tipos para los datos de las órdenes
interface TableData {
  id: string;
  status: 'finished' | 'pending' | 'inactive';
  key_ref: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  state: string;
  weekday: string;
  dateReference: string;
  job: string;
  weight: number;
  distance: number;
  expense: string;
  income: string;
  totalCost: number;
  week: number;
  payStatus: number;
  created_by: string;
  operators?: any[];
}

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
  // Props para datos reales
  data: TableData[];  // Todos los datos sin filtrar
  filteredData: TableData[];  // Datos filtrados por la semana y otros filtros
}

const weekDays = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
  'Thursday', 'Friday', 'Saturday'
];

export const TableFilters: React.FC<TableFiltersProps> = ({
  week,
  weekdayFilter,
  locationFilter,
  locations,
  weekRange,
  onWeekChange,
  onWeekdayChange,
  onLocationChange,
  onCalendarOpen,
  data = [],
}) => {
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'select' | 'input'>('select');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calcular estadísticas basadas en los datos filtrados de la semana actual
  const weeklyStats = React.useMemo(() => {
    // Filtrar datos solo por la semana seleccionada (sin otros filtros aplicados)
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
  }, [data, week]);

  // Estilos para el scrollbar personalizado
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

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWeekDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generar array de semanas (1-53)
  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);

  // Función para seleccionar semana desde el dropdown
  const handleWeekSelect = (selectedWeek: number) => {
    onWeekChange(selectedWeek);
    setShowWeekDropdown(false);
  };

  // Función para manejar cambio de input numérico
  const handleWeekInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWeek = parseInt(event.target.value, 10);
    if (newWeek >= 1 && newWeek <= 53) {
      onWeekChange(newWeek);
    }
  };

  // Función para navegar con teclado en el dropdown
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

  return (
    <div>
      {/* Main Filter Card */}
      <div className=" rounded-2xl shadow-lg border-2 p-6 mb-6 week-dropdown-container" style={{ borderColor: '#0B2863' }}>
        {/* Header with Gradient Background */}
        <div 
          className="rounded-xl p-4 mb-6 -mx-2 -mt-2"
        >
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: '#F09F52' }}
            >
              <Box size={20} className="text-[#0B2863]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0B2863]">
                ORDERS 
              </h2>

            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Week Input Card - Implementación mejorada */}
          <div 
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 shadow-md"
            style={{ borderColor: '#0B2863' }}
            ref={dropdownRef}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold" style={{ color: '#0B2863' }}>
                📅 Week Number
              </label>
              <button
                onClick={() => setViewMode(viewMode === 'select' ? 'input' : 'select')}
                className="text-xs px-2 py-1 rounded-md border transition-colors duration-200"
                style={{ 
                  backgroundColor: '#F09F52',
                  borderColor: '#0B2863',
                  color: 'white'
                }}
                title={`Switch to ${viewMode === 'select' ? 'input' : 'dropdown'} view`}
              >
                {viewMode === 'select' ? '⌨️' : '▼'}
              </button>
            </div>
            
            {viewMode === 'select' ? (
              // Modo dropdown mejorado
              <div className="relative">
                <div
                  className="w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 font-bold text-center bg-white cursor-pointer flex items-center justify-between shadow-sm"
                  style={{ borderColor: '#F09F52' }}
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
                  <span style={{ color: '#0B2863' }}>Week {week}</span>
                  <ChevronDown 
                    size={16}
                    className={`transition-transform duration-200 ${showWeekDropdown ? 'rotate-180' : ''}`}
                    style={{ color: '#F09F52' }}
                  />
                </div>

                {showWeekDropdown && (
                  <div className="week-dropdown mt-2 bg-white border-2 rounded-lg shadow-xl w-[350px]" style={{ borderColor: '#0B2863' }}>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold" style={{ color: '#0B2863' }}>Select week (1-53):</span>
                        <button
                          onClick={() => setShowWeekDropdown(false)}
                          className="p-1 rounded transition-colors"
                          style={{ backgroundColor: '#ef4444', color: 'white' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      
                      {/* Quick actions */}
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
                              backgroundColor: '#F09F52',
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
                              backgroundColor: week === weekNum ? '#22c55e' : '#f9fafb',
                              color: week === weekNum ? 'white' : '#0B2863',
                              borderColor: week === weekNum ? '#22c55e' : '#e5e7eb'
                            }}
                            onMouseEnter={(e) => {
                              if (week !== weekNum) {
                                e.currentTarget.style.backgroundColor = '#F09F52';
                                e.currentTarget.style.color = 'white';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (week !== weekNum) {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                e.currentTarget.style.color = '#0B2863';
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
              // Modo input numérico
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="53"
                  value={week}
                  onChange={handleWeekInputChange}
                  className="w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 font-bold text-center bg-white shadow-sm"
                  style={{ 
                    borderColor: '#0B2863',
                    color: '#0B2863'
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
              style={{ backgroundColor: week ? '#22c55e' : '#ef4444' }}
            ></div>
          </div>

          {/* Weekday Select Card */}
          <div 
            className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 shadow-md"
            style={{ borderColor: '#F09F52' }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold" style={{ color: '#0B2863' }}>
                📆 Weekday Filter
              </label>
              {weekdayFilter && (
                <button
                  onClick={() => onWeekdayChange('')}
                  className="p-1 rounded transition-colors"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
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
                  borderColor: '#0B2863',
                  color: weekdayFilter ? '#0B2863' : '#6b7280'
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
                style={{ color: '#F09F52' }}
              />
              <div 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                style={{ backgroundColor: weekdayFilter ? '#22c55e' : '#ef4444' }}
              ></div>
            </div>
          </div>

          {/* Location Input Card - Con botón clear individual */}
          <div 
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 shadow-md"
            style={{ borderColor: '#22c55e' }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold" style={{ color: '#0B2863' }}>
                📍 Location Filter
              </label>
              {locationFilter && (
                <button
                  onClick={() => onLocationChange('')}
                  className="p-1 rounded transition-colors"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                  title="Clear location filter"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="relative">
              <MapPin 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10"
                style={{ color: '#22c55e' }}
              />
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => onLocationChange(e.target.value)}
                list="locations-list"
                placeholder="Search location..."
                className="w-full pl-10 pr-4 py-3 border-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ 
                  borderColor: '#0B2863',
                  backgroundColor: 'white',
                  color: '#0B2863'
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = `0 0 0 3px rgba(34, 197, 94, 0.3)`;
                  e.target.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'scale(1)';
                }}
              />
              <datalist id="locations-list">
                {locations.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
              <div 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                style={{ backgroundColor: locationFilter ? '#22c55e' : '#ef4444' }}
              ></div>
            </div>
          </div>

          {/* Calendar Button Card */}
          <div 
            className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border-2 shadow-md flex flex-col justify-between"
            style={{ borderColor: '#8b5cf6' }}
          >
            <label className="block text-sm font-bold mb-3" style={{ color: '#0B2863' }}>
              📊 Quick Actions
            </label>
            <button
              onClick={onCalendarOpen}
              className="w-full px-4 py-3 border-2 rounded-lg text-sm font-bold transition-all duration-200 hover:shadow-lg flex items-center justify-center space-x-2"
              style={{ 
                borderColor: '#8b5cf6',
                backgroundColor: '#8b5cf6',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
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

        {/* Period Display Section */}
        <div 
          className="mt-6 rounded-xl p-4 border-2"
          style={{ 
            borderColor: '#F09F52',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#0B2863' }}
              >
                <Calendar size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: '#0B2863' }}>
                  Current Period
                </h3>
                <p className="text-sm text-gray-600">Active date range for your data</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div 
                className="px-4 py-2 rounded-xl border-2 font-bold text-sm shadow-md"
                style={{ 
                  borderColor: '#22c55e',
                  backgroundColor: '#22c55e',
                  color: 'white'
                }}
              >
                {weekRange.start}
              </div>
              <div 
                className="p-2 rounded-full"
                style={{ backgroundColor: '#F09F52' }}
              >
                <span className="text-white font-bold">→</span>
              </div>
              <div 
                className="px-4 py-2 rounded-xl border-2 font-bold text-sm shadow-md"
                style={{ 
                  borderColor: '#22c55e',
                  backgroundColor: '#22c55e',
                  color: 'white'
                }}
              >
                {weekRange.end}
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold" style={{ color: '#0B2863' }}>
              🏷️ Active Filters
            </h4>
            <span className="text-xs text-gray-500">
              {[week && 'Week', weekdayFilter && 'Day', locationFilter && 'Location'].filter(Boolean).length} active
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {week && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold text-white border-2 shadow-sm"
                style={{ backgroundColor: '#F09F52', borderColor: '#0B2863' }}
              >
                📅 Week {week}
              </div>
            )}
            {weekdayFilter && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold text-white border-2 shadow-sm"
                style={{ backgroundColor: '#F09F52', borderColor: '#0B2863' }}
              >
                📆 {weekdayFilter}
              </div>
            )}
            {locationFilter && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold text-white border-2 shadow-sm"
                style={{ backgroundColor: '#F09F52', borderColor: '#0B2863' }}
              >
                📍 {locationFilter}
              </div>
            )}
            {(!week && !weekdayFilter && !locationFilter) && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-semibold border-2"
                style={{ 
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#6b7280'
                }}
              >
                ✨ No active filters - showing all data
              </div>
            )}
          </div>
        </div>

        {/* Statistics Panel - DATOS REALES */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold" style={{ color: '#0B2863' }}>
                📊 Week {week} Statistics
              </h4>
              <p className="text-sm text-gray-600">
                Orders for {weekRange.start} → {weekRange.end}
              </p>
            </div>
            <div 
              className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: '#F09F52' }}
            >
              Live Data
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Orders */}
            <div 
              className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border-2 shadow-md text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: '#0B2863' }}
            >
              <div 
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#0B2863' }}
              >
                <span className="text-white font-bold text-lg">📋</span>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: '#0B2863' }}>
                {weeklyStats.totalOrders.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                Total This Week
              </div>
            </div>

            {/* Finished Orders */}
            <div 
              className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 shadow-md text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: '#22c55e' }}
            >
              <div 
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#22c55e' }}
              >
                <span className="text-white font-bold text-lg">✅</span>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: '#22c55e' }}>
                {weeklyStats.finishedOrders.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                Finished This Week
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
              style={{ borderColor: '#F09F52' }}
            >
              <div 
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F09F52' }}
              >
                <span className="text-white font-bold text-lg">⏳</span>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: '#F09F52' }}>
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
              style={{ borderColor: '#ef4444' }}
            >
              <div 
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#ef4444' }}
              >
                <span className="text-white font-bold text-lg">❌</span>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: '#ef4444' }}>
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
            <div className="mt-4 p-4 bg-white rounded-xl border-2 shadow-md" style={{ borderColor: '#0B2863' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: '#0B2863' }}>
                  🎯 Week {week} Progress
                </span>
                <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                  {Math.round((weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="transition-all duration-500"
                    style={{ 
                      width: `${(weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100}%`,
                      backgroundColor: '#22c55e'
                    }}
                  ></div>
                  <div 
                    className="transition-all duration-500"
                    style={{ 
                      width: `${(weeklyStats.pendingOrders / weeklyStats.totalOrders) * 100}%`,
                      backgroundColor: '#F09F52'
                    }}
                  ></div>
                  <div 
                    className="transition-all duration-500"
                    style={{ 
                      width: `${(weeklyStats.inactiveOrders / weeklyStats.totalOrders) * 100}%`,
                      backgroundColor: '#ef4444'
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>✅ {weeklyStats.finishedOrders} finished</span>
                <span>⏳ {weeklyStats.pendingOrders} pending</span>
                <span>❌ {weeklyStats.inactiveOrders} inactive</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};