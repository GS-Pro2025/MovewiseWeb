/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { SummaryCostRepository } from "../data/SummaryCostRepository";
import type { OrderSummary } from "../domain/OrderSummaryModel";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import OrdersByKeyRefTable from "./OrdersByKeyRefTable";

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

const FinancialView = () => {
  const repository = new SummaryCostRepository();
  const [data, setData] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  const fetchData = async (pageNumber: number) => {
    setLoading(true);
    setError(null);
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

  const superOrders = useMemo(() => groupByKeyRef(data), [data]);

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
      
      { accessorKey: "totalIncome", header: "Income" },
      { accessorKey: "totalCost", header: "Total Cost" },
      { accessorKey: "expense", header: "Expense" },
      { accessorKey: "fuelCost", header: "Fuel Cost" },
      { accessorKey: "workCost", header: "Work Cost" },
      { accessorKey: "driverSalaries", header: "Driver Salaries" },
      { accessorKey: "otherSalaries", header: "Operator Salaries" },
      { accessorKey: "client", header: "Client" },
    ],
    []
  );

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Financial Summary
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <MaterialReactTable
          columns={columns}
          data={superOrders}
          enableStickyHeader
          muiTableContainerProps={{ sx: { maxHeight: 600 } }}
          renderDetailPanel={({ row }) => (
            <OrdersByKeyRefTable
              orders={row.original.orders}
              keyRef={row.original.key_ref}
              onOrderPaid={() => fetchData(page)}
            />
          )}
        />
      )}
    </Box>
  );
};

export default FinancialView;


