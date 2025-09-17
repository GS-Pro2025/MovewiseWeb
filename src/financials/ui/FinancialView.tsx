/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { SummaryCostRepository, payByKey_ref } from "../data/SummaryCostRepository";
import type { OrderSummary } from "../domain/OrderSummaryModel";
import { processDocaiStatement } from "../data/repositoryDOCAI";
import { searchOrdersByKeyRefLike } from "../data/OrdersRepository";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { OCRResult, SuperOrder } from "../domain/ModelsOCR";

// Imported Components
import FinancialSummaryCards from "./FinancialSummaryCards";
import FinancialControls from "./FinancialControls";
import FinancialTable from "./FinancialTable";
import OCRUploadDialog from "./OCRUploadDialog";
import PaymentDialog from "./PaymentDialog";
import SuperOrderDetailsDialog from "./SuperOrderDetailsDialog";
import DocaiResultDialog from "./DocaiResultDialog";

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
  const repository = new SummaryCostRepository();
  const navigate = useNavigate();

  // Core data states
  const [data, setData] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  console.log("rowCount", rowCount);

  // Week and year controls
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now.getTime() - start.getTime()) / 604800000);
  });
  const [year] = useState<number>(new Date().getFullYear());
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
  const [ocrStep, setOcrStep] = useState<string>("Setting data");
  const [docaiDialogOpen, setDocaiDialogOpen] = useState(false);
  const [docaiDialogResult, setDocaiDialogResult] = useState<any>(null);

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
          workCost: 0,
          driverSalaries: 0,
          otherSalaries: 0,
        });
      }
      const superOrder = map.get(item.key_ref)!;
      superOrder.orders.push(item);
      superOrder.totalIncome += item.income ?? 0;
      superOrder.totalCost += item.summary?.totalCost ?? 0;
      superOrder.expense += item.summary?.expense ?? 0;
      superOrder.fuelCost += item.summary?.fuelCost ?? 0;
      superOrder.workCost += item.summary?.workCost ?? 0;
      superOrder.driverSalaries += item.summary?.driverSalaries ?? 0;
      superOrder.otherSalaries += item.summary?.otherSalaries ?? 0;
      superOrder.payStatus = superOrder.payStatus && item.payStatus === 1 ? 1 : 0;
    });
    map.forEach((superOrder) => {
      superOrder.totalProfit = superOrder.totalIncome - superOrder.totalCost;
    });
    return Array.from(map.values());
  }

  // Fetch data function
  const fetchData = useCallback(async (pageNumber: number, week: number) => {
    const currentYear = new Date().getFullYear();
    setLoading(true);
    setError(null);
    try {
      const result = await repository.getSummaryCost(pageNumber, week, currentYear);
      setData(result.results);
      setRowCount(result.count);
    } catch (err: any) {
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  }, [repository]);

  // Load data on component mount and when week changes
  useEffect(() => {
    fetchData(page, week);
  }, [page, week, year]);

  // Process and sort super orders
  const superOrders = useMemo(() => {
    const grouped = groupByKeyRef(data);
    return grouped.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, sortOrder]);

  // Calculate summary totals
  const totalSummary = useMemo(() => {
    const currentData = searchResults ? groupByKeyRef(searchResults) : superOrders;
    return currentData.reduce((acc, order) => ({
      totalIncome: acc.totalIncome + order.totalIncome,
      totalCost: acc.totalCost + order.totalCost,
      totalProfit: acc.totalProfit + order.totalProfit,
      paidOrders: acc.paidOrders + (order.payStatus === 1 ? 1 : 0),
      unpaidOrders: acc.unpaidOrders + (order.payStatus === 0 ? 1 : 0),
    }), {
      totalIncome: 0,
      totalCost: 0,
      totalProfit: 0,
      paidOrders: 0,
      unpaidOrders: 0,
    });
  }, [superOrders, searchResults]);

  // Current data for display and export
  const currentExportData = searchResults ? groupByKeyRef(searchResults) : superOrders;

  // Event Handlers
  const handleWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWeek = parseInt(event.target.value, 10);
    if (newWeek >= 1 && newWeek <= 53) setWeek(newWeek);
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
      if (results.length === 0) enqueueSnackbar("No results found.", { variant: "info" });
    } catch (err) {
      enqueueSnackbar(`Error searching reference: ${err}`, { variant: "error" });
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setSearchRef("");
  };

  const handleOpenPayDialog = (superOrder: SuperOrder) => {
    setPaySuperOrder(superOrder);
    setPayDialogOpen(true);
  };

  const handleConfirmPay = async (expense: number, income: number) => {
    if (!paySuperOrder) return;
    const res = await payByKey_ref(paySuperOrder.key_ref, expense, income);
    setPayDialogOpen(false);
    setPaySuperOrder(null);
    if (res.success) {
      enqueueSnackbar("Payment registered successfully", { variant: "success" });
      fetchData(page, week);
    } else {
      enqueueSnackbar(res.errorMessage || "Error processing payment", { variant: "error" });
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
      fetchData(page, week);
    }
  };

  // OCR Handlers
  const handleOcrUpload = async () => {
    setOcrLoading(true);
    setOcrStep("Setting data");
    enqueueSnackbar("Setting data...", { variant: "info" });
    const results: OCRResult[] = [];
    
    for (const file of ocrFiles) {
      setOcrStep(`Processing ${file.name}...`);
      enqueueSnackbar(`Processing ${file.name}...`, { variant: "info" });
      
      try {
        const res = await processDocaiStatement(file);
        const isSuccess = res.success !== false && res.update_result !== undefined;
        results.push({
          name: file.name,
          success: isSuccess,
          message: res.message || (isSuccess ? "Success" : "Failed"),
          data: res.update_result ? {
            updated_orders: (res.update_result.updated_orders || []).map(order => ({
              ...order,
              income: order.income ?? 0,
            })),
            not_found_orders: res.update_result.not_found_orders || [],
            total_updated: res.update_result.total_updated || 0,
            total_not_found: res.update_result.total_not_found || 0,
          } : undefined,
          ocr_text: res.ocr_text,
          order_key: res.order_key,
        });

        if (isSuccess) {
          const normalizedUpdateResult = {
            ...res.update_result,
            updated_orders: (res.update_result?.updated_orders || []).map(order => ({
              key_ref: order.key_ref,
              orders_updated: order.orders_updated,
              income: order.income ?? 0,
              expense: order.expense ?? 0,
            })),
            not_found_orders: res.update_result?.not_found_orders || [],
            total_updated: res.update_result?.total_updated ?? 0,
            total_not_found: res.update_result?.total_not_found ?? 0,
          };

          setDocaiDialogResult({
            message: res.message,
            ocr_text: res.ocr_text,
            update_result: normalizedUpdateResult,
          });
          setDocaiDialogOpen(true);
        }
      } catch (err: any) {
        results.push({
          name: file.name,
          success: false,
          message: err?.message || "Network error",
          data: undefined,
        });
      }
    }
    
    setOcrResults(results);
    setOcrLoading(false);

    const successCount = results.filter(r => r.success).length;
    if (successCount === results.length) {
      enqueueSnackbar("All files processed successfully!", { variant: "success" });
    } else if (successCount === 0) {
      enqueueSnackbar("All files failed to process.", { variant: "error" });
    } else {
      enqueueSnackbar(`${successCount} of ${results.length} files processed successfully.`, { variant: "warning" });
    }

    fetchData(page, week);
  };

  const handleOcrClose = () => {
    setOcrDialogOpen(false);
    setOcrFiles([]);
    setOcrResults([]);
    setOcrLoading(false);
  };

  const handleOcrProcessMore = () => {
    setOcrFiles([]);
    setOcrResults([]);
  };

  return (
    <Box p={3} sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          📊 Financial Summary
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Track your financial performance with detailed insights and analytics
        </Typography>
      </Box>

      {/* Summary Cards */}
      <FinancialSummaryCards summary={totalSummary} />

      {/* Controls */}
      <FinancialControls
        week={week}
        onWeekChange={handleWeekChange}
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
        year={year}
        loading={loading}
      />

      {/* Main Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress size={60} sx={{ color: '#667eea' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 4 }}>
          {error}
        </Alert>
      ) : (
        <FinancialTable
          data={currentExportData}
          sortBy={sortBy}
          sortOrder={sortOrder}
          expandedRows={expandedRows}
          onSort={handleSort}
          onToggleExpand={toggleRowExpansion}
          onPayOrder={handleOpenPayDialog}
          onViewDetails={handleViewDetails}
          onOrderPaid={handleOrderPaid}
          onViewOperators={(orderId: string) => navigate(`/add-operators-to-order/${orderId}`)}
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
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedSuperOrder(null);
        }}
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
      />

      {docaiDialogOpen && (
        <DocaiResultDialog
          open={docaiDialogOpen}
          onClose={() => setDocaiDialogOpen(false)}
          result={docaiDialogResult}
        />
      )}
    </Box>
  );
};

export default FinancialView;