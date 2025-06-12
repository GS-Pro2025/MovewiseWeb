/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
} from "material-react-table";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import PaymentIcon from "@mui/icons-material/AttachMoney";
import { SummaryCostRepository, updateOrder } from "../data/SummaryCostRepository";
import type { OrderSummary } from "../domain/OrderSummaryModel";
import PaymentDialog from "./PaymentDialog";
import { UpdateOrderData } from "../domain/ModelOrderUpdate";
import { enqueueSnackbar } from "notistack";


const FinancialView = () => {
  const repository = new SummaryCostRepository();
  const [data, setData] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState(false);

  // Estado para PaymentDialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<UpdateOrderData | null>(null);
  const handlePay = useCallback((order: OrderSummary) => {
    setPaymentOrder({
      key: order.key,
      expense: order.summary?.expense ?? 0,
      income: order.income ?? 0,
      payStatus: order.payStatus,
    } as UpdateOrderData);
    setPaymentDialogOpen(true);
  }, []);
const columns: MRT_ColumnDef<OrderSummary>[] = [
  { accessorKey: "key_ref", header: "Reference" },
  { accessorKey: "client", header: "Customer" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "state", header: "State" },
  { accessorKey: "income", header: "Income" },
  {
    accessorKey: "summary.expense",
    header: "Expense",
    Cell: ({ row }) => row.original.summary?.expense ?? 0,
  },
  {
    accessorKey: "summary.rentingCost",
    header: "Renting Cost",
    Cell: ({ row }) => row.original.summary?.rentingCost ?? 0,
  },
  {
    accessorKey: "summary.fuelCost",
    header: "Fuel Cost",
    Cell: ({ row }) => row.original.summary?.fuelCost ?? 0,
  },
  {
    accessorKey: "summary.workCost",
    header: "Work Cost",
    Cell: ({ row }) => row.original.summary?.workCost ?? 0,
  },
  {
    accessorKey: "summary.driverSalaries",
    header: "Driver Salaries",
    Cell: ({ row }) => row.original.summary?.driverSalaries ?? 0,
  },
  {
    accessorKey: "summary.otherSalaries",
    header: "Other Salaries",
    Cell: ({ row }) => row.original.summary?.otherSalaries ?? 0,
  },
  {
    accessorKey: "summary.totalCost",
    header: "Total Cost",
    Cell: ({ row }) => row.original.summary?.totalCost ?? 0,
  },
  {
    header: "Paystatus",
    accessorKey: "payStatus",
    Cell: ({ row }) => {
      const value = row.original.payStatus;
      const color = value === 1 ? "green" : "red";
      return (
        <Typography sx={{ color, fontWeight: 600 }}>
          {value === 1 ? "Paid" : "Unpaid"}
        </Typography>
      );
    },
    size: 120,
  },
  {
    header: "Pay",
    id: "pay",
    size: 120,
    Cell: ({ row }: { row: MRT_Row<OrderSummary> }) => {
      const isPaid = row.original.payStatus === 1;
      return (
        <Button
          size="small"
          color="success"
          startIcon={<PaymentIcon />}
          disabled={isPaid}
          onClick={() => handlePay(row.original)}
        >
          Pay
        </Button>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];



// Agrupa las órdenes por key_ref y suma los valores numéricos
function groupByKeyRef(data: OrderSummary[]): OrderSummary[] {
  const map = new Map<string, OrderSummary>();
  data.forEach((item) => {
    if (!map.has(item.key_ref)) {
      map.set(item.key_ref, { ...item });
    } else {
      const existing = map.get(item.key_ref)!;
      existing.income += item.income;
      if (existing.summary && item.summary) {
        existing.summary.expense += item.summary.expense;
        existing.summary.rentingCost += item.summary.rentingCost;
        existing.summary.fuelCost += item.summary.fuelCost;
        existing.summary.workCost += item.summary.workCost;
        existing.summary.driverSalaries += item.summary.driverSalaries;
        existing.summary.otherSalaries += item.summary.otherSalaries;
        existing.summary.totalCost += item.summary.totalCost;
      }
    }
  });
  return Array.from(map.values());
}


  
  const fetchData = async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    console.log("rowCount", rowCount);
    try {
      const result = await repository.getSummaryCost(pageNumber + 1);
      setData(result.results);
      setRowCount(result.count);
    } catch (err: any) {
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filteredData = useMemo(
    () => (groupBy ? groupByKeyRef(data) : data),
    [data, groupBy]
  );
    function mapTableDataToUpdateOrderData(paymentOrder: UpdateOrderData): any {
        // Map only the fields relevant for updating the order
        return {
            key: paymentOrder.key,
            expense: paymentOrder.expense,
            income: paymentOrder.income,
            payStatus: paymentOrder.payStatus,
            // Add other fields if needed for the update API
        };
    }

  // Handler para confirmar el pago
  async function handleConfirmPayment(expense: number, income: number) {
       if (!expense) return;
       if (!paymentOrder) return;
       paymentOrder.expense = expense;
       paymentOrder.income = income;
       await updateOrder(paymentOrder.key, {
         ...mapTableDataToUpdateOrderData(paymentOrder),
         expense,
         income,
         payStatus: 1, 
       });
       enqueueSnackbar('Payment registered', { variant: 'success' });
       fetchData(1); // refresca la tabla
       setPaymentDialogOpen(false);
       setPaymentOrder(null);
  }

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    manualPagination: true,
    rowCount: filteredData.length,
    state: { isLoading: loading, pagination: { pageIndex: page, pageSize: 10 } },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex: page, pageSize: 10 });
        setPage(newState.pageIndex);
      } else {
        setPage(updater.pageIndex);
      }
    },
    enableColumnResizing: true,
    enableStickyHeader: true,
    muiTableContainerProps: { sx: { maxHeight: 600 } },
  });

  return (
    <>
      <Box p={2}>
        <Typography variant="h5" gutterBottom>
          Cost Summary
        </Typography>
        <Box mb={2}>
          <label>
            <input
              type="checkbox"
              checked={groupBy}
              onChange={() => setGroupBy((v) => !v)}
              style={{ marginRight: 8 }}
            />
            Group by Reference
          </label>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <MaterialReactTable table={table} />
        )}
      </Box>
      <PaymentDialog
        open={paymentDialogOpen}
        expense={paymentOrder?.expense ?? 0}
        income={paymentOrder?.income ?? 0}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={handleConfirmPayment}
      />
    </>
  );
};

export default FinancialView;


