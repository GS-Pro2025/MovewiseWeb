/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { fetchWorkhouseOrders } from "../data/WarehouseRepository";
import type { WorkhouseOrderData } from "../domain/WarehouseModel";
import { enqueueSnackbar } from "notistack";

const PAGE_SIZE = 10;

  const WarehouseView = () => {
    const [orders, setOrders] = useState<WorkhouseOrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowCount, setRowCount] = useState(0);
  useEffect(() => {
    setLoading(true);
    fetchWorkhouseOrders(page, PAGE_SIZE)
      .then((data) => {
        setOrders(data.results);
        setRowCount(data.count);
        if (data.count === 0) {
          enqueueSnackbar("No orders found", { variant: "info" });
        }
      })
      .catch((err) => {
        console.error("Error loading warehouse orders:", err);
        enqueueSnackbar("Error loading orders", { variant: "error" });
        setOrders([]);
        setRowCount(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page]);

  const columns = useMemo<MRT_ColumnDef<WorkhouseOrderData>[]>(
    () => [
      { accessorKey: "key_ref", header: "Reference", size: 120 },
      { accessorKey: "date", header: "Date", size: 120 },
      { accessorKey: "status", header: "Status", size: 100 },
      { accessorKey: "payStatus", header: "Pay Status", size: 100,
        Cell: ({ cell }) => {
          const value = cell.getValue<number>();
          return (
            <span
              style={{
                color: value === 1 ? "#4caf50" : "#f44336",
                padding: "4px 12px",
                borderRadius: "16px",
                fontWeight: 600,
                display: "inline-block",
                minWidth: 60,
                textAlign: "center",
              }}
            >
              {value === 1 ? "Paid" : "Unpaid"}
            </span>
          );
        }
      },
      { accessorKey: "income", header: "Income", size: 100 },
      { accessorKey: "expense", header: "Expense", size: 100 },
      { accessorKey: "weight", header: "Weight", size: 100 },
      { accessorKey: "distance", header: "Distance", size: 100 },
      { accessorKey: "job_name", header: "Job", size: 120 },
      { accessorKey: "customer_factory_name", header: "Customer Factory", size: 160 },
      { accessorKey: "state_usa", header: "State", size: 80 },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: orders,
    enableRowSelection: false,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    rowCount,
    manualPagination: true,
    onPaginationChange: (updater) => {
      const nextPage = typeof updater === "function" ? updater({ pageIndex: page - 1, pageSize: PAGE_SIZE }) : updater;
      setPage(nextPage.pageIndex + 1);
    },
    state: { pagination: { pageIndex: page - 1, pageSize: PAGE_SIZE } },
    muiTablePaperProps: {
      sx: { borderRadius: 3, boxShadow: 4, mt: 2 },
    },
    muiTableHeadCellProps: {
      sx: { fontWeight: 700, fontSize: 16, bgcolor: "#f5f5f5" },
    },
    muiTableBodyCellProps: {
      sx: { fontSize: 15 },
    },
    initialState: { pagination: { pageSize: PAGE_SIZE, pageIndex: 0 } },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Workhouse Orders
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Here you can find all the workhouse orders registered in the system.
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <MaterialReactTable table={table} />
      )}
    </Box>
  );
};

export default WarehouseView;