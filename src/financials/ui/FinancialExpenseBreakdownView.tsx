/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { SummaryCostRepository } from "../data/SummaryCostRepository";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import FinancialExpenseBreakdownExportDialog from "./FinancialExpenseBreakdownExportDialog";
import { deleteCostApi } from "../data/CostRepository";
import { Cost } from "../domain/ModelsCost";
import CreateCostDialog from "./components/CreateCostDialog";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import { OrderSummaryLightTotalsResponse } from "../domain/ModelsSummaryLight";
import CostsTableDropdown from './components/CostsTableDropdown';

// FORMATO UNIFICADO PARA TODOS LOS NÚMEROS
const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};


// Costos fijos y variables con etiquetas - ACTUALIZADO
const EXPENSE_TYPES = [
  { key: "expense", label: "Expense", type: "variable", color: "#F09F52", calculated: true },
  { key: "fuelCost", label: "Fuel Costs", type: "variable", color: "#F09F52", calculated: true },
  { key: "workCost", label: "Extra Costs", type: "variable", color: "#F09F52", calculated: true },
  { key: "bonus", label: "Bonus", type: "variable", color: "#F09F52", calculated: true },
  { key: "driverSalaries", label: "Driver Salaries", type: "fixed", color: "#0B2863", calculated: true },
  { key: "otherSalaries", label: "Operators Salaries", type: "fixed", color: "#0B2863", calculated: true },
  { key: "totalCost", label: "Total Cost", type: "total", color: "#0B2863", calculated: true },
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

// Cambiar INCOME_TYPES por DISCOUNT_TYPES
const DISCOUNT_TYPES = [
  { key: "operators_discount", label: "Operators Discount", color: "#22c55e" },
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
  const [summaryData, setSummaryData] = useState<{ 
    expenses: Record<string, number>, 
    discounts: Record<string, number>,
    income: number,
    totalCost: number,
    profit: number,
    totalCostFromTable?: number // AGREGAR
  } | null>(null);
  const [dbCosts, setDbCosts] = useState<Cost[]>([]);
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"select" | "input">("select");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  console.log(showCreateDialog);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; cost: Cost | null }>({
    open: false,
    cost: null
  });
  const [refreshLoading, setRefreshLoading] = useState(false);
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

  // Fetch breakdown usando el nuevo endpoint de totals CON COSTOS
  const fetchBreakdown = async (fromWeek: number, toWeek: number, selectedYear: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: OrderSummaryLightTotalsResponse = await repository.getSummaryCostRangeTotals(fromWeek, toWeek, selectedYear, true);

      console.log('Full API Response:', result);

      const expenses: Record<string, number> = {};
      const discounts: Record<string, number> = {};

      // Inicializar expenses con 0
      EXPENSE_TYPES.forEach(type => {
        expenses[type.key] = 0;
      });

      // Inicializar discounts con 0
      DISCOUNT_TYPES.forEach(type => {
        discounts[type.key] = 0;
      });

      const data = result.data || result;
      
      console.log('Extracted data:', data);
      console.log('Costs from backend:', data.costs);
      console.log('Total cost from table:', data.totalCostFromTable);
      
      // Expenses - FORMATO UNIFICADO
      expenses.expense = Number(Number(data.expense || 0).toFixed(2));
      expenses.fuelCost = Number(Number(data.fuelCost || 0).toFixed(2));
      expenses.workCost = Number(Number(data.workCost || 0).toFixed(2));
      expenses.bonus = Number(Number(data.bonus || 0).toFixed(2));
      expenses.driverSalaries = Number(Number(data.driverSalaries || 0).toFixed(2));
      expenses.otherSalaries = Number(Number(data.otherSalaries || 0).toFixed(2));

      // ACTUALIZAR dbCosts - MAPEAR other_transaction como FIXED
      const costsFromBackend = (data.costs || []).map((cost: any) => ({
        id_cost: cost.id_cost,
        description: cost.description || 'Undefined',
        cost: cost.cost,
        type: cost.type === 'other_transaction' ? 'FIXED' : cost.type,
        date: cost.date,
        update: cost.date,
        is_active: true
      }));
      
      console.log('Costs mapped from backend:', costsFromBackend);
      console.log('Number of costs:', costsFromBackend.length);
      
      setDbCosts(costsFromBackend);

      // El backend ya suma totalCostFromTable en totalCost
      expenses.totalCost = Number(Number(data.totalCost || 0).toFixed(2));
      
      const totalCostFromTable = Number(Number(data.totalCostFromTable || 0).toFixed(2));

      console.log('=== VERIFICACIÓN DE COSTOS ===');
      console.log('Expense:', expenses.expense);
      console.log('Fuel Cost:', expenses.fuelCost);
      console.log('Work Cost:', expenses.workCost);
      console.log('Bonus:', expenses.bonus);
      console.log('Driver Salaries:', expenses.driverSalaries);
      console.log('Other Salaries:', expenses.otherSalaries);
      console.log('DB Costs (from table):', totalCostFromTable);
      console.log('Total Cost (backend calculated):', expenses.totalCost);
      
      const manualSum = expenses.expense + expenses.fuelCost + expenses.workCost + 
                       expenses.bonus + expenses.driverSalaries + expenses.otherSalaries + 
                       totalCostFromTable;
      console.log('Manual Sum:', Number(manualSum.toFixed(2)));
      console.log('Difference:', Number((expenses.totalCost - manualSum).toFixed(2)));

      // Discounts breakdown - SOLO PARA MOSTRAR, NO SE USAN EN CÁLCULOS
      discounts.operators_discount = Number(Number(data.operators_discount || 0).toFixed(2));

      // Income - YA INCLUYE operators_discount sumado por el backend
      const income = Number(Number(data.rentingCost || 0).toFixed(2));

      // YA NO aplicamos descuentos - el backend ya los manejó
      // El totalCost ya está completo del backend
      const totalCost = expenses.totalCost;

      // El profit viene directamente del backend (ya calculado correctamente)
      const profit = Number(Number(data.net_profit).toFixed(2));

      console.log('=== VERIFICACIÓN DE PROFIT ===');
      console.log('Income (includes operators_discount):', income);
      console.log('Operators Discount (for display only):', discounts.operators_discount);
      console.log('Total Cost:', totalCost);
      console.log('Net Profit (backend):', profit);
      console.log('Verification: Income - Total Cost =', Number((income - totalCost).toFixed(2)));

      setSummaryData({ 
        expenses, 
        discounts,
        income,
        totalCost, // Ya no se restan descuentos aquí
        profit,
        totalCostFromTable
      });

      console.log('Total costs from DB table:', data.totalCostFromTable);
      console.log('Final totalCost:', totalCost);
      console.log('Number of costs from DB:', costsFromBackend.length);
      
    } catch (err: any) {
      console.error('Error in fetchBreakdown:', err);
      setError(err.message || "Error loading breakdown");
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial y cuando cambian los pickers
  // YA NO NECESITAS fetchDbCosts() separado
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

  // Handle refresh button - SIMPLIFICADO
  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await fetchBreakdown(startWeek, currentWeek, year);
      enqueueSnackbar("Data refreshed successfully", { variant: "success" });
    } catch (err: any) {
      enqueueSnackbar("Error refreshing data", { variant: "error" });
    } finally {
      setRefreshLoading(false);
    }
  };

  // Handle delete confirmation - ACTUALIZADO
  const handleDeleteConfirm = async () => {
    if (!deleteModal.cost) return;
    
    setActionLoading(deleteModal.cost.id_cost);
    try {
      await deleteCostApi(deleteModal.cost.id_cost);
      
      setDbCosts(prevCosts => 
        prevCosts.filter(cost => cost.id_cost !== deleteModal.cost!.id_cost)
      );
      
      // ACTUALIZADO: Ya no restamos descuentos
      setSummaryData(prev => {
        if (!prev) return prev;
        
        const deletedCostAmount = Number(Number(deleteModal.cost!.cost).toFixed(2));
        const newExpensesTotalCost = Number((prev.expenses.totalCost - deletedCostAmount).toFixed(2));
        const newTotalCost = newExpensesTotalCost; // YA NO se restan descuentos
        const newProfit = Number((prev.income - newTotalCost).toFixed(2));
        
        return {
          ...prev,
          expenses: {
            ...prev.expenses,
            totalCost: newExpensesTotalCost,
          },
          totalCost: newTotalCost,
          profit: newProfit,
        };
      });
      
      enqueueSnackbar("Cost deleted successfully", { variant: "success" });
      setDeleteModal({ open: false, cost: null });
    } catch (err: any) {
      enqueueSnackbar(err.message || "Error deleting cost", { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

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

  // Separar costos de BD por tipo - ACTUALIZADO
  // TODOS los costos de other_transaction ahora son FIXED
  const fixedDbCosts = dbCosts.filter(cost => {
    const costType = cost.type.toUpperCase();
    return costType === 'FIXED'; // Solo FIXED (ya mapeados desde other_transaction)
  });
  
  const variableDbCosts = dbCosts.filter(cost => cost.type.toUpperCase() === 'VARIABLE');

  console.log('=== COSTS BREAKDOWN ===');
  console.log('Total DB Costs:', dbCosts.length);
  console.log('Fixed DB Costs:', fixedDbCosts.length);
  console.log('Variable DB Costs:', variableDbCosts.length);
  console.log('Sample costs:', dbCosts.slice(0, 3).map(c => ({ 
    type: c.type, 
    cost: c.cost, 
    description: c.description 
  })));

  // Función para calcular subtotales por categoría - ACTUALIZADO
  const calculateCategorySubtotal = (categoryType: string): number => {
    if (!summaryData) return 0;
    
    if (categoryType === 'fixed') {
      const dbFixedTotal = fixedDbCosts.reduce((sum, cost) => sum + Number(Number(cost.cost).toFixed(2)), 0);
      const calculatedFixedTotal = EXPENSE_TYPES
        .filter(type => type.type === 'fixed')
        .reduce((sum, type) => sum + (summaryData.expenses[type.key] || 0), 0);
      return Number((dbFixedTotal + calculatedFixedTotal).toFixed(2));
    }
    
    if (categoryType === 'variable') {
      const dbVariableTotal = variableDbCosts.reduce((sum, cost) => sum + Number(Number(cost.cost).toFixed(2)), 0);
      const calculatedVariableTotal = EXPENSE_TYPES
        .filter(type => type.type === 'variable')
        .reduce((sum, type) => sum + (summaryData.expenses[type.key] || 0), 0);
      return Number((dbVariableTotal + calculatedVariableTotal).toFixed(2));
    }
    
    // Los descuentos ahora son solo informativos
    if (categoryType === 'discounts') {
      return Number(Object.values(summaryData.discounts).reduce((sum, value) => sum + value, 0).toFixed(2));
    }
    
    return 0;
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-wide" style={{ color: '#0B2863' }}>
              Expense Breakdown
            </h1>
            <p className="text-gray-600 mb-6">
              Select a period below. The breakdown will show data for the selected range. Use quick buttons for standard periods or customize your own range.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {refreshLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <i className="fas fa-sync-alt"></i>
              )}
              Refresh
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Create Cost
            </button>
          </div>
        </div>

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

        {/* Week Picker - mantener código existente */}
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
                  <th className="text-right px-6 py-4 text-white font-semibold text-base">Amount($USD)</th>
                  <th className="text-center px-6 py-4 text-white font-semibold text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Fixed Costs Section */}
                <tr className="bg-blue-100">
                  <td colSpan={3} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#0B2863' }}>
                    FIXED COSTS
                  </td>
                </tr>
                
                {/* Database Fixed Costs - AHORA COMO DROPDOWN */}
                {fixedDbCosts.length > 0 && (
                <CostsTableDropdown 
                  costs={fixedDbCosts}
                  totalAmount={fixedDbCosts.reduce((sum, cost) => sum + Number(Number(cost.cost).toFixed(2)), 0)}
                  onCostDeleted={(costId) => {
                    setDbCosts(prevCosts => prevCosts.filter(cost => cost.id_cost !== costId));
                    setSummaryData(prev => {
                      if (!prev) return prev;
                      const deletedCost = fixedDbCosts.find(c => c.id_cost === costId);
                      if (!deletedCost) return prev;
                      const deletedAmount = Number(Number(deletedCost.cost).toFixed(2));
                      const newExpensesTotalCost = Number((prev.expenses.totalCost - deletedAmount).toFixed(2));
                      const newTotalCost = newExpensesTotalCost;
                      const newProfit = Number((prev.income - newTotalCost).toFixed(2));
                      return {
                        ...prev,
                        expenses: { ...prev.expenses, totalCost: newExpensesTotalCost },
                        totalCost: newTotalCost,
                        profit: newProfit,
                      };
                    });
                  }}
                  onCostCreated={(newCost: Cost) => {
                    setDbCosts(prevCosts => [...prevCosts, newCost]);
                    setSummaryData(prev => {
                      if (!prev) return prev;
                      const newAmount = Number(Number(newCost.cost).toFixed(2));
                      const newExpensesTotalCost = Number((prev.expenses.totalCost + newAmount).toFixed(2));
                      const newTotalCost = newExpensesTotalCost;
                      const newProfit = Number((prev.income - newTotalCost).toFixed(2));
                      return {
                        ...prev,
                        expenses: { ...prev.expenses, totalCost: newExpensesTotalCost },
                        totalCost: newTotalCost,
                        profit: newProfit,
                      };
                    });
                  }}
                />
              )}
                
                {/* Calculated Fixed Costs */}
                {EXPENSE_TYPES.filter(type => type.type === "fixed").map(type => (
                  <tr key={type.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 pl-12 text-gray-800">
                      {type.label}
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        CALCULATED
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium" style={{ color: type.color }}>
                      {formatCurrency(summaryData.expenses[type.key] || 0)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-400 text-sm">
                      No actions
                    </td>
                  </tr>
                ))}

                {/* Fixed Costs Subtotal */}
                <tr className="bg-blue-50 border-b-2 border-blue-200">
                  <td className="px-6 py-3 pl-8 font-bold text-gray-700">
                    Fixed Costs Subtotal
                  </td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#0B2863' }}>
                    {formatCurrency(calculateCategorySubtotal('fixed'))}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">
                    -
                  </td>
                </tr>

                {/* Variable Costs Section */}
                <tr className="bg-orange-100"> 
                  <td colSpan={3} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#1E2939' }}>
                    VARIABLE COSTS
                  </td>
                </tr>
                
                {/* Database Variable Costs - AHORA COMO DROPDOWN */}
                {variableDbCosts.length > 0 && (
                  <CostsTableDropdown 
                    costs={variableDbCosts}
                    totalAmount={variableDbCosts.reduce((sum, cost) => sum + Number(Number(cost.cost).toFixed(2)), 0)}
                  />
                )}
                
                {/* Calculated Variable Costs */}
                {EXPENSE_TYPES.filter(type => type.type === "variable").map(type => (
                  <tr key={type.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 pl-12 text-gray-700">
                      {type.label}
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        CALCULATED
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium" style={{ color: type.color }}>
                      {formatCurrency(summaryData.expenses[type.key] || 0)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-400 text-sm">
                      No actions
                    </td>
                  </tr>
                ))}
                
                {/* Variable Costs Subtotal */}
                <tr className="bg-orange-50 border-b-2 border-orange-200">
                  <td className="px-6 py-3 pl-8 font-bold text-gray-600">
                    Variable Costs Subtotal
                  </td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#F09F52' }}>
                    {formatCurrency(calculateCategorySubtotal('variable'))}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">
                    -
                  </td>
                </tr>

                {/* Discounts Section - AHORA SOLO INFORMATIVO */}
                <tr className="bg-green-100">
                  <td colSpan={3} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#000000ff' }}>
                    DISCOUNTS
                  </td>
                </tr>
                
                {DISCOUNT_TYPES.map(type => (
                  <tr key={type.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 pl-12 text-gray-700">
                      {type.label}
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        INFORMATIONAL
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium" style={{ color: type.color }}>
                      {formatCurrency(summaryData.discounts[type.key] || 0)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-400 text-sm">
                      No actions
                    </td>
                  </tr>
                ))}
                
                {/* Discounts Subtotal - AHORA SOLO INFORMATIVO */}
                <tr className="bg-green-50 border-b-2 border-green-200">
                  <td className="px-6 py-3 pl-8 font-bold text-gray-800">
                    Discounts Total (Informational)
                  </td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#22c55e' }}>
                    {formatCurrency(calculateCategorySubtotal('discounts'))}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">
                    -
                  </td>
                </tr>

                {/* Summary Section */}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#0B2863' }}>
                    FINANCIAL SUMMARY
                  </td>
                </tr>
                
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 pl-12 font-bold" style={{ color: '#22c55e' }}>
                    Income (includes operators discount)
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                      CALCULATED
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#22c55e' }}>
                    {formatCurrency(summaryData.income)}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">
                    No actions
                  </td>
                </tr>
                
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 pl-12 font-semibold text-gray-700">
                    Total Cost
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                      CALCULATED
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold" style={{ color: '#0B2863' }}>
                    {formatCurrency(summaryData.totalCost)}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">
                    No actions
                  </td>
                </tr>
                
                <tr style={{ backgroundColor: summaryData.profit >= 0 ? '#e8f5e9' : '#ffebee' }}>
                  <td className="px-6 py-4 pl-12 font-bold text-lg" style={{ color: '#0B2863' }}>
                    Net Profit
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                      CALCULATED
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-lg" style={{ color: summaryData.profit >= 0 ? '#2e7d32' : '#c62828' }}>
                    {formatCurrency(summaryData.profit)}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 text-sm">
                    No actions
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
        income={Number(summaryData?.income || 0)}
        profit={Number(summaryData?.profit || 0)}
        startWeek={startWeek}
        endWeek={currentWeek}
        year={year}
      />

      <CreateCostDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={async (newCost: Cost) => {
          setDbCosts(prevCosts => [...prevCosts, newCost]);
          
          // ACTUALIZADO: Ya no restamos descuentos
          setSummaryData(prev => {
            if (!prev) return prev;
            
            const newExpensesTotalCost = Number((prev.expenses.totalCost + Number(Number(newCost.cost).toFixed(2))).toFixed(2));
            const newTotalCost = newExpensesTotalCost; // YA NO se restan descuentos
            const newProfit = Number((prev.income - newTotalCost).toFixed(2));
            
            return {
              ...prev,
              expenses: {
                ...prev.expenses,
                totalCost: newExpensesTotalCost,
              },
              totalCost: newTotalCost,
              profit: newProfit,
            };
          });
          
          enqueueSnackbar("Cost created successfully", { variant: "success" });
        }}
      />

      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, cost: null })}
        onConfirm={handleDeleteConfirm}
        costDescription={deleteModal.cost?.description || ""}
        loading={actionLoading === deleteModal.cost?.id_cost}
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