/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { SummaryCostRepository } from "../data/SummaryCostRepository";
import { Summary } from "../domain/SummaryModel";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import FinancialExpenseBreakdownExportDialog from "./FinancialExpenseBreakdownExportDialog";

// Costos fijos y variables con etiquetas
const EXPENSE_TYPES = [
  { key: "expense", label: "General Expenses", type: "variable", color: "#F09F52" },
  { key: "fuelCost", label: "Fuel Costs", type: "variable", color: "#F09F52" },
  { key: "workCost", label: "Extra Costs", type: "variable", color: "#F09F52" },
  { key: "driverSalaries", label: "Driver Salaries", type: "fixed", color: "#0B2863" },
  { key: "otherSalaries", label: "Operators Salaries", type: "fixed", color: "#0B2863" },
  { key: "totalCost", label: "Total Cost", type: "total", color: "#0B2863" },
];

// Trimestres y semestres exactos
const TIMELAPSES = [
  { label: "Q1 (Jan-Mar)", startWeek: 1, endWeek: 13 },
  { label: "Q2 (Apr-Jun)", startWeek: 14, endWeek: 26 },
  { label: "Q3 (Jul-Sep)", startWeek: 27, endWeek: 39 },
  { label: "Q4 (Oct-Dec)", startWeek: 40, endWeek: 52 },
  { label: "H1 (Jan-Jun)", startWeek: 1, endWeek: 26 },
  { label: "H2 (Jul-Dec)", startWeek: 27, endWeek: 52 },
];

const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  const startYear = 2015;
  const years = [];
  for (let y = currentYear + 1; y >= startYear; y--) {
    years.push(y);
  }
  return years;
};

