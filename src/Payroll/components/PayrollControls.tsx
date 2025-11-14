import React, { useState, useRef, useEffect } from 'react';
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { WeekInfo } from "../../service/PayrollService";
import PayrollExport from '../util/PayrollExport';
import { OperatorRowExtended } from '../types/payroll.types';
import WeekPicker from '../../components/WeekPicker'; // <-- nueva importación

interface PayrollControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
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
  week: number;
  changeWeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  weekInfo: WeekInfo | null;
  loading: boolean;
  grouped: OperatorRowExtended[];
  filteredOperators: OperatorRowExtended[];
  weekDates: { [key: string]: string };
  paymentStats: {
    paid: number;
    unpaid: number;
    total: number;
    paidAmount: number;
    unpaidAmount: number;
  };
  filteredTotalGrand: number;
}

// Tipos para las opciones de location
type LocationOption = { country: string } | { name: string } | string;

export const PayrollControls: React.FC<PayrollControlsProps> = ({
  searchTerm,
  setSearchTerm,
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
  week,
  changeWeek,
  weekInfo,
  loading,
  grouped,
  filteredOperators,
  weekDates,
  paymentStats,
  filteredTotalGrand,
}) => {
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  console.log("Rendering PayrollControls with week:", showWeekDropdown);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      
      /* Asegurar que el dropdown tenga el z-index más alto */
      .week-dropdown-container {
        z-index: 1 !important;
        position: relative;
      }
      
      .week-dropdown {
        z-index: 1 !important;
        position: relative;
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

  // Opciones y labels dinámicos según el paso - TIPOS CORRECTOS
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

  return (
    <div className="bg-white/0 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 mb-6 week-dropdown-container">
      {/* Animated border */}
      <div className="top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-pulse" style={{ backgroundSize: '200% 100%' }}></div>
      
      {/* Main Controls */}
      <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
        {/* Week Input - Mejorado */}
        <div className="min-w-[200px]">
          <WeekPicker
            week={week}
            onWeekSelect={(selectedWeek) => {
              // crear evento sintético para mantener la firma de changeWeek
              const syntheticEvent = { target: { value: selectedWeek.toString() } } as React.ChangeEvent<HTMLInputElement>;
              changeWeek(syntheticEvent);
            }}
            className="/* puedes pasar clases si necesitas */"
          />
        </div>
        
        {/* Resto del código permanece igual */}
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="bg-white/80 rounded-xl p-4 border-2 border-gray-100 shadow-sm">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🔍 Search Operators
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by code, name, or last name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="relative right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-md"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Location Input */}
        <div className="w-72">
          <div className="bg-white/80 rounded-xl p-4 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">
                📍 Location
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
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
          </div>
        </div>
      </div>

      {/* Period and Export */}
      <div className="flex flex-col items-center mt-8 gap-4">
        {weekInfo && (
          <div className="flex items-center gap-4 bg-amber-50 rounded-xl p-5 border-2 border-amber-200 shadow-sm w-full max-w-md">
            <div className="bg-amber-100 p-3 rounded-full">
              <span className="text-amber-700 text-lg">⏰</span>
            </div>
            <div>
              <div className="text-sm font-bold text-amber-800 uppercase tracking-wide">Payroll Period</div>
              <div className="text-amber-700 font-semibold text-lg">
                {weekInfo.start_date} → {weekInfo.end_date}
              </div>
            </div>
          </div>
        )}
        {!loading && weekInfo && grouped.length > 0 && (
          <PayrollExport
            operators={filteredOperators}
            weekInfo={weekInfo}
            weekDates={weekDates}
            week={week}
            location={locationString}
            paymentStats={paymentStats}
            totalGrand={filteredTotalGrand}
          />
        )}
      </div>
    </div>
  );
};