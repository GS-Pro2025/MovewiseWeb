/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SummaryCostRepository, payByKey_ref } from "../data/SummaryCostRepository";
import type { OrderSummary } from "../domain/OrderSummaryModel";
import { processDocaiStatement, ProcessMode } from "../data/repositoryDOCAI";
import { addExpenseToOrder, addIncomeToOrder, searchOrdersByKeyRefLike } from "../data/OrdersRepository";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { OCRResult, SuperOrder } from "../domain/ModelsOCR";
import { BarChart3 } from "lucide-react";
import LoaderSpinner from "../../components/Login_Register/LoadingSpinner";

// Imported Components
import FinancialSummaryCards from "./FinancialSummaryCards";
import FinancialControls from "./FinancialControls";
import FinancialTable from "./FinancialTable";
import OCRUploadDialog from "./OCRUploadDialog";
import PaymentDialog from "./PaymentDialog";
import SuperOrderDetailsDialog from "./SuperOrderDetailsDialog";
import DocaiResultDialog from "./DocaiResultDialog";
import AddAmountDialog from './components/AddAmountDialog';

// Utility function for week range calculation
function getWeekRange(year: number, week: number): { start: string; end: string } {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
  const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
  const endDate = new Date(startDate.getTime() + 6 * 86400000);
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

const FinancialView = () => {
  const { t } = useTranslation();
  const repository = new SummaryCostRepository();
  const navigate = useNavigate();

  // Core data states
  const [data, setData] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page] = useState(0);

  // Week and year controls
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now.getTime() - start.getTime()) / 604800000);
  });
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const weekRange = useMemo(() => getWeekRange(year, week), [year, week]);

  // Table states
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof SuperOrder>('totalProfit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Search states
  const [searchRef, setSearchRef] = useState("");
  const [searchResults, setSearchResults] = useState<OrderSummary[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Modal states
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [paySuperOrder, setPaySuperOrder] = useState<SuperOrder | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSuperOrder, setSelectedSuperOrder] = useState<SuperOrder | null>(null);

  // OCR states
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStep, setOcrStep] = useState<string>(t('financialView.ocr.settingData'));
  const [docaiDialogOpen, setDocaiDialogOpen] = useState(false);
  const [docaiDialogResult, setDocaiDialogResult] = useState<any>(null);

  const [shouldShowConfirmation, setShouldShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Add amount dialog states
  const [addAmountDialogOpen, setAddAmountDialogOpen] = useState(false);
  const [addAmountType, setAddAmountType] = useState<'income' | 'expense'>('income');
  const [addAmountSuperOrder, setAddAmountSuperOrder] = useState<SuperOrder | null>(null);
  const [addAmountLoading, setAddAmountLoading] = useState(false);

  // Group orders by key_ref and calculate totals
  function groupByKeyRef(data: OrderSummary[]): SuperOrder[] {
    const map = new Map<string, SuperOrder>();
    data.forEach((item) => {
      if (!map.has(item.key_ref)) {
        map.set(item.key_ref, {
          key_ref: item.key_ref,
          orders: [],
          totalIncome: 0,
          totalCost: 0,
          totalProfit: 0,
          payStatus: 1,
          client: item.client,
          expense: 0,
          fuelCost: 0,
          bonus: 0,
          workCost: 0,
          driverSalaries: 0,
          otherSalaries: 0,
        });
      }
      const superOrder = map.get(item.key_ref)!;
      superOrder.orders.push(item);
      superOrder.totalIncome     += item.income ?? 0;
      superOrder.totalCost       += item.summary?.totalCost ?? 0;
      superOrder.expense         += item.summary?.expense ?? 0;
      superOrder.fuelCost        += item.summary?.fuelCost ?? 0;
      superOrder.bonus           += item.summary?.bonus ?? 0;
      superOrder.workCost        += item.summary?.workCost ?? 0;
      superOrder.driverSalaries  += item.summary?.driverSalaries ?? 0;
      superOrder.otherSalaries   += item.summary?.otherSalaries ?? 0;
      superOrder.payStatus = superOrder.payStatus && item.payStatus === 1 ? 1 : 0;
    });
    map.forEach((superOrder) => {
      superOrder.totalProfit = superOrder.totalIncome - superOrder.totalCost;
    });
    return Array.from(map.values());
  }

  // Fetch data
  const fetchData = useCallback(async (pageNumber: number, week: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await repository.getSummaryCost(pageNumber, week, year);
      setData(result.results);
    } catch (err: any) {
      setError(err.message || t('financialView.errors.loadData'));
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    fetchData(page, week, year);
  }, [page, week, year]);

  // Sorted super orders
  const superOrders = useMemo(() => {
    const grouped = groupByKeyRef(data);
    return grouped.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, sortOrder]);

  // Summary totals
  const totalSummary = useMemo(() => {
    const currentData = searchResults ? groupByKeyRef(searchResults) : superOrders;
    return currentData.reduce((acc, order) => ({
      totalIncome:   acc.totalIncome   + order.totalIncome,
      totalCost:     acc.totalCost     + order.totalCost,
      totalProfit:   acc.totalProfit   + order.totalProfit,
      paidOrders:    acc.paidOrders    + (order.payStatus === 1 ? 1 : 0),
      unpaidOrders:  acc.unpaidOrders  + (order.payStatus === 0 ? 1 : 0),
    }), { totalIncome: 0, totalCost: 0, totalProfit: 0, paidOrders: 0, unpaidOrders: 0 });
  }, [superOrders, searchResults]);

  const currentExportData = searchResults ? groupByKeyRef(searchResults) : superOrders;

  // ── Event Handlers ──────────────────────────────────────────────────────────
  const handleWeekChange = (newWeek: number) => {
    if (Number.isInteger(newWeek) && newWeek >= 1 && newWeek <= 53) setWeek(newWeek);
  };

  const handleYearChange = (newYear: number) => {
    if (Number.isInteger(newYear) && newYear >= 2020 && newYear <= new Date().getFullYear() + 2) setYear(newYear);
  };

  const handleSort = (column: keyof SuperOrder) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const toggleRowExpansion = (keyRef: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(keyRef)) {
      newExpanded.delete(keyRef);
    } else {
      newExpanded.add(keyRef);
    }
    setExpandedRows(newExpanded);
  };

  const handleSearch = async () => {
    if (!searchRef.trim()) return;
    setSearchLoading(true);
    try {
      const results = await searchOrdersByKeyRefLike(searchRef.trim());
      setSearchResults(results);
      if (results.length === 0) enqueueSnackbar(t('financialView.search.noResults'), { variant: "info" });
    } catch (err) {
      enqueueSnackbar(t('financialView.search.error', { err }), { variant: "error" });
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setSearchRef("");
  };

  const handleConfirmPay = async (expense: number, income: number) => {
    if (!paySuperOrder) return;
    const res = await payByKey_ref(paySuperOrder.key_ref, expense, income);
    setPayDialogOpen(false);
    setPaySuperOrder(null);
    if (res.success) {
      enqueueSnackbar(t('financialView.payment.success'), { variant: "success" });
      fetchData(page, week, year);
    } else {
      enqueueSnackbar(res.errorMessage || t('financialView.payment.error'), { variant: "error" });
    }
  };

  const handleViewDetails = (superOrder: SuperOrder) => {
    setSelectedSuperOrder(superOrder);
    setDetailsDialogOpen(true);
  };

  const handleOrderPaid = () => {
    if (searchResults) {
      handleSearch();
    } else {
      fetchData(page, week, year);
    }
  };

  // ── OCR Handlers ────────────────────────────────────────────────────────────
  const handleOcrUpload = async (processMode: ProcessMode = 'full_process', targetWeek?: number, targetYear?: number) => {
    setOcrLoading(true);
    setOcrStep(t('financialView.ocr.settingData'));
    enqueueSnackbar(t('financialView.ocr.startingMode', { mode: processMode }), { variant: "info" });

    const results: OCRResult[] = [];
    let hasAnySuccess         = false;
    let totalUpdatedOrders    = 0;
    let totalNotFoundOrders   = 0;
    let totalSavedRecords     = 0;

    for (const file of ocrFiles) {
      setOcrStep(t('financialView.ocr.processingFile', { name: file.name, mode: processMode }));
      enqueueSnackbar(t('financialView.ocr.processingFileShort', { name: file.name }), { variant: "info" });

      try {
        const res = await processDocaiStatement(file, processMode, targetWeek, targetYear);
        const isSuccess = res.success !== false;

        if (isSuccess) {
          hasAnySuccess = true;
          if (processMode === 'full_process' && res.regular_orders_data?.update_summary) {
            totalUpdatedOrders  += res.regular_orders_data.update_summary.total_updated || 0;
            totalNotFoundOrders += res.regular_orders_data.update_summary.total_not_found || 0;
          } else if (processMode === 'save_only' && res.regular_orders_data?.save_summary) {
            totalSavedRecords += res.regular_orders_data.save_summary.statement_records_created || 0;
          }
          if (res.other_transactions_data?.save_summary) {
            totalSavedRecords += res.other_transactions_data.save_summary.statements_created || 0;
          }
        }

        results.push({
          name: file.name,
          success: isSuccess,
          message: res.message || (isSuccess ? t('financialView.ocr.success') : t('financialView.ocr.failed')),
          processMode: res.process_mode || processMode,
          data: res.update_result ? {
            updated_orders: (res.update_result.updated_orders || []).map((order: { income: any }) => ({
              ...order,
              income: order.income ?? 0,
            })),
            not_found_orders: res.update_result.not_found_orders || [],
            total_updated: res.update_result.total_updated || 0,
            total_not_found: res.update_result.total_not_found || 0,
            duplicated_orders: res.update_result.duplicated_orders || [],
            total_duplicated: res.update_result.total_duplicated || 0,
            statement_records_created:
              res.regular_orders_data?.update_summary?.statement_records_created ||
              res.regular_orders_data?.save_summary?.statement_records_created ||
              res.other_transactions_data?.save_summary?.statements_created,
          } : undefined,
          ocr_text: res.ocr_text,
          order_key: res.order_key,
          parsed_orders: res.regular_orders_data?.parsed_orders,
        });

        if (isSuccess && !docaiDialogResult) {
          setDocaiDialogResult({
            message: res.message,
            processing_type: res.processing_type,
            other_transactions_page: res.other_transactions_page,
            total_pages_scanned: res.total_pages_scanned,
            process_mode: res.process_mode || processMode,
            ocr_text: res.ocr_text,
            parsed_orders: res.regular_orders_data?.parsed_orders,
            update_result: res.update_result,
            update_summary: res.regular_orders_data?.update_summary,
            other_transactions_data: res.other_transactions_data,
            data: res.regular_orders_data,
          });
        }
      } catch (err: any) {
        results.push({
          name: file.name,
          success: false,
          message: err?.message || t('financialView.ocr.networkError'),
          processMode,
          data: undefined,
        });
      }
    }

    setOcrResults(results);
    setOcrLoading(false);

    const successCount = results.filter(r => r.success).length;

    if (successCount === results.length && hasAnySuccess) {
      const confirmMsg = processMode === 'full_process'
        ? t('financialView.ocr.fullProcessSuccess', { updated: totalUpdatedOrders, notFound: totalNotFoundOrders })
        : t('financialView.ocr.saveOnlySuccess', { saved: totalSavedRecords });
      setConfirmationMessage(confirmMsg);
      setShouldShowConfirmation(true);
      enqueueSnackbar(t('financialView.ocr.allFilesSuccess'), { variant: "success" });
    } else if (successCount === 0) {
      enqueueSnackbar(t('financialView.ocr.allFilesFailed'), { variant: "error" });
    } else if (hasAnySuccess) {
      const confirmMsg = t('financialView.ocr.partialSuccess', { success: successCount, total: results.length });
      setConfirmationMessage(confirmMsg);
      setShouldShowConfirmation(true);
      enqueueSnackbar(t('financialView.ocr.partialSuccessSnack', { success: successCount, total: results.length }), { variant: "warning" });
    } else {
      enqueueSnackbar(t('financialView.ocr.noFilesProcessed'), { variant: "warning" });
    }

    if (processMode === 'full_process') {
      fetchData(page, week, year);
    }
  };

  const handleDocaiDialogClose = () => {
    setDocaiDialogOpen(false);
    setDocaiDialogResult(null);
    if (shouldShowConfirmation) {
      enqueueSnackbar(confirmationMessage, {
        variant: "success",
        autoHideDuration: 6000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
      });
      setShouldShowConfirmation(false);
      setConfirmationMessage("");
    }
  };

  const handleOcrClose = () => {
    setOcrDialogOpen(false);
    setOcrFiles([]);
    setOcrResults([]);
    setOcrLoading(false);
    setShouldShowConfirmation(false);
    setConfirmationMessage("");
    setDocaiDialogResult(null);
  };

  const handleOcrProcessMore = () => {
    setOcrFiles([]);
    setOcrResults([]);
    setShouldShowConfirmation(false);
    setConfirmationMessage("");
  };

  const handleViewDetailedResults = () => {
    setOcrDialogOpen(false);
    setDocaiDialogOpen(true);
  };

  // ── Add Amount Handlers ─────────────────────────────────────────────────────
  const handleAddIncome = (superOrder: SuperOrder) => {
    setAddAmountSuperOrder(superOrder);
    setAddAmountType('income');
    setAddAmountDialogOpen(true);
  };

  const handleAddExpense = (superOrder: SuperOrder) => {
    setAddAmountSuperOrder(superOrder);
    setAddAmountType('expense');
    setAddAmountDialogOpen(true);
  };

  const handleConfirmAddAmount = async (amount: number) => {
    if (!addAmountSuperOrder) return;
    setAddAmountLoading(true);
    try {
      const payload = { amount, key_ref: addAmountSuperOrder.key_ref };
      const result = addAmountType === 'income'
        ? await addIncomeToOrder(payload)
        : await addExpenseToOrder(payload);

      if (result && result.length > 0) {
        enqueueSnackbar(
          t('financialView.addAmount.success', { type: addAmountType === 'income' ? t('financialView.addAmount.income') : t('financialView.addAmount.expense'), count: result.length }),
          { variant: "success" }
        );
        if (searchResults) {
          handleSearch();
        } else {
          fetchData(page, week, year);
        }
      } else {
        enqueueSnackbar(t('financialView.addAmount.noOrdersUpdated'), { variant: "warning" });
      }

      setAddAmountDialogOpen(false);
      setAddAmountSuperOrder(null);
    } catch (error: any) {
      enqueueSnackbar(
        t('financialView.addAmount.error', { type: addAmountType, message: error.message || error }),
        { variant: "error" }
      );
    } finally {
      setAddAmountLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 w-full overflow-x-hidden">

      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
          <BarChart3 size={32} className="sm:w-10 sm:h-10 text-[#092962]" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#092962]">
            {t('financialView.title')}
          </h1>
        </div>
        <p className="text-gray-600 text-sm sm:text-base px-1 sm:px-0">
          {t('financialView.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <FinancialSummaryCards summary={totalSummary} />
      </div>

      {/* Controls */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <FinancialControls
          week={week}
          onWeekChange={handleWeekChange}
          year={year}
          onYearChange={handleYearChange}
          weekRange={weekRange}
          showWeekControls={!searchResults}
          searchRef={searchRef}
          onSearchRefChange={setSearchRef}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          searchLoading={searchLoading}
          hasSearchResults={!!searchResults}
          onUploadClick={() => setOcrDialogOpen(true)}
          exportData={currentExportData}
          isSearchResults={!!searchResults}
          loading={loading}
          onViewExpenseBreakdown={() => navigate("/app/financial-expense-breakdown")}
        />
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center min-h-48 sm:min-h-64 md:min-h-80 px-2 sm:px-0">
          <LoaderSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 sm:px-6 sm:py-4 rounded-lg text-sm sm:text-base">
          {error}
        </div>
      ) : (
        <FinancialTable
          data={currentExportData}
          sortBy={sortBy}
          sortOrder={sortOrder}
          expandedRows={expandedRows}
          onSort={handleSort}
          onToggleExpand={toggleRowExpansion}
          onAddIncome={handleAddIncome}
          onAddExpense={handleAddExpense}
          onViewDetails={handleViewDetails}
          onOrderPaid={handleOrderPaid}
          onViewOperators={(orderId: string) => navigate(`/app/add-operators-to-order/${orderId}`)}
        />
      )}

      {/* Dialogs */}
      <PaymentDialog
        open={payDialogOpen}
        expense={paySuperOrder?.expense ?? 0}
        income={paySuperOrder?.totalIncome ?? 0}
        onClose={() => setPayDialogOpen(false)}
        onConfirm={handleConfirmPay}
      />

      <SuperOrderDetailsDialog
        open={detailsDialogOpen}
        superOrder={selectedSuperOrder}
        onClose={() => { setDetailsDialogOpen(false); setSelectedSuperOrder(null); }}
      />

      <OCRUploadDialog
        open={ocrDialogOpen}
        loading={ocrLoading}
        step={ocrStep}
        files={ocrFiles}
        results={ocrResults}
        onClose={handleOcrClose}
        onFilesSelected={setOcrFiles}
        onUpload={handleOcrUpload}
        onProcessMore={handleOcrProcessMore}
        onViewDetails={handleViewDetailedResults}
        hasDetailedResults={!!docaiDialogResult}
        currentWeek={week}
        currentYear={year}
      />

      <DocaiResultDialog
        open={docaiDialogOpen}
        onClose={handleDocaiDialogClose}
        result={docaiDialogResult}
      />

      <AddAmountDialog
        open={addAmountDialogOpen}
        type={addAmountType}
        keyRef={addAmountSuperOrder?.key_ref || ''}
        loading={addAmountLoading}
        onClose={() => { setAddAmountDialogOpen(false); setAddAmountSuperOrder(null); }}
        onConfirm={handleConfirmAddAmount}
      />
    </div>
  );
};

export default FinancialView;