const FinancialExpenseBreakdownView = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{ expenses: Record<string, number>, income: number, profit: number } | null>(null);
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"select" | "input">("select");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const repository = new SummaryCostRepository();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(year, 0, 1);
    return Math.ceil((now.getTime() - start.getTime()) / 604800000);
  });
  const [startWeek, setStartWeek] = useState<number>(1);
  const [selectedTimelapse, setSelectedTimelapse] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Actualizar currentWeek cuando cambie el año
  useEffect(() => {
    const now = new Date();
    const start = new Date(year, 0, 1);
    setCurrentWeek(Math.ceil((now.getTime() - start.getTime()) / 604800000));
    setStartWeek(1);
    setSelectedTimelapse(null);
  }, [year]);

  // Fetch breakdown usando la nueva función de rango
  const fetchBreakdown = async (fromWeek: number, toWeek: number, selectedYear: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await repository.getSummaryCostRange(fromWeek, toWeek, selectedYear, true);
      
      const expenses: Record<string, number> = {};
      let totalIncome = 0;
      
      // Inicializar expenses
      EXPENSE_TYPES.forEach(type => {
        expenses[type.key] = 0;
      });

      result.results.forEach(order => {
        EXPENSE_TYPES.forEach(type => {
          expenses[type.key] += order.summary[type.key as keyof Summary] || 0;
        });
        totalIncome += order.income || 0;
      });

      const totalCost = expenses.totalCost;
      setSummaryData({ expenses, income: totalIncome, profit: totalIncome - totalCost });
    } catch (err: any) {
      setError(err.message || "Error loading breakdown");
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial y cuando cambian los pickers
  useEffect(() => {
    fetchBreakdown(startWeek, currentWeek, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWeek, currentWeek, year]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWeekDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1);

  const handleWeekSelect = (selectedWeek: number) => {
    setStartWeek(selectedWeek);
    setShowWeekDropdown(false);
    setSelectedTimelapse(null);
  };

  const handleWeekKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowWeekDropdown(true);
    } else if (e.key === "Escape") {
      setShowWeekDropdown(false);
    } else if (e.key === "Enter") {
      setShowWeekDropdown(!showWeekDropdown);
    }
  };

  const handleWeekInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value < 1 || value > currentWeek) {
      enqueueSnackbar(`Week must be between 1 and ${currentWeek}.`, { variant: "error" });
      return;
    }
    setStartWeek(value);
    setSelectedTimelapse(null);
  };

  // Quick timelapse handler para periodos exactos
  const handleTimelapse = (timelapse: any) => {
    const { startWeek: start, endWeek: end, label } = timelapse;
    
    if (start > currentWeek) {
      enqueueSnackbar(`Selected period starts after current week ${currentWeek}. No data available yet.`, { variant: "error" });
      return;
    }
    
    setStartWeek(start);
    setSelectedTimelapse(label);
    fetchBreakdown(start, end, year);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <button 
        className="mb-6 px-4 py-2 border-2 rounded-lg font-semibold transition-all duration-200 hover:bg-opacity-5"
        style={{ 
          borderColor: '#0B2863', 
          color: '#0B2863',
          backgroundColor: 'transparent'
        }}
        onClick={() => navigate(-1)}
      >
        ← Back to Financial Summary
      </button>
      
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-6 mb-6">
        <h1 className="text-4xl font-bold mb-2 tracking-wide" style={{ color: '#0B2863' }}>
          Expense Breakdown
        </h1>
        <p className="text-gray-600 mb-6">
          Select a period below. The breakdown will show data for the selected range. Use quick buttons for standard periods or customize your own range.
        </p>
        
        {/* Year Picker */}
        <div className="mb-6 max-w-xs">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
            Year
          </label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="w-full px-4 py-2 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 transition-all"
            style={{ 
              borderColor: '#0B2863',
              color: '#0B2863'
            }}
          >
            {getAvailableYears().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Quick timelapses */}
        <div className="mb-6 flex gap-3 flex-wrap">
          {TIMELAPSES.map(t => (
            <button
              key={t.label}
              onClick={() => handleTimelapse(t)}
              className="min-w-[120px] px-4 py-2 border-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: selectedTimelapse === t.label ? '#0B2863' : 'white',
                borderColor: '#0B2863',
                color: selectedTimelapse === t.label ? 'white' : '#0B2863'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Week Picker */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
            Select Start Week (Custom Range)
          </h3>
          <div
            className="bg-gradient-to-br from-white/90 to-orange-50/50 backdrop-blur-sm rounded-xl p-4 border-2 shadow-sm hover:shadow-md transition-all duration-300"
            style={{ borderColor: '#F09F52' }}
            ref={dropdownRef}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold text-gray-700">
                Week Range
              </label>
              <button
                onClick={() => setViewMode(viewMode === "select" ? "input" : "select")}
                className="text-xs text-white px-3 py-1 rounded-md font-medium transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: '#F09F52' }}
                title={`Switch to ${viewMode === "select" ? "input" : "dropdown"} view`}
              >
                {viewMode === "select" ? "Input" : "Dropdown"}
              </button>
            </div>
            
            {/* Visual range bar */}
            <div className="w-full flex items-center gap-3 m-3">
              <div className="flex-1 h-4 rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-4 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: '#F09F52',
                    width: `${((currentWeek - startWeek + 1) / currentWeek) * 100}%`,
                    left: `${((startWeek - 1) / currentWeek) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 h-5 rounded-full"
                  style={{
                    width: "100%",
                    border: "1px solid #0B2863",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#0B2863' }}>
                W{startWeek} → W{currentWeek}
              </span>
            </div>
            
            {viewMode === "select" ? (
              <div className="relative">
                <div
                  className="w-full px-4 py-2 border-2 rounded-lg font-bold text-center bg-white cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md transition-all"
                  style={{ borderColor: '#F09F52' }}
                  onClick={() => setShowWeekDropdown(!showWeekDropdown)}
                  onKeyDown={handleWeekKeyDown}
                  tabIndex={0}
                >
                  <span style={{ color: '#0B2863' }}>
                    Week {startWeek}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${showWeekDropdown ? "rotate-180" : ""}`}
                    style={{ color: '#F09F52' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {showWeekDropdown && (
                  <div 
                    className="absolute mt-2 bg-white border-2 rounded-lg shadow-2xl w-full z-50"
                    style={{ borderColor: '#F09F52' }}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold text-gray-600">
                          Select start week (1-{currentWeek}):
                        </span>
                        <button
                          onClick={() => setShowWeekDropdown(false)}
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {weeks.map((weekNum) => (
                          <button
                            key={weekNum}
                            onClick={() => handleWeekSelect(weekNum)}
                            className="p-2 text-sm rounded-lg border-2 transition-all duration-200 font-semibold hover:scale-105"
                            style={{
                              backgroundColor: startWeek === weekNum ? '#F09F52' : '#f9f9f9',
                              color: startWeek === weekNum ? '#fff' : '#333',
                              borderColor: startWeek === weekNum ? '#F09F52' : '#e0e0e0',
                            }}
                            title={`Select start week ${weekNum}`}
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
                  max={currentWeek}
                  value={startWeek}
                  onChange={handleWeekInputChange}
                  className="w-full px-4 py-2 border-2 rounded-lg font-bold text-center bg-white shadow-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#F09F52' }}
                  placeholder={`1-${currentWeek}`}
                  disabled={loading}
                />
                <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-500 text-center">
                  Press Enter to confirm
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#0B2863', borderTopColor: 'transparent' }}></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg">
          {error}
        </div>
      ) : summaryData ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0B2863' }}>
            Financial Breakdown - Week {startWeek} to {currentWeek}, {year}
          </h2>
          
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#0B2863' }}>
                  <th className="text-left px-6 py-4 text-white font-semibold text-base">Category</th>
                  <th className="text-right px-6 py-4 text-white font-semibold text-base">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Fixed Costs Section */}
                <tr className="bg-blue-50">
                  <td colSpan={2} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#0B2863' }}>
                    FIXED COSTS
                  </td>
                </tr>
                {EXPENSE_TYPES.filter(type => type.type === "fixed").map(type => (
                  <tr key={type.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 pl-12 text-gray-700">{type.label}</td>
                    <td className="px-6 py-3 text-right font-medium" style={{ color: type.color }}>
                      ${summaryData.expenses[type.key]?.toLocaleString("en-US") || 0}
                    </td>
                  </tr>
                ))}

                {/* Variable Costs Section */}
                <tr className="bg-orange-50">
                  <td colSpan={2} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#F09F52' }}>
                    VARIABLE COSTS
                  </td>
                </tr>
                {EXPENSE_TYPES.filter(type => type.type === "variable").map(type => (
                  <tr key={type.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 pl-12 text-gray-700">{type.label}</td>
                    <td className="px-6 py-3 text-right font-medium" style={{ color: type.color }}>
                      ${summaryData.expenses[type.key]?.toLocaleString("en-US") || 0}
                    </td>
                  </tr>
                ))}

                {/* Summary Section */}
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#0B2863' }}>
                    FINANCIAL SUMMARY
                  </td>
                </tr>
                {EXPENSE_TYPES.filter(type => type.type === "total").map(type => (
                  <tr key={type.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 pl-12 font-semibold text-gray-700">{type.label}</td>
                    <td className="px-6 py-3 text-right font-semibold" style={{ color: type.color }}>
                      ${summaryData.expenses[type.key]?.toLocaleString("en-US") || 0}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 pl-12 font-bold" style={{ color: '#0B2863' }}>Income</td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#0B2863' }}>
                    ${summaryData.income.toLocaleString("en-US")}
                  </td>
                </tr>
                <tr style={{ backgroundColor: summaryData.profit >= 0 ? '#e8f5e9' : '#ffebee' }}>
                  <td className="px-6 py-4 pl-12 font-bold text-lg" style={{ color: '#0B2863' }}>
                    Profit
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-lg" style={{ color: summaryData.profit >= 0 ? '#2e7d32' : '#c62828' }}>
                    ${summaryData.profit.toLocaleString("en-US")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <button
        className="mt-6 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#0B2863' }}
        onClick={() => setExportDialogOpen(true)}
        disabled={!summaryData}
      >
        Export / Print
      </button>
      
      <FinancialExpenseBreakdownExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        expenses={summaryData?.expenses || {}}
        income={summaryData?.income || 0}
        profit={summaryData?.profit || 0}
        startWeek={startWeek}
        endWeek={currentWeek}
        year={year}
      />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #F09F52;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e68a3d;
        }
      `}</style>
    </div>
  );
};

export default FinancialExpenseBreakdownView;