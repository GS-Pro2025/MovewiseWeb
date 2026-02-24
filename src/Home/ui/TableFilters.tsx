import React, { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  ArrowRight,
} from "lucide-react";
import WeekPicker from "../../components/WeekPicker";
import YearPicker from "../../components/YearPicker";
import type { TableData } from "../domain/TableData";

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

const COLORS = {
  primary: "#0B2863",
  secondary: "#F09F52",
  success: "#22c55e",
  error: "#ef4444",
  gray: "#6b7280",
  lightGray: "#9CA3AF",
  grayBg: "#f3f4f6",
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
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Weekdays translated
  const weekDayOptions = [
    { label: t("weekdays.sunday"), value: "Sunday" },
    { label: t("weekdays.monday"), value: "Monday" },
    { label: t("weekdays.tuesday"), value: "Tuesday" },
    { label: t("weekdays.wednesday"), value: "Wednesday" },
    { label: t("weekdays.thursday"), value: "Thursday" },
    { label: t("weekdays.friday"), value: "Friday" },
    { label: t("weekdays.saturday"), value: "Saturday" },
  ];

  let options: LocationOption[] = [];
  let getOptionLabel: (option: LocationOption) => string = () => "";
  let label = "";
  let value: LocationOption | null = null;

  if (locationStep === "country") {
    options = countries;
    getOptionLabel = (o: LocationOption) =>
      typeof o === "object" && "country" in o ? o.country : "";
    label = t("filters.country");
    value = countries.find((c) => c.country === country) || null;
  } else if (locationStep === "state") {
    options = states;
    getOptionLabel = (o: LocationOption) =>
      typeof o === "object" && "name" in o ? o.name : "";
    label = t("filters.state");
    value = states.find((s) => s.name === state) || null;
  } else if (locationStep === "city") {
    options = cities;
    getOptionLabel = (o: LocationOption) => (typeof o === "string" ? o : "");
    label = t("filters.city");
    value = city || null;
  }

  const weeklyStats = React.useMemo(() => {
    if (isGlobalSearchActive) {
      return {
        totalOrders: data.length,
        finishedOrders: data.filter((item) => item.status === "finished")
          .length,
        pendingOrders: data.filter((item) => item.status === "pending").length,
        inactiveOrders: data.filter((item) => item.status === "inactive")
          .length,
      };
    }
    const weekData = data.filter((item) => item.week === week);
    return {
      totalOrders: weekData.length,
      finishedOrders: weekData.filter((item) => item.status === "finished")
        .length,
      pendingOrders: weekData.filter((item) => item.status === "pending")
        .length,
      inactiveOrders: weekData.filter((item) => item.status === "inactive")
        .length,
    };
  }, [data, week, isGlobalSearchActive]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
      .week-dropdown-container { z-index: 9999 !important; position: relative; }
      .week-dropdown { z-index: 10000 !important; position: absolute; top: 100%; left: 0; right: 0; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleGlobalSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !globalSearchLoading && globalSearch.trim()) {
      onGlobalSearchSubmit();
    }
  };

  const finishedPct =
    weeklyStats.totalOrders > 0
      ? Math.round((weeklyStats.finishedOrders / weeklyStats.totalOrders) * 100)
      : 0;
  const pendingPct =
    weeklyStats.totalOrders > 0
      ? Math.round((weeklyStats.pendingOrders / weeklyStats.totalOrders) * 100)
      : 0;
  const inactivePct =
    weeklyStats.totalOrders > 0
      ? Math.round((weeklyStats.inactiveOrders / weeklyStats.totalOrders) * 100)
      : 0;

  const activeFilterCount = [
    isGlobalSearchActive && "global",
    !isGlobalSearchActive && week && "week",
    !isGlobalSearchActive && weekdayFilter && "day",
    !isGlobalSearchActive && locationFilter && "location",
  ].filter(Boolean).length;

  return (
    <div data-statistics-panel="true">
      {/* Statistics Panel */}
      <div
        className="rounded-xl shadow-md border p-3 mb-2 transition-all duration-300"
        style={{ borderColor: COLORS.primary }}
      >
        <div className="flex items-center justify-between mb-2">
          <h4
            className="text-sm font-bold flex items-center gap-2"
            style={{ color: COLORS.primary }}
          >
            <BarChart3 size={16} />
            {isGlobalSearchActive
              ? t("filters.globalSearchResults")
              : t("filters.weekStatistics", { week })}
          </h4>
          <span className="text-xs text-gray-600">
            {isGlobalSearchActive
              ? t("filters.resultsFor", { search: globalSearch })
              : `${weekRange.start} → ${weekRange.end}`}
          </span>
        </div>

        {weeklyStats.totalOrders > 0 && (
          <div
            className="p-3 rounded-lg border shadow-sm"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <span
                  className="text-xs font-bold flex items-center gap-1"
                  style={{ color: COLORS.primary }}
                >
                  <Target size={14} />
                  {isGlobalSearchActive
                    ? t("filters.resultsProgress")
                    : t("filters.weekProgress", { week })}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: COLORS.success }}
                >
                  {t("filters.complete", { percent: finishedPct })}
                </span>
              </div>
              <span
                className="text-xs font-bold"
                style={{ color: COLORS.primary }}
              >
                {t("filters.total", { count: weeklyStats.totalOrders })}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-lg h-3 overflow-hidden">
              <div className="h-full flex">
                <div
                  className="transition-all duration-500"
                  style={{
                    width: `${finishedPct}%`,
                    backgroundColor: COLORS.success,
                  }}
                />
                <div
                  className="transition-all duration-500"
                  style={{
                    width: `${pendingPct}%`,
                    backgroundColor: COLORS.secondary,
                  }}
                />
                <div
                  className="transition-all duration-500"
                  style={{
                    width: `${inactivePct}%`,
                    backgroundColor: COLORS.error,
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold mt-2">
              <span
                className="flex items-center gap-1"
                style={{ color: COLORS.success }}
              >
                <CheckCircle size={12} />
                {t("filters.finished", {
                  count: weeklyStats.finishedOrders,
                  percent: finishedPct,
                })}
              </span>
              <span
                className="flex items-center gap-1"
                style={{ color: COLORS.secondary }}
              >
                <Clock size={12} />
                {t("filters.pending", {
                  count: weeklyStats.pendingOrders,
                  percent: pendingPct,
                })}
              </span>
              <span
                className="flex items-center gap-1"
                style={{ color: COLORS.error }}
              >
                <XCircle size={12} />
                {t("filters.inactive", {
                  count: weeklyStats.inactiveOrders,
                  percent: inactivePct,
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Filter Card */}
      <div
        className="rounded-xl shadow-md border p-3 mb-3 week-dropdown-container transition-all duration-300"
        style={{ borderColor: COLORS.primary }}
        ref={dropdownRef}
      >
        {/* Header */}
        <div className="flex items-center space-x-2 mb-3">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: COLORS.primary }}
          >
            <ClipboardList size={16} style={{ color: COLORS.secondary }} />
          </div>
          <h2 className="text-sm font-bold" style={{ color: COLORS.primary }}>
            {t("filters.title")}
          </h2>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
          {/* Global Search */}
          <div className="lg:col-span-2 relative">
            <div className="flex items-center justify-between mb-2">
              <label
                className="block text-xs font-bold"
                style={{ color: COLORS.primary }}
              >
                <div className="flex items-center gap-1.5">
                  <Globe size={12} />
                  {t("filters.globalSearch")}
                </div>
              </label>
              {isGlobalSearchActive && (
                <button
                  onClick={onGlobalSearchClear}
                  className="p-0.5 rounded transition-colors"
                  style={{ backgroundColor: COLORS.error, color: "white" }}
                  title={t("filters.clearGlobalSearch")}
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
                  placeholder={t("filters.searchPlaceholder")}
                  className="w-full pl-7 pr-2 py-1.5 border rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{
                    borderColor: COLORS.primary,
                    backgroundColor: "white",
                    color: COLORS.primary,
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = "none";
                  }}
                  disabled={globalSearchLoading}
                />
              </div>
              <button
                onClick={onGlobalSearchSubmit}
                disabled={globalSearchLoading || !globalSearch.trim()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                  globalSearchLoading || !globalSearch.trim()
                    ? "cursor-not-allowed"
                    : "text-white hover:shadow-md"
                }`}
                style={{
                  backgroundColor:
                    globalSearchLoading || !globalSearch.trim()
                      ? "#d1d5db"
                      : COLORS.primary,
                  color:
                    globalSearchLoading || !globalSearch.trim()
                      ? COLORS.gray
                      : "white",
                }}
              >
                <Search
                  size={12}
                  className={globalSearchLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {!isGlobalSearchActive && (
            <>
              {/* Year */}
              <div className="relative">
                <YearPicker
                  year={year}
                  onYearSelect={onYearChange}
                  min={2015}
                  max={new Date().getFullYear() + 2}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: year ? COLORS.success : COLORS.error,
                  }}
                />
              </div>

              {/* Week */}
              <div className="relative">
                <WeekPicker
                  week={week}
                  onWeekSelect={onWeekChange}
                  min={1}
                  max={53}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: week ? COLORS.success : COLORS.error,
                  }}
                />
              </div>

              {/* Weekday */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-xs font-bold"
                    style={{ color: COLORS.primary }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {t("filters.weekday")}
                    </div>
                  </label>
                  {weekdayFilter && (
                    <button
                      onClick={() => onWeekdayChange("")}
                      className="p-0.5 rounded transition-colors"
                      style={{ backgroundColor: COLORS.error, color: "white" }}
                      title={t("filters.clearWeekday")}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
                <Autocomplete
                  options={weekDayOptions}
                  getOptionLabel={(option) => option.label}
                  value={
                    weekDayOptions.find((o) => o.value === weekdayFilter) ||
                    null
                  }
                  onChange={(_, newValue) =>
                    onWeekdayChange(newValue ? newValue.value : "")
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t("filters.selectWeekday")}
                      size="small"
                      className="bg-white rounded-lg"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "0.5rem",
                          backgroundColor: "white",
                          fontSize: "0.875rem",
                        },
                        "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  disableClearable={false}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: weekdayFilter
                      ? COLORS.success
                      : COLORS.error,
                  }}
                />
              </div>

              {/* Location */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-xs font-bold"
                    style={{ color: COLORS.primary }}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {t("filters.location")}
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
                      title={t("filters.clearLocation")}
                    >
                      <X size={10} />
                      {t("filters.clearLocation")}
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
                      if (
                        locationStep === "country" &&
                        typeof newValue === "object" &&
                        "country" in newValue
                      )
                        setCountry(newValue.country);
                      else if (
                        locationStep === "state" &&
                        typeof newValue === "object" &&
                        "name" in newValue
                      )
                        setState(newValue.name);
                      else if (
                        locationStep === "city" &&
                        typeof newValue === "string"
                      )
                        setCity(newValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={label}
                      placeholder={t("filters.selectLocation", {
                        label: label.toLowerCase(),
                      })}
                      size="small"
                      className="bg-white rounded-lg"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "0.5rem",
                          backgroundColor: "white",
                          fontSize: "0.875rem",
                        },
                        "& .MuiInputLabel-root": { fontSize: "0.875rem" },
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
                  style={{
                    backgroundColor: locationString
                      ? COLORS.success
                      : COLORS.error,
                  }}
                />
              </div>

              {/* Calendar Button */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={onCalendarOpen}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-md flex items-center justify-center space-x-1.5"
                  style={{
                    borderColor: COLORS.secondary,
                    backgroundColor: COLORS.secondary,
                    color: "white",
                  }}
                >
                  <Calendar size={14} />
                  <span>{t("filters.calendar")}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Period Display */}
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
              <span
                className="font-bold text-xs"
                style={{ color: COLORS.primary }}
              >
                {t("filters.yearWeek", { year, week })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="px-2 py-1 rounded-lg border font-bold text-xs"
                style={{ borderColor: COLORS.secondary, color: COLORS.primary }}
              >
                {weekRange.start}
              </div>
              <ArrowRight size={12} style={{ color: COLORS.primary }} />
              <div
                className="px-2 py-1 rounded-lg border font-bold text-xs"
                style={{ borderColor: COLORS.secondary, color: COLORS.primary }}
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
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
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
                  <h3
                    className="font-bold text-xs"
                    style={{ color: COLORS.primary }}
                  >
                    {t("filters.globalSearchResults")}
                  </h3>
                  <p className="text-xs text-gray-600">"{globalSearch}"</p>
                </div>
              </div>
              <div
                className="px-2 py-1 rounded-lg border font-bold text-xs"
                style={{
                  borderColor: COLORS.primary,
                  backgroundColor: COLORS.primary,
                  color: "white",
                }}
              >
                {t("filters.results", { count: weeklyStats.totalOrders })}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <h4
              className="text-xs font-bold flex items-center gap-1"
              style={{ color: COLORS.primary }}
            >
              <Filter size={12} />
              {t("filters.activeFilters")}
            </h4>
            <span className="text-xs text-gray-500">
              {t("filters.activeCount", { count: activeFilterCount })}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {isGlobalSearchActive && (
              <div
                className="px-2 py-1 rounded-full text-xs font-bold text-white border shadow-sm flex items-center gap-1"
                style={{
                  backgroundColor: COLORS.primary,
                  borderColor: COLORS.primary,
                }}
              >
                <Globe size={10} />
                {t("filters.globalLabel", {
                  search:
                    globalSearch.length > 20
                      ? globalSearch.substring(0, 20) + "..."
                      : globalSearch,
                })}
              </div>
            )}
            {!isGlobalSearchActive && week && (
              <div
                className="px-2 py-1 rounded-full text-xs font-bold text-[#0B2863] border shadow-sm flex items-center gap-1"
                style={{ borderColor: COLORS.primary }}
              >
                <Calendar size={10} />
                {t("filters.yearWeekLabel", { year, week })}
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
            {!isGlobalSearchActive &&
              !week &&
              !weekdayFilter &&
              !locationFilter && (
                <div
                  className="px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1"
                  style={{
                    backgroundColor: COLORS.grayBg,
                    borderColor: "#d1d5db",
                    color: COLORS.gray,
                  }}
                >
                  <Activity size={10} />
                  {t("filters.noActiveFilters")}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
