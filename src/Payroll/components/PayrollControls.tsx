import React, { useRef, useEffect } from 'react';
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Search, MapPin, X, Calendar, ArrowRight } from 'lucide-react';
import { WeekInfo } from "../../service/PayrollService";
import PayrollExport from '../util/PayrollExport';
import { OperatorRowExtended } from '../types/payroll.types';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';

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
  year: number;
  changeYear: (year: number) => void;
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

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
  gray: '#6b7280',
};

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
  year,
  changeYear,
  weekInfo,
  loading,
  grouped,
  filteredOperators,
  weekDates,
  paymentStats,
  filteredTotalGrand,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="bg-white rounded-xl shadow-md border p-4 mb-4 week-dropdown-container" style={{ borderColor: COLORS.primary }} ref={dropdownRef}>
      {/* Main Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Week Input */}
        <div className="relative">
          <WeekPicker
            week={week}
            onWeekSelect={(selectedWeek) => {
              const syntheticEvent = { target: { value: selectedWeek.toString() } } as React.ChangeEvent<HTMLInputElement>;
              changeWeek(syntheticEvent);
            }}
          />
        </div>
        
        {/* Year Input */}
        <div className="relative">
          <YearPicker
            year={year}
            onYearSelect={changeYear}
            min={2020}
            max={new Date().getFullYear() + 2}
          />
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <label className="block text-xs font-bold mb-2" style={{ color: COLORS.primary }}>
            <div className="flex items-center gap-1.5">
              <Search size={14} />
              Search Operators
            </div>
          </label>
          <div className="relative">
            <Search 
              size={14} 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10"
              style={{ color: COLORS.primary }}
            />
            <input
              type="text"
              placeholder="Search by code, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-2 border rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
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
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 rounded transition-colors"
                style={{ color: COLORS.error }}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        
        {/* Location Input */}
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
        </div>
      </div>

      {/* Period and Export */}
      {weekInfo && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.primary }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Period Info */}
            <div className="flex items-center gap-3 rounded-lg p-3 border-2 shadow-sm" style={{ borderColor: COLORS.secondary }}>
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.primary }}>
                <Calendar size={14} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: COLORS.primary }}>
                  Payroll Period (Week {week}, {year})
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: COLORS.gray }}>
                  <span>{weekInfo.start_date}</span>
                  <ArrowRight size={12} style={{ color: COLORS.primary }} />
                  <span>{weekInfo.end_date}</span>
                </div>
              </div>
            </div>

            {/* Export Button */}
            {!loading && grouped.length > 0 && (
              <PayrollExport
                operators={filteredOperators}
                weekInfo={weekInfo}
                weekDates={weekDates}
                week={week}
                year={year}
                location={locationString}
                paymentStats={paymentStats}
                totalGrand={filteredTotalGrand}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};