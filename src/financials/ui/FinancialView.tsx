/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Typography, CircularProgress, TextField, Button, Chip, Alert, Divider } from "@mui/material";
import { SummaryCostRepository, payByKey_ref } from "../data/SummaryCostRepository";
import type { OrderSummary } from "../domain/OrderSummaryModel";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import OrdersByKeyRefTable from "./OrdersByKeyRefTable";
import PaymentDialog from "./PaymentDialog";
import SuperOrderDetailsDialog from "./SuperOrderDetailsDialog";
import PaymentIcon from "@mui/icons-material/AttachMoney";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import { processDocaiStatement } from "../data/repositoryDOCAI";
import { enqueueSnackbar } from "notistack";
import LoaderSpinner from "../../componets/Login_Register/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { OCRResult, SuperOrder } from "../domain/ModelsOCR";
import DocaiResultDialog from "./DocaiResultDialog"; // Asegúrate de importar el componente


// Utilidad para calcular el rango de fechas de la semana
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
  const [data, setData] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  console.log("rowCount", rowCount);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Semana y año seleccionados
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now.getTime() - start.getTime()) / 604800000);
  });
  const [year] = useState<number>(new Date().getFullYear());

  const weekRange = useMemo(() => getWeekRange(year, week), [year, week]);

  // Agrupa las órdenes por key_ref y calcula totales
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

  // fetchData adaptado para semana y año
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

  useEffect(() => {
    fetchData(page, week);
  }, [page, week, year]);

  const superOrders = useMemo(() => groupByKeyRef(data), [data]);

  // Estado para el PaymentDialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [paySuperOrder, setPaySuperOrder] = useState<SuperOrder | null>(null);

  // Abre el modal y guarda el superOrder a pagar
  const handleOpenPayDialog = (superOrder: SuperOrder) => {
    setPaySuperOrder(superOrder);
    setPayDialogOpen(true);
  };

  // Cuando se confirma el pago en el modal
  const handleConfirmPay = async (expense: number, income: number) => {
    if (!paySuperOrder) return;
    const res = await payByKey_ref(
      paySuperOrder.key_ref,
      expense,
      income
    );
    setPayDialogOpen(false);
    setPaySuperOrder(null);
    if (res.success) {
      enqueueSnackbar("Payment registered successfully", { variant: "success" });
      fetchData(page, week);
    } else {
      enqueueSnackbar (res.errorMessage || "Error processing payment", { variant: "error" });
      alert(res.errorMessage || "Error processing payment");
    }
  };

  // OCR Upload State
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStep, setOcrStep] = useState<string>("Setting data");

  // Estado para mostrar el dialog final de DOCAi
  const [docaiDialogOpen, setDocaiDialogOpen] = useState(false);
  const [docaiDialogResult, setDocaiDialogResult] = useState<any>(null);

  // OCR Upload Handler
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
              income: order.income ?? 0, // Ensure income is always a number
            })),
            not_found_orders: res.update_result.not_found_orders || [],
            total_updated: res.update_result.total_updated || 0,
            total_not_found: res.update_result.total_not_found || 0,
          } : undefined,
          ocr_text: res.ocr_text,
          order_key: res.order_key,
        });

        // Si hay éxito, muestra el dialog con el resultado
        if (isSuccess) {
          // Normaliza updated_orders para que income nunca sea undefined y elimina payStatus
          const normalizedUpdateResult = {
            ...res.update_result,
            updated_orders: (res.update_result?.updated_orders || []).map(order => ({
              key_ref: order.key_ref,
              orders_updated: order.orders_updated,
              income: order.income ?? 0, // valor por defecto si falta
              expense: order.expense ?? 0, // opcional, si lo usas
              // payStatus: 1, // Elimina si no lo necesitas
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

    // Snackbar general
    const successCount = results.filter(r => r.success).length;
    if (successCount === results.length) {
      enqueueSnackbar("All files processed successfully!", { variant: "success" });
    } else if (successCount === 0) {
      enqueueSnackbar("All files failed to process.", { variant: "error" });
    } else {
      enqueueSnackbar(`${successCount} of ${results.length} files processed successfully.`, { variant: "warning" });
    }

    // Refresh data after processing
    fetchData(page, week);
  };

  // Calculate totals for results summary
  const getResultsSummary = () => {
    let totalUpdated = 0;
    let totalNotFound = 0;
    const allNotFoundOrders: string[] = [];
    const allUpdatedOrders: Array<{ key_ref: string; income: number; orders_updated: number }> = [];

    ocrResults.forEach(result => {
      if (result.success && result.data) {
        totalUpdated += result.data.total_updated || 0;
        totalNotFound += result.data.total_not_found || 0;
        
        if (result.data.not_found_orders) {
          allNotFoundOrders.push(...result.data.not_found_orders);
        }
        
        if (result.data.updated_orders) {
          allUpdatedOrders.push(...result.data.updated_orders);
        }
      }
    });

    return {
      totalUpdated,
      totalNotFound,
      allNotFoundOrders,
      allUpdatedOrders,
    };
  };

  const columns = useMemo<MRT_ColumnDef<SuperOrder>[]>(
    () => [
      { accessorKey: "key_ref", header: "Reference" },
      {
        accessorKey: "totalProfit",
        header: "Profit",
        Cell: ({ cell }) => {
          const value = cell.getValue<number>();
          return (
            <span
              style={{
                color: "#fff",
                background: value >= 0 ? "#4caf50" : "#f44336",
                padding: "4px 12px",
                borderRadius: "16px",
                fontWeight: 600,
                display: "inline-block",
                minWidth: 60,
                textAlign: "center",
              }}
            >
              {value}
            </span>
          );
        },
      },
      {
        accessorKey: "payStatus",
        header: "Paystatus",
        Cell: ({ cell }) => (
          <Typography sx={{ color: cell.getValue<number>() === 1 ? "green" : "orange", fontWeight: 600 }}>
            {cell.getValue<number>() === 1 ? "Paid" : "Unpaid"}
          </Typography>
        ),
      },
      {
        header: "Pay",
        id: "pay",
        size: 120,
        Cell: ({ row }) => {
          const isPaid = row.original.payStatus === 1;
          return (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PaymentIcon />}
              disabled={isPaid}
              onClick={() => handleOpenPayDialog(row.original)}
            >
              Pay
            </Button>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      { accessorKey: "totalIncome", header: "Income" },
      { accessorKey: "totalCost", header: "Total Cost" },
      { accessorKey: "expense", header: "Expense" },
      { accessorKey: "fuelCost", header: "Fuel Cost" },
      { accessorKey: "workCost", header: "Work Cost" },
      { accessorKey: "driverSalaries", header: "Driver Salaries" },
      { accessorKey: "otherSalaries", header: "Operator Salaries" },
      { accessorKey: "client", header: "Client" },
    ],
    [week]
  );

  // Inputs para cambiar semana y año
  const handleWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWeek = parseInt(event.target.value, 10);
    if (newWeek >= 1 && newWeek <= 53) setWeek(newWeek);
  };

  // Muestra LoaderSpinner como pantalla completa, superponiendo el layout/sidebar
  const FullScreenLoader = ({ text }: { text: string }) => (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2000,
        background: "rgba(255,255,255,0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoaderSpinner />
      <Typography variant="h6" sx={{ mt: 4, color: "#0458AB" }}>
        {text}
      </Typography>
    </Box>
  );

  // Estado para el SuperOrderDetailsDialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSuperOrder, setSelectedSuperOrder] = useState<SuperOrder | null>(null);

  const handleRowClick = (superOrder: SuperOrder) => {
    setSelectedSuperOrder(superOrder);
    setDetailsDialogOpen(true);
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Financial Summary
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Week"
          type="number"
          value={week}
          onChange={handleWeekChange}
          inputProps={{ min: 1, max: 53 }}
          size="small"
        />
        <Typography variant="body1" sx={{ alignSelf: 'center' }}>
          Period: {weekRange.start} → {weekRange.end}
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => setOcrDialogOpen(true)}
        >
          Upload Statement PDFs (OCR)
        </Button>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <MaterialReactTable
            columns={columns}
            data={superOrders}
            enableStickyHeader
            muiTableContainerProps={{ sx: { maxHeight: 600 } }}
            muiTableBodyRowProps={({ row }) => ({
              onClick: () => handleRowClick(row.original),
              sx: {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              },
            })}
            renderDetailPanel={({ row }) => (
              <OrdersByKeyRefTable
                orders={row.original.orders}
                keyRef={row.original.key_ref}
                onOrderPaid={() => fetchData(page, week)}
                onViewOperators={(orderId: string) => {
                  navigate(`/add-operators-to-order/${orderId}`);
                }}
              />
            )}
          />
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
        </>
      )}

      {/* OCR Upload Dialog */}
      {ocrDialogOpen && (
        <>
          {ocrLoading ? (
            <FullScreenLoader text={ocrStep} />
          ) : (
            <Box
              sx={{
                position: "fixed",
                inset: 0,
                zIndex: 1300,
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(2px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                setOcrDialogOpen(false);
                setOcrFiles([]);
                setOcrResults([]);
                setOcrLoading(false);
              }}
            >
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: 2,
                  boxShadow: 4,
                  p: 4,
                  minWidth: 400,
                  maxWidth: 700,
                  maxHeight: "90vh",
                  overflow: "auto",
                }}
                onClick={e => e.stopPropagation()}
              >
                <Typography variant="h6" mb={2}>Upload Statement PDFs (OCR)</Typography>
                
                {ocrResults.length === 0 ? (
                  <>
                    <input
                      id="ocr-upload-input"
                      type="file"
                      accept="application/pdf"
                      multiple
                      style={{ display: "none" }}
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        setOcrFiles(files.slice(0, 10));
                        setOcrResults([]);
                      }}
                      disabled={ocrLoading}
                    />
                    <label htmlFor="ocr-upload-input">
                      <Button
                        variant="outlined"
                        component="span"
                        disabled={ocrLoading || ocrFiles.length >= 10}
                        sx={{ mb: 2 }}
                      >
                        {ocrFiles.length > 0
                          ? `${ocrFiles.length} file(s) selected`
                          : "Select PDF files (max 10)"}
                      </Button>
                    </label>
                    <Box sx={{ mb: 2 }}>
                      {ocrFiles.map((file, idx) => (
                        <Typography key={file.name + idx} variant="body2">
                          📄 {file.name}
                        </Typography>
                      ))}
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={ocrFiles.length === 0 || ocrLoading}
                        onClick={handleOcrUpload}
                      >
                        {ocrLoading ? "Processing..." : "Process Files"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setOcrDialogOpen(false);
                          setOcrFiles([]);
                          setOcrResults([]);
                          setOcrLoading(false);
                        }}
                        disabled={ocrLoading}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    {/* Results Summary */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" mb={2} color="primary">
                        Processing Results
                      </Typography>
                      
                      {(() => {
                        const summary = getResultsSummary();
                        return (
                          <Box sx={{ mb: 2 }}>
                            <Alert 
                              severity={summary.totalNotFound > 0 ? "warning" : "success"} 
                              sx={{ mb: 2 }}
                            >
                              <Typography variant="body2">
                                <strong>Summary:</strong> {summary.totalUpdated} orders updated successfully
                                {summary.totalNotFound > 0 && `, ${summary.totalNotFound} orders not found in the system`}
                              </Typography>
                            </Alert>
                            
                            {summary.totalUpdated > 0 && (
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                  <CheckCircleIcon sx={{ mr: 1, fontSize: 18 }} />
                                  Updated Orders ({summary.totalUpdated}):
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {summary.allUpdatedOrders.map((order, idx) => (
                                    <Chip 
                                      key={idx} 
                                      label={`${order.key_ref} ($${order.income.toLocaleString()})`}
                                      size="small" 
                                      color="success" 
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            
                            {summary.totalNotFound > 0 && (
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                  <WarningIcon sx={{ mr: 1, fontSize: 18 }} />
                                  Orders Not Found in System ({summary.totalNotFound}):
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                  These orders were found in the PDFs but don't exist in the system.
                                </Typography>
                                <Box sx={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                                  gap: 0.5,
                                  maxHeight: 200,
                                  overflow: 'auto',
                                  p: 1,
                                  border: '1px solid',
                                  borderColor: 'grey.300',
                                  borderRadius: 1,
                                  backgroundColor: 'grey.50'
                                }}>
                                  {summary.allNotFoundOrders.map((order, idx) => (
                                    <Chip 
                                      key={idx} 
                                      label={order} 
                                      size="small" 
                                      color="warning" 
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        );
                      })()}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Detailed Results */}
                    <Typography variant="subtitle1" mb={2}>File Processing Details:</Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {ocrResults.map((result, idx) => (
                        <Box key={idx} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {result.success ? (
                              <CheckCircleIcon sx={{ color: 'success.main', mr: 1, fontSize: 18 }} />
                            ) : (
                              <ErrorIcon sx={{ color: 'error.main', mr: 1, fontSize: 18 }} />
                            )}
                            <Typography variant="body2" fontWeight="medium">
                              {result.name}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {result.message}
                          </Typography>
                          
                          {result.success && result.data && (
                            <Box sx={{ ml: 3 }}>
                              <Typography variant="caption" color="success.main">
                                ✓ {result.data.total_updated || 0} orders updated
                              </Typography>
                              {(result.data.total_not_found || 0) > 0 && (
                                <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                                  ⚠ {result.data.total_not_found || 0} orders not found
                                </Typography>
                              )}
                              
                              {/* Show updated orders for this file */}
                              {result.data.updated_orders && result.data.updated_orders.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">Updated:</Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {result.data.updated_orders.map((order, orderIdx) => (
                                      <Chip 
                                        key={orderIdx}
                                        label={`${order.key_ref} ($${order.income})`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ fontSize: '0.65rem', height: 20 }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* Show not found orders for this file */}
                              {result.data.not_found_orders && result.data.not_found_orders.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">Not found:</Typography>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: 0.3, 
                                    mt: 0.5,
                                    maxHeight: 60,
                                    overflow: 'auto'
                                  }}>
                                    {result.data.not_found_orders.slice(0, 10).map((order, orderIdx) => (
                                      <Chip 
                                        key={orderIdx}
                                        label={order}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                        sx={{ fontSize: '0.6rem', height: 18 }}
                                      />
                                    ))}
                                    {result.data.not_found_orders.length > 10 && (
                                      <Chip 
                                        label={`+${result.data.not_found_orders.length - 10} more`}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                        sx={{ fontSize: '0.6rem', height: 18 }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          setOcrDialogOpen(false);
                          setOcrFiles([]);
                          setOcrResults([]);
                          setOcrLoading(false);
                        }}
                      >
                        Done
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setOcrFiles([]);
                          setOcrResults([]);
                        }}
                      >
                        Process More Files
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          )}
        </>
      )}

      {/* 🆕 Dialog final para mostrar el resultado DOCAi */}
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


