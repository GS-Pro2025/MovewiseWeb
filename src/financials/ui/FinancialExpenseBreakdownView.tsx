/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { SummaryCostRepository } from "../data/SummaryCostRepository";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import FinancialExpenseBreakdownExportDialog from "./FinancialExpenseBreakdownExportDialog";
import { deleteCostApi } from "../data/CostRepository";
import { Cost } from "../domain/ModelsCost";
import CreateCostDialog from "./components/CreateCostDialog";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import { ExtraIncomeItem, OrderSummaryLightTotalsResponse } from "../domain/ModelsSummaryLight";
import CostsTableDropdown from './components/CostsTableDropdown';
import CreateExtraIncomeDialog from './components/CreateExtraIncomeDialog';
import YearPicker from "../../components/YearPicker";
import WeekPicker from "../../components/WeekPicker";
import { useTranslation } from "react-i18next";

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

const TIMELAPSES = [
  { labelKey: "expenseBreakdown.timelapses.q1", startWeek: 1,  endWeek: 13 },
  { labelKey: "expenseBreakdown.timelapses.q2", startWeek: 14, endWeek: 26 },
  { labelKey: "expenseBreakdown.timelapses.q3", startWeek: 27, endWeek: 39 },
  { labelKey: "expenseBreakdown.timelapses.q4", startWeek: 40, endWeek: 52 },
  { labelKey: "expenseBreakdown.timelapses.h1", startWeek: 1,  endWeek: 26 },
  { labelKey: "expenseBreakdown.timelapses.h2", startWeek: 27, endWeek: 52 },
];

const EXPENSE_TYPES = [
  { key: "expense",        labelKey: "expenseBreakdown.expenseTypes.expense",        type: "variable", color: "#F09F52" },
  { key: "fuelCost",       labelKey: "expenseBreakdown.expenseTypes.fuelCost",       type: "variable", color: "#F09F52" },
  { key: "workCost",       labelKey: "expenseBreakdown.expenseTypes.workCost",       type: "variable", color: "#F09F52" },
  { key: "bonus",          labelKey: "expenseBreakdown.expenseTypes.bonus",          type: "variable", color: "#F09F52" },
  { key: "driverSalaries", labelKey: "expenseBreakdown.expenseTypes.driverSalaries", type: "fixed",    color: "#0B2863" },
  { key: "otherSalaries",  labelKey: "expenseBreakdown.expenseTypes.otherSalaries",  type: "fixed",    color: "#0B2863" },
  { key: "totalCost",      labelKey: "expenseBreakdown.expenseTypes.totalCost",      type: "total",    color: "#0B2863" },
];

const DISCOUNT_TYPES: { key: string; labelKey: string; color: string }[] = [];

