/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Table, TableBody, TableCell, TableRow, CircularProgress, Alert, Paper } from "@mui/material";
import { SummaryCostRepository } from "../data/SummaryCostRepository";
import { Summary } from "../domain/SummaryModel";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import FinancialExpenseBreakdownExportDialog from "./FinancialExpenseBreakdownExportDialog";

const EXPENSE_TYPES = [
  { key: "expense", label: "Expense" },
  { key: "fuelCost", label: "Fuel Cost" },
  { key: "workCost", label: "Work Cost" },
  { key: "driverSalaries", label: "Driver Salaries" },
  { key: "otherSalaries", label: "Other Salaries" },
  { key: "totalCost", label: "Total Cost" },
];

const TIMELAPSES = [
  { label: "3 months", weeks: 13 },
  { label: "6 months", weeks: 26 },
  { label: "9 months", weeks: 39 },
  { label: "12 months", weeks: 52 },
];

const FinancialExpenseBreakdownView = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{ expenses: Record<string, number>, income: number, profit: number } | null>(null);
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"select" | "input">("select");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const repository = new SummaryCostRepository();
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const currentWeek = Math.ceil((Date.now() - new Date(year, 0, 1).getTime()) / 604800000);
  const [startWeek, setStartWeek] = useState<number>(currentWeek);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch breakdown for a range of weeks
  const fetchBreakdown = async (fromWeek: number, toWeek: number) => {
    setLoading(true);
    setError(null);
    try {
      const expenses: Record<string, number> = {};
      let totalIncome = 0;
      let totalCost = 0;
      for (let w = toWeek; w >= fromWeek && w > 0; w--) {
        const result = await repository.getSummaryCost(0, w, year);
        result.results.forEach(order => {
          EXPENSE_TYPES.forEach(type => {
            expenses[type.key] = (expenses[type.key] || 0) + (order.summary[type.key as keyof Summary] || 0);
          });
          totalIncome += order.income || 0;
          totalCost += order.summary?.totalCost || 0;
        });
      }
      setSummaryData({ expenses, income: totalIncome, profit: totalIncome - totalCost });
    } catch (err: any) {
      setError(err.message || "Error loading breakdown");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBreakdown(startWeek, currentWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWeek]);

  // Close dropdown when clicking outside
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
    if (selectedWeek > currentWeek) {
      enqueueSnackbar(`Week ${selectedWeek} is not available. Current week is ${currentWeek}.`, { variant: "error" });
      setShowWeekDropdown(false);
      return;
    }
    setStartWeek(selectedWeek);
    setShowWeekDropdown(false);
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
    if (value > currentWeek) {
      enqueueSnackbar(`Week ${value} is not available. Current week is ${currentWeek}.`, { variant: "error" });
      return;
    }
    setStartWeek(value);
  };

  // Quick timelapse handler
  const handleTimelapse = (weeks: number) => {
    const calculatedStart = currentWeek - weeks + 1;
    if (calculatedStart < 1) {
      enqueueSnackbar("Selected period exceeds available weeks.", { variant: "error" });
      return;
    }
    setStartWeek(calculatedStart);
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
          Select a starting week below. The breakdown will show data from the selected week up to the current week
          ({currentWeek}). Quick buttons let you select common periods.
        </Typography>
        {/* Quick timelapses */}
        <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          {TIMELAPSES.map(t => (
            <Button
              key={t.label}
              variant={startWeek === currentWeek - t.weeks + 1 ? "contained" : "outlined"}
              onClick={() => handleTimelapse(t.weeks)}
              sx={{
                minWidth: 120,
                fontWeight: 600,
                background: startWeek === currentWeek - t.weeks + 1 ? "#667eea" : undefined,
                color: startWeek === currentWeek - t.weeks + 1 ? "#fff" : undefined
              }}
            >
              {t.label}
            </Button>
          ))}
        </Box>
        {/* Week Picker - Styled like Statistics */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Start Week</Typography>
          <div
            className="bg-gradient-to-br from-white/90 to-green-50/50 backdrop-blur-sm rounded-xl p-3 border-2 border-green-100 shadow-sm hover:shadow-md transition-all duration-300"
            ref={dropdownRef}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700">
                Week Number
              </label>
              <button
                onClick={() => setViewMode(viewMode === "select" ? "input" : "select")}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200 px-2 py-1 rounded-md border border-green-200"
                title={`Switch to ${viewMode === "select" ? "input" : "dropdown"} view`}
              >
                {viewMode === "select" ? "Input" : "Dropdown"}
              </button>
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
                          Select week (1-{currentWeek}):
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
        <Table sx={{ maxWidth: 500, mx: "auto", backgroundColor: "#fff", borderRadius: 2, boxShadow: 2 }}>
          <TableBody>
            {EXPENSE_TYPES.map(type => (
              <TableRow key={type.key}>
                <TableCell sx={{ fontWeight: 500, color: "#374151" }}>{type.label}</TableCell>
                <TableCell sx={{ fontWeight: 500, color: "#4f46e5" }}>${summaryData.expenses[type.key]?.toLocaleString("en-US") || 0}</TableCell>
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