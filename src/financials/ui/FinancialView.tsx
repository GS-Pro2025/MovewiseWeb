/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Typography, CircularProgress, TextField, Button } from "@mui/material";
import { SummaryCostRepository, payByKey_ref } from "../data/SummaryCostRepository";
import type { OrderSummary } from "../domain/OrderSummaryModel";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import OrdersByKeyRefTable from "./OrdersByKeyRefTable";
import PaymentDialog from "./PaymentDialog";
import PaymentIcon from "@mui/icons-material/AttachMoney";
import { enqueueSnackbar } from "notistack";

interface SuperOrder {
  key_ref: string;
  orders: OrderSummary[];
  client: string;
  expense: number;
  fuelCost: number;
  workCost: number;
  driverSalaries: number;
  otherSalaries: number;
  totalIncome: number;
  totalCost: number;
  totalProfit: number;
  payStatus: number;
}

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
            renderDetailPanel={({ row }) => (
              <OrdersByKeyRefTable
                orders={row.original.orders}
                keyRef={row.original.key_ref}
                onOrderPaid={() => fetchData(page, week)}
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
        </>
      )}
    </Box>
  );
};

export default FinancialView;