const getMaxWeeksInYear = (year: number): number => {
  const d = new Date(year, 11, 31);
  const weekNum = getWeekNumber(d);
  return weekNum === 1 ? 52 : weekNum;
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const FinancialExpenseBreakdownView = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    expenses: Record<string, number>;
    discounts: Record<string, number>;
    income: number;
    totalCost: number;
    profit: number;
    totalCostFromTable?: number;
    extraIncomes?: ExtraIncomeItem[];
    totalExtraIncome?: number;
  } | null>(null);
  const [dbCosts, setDbCosts] = useState<Cost[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateExtraIncomeDialog, setShowCreateExtraIncomeDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; cost: Cost | null }>({ open: false, cost: null });
  const [refreshLoading, setRefreshLoading] = useState(false);
  const repository = new SummaryCostRepository();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [maxWeeks, setMaxWeeks] = useState<number>(getMaxWeeksInYear(currentYear));

  const getCurrentWeekInYear = (selectedYear: number): number => {
    const now = new Date();
    if (selectedYear > currentYear) return getMaxWeeksInYear(selectedYear);
    if (selectedYear === currentYear) {
      const start = new Date(selectedYear, 0, 1);
      const weekNum = Math.ceil((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return Math.min(weekNum, getMaxWeeksInYear(selectedYear));
    }
    return getMaxWeeksInYear(selectedYear);
  };

  const [startWeek, setStartWeek] = useState<number>(1);
  const [endWeek, setEndWeek] = useState<number>(() => getCurrentWeekInYear(currentYear));
  const [selectedTimelapse, setSelectedTimelapse] = useState<string | null>(null);

  useEffect(() => {
    const newMaxWeeks = getMaxWeeksInYear(year);
    setMaxWeeks(newMaxWeeks);
    const currentWeekInYear = getCurrentWeekInYear(year);
    setEndWeek(Math.min(currentWeekInYear, newMaxWeeks));
    setStartWeek(1);
    setSelectedTimelapse(null);
  }, [year, currentYear]);

  useEffect(() => {
    const adjustedStartWeek = Math.min(startWeek, endWeek);
    const adjustedEndWeek = Math.max(startWeek, endWeek);
    fetchBreakdown(adjustedStartWeek, adjustedEndWeek, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWeek, endWeek, year]);

  const fetchBreakdown = async (fromWeek: number, toWeek: number, selectedYear: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: OrderSummaryLightTotalsResponse = await repository.getSummaryCostRangeTotals(fromWeek, toWeek, selectedYear, true);
      const expenses: Record<string, number> = {};
      const discounts: Record<string, number> = {};
      EXPENSE_TYPES.forEach(type => { expenses[type.key] = 0; });
      DISCOUNT_TYPES.forEach(type => { discounts[type.key] = 0; });

      const data = result.data || result;

      expenses.expense        = Number(Number(data.expense        || 0).toFixed(2));
      expenses.fuelCost       = Number(Number(data.fuelCost       || 0).toFixed(2));
      expenses.workCost       = Number(Number(data.workCost       || 0).toFixed(2));
      expenses.bonus          = Number(Number(data.bonus          || 0).toFixed(2));
      expenses.driverSalaries = Number(Number(data.driverSalaries || 0).toFixed(2));
      expenses.otherSalaries  = Number(Number(data.otherSalaries  || 0).toFixed(2));

      const costsFromBackend = (data.costs || []).map((cost: any) => ({
        id_cost: cost.id_cost,
        description: cost.description || 'Undefined',
        cost: cost.cost,
        type: cost.type,
        date: cost.date,
        update: cost.date,
        is_active: true,
      }));
      setDbCosts(costsFromBackend);

      expenses.totalCost = Number(Number(data.totalCost || 0).toFixed(2));
      const totalCostFromTable = Number(Number(data.totalCostFromTable || 0).toFixed(2));
      const extraIncomes = (data.extraIncomes || []) as ExtraIncomeItem[];
      const totalExtraIncome = Number(Number(data.totalExtraIncome || 0).toFixed(2));
      const income = Number(Number(data.rentingCost || 0).toFixed(2));
      const totalCost = expenses.totalCost;
      const profit = Number(Number(data.net_profit).toFixed(2));

      setSummaryData({ expenses, discounts, income, totalCost, profit, totalCostFromTable, extraIncomes, totalExtraIncome });
    } catch (err: any) {
      setError(err.message || t('expenseBreakdown.error.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      const s = Math.min(startWeek, endWeek);
      const e = Math.max(startWeek, endWeek);
      await fetchBreakdown(s, e, year);
      enqueueSnackbar(t('expenseBreakdown.snackbar.refreshSuccess'), { variant: "success" });
    } catch {
      enqueueSnackbar(t('expenseBreakdown.snackbar.refreshError'), { variant: "error" });
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.cost) return;
    setActionLoading(deleteModal.cost.id_cost);
    try {
      await deleteCostApi(deleteModal.cost.id_cost);
      setDbCosts(prev => prev.filter(c => c.id_cost !== deleteModal.cost!.id_cost));
      setSummaryData(prev => {
        if (!prev) return prev;
        const deletedAmount = Number(Number(deleteModal.cost!.cost).toFixed(2));
        const newTotalCost = Number((prev.expenses.totalCost - deletedAmount).toFixed(2));
        return {
          ...prev,
          expenses: { ...prev.expenses, totalCost: newTotalCost },
          totalCost: newTotalCost,
          profit: Number((prev.income - newTotalCost).toFixed(2)),
        };
      });
      enqueueSnackbar(t('expenseBreakdown.snackbar.deleteSuccess'), { variant: "success" });
      setDeleteModal({ open: false, cost: null });
    } catch (err: any) {
      enqueueSnackbar(err.message || t('expenseBreakdown.snackbar.deleteError'), { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTimelapse = (timelapse: typeof TIMELAPSES[0]) => {
    const { startWeek: start, endWeek: end, labelKey } = timelapse;
    const currentWeekInYear = getCurrentWeekInYear(year);
    if (start > currentWeekInYear) {
      enqueueSnackbar(
        t('expenseBreakdown.snackbar.futureWeek', { week: currentWeekInYear }),
        { variant: "error" }
      );
      return;
    }
    setStartWeek(start);
    setEndWeek(Math.min(end, maxWeeks));
    setSelectedTimelapse(labelKey);
  };

  // Cost separation by type
  const otherTransactionCosts = dbCosts.filter(c => c.type.toLowerCase() === 'other_transaction');
  const fixedDbCosts = dbCosts.filter(c => {
    const ct = c.type.toLowerCase();
    return ct === 'fixed' || (ct !== 'variable' && ct !== 'other_transaction');
  });
  const variableDbCosts = dbCosts.filter(c => c.type.toLowerCase() === 'variable');

  const calculateCategorySubtotal = (categoryType: string): number => {
    if (!summaryData) return 0;
    if (categoryType === 'fixed') {
      const dbFixed   = fixedDbCosts.reduce((s, c) => s + Number(Number(c.cost).toFixed(2)), 0);
      const dbOther   = otherTransactionCosts.reduce((s, c) => s + Number(Number(c.cost).toFixed(2)), 0);
      const calcFixed = EXPENSE_TYPES.filter(t => t.type === 'fixed').reduce((s, t) => s + (summaryData.expenses[t.key] || 0), 0);
      return Number((dbFixed + dbOther + calcFixed).toFixed(2));
    }
    if (categoryType === 'variable') {
      const dbVar   = variableDbCosts.reduce((s, c) => s + Number(Number(c.cost).toFixed(2)), 0);
      const calcVar = EXPENSE_TYPES.filter(t => t.type === 'variable').reduce((s, t) => s + (summaryData.expenses[t.key] || 0), 0);
      return Number((dbVar + calcVar).toFixed(2));
    }
    if (categoryType === 'other_transaction')
      return otherTransactionCosts.reduce((s, c) => s + Number(Number(c.cost).toFixed(2)), 0);
    if (categoryType === 'discounts')
      return Number(Object.values(summaryData.discounts).reduce((s, v) => s + v, 0).toFixed(2));
    return 0;
  };

  // Shared helpers for cost CRUD state updates
  const makeCostDeletedUpdater = (costsList: Cost[]) => (costId: string) => {
    setDbCosts(prev => prev.filter(c => c.id_cost !== costId));
    setSummaryData(prev => {
      if (!prev) return prev;
      const deleted = costsList.find(c => c.id_cost === costId);
      if (!deleted) return prev;
      const amount = Number(Number(deleted.cost).toFixed(2));
      const newTotal = Number((prev.expenses.totalCost - amount).toFixed(2));
      return { ...prev, expenses: { ...prev.expenses, totalCost: newTotal }, totalCost: newTotal, profit: Number((prev.income - newTotal).toFixed(2)) };
    });
  };

  const makeCostCreatedUpdater = () => (newCost: Cost) => {
    setDbCosts(prev => [...prev, newCost]);
    setSummaryData(prev => {
      if (!prev) return prev;
      const amount = Number(Number(newCost.cost).toFixed(2));
      const newTotal = Number((prev.expenses.totalCost + amount).toFixed(2));
      return { ...prev, expenses: { ...prev.expenses, totalCost: newTotal }, totalCost: newTotal, profit: Number((prev.income - newTotal).toFixed(2)) };
    });
  };

  const makeCostUpdatedUpdater = (costsList: Cost[]) => (updatedCost: Cost) => {
    setDbCosts(prev => prev.map(c => c.id_cost === updatedCost.id_cost ? updatedCost : c));
    setSummaryData(prev => {
      if (!prev) return prev;
      const old = costsList.find(c => c.id_cost === updatedCost.id_cost);
      if (!old) return prev;
      const diff = Number((updatedCost.cost - old.cost).toFixed(2));
      const newTotal = Number((prev.expenses.totalCost + diff).toFixed(2));
      return { ...prev, expenses: { ...prev.expenses, totalCost: newTotal }, totalCost: newTotal, profit: Number((prev.income - newTotal).toFixed(2)) };
    });
  };

  // Inline badge
  const CalcBadge = ({ variant = 'gray' }: { variant?: 'gray' | 'blue' | 'orange' }) => {
    const styles: Record<string, string> = {
      gray:   'bg-gray-100 text-gray-600',
      blue:   'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full font-medium ${styles[variant]}`}>
        {t('expenseBreakdown.badge.calculated')}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      {/* Back button */}
      <button
        className="mb-6 px-4 py-2 border-2 rounded-lg font-semibold transition-all duration-200 hover:bg-opacity-5"
        style={{ borderColor: '#0B2863', color: '#0B2863', backgroundColor: 'transparent' }}
        onClick={() => navigate(-1)}
      >
        ← {t('expenseBreakdown.back')}
      </button>

      {/* Header card */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-wide" style={{ color: '#0B2863' }}>
              {t('expenseBreakdown.title')}
            </h1>
            <p className="text-gray-600 mb-6">{t('expenseBreakdown.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {refreshLoading
                ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                : <i className="fas fa-sync-alt" />}
              {t('expenseBreakdown.actions.refresh')}
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
            >
              <i className="fas fa-plus" />
              {t('expenseBreakdown.actions.createCost')}
            </button>
            <button
              onClick={() => setShowCreateExtraIncomeDialog(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center gap-2"
            >
              <i className="fas fa-plus" />
              {t('expenseBreakdown.actions.createIncome')}
            </button>
          </div>
        </div>

        {/* Year picker */}
        <div className="mb-6 max-w-xs">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
            {t('expenseBreakdown.filters.year')}
          </label>
          <YearPicker
            year={year}
            onYearSelect={(newYear) => {
              setYear(newYear);
              setMaxWeeks(getMaxWeeksInYear(newYear));
              setEndWeek(getCurrentWeekInYear(newYear));
              setStartWeek(1);
              setSelectedTimelapse(null);
            }}
            min={2015}
            max={new Date().getFullYear() + 1}
            className="w-full"
          />
        </div>

        {/* Quick timelapses */}
        <div className="mb-6 flex gap-3 flex-wrap">
          {TIMELAPSES.map(tl => (
            <button
              key={tl.labelKey}
              onClick={() => handleTimelapse(tl)}
              className="min-w-[120px] px-4 py-2 border-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: selectedTimelapse === tl.labelKey ? '#0B2863' : 'white',
                borderColor: '#0B2863',
                color: selectedTimelapse === tl.labelKey ? 'white' : '#0B2863',
              }}
            >
              {t(tl.labelKey)}
            </button>
          ))}
        </div>

        {/* Week range pickers */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
              {t('expenseBreakdown.filters.startWeek')}
            </label>
            <WeekPicker
              week={startWeek}
              onWeekSelect={(w) => { setStartWeek(w); setSelectedTimelapse(null); }}
              min={1} max={maxWeeks} className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
              {t('expenseBreakdown.filters.endWeek')}
            </label>
            <WeekPicker
              week={endWeek}
              onWeekSelect={(w) => { setEndWeek(w); setSelectedTimelapse(null); }}
              min={1} max={maxWeeks} className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: '#0B2863', borderTopColor: 'transparent' }} />
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg">{error}</div>
      ) : summaryData ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0B2863' }}>
            {t('expenseBreakdown.rangeTitle', {
              start: Math.min(startWeek, endWeek),
              end: Math.max(startWeek, endWeek),
              year,
            })}
          </h2>

          {/* Profit summary banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm opacity-90">{t('expenseBreakdown.summary.totalIncome')}</div>
                <div className="text-2xl font-bold">{formatCurrency(summaryData.income)}</div>
              </div>
              <div>
                <div className="text-sm opacity-90">{t('expenseBreakdown.summary.totalCosts')}</div>
                <div className="text-2xl font-bold">-{formatCurrency(summaryData.totalCost)}</div>
              </div>
              <div className="border-l border-white border-opacity-30 pl-4">
                <div className="text-sm opacity-90">{t('expenseBreakdown.summary.netProfit')}</div>
                <div className={`text-2xl font-bold ${summaryData.profit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatCurrency(summaryData.profit)}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#0B2863' }}>
                  <th className="text-left px-6 py-4 text-white font-semibold text-base">
                    {t('expenseBreakdown.table.category')}
                  </th>
                  <th className="text-right px-6 py-4 text-white font-semibold text-base">
                    {t('expenseBreakdown.table.amount')}
                  </th>
                  <th className="text-center px-6 py-4 text-white font-semibold text-base">
                    {t('expenseBreakdown.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ── FIXED COSTS ── */}
                <tr className="bg-blue-100">
                  <td colSpan={3} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#0B2863' }}>
                    {t('expenseBreakdown.sections.fixedCosts')}
                  </td>
                </tr>

                {otherTransactionCosts.length > 0 && (
                  <CostsTableDropdown
                    costs={otherTransactionCosts}
                    title={t('expenseBreakdown.costGroups.otherTransactions')}
                    totalAmount={otherTransactionCosts.reduce((s, c) => s + Number(Number(c.cost).toFixed(2)), 0)}
                    onCostDeleted={makeCostDeletedUpdater(otherTransactionCosts)}
                    onCostCreated={makeCostCreatedUpdater()}
                    onCostUpdated={makeCostUpdatedUpdater(otherTransactionCosts)}
                  />
                )}

                {fixedDbCosts.length > 0 && (
                  <CostsTableDropdown
                    costs={fixedDbCosts}
                    title={t('expenseBreakdown.costGroups.fixedFromDb')}
                    totalAmount={fixedDbCosts.reduce((s, c) => s + Number(Number(c.cost).toFixed(2)), 0)}
                    onCostDeleted={makeCostDeletedUpdater(fixedDbCosts)}
                    onCostCreated={makeCostCreatedUpdater()}
                    onCostUpdated={makeCostUpdatedUpdater(fixedDbCosts)}
                  />
                )}

                {EXPENSE_TYPES.filter(et => et.type === 'fixed').map(et => (
                  <tr key={et.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 pl-12 text-gray-800">
                      {t(et.labelKey)}
                      <CalcBadge variant="blue" />
                    </td>
                    <td className="px-6 py-3 text-right font-medium" style={{ color: et.color }}>
                      {formatCurrency(summaryData.expenses[et.key] || 0)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-400 text-sm">
                      {t('expenseBreakdown.table.noActions')}
                    </td>
                  </tr>
                ))}

                <tr className="bg-blue-50 border-b-2 border-blue-200">
                  <td className="px-6 py-3 pl-8 font-bold text-gray-700">
                    {t('expenseBreakdown.subtotals.fixed')}
                  </td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#0B2863' }}>
                    {formatCurrency(calculateCategorySubtotal('fixed'))}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">-</td>
                </tr>

                {/* ── VARIABLE COSTS ── */}
                <tr className="bg-orange-100">
                  <td colSpan={3} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#1E2939' }}>
                    {t('expenseBreakdown.sections.variableCosts')}
                  </td>
                </tr>

                {variableDbCosts.length > 0 && (
                  <CostsTableDropdown
                    costs={variableDbCosts}
                    title={t('expenseBreakdown.costGroups.variableFromDb')}
                    totalAmount={variableDbCosts.reduce((s, c) => s + Number(Number(c.cost).toFixed(2)), 0)}
                    onCostDeleted={makeCostDeletedUpdater(variableDbCosts)}
                    onCostCreated={makeCostCreatedUpdater()}
                    onCostUpdated={makeCostUpdatedUpdater(variableDbCosts)}
                  />
                )}

                {EXPENSE_TYPES.filter(et => et.type === 'variable').map(et => (
                  <tr key={et.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 pl-12 text-gray-700">
                      {t(et.labelKey)}
                      <CalcBadge variant="orange" />
                    </td>
                    <td className="px-6 py-3 text-right font-medium" style={{ color: et.color }}>
                      {formatCurrency(summaryData.expenses[et.key] || 0)}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-400 text-sm">
                      {t('expenseBreakdown.table.noActions')}
                    </td>
                  </tr>
                ))}

                <tr className="bg-orange-50 border-b-2 border-orange-200">
                  <td className="px-6 py-3 pl-8 font-bold text-gray-600">
                    {t('expenseBreakdown.subtotals.variable')}
                  </td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#F09F52' }}>
                    {formatCurrency(calculateCategorySubtotal('variable'))}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">-</td>
                </tr>

                {/* ── TOTAL INCOMES ── */}
                <tr className="bg-emerald-50 border-b-2 border-emerald-200">
                  <td className="px-6 py-3 pl-8 font-bold text-gray-700">
                    {t('expenseBreakdown.subtotals.totalIncomes')}
                    {summaryData.extraIncomes && summaryData.extraIncomes.length > 0 ? (
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        ({t('expenseBreakdown.extraIncomes.count', { count: summaryData.extraIncomes.length })})
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        ({t('expenseBreakdown.extraIncomes.none')})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#22c55e' }}>
                    {formatCurrency(summaryData.totalExtraIncome || 0)}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">-</td>
                </tr>

                {/* ── FINANCIAL SUMMARY ── */}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-3 font-bold text-sm tracking-wide" style={{ color: '#0B2863' }}>
                    {t('expenseBreakdown.sections.financialSummary')}
                  </td>
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 pl-12 font-bold" style={{ color: '#22c55e' }}>
                    {t('expenseBreakdown.summary.income')}
                    <CalcBadge />
                  </td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#22c55e' }}>
                    {formatCurrency(summaryData.income)}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">
                    {t('expenseBreakdown.table.noActions')}
                  </td>
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 pl-12 font-semibold text-gray-700">
                    {t('expenseBreakdown.summary.totalCost')}
                    <CalcBadge />
                  </td>
                  <td className="px-6 py-3 text-right font-semibold" style={{ color: '#0B2863' }}>
                    {formatCurrency(summaryData.totalCost)}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-400 text-sm">
                    {t('expenseBreakdown.table.noActions')}
                  </td>
                </tr>

                <tr style={{ backgroundColor: summaryData.profit >= 0 ? '#e8f5e9' : '#ffebee' }}>
                  <td className="px-6 py-4 pl-12 font-bold text-lg" style={{ color: '#0B2863' }}>
                    {t('expenseBreakdown.summary.netProfit')}
                    <CalcBadge />
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-lg"
                    style={{ color: summaryData.profit >= 0 ? '#2e7d32' : '#c62828' }}>
                    {formatCurrency(summaryData.profit)}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 text-sm">
                    {t('expenseBreakdown.table.noActions')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Export button */}
      <button
        className="mt-6 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#0B2863' }}
        onClick={() => setExportDialogOpen(true)}
        disabled={!summaryData}
      >
        {t('expenseBreakdown.actions.export')}
      </button>

      {/* Dialogs */}
      <FinancialExpenseBreakdownExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        expenses={summaryData?.expenses || {}}
        income={Number(summaryData?.income || 0)}
        profit={Number(summaryData?.profit || 0)}
        startWeek={Math.min(startWeek, endWeek)}
        endWeek={Math.max(startWeek, endWeek)}
        year={year}
      />

      <CreateCostDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={async (newCost: Cost) => {
          makeCostCreatedUpdater()(newCost);
          enqueueSnackbar(t('expenseBreakdown.snackbar.costCreated'), { variant: "success" });
        }}
      />

      <CreateExtraIncomeDialog
        open={showCreateExtraIncomeDialog}
        onClose={() => setShowCreateExtraIncomeDialog(false)}
        onSuccess={(newIncome) => {
          setSummaryData(prev => {
            if (!prev) return prev;
            const item: ExtraIncomeItem = {
              id: newIncome.id, value: newIncome.value, description: newIncome.description,
              type: newIncome.type, date: newIncome.date, is_active: newIncome.is_active,
              updated_at: newIncome.updated_at,
            };
            const updatedIncomes = [...(prev.extraIncomes || []), item];
            const newTotal = updatedIncomes.reduce((s, i) => s + i.value, 0);
            return {
              ...prev,
              extraIncomes: updatedIncomes,
              totalExtraIncome: newTotal,
              income: newTotal,
              profit: Number((newTotal - prev.totalCost).toFixed(2)),
            };
          });
          enqueueSnackbar(t('expenseBreakdown.snackbar.incomeCreated'), { variant: "success" });
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
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F09F52; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e68a3d; }
      `}</style>
    </div>
  );
};

export default FinancialExpenseBreakdownView;