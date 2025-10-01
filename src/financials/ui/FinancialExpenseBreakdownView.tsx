/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Table, TableBody, TableCell, TableRow, CircularProgress, Alert, Paper, MenuItem, Select, FormControl, InputLabel, Chip } from "@mui/material";
import { SummaryCostRepository } from "../data/SummaryCostRepository";
import { Summary } from "../domain/SummaryModel";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import FinancialExpenseBreakdownExportDialog from "./FinancialExpenseBreakdownExportDialog";

// Costos fijos y variables con etiquetas
const EXPENSE_TYPES = [
  { key: "expense", label: "General Expenses", type: "variable", color: "#3b82f6" },
  { key: "fuelCost", label: "Fuel Costs", type: "variable", color: "#3b82f6" },
  { key: "workCost", label: "Extra Costs", type: "variable", color: "#3b82f6" },
  { key: "driverSalaries", label: "Driver Salaries", type: "fixed", color: "#059669" },
  { key: "otherSalaries", label: "Operators Salaries", type: "fixed", color: "#059669" },
  { key: "totalCost", label: "Total Cost", type: "total", color: "#6366f1" },
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
    // Esta validación SÍ debe mantenerse para el input manual
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
    
    // Validar solo si el período está completamente fuera del rango disponible
    if (start > currentWeek) {
      enqueueSnackbar(`Selected period starts after current week ${currentWeek}. No data available yet.`, { variant: "error" });
      return;
    }
    
    setStartWeek(start);
    setSelectedTimelapse(label);
    // Usar el endWeek completo del timelapse, el backend manejará las semanas disponibles
    fetchBreakdown(start, end, year);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate(-1)}>
        ← Back to Financial Summary
      </Button>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3, background: "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: "#0B2863", letterSpacing: 1 }}>
          Expense Breakdown
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: "#374151" }}>
          Select a period below. The breakdown will show data for the selected range. Use quick buttons for standard periods or customize your own range.
        </Typography>
        
        {/* Year Picker */}
        <Box sx={{ mb: 2, maxWidth: 200 }}>
          <FormControl fullWidth>
            <InputLabel id="year-picker-label">Year</InputLabel>
            <Select
              labelId="year-picker-label"
              value={year}
              label="Year"
              onChange={e => setYear(Number(e.target.value))}
            >
              {getAvailableYears().map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Quick timelapses - Trimestres y Semestres */}
        <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          {TIMELAPSES.map(t => (
            <Button
              key={t.label}
              variant={selectedTimelapse === t.label ? "contained" : "outlined"}
              onClick={() => handleTimelapse(t)}
              sx={{
                minWidth: 120,
                fontWeight: 600,
                background: selectedTimelapse === t.label ? "#667eea" : undefined,
                color: selectedTimelapse === t.label ? "#fff" : undefined
              }}
            >
              {t.label}
            </Button>
          ))}
        </Box>

        {/* Week Picker - Visual range */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Start Week (Custom Range)</Typography>
          <div
            className="bg-gradient-to-br from-white/90 to-green-50/50 backdrop-blur-sm rounded-xl p-3 border-2 border-green-100 shadow-sm hover:shadow-md transition-all duration-300"
            ref={dropdownRef}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700">
                Week Range
              </label>
              <button
                onClick={() => setViewMode(viewMode === "select" ? "input" : "select")}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200 px-2 py-1 rounded-md border border-green-200"
                title={`Switch to ${viewMode === "select" ? "input" : "dropdown"} view`}
              >
                {viewMode === "select" ? "Input" : "Dropdown"}
              </button>
            </div>
            
            {/* Visual range bar */}
            <div className="w-full flex items-center gap-2 mb-2">
              <div className="flex-1 h-3 rounded-full bg-gray-200 relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-3 bg-green-400 rounded-full"
                  style={{
                    width: `${((currentWeek - startWeek + 1) / currentWeek) * 100}%`,
                    left: `${((startWeek - 1) / currentWeek) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 h-3 rounded-full"
                  style={{
                    width: "100%",
                    border: "1px solid #059669",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <span className="text-xs font-bold text-green-700">
                {`W${startWeek} → W${currentWeek}`}
              </span>
            </div>
            {viewMode === "select" ? (
              <div className="relative">
                <div
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 font-bold text-center bg-white cursor-pointer flex items-center justify-between shadow-sm hover:border-green-300 hover:shadow-sm"
                  onClick={() => setShowWeekDropdown(!showWeekDropdown)}
                  onKeyDown={handleWeekKeyDown}
                  tabIndex={0}
                >
                  <span className="text-green-700">
                    Week {startWeek}
                  </span>
                  <svg
                    className={`w-4 h-4 text-green-500 transition-transform duration-200 ${showWeekDropdown ? "rotate-180" : ""}`}
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
                  <div className="week-dropdown mt-2 bg-white border-2 border-green-200 rounded-lg shadow-xl w-full" style={{ zIndex: 10000 }}>
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold text-gray-600">
                          Select start week (1-{currentWeek}):
                        </span>
                        <button
                          onClick={() => setShowWeekDropdown(false)}
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-9 gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                        {weeks.map((weekNum) => (
                          <button
                            key={weekNum}
                            onClick={() => handleWeekSelect(weekNum)}
                            className={`p-1 sm:p-2 text-xs sm:text-sm rounded-md border transition-all duration-200 font-medium hover:scale-105 ${
                              startWeek === weekNum
                                ? "bg-green-500 text-white border-green-600 shadow-md ring-2 ring-green-300"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-green-100 hover:border-green-300 hover:text-green-700"
                            }`}
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
              // Week input mode
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={currentWeek}
                  value={startWeek}
                  onChange={handleWeekInputChange}
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 font-bold text-center bg-white shadow-sm text-sm"
                  placeholder={`1-${currentWeek}`}
                  disabled={loading}
                />
                <div className="absolute -bottom-5 left-0 right-0 text-xs text-gray-500 text-center">
                  Press Enter to confirm
                </div>
              </div>
            )}
          </div>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : summaryData ? (
        <Box>
          {/* Fixed Costs Section */}
          <Paper sx={{ mb: 2, p: 2, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Chip label="Fixed Costs" sx={{ backgroundColor: "#059669", color: "white", fontWeight: 600 }} />
            </Box>
            <Table sx={{ backgroundColor: "#fff" }}>
              <TableBody>
                {EXPENSE_TYPES.filter(type => type.type === "fixed").map(type => (
                  <TableRow key={type.key}>
                    <TableCell sx={{ fontWeight: 500, color: "#374151" }}>{type.label}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: type.color }}>${summaryData.expenses[type.key]?.toLocaleString("en-US") || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Variable Costs Section */}
          <Paper sx={{ mb: 2, p: 2, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Chip label="Variable Costs" sx={{ backgroundColor: "#3b82f6", color: "white", fontWeight: 600 }} />
            </Box>
            <Table sx={{ backgroundColor: "#fff" }}>
              <TableBody>
                {EXPENSE_TYPES.filter(type => type.type === "variable").map(type => (
                  <TableRow key={type.key}>
                    <TableCell sx={{ fontWeight: 500, color: "#374151" }}>{type.label}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: type.color }}>${summaryData.expenses[type.key]?.toLocaleString("en-US") || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Summary Section */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Chip label="Financial Summary" sx={{ backgroundColor: "#6366f1", color: "white", fontWeight: 600 }} />
            </Box>
            <Table sx={{ backgroundColor: "#fff" }}>
              <TableBody>
                {EXPENSE_TYPES.filter(type => type.type === "total").map(type => (
                  <TableRow key={type.key}>
                    <TableCell sx={{ fontWeight: 500, color: "#374151" }}>{type.label}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: type.color }}>${summaryData.expenses[type.key]?.toLocaleString("en-US") || 0}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#059669" }}>Income</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#059669" }}>${summaryData.income.toLocaleString("en-US")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#7c3aed" }}>Profit</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#7c3aed" }}>${summaryData.profit.toLocaleString("en-US")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Box>
      ) : null}

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        onClick={() => setExportDialogOpen(true)}
        disabled={!summaryData}
      >
        Export / Print
      </Button>
      
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
        @media (max-width: 640px) {
          .week-dropdown {
            position: fixed !important;
            left: 1rem !important;
            right: 1rem !important;
            width: auto !important;
            z-index: 50 !important;
          }
          .week-dropdown .grid {
            grid-template-columns: repeat(6, 1fr) !important;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .week-dropdown .grid {
            grid-template-columns: repeat(8, 1fr) !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default FinancialExpenseBreakdownView;