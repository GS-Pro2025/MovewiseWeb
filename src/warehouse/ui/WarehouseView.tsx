import { useEffect, useState, useMemo } from "react";
import { Box, Typography, CircularProgress, Button, TextField } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef, type MRT_Row } from "material-react-table";
import { fetchWorkhouseOrders, fetchOperatorsInOrder } from "../data/WarehouseRepository";
import type { WorkhouseOrderData } from "../domain/WarehouseModel";
import {OperatorAssigned} from "../domain/OperatorModels";
import { enqueueSnackbar } from "notistack";
import OperatorsTable from "../../Home/ui/operatorsTable"; 
import EditOrderDialog from "../../Home/ui/editOrderModal"; 
import { parseWarehouseToUpdateOrder } from "../data/parseWarehouse";
import { updateOrder } from "../../Home/data/repositoryOrders"; 
import WeekPicker from "../../components/WeekPicker";
import type { UpdateOrderData } from "../../Home/domain/ModelOrderUpdate";

const PAGE_SIZE = 10;

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((now.getTime() - start.getTime()) / 604800000);
};

const WarehouseView = () => {
  const [orders, setOrders] = useState<WorkhouseOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowCount, setRowCount] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [operatorsByOrder, setOperatorsByOrder] = useState<Record<string, OperatorAssigned[]>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<UpdateOrderData | null>(null);

  
  const [week, setWeek] = useState(getCurrentWeek());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetchWorkhouseOrders(page, PAGE_SIZE, week, year)
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
  }, [page, week, year]);

  const columns = useMemo<MRT_ColumnDef<WorkhouseOrderData>[]>(
    () => [
      {
        header: "Actions",
        id: "actions",
        size: 160,
        headerProps: { style: { textAlign: 'center' } },
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={e => {
                e.stopPropagation();
                handleEditOrder(row.original);
              }}
              size="small"
              color="primary"
              startIcon={<EditIcon />}
            >
              Editar
            </Button>
          </Box>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      { accessorKey: "key_ref", header: "Reference", size: 120 },
      { accessorKey: "date", header: "Date", size: 120 },
      { accessorKey: "status", header: "Status", size: 100 },
      { accessorKey: "customer_factory_name", header: "Customer Factory", size: 160 },
      {
        accessorKey: "payStatus",
        header: "Pay Status",
        size: 100,
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
        },
      },
      { accessorKey: "income", header: "Income", size: 100 },
      { accessorKey: "expense", header: "Expense", size: 100 },
      { accessorKey: "job_name", header: "Job", size: 120 },
      { accessorKey: "state_usa", header: "Location", size: 80 },

    ],
    []
  );

  // Nuevo: cargar operadores al expandir una orden
  const handleRowExpand = async (orderKey: string) => {
    // Si ya está expandida, colapsa
    setExpandedRowId((prev) => (prev === orderKey ? null : orderKey));
    // Si aún no se han cargado los operadores de esta orden, haz el fetch
    if (!operatorsByOrder[orderKey]) {
      try {
        const assignedOperators = await fetchOperatorsInOrder(orderKey);
        setOperatorsByOrder((prev) => ({ ...prev, [orderKey]: assignedOperators }));
      } catch (err) {
        console.error("Error loading operators for order:", err);
        enqueueSnackbar("Error loading operators for order", { variant: "error" });
      }
    }
  };

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
      const nextPage =
        typeof updater === "function"
          ? updater({ pageIndex: page - 1, pageSize: PAGE_SIZE })
          : updater;
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
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowExpand(row.original.key),
      sx: { cursor: "pointer" },
    }),
    renderDetailPanel: ({ row }: { row: MRT_Row<WorkhouseOrderData> }) =>
      expandedRowId === row.original.key ? (
        <Box
          sx={{
            p: 3,
            bgcolor: "#ffffff",
            borderRadius: 2,
            boxShadow: 3,
            border: "1px solid #e0e0e0",
          }}
        >
          <OperatorsTable
            operators={
              (operatorsByOrder[row.original.key] || []).map(op => ({
                ...op,
                date: op.assigned_at ?? '',    
                bonus:  0,     // To review
                role: op.rol ?? '', 
              }))
            }
            orderKey={row.original.key}
          />
        </Box>
      ) : null,
  }
  );

  // Cuando abres el modal, parsea a UpdateOrderData:
  const handleEditOrder = (order: WorkhouseOrderData) => {
    setOrderToEdit(parseWarehouseToUpdateOrder(order));
    setEditDialogOpen(true);
  };

  // Cuando guardas la edición:
  const handleSaveEdit = async (key: string, order: UpdateOrderData) => {
    try {
      const result = await updateOrder(key, order);
      if (result.success) {
        enqueueSnackbar('Order updated', { variant: 'success' });
        // Refresca la tabla
        fetchWorkhouseOrders(page, PAGE_SIZE, week, year)
          .then((data) => {
            setOrders(data.results);
            setRowCount(data.count);
          })
          .catch((err) => {
            console.error("Error reloading warehouse orders:", err);
            enqueueSnackbar("Error reloading orders", { variant: "error" });
          })
          .finally(() => setLoading(false));
      } else {
        enqueueSnackbar(`Sorry there was an error updating the order: ${result.errorMessage}`, { variant: 'error' });
      }
    } catch (e) {
      console.error("Error updating order:", e);
      enqueueSnackbar('Sorry there was an error updating the order', { variant: 'error' });
    }
    setEditDialogOpen(false);
    setOrderToEdit(null);
  };

  // Para manejar los cambios en el modal:
  const handleChangeOrder = (field: keyof UpdateOrderData | `person.${string}`, value: unknown) => {
    if (!orderToEdit) return;
    if (field.startsWith('person.')) {
      const personField = field.split('.')[1];
      setOrderToEdit({
        ...orderToEdit,
        person: {
          ...orderToEdit.person,
          [personField]: value,
        },
      });
    } else {
      setOrderToEdit({
        ...orderToEdit,
        [field]: value,
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Warehouse Orders
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Here you can find all the warehouse orders registered in the system.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Box sx={{ position: 'relative', overflow: 'visible', minWidth: 160 }}>
          <WeekPicker
            week={week}
            onWeekSelect={(w) => setWeek(w)}
            min={1}
            max={53}
            className=""
          />
        </Box>
        <TextField
          label="Year"
          type="number"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          inputProps={{ min: 2020, max: 2100 }}
          size="small"
        />
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <MaterialReactTable table={table} />
      )}
      <EditOrderDialog
        open={editDialogOpen}
        order={orderToEdit}
        onClose={() => {
          setEditDialogOpen(false);
          setOrderToEdit(null);
        }}
        onSave={(order) => handleSaveEdit(order.key, order)}
        onChange={handleChangeOrder}
      />
    </Box>
  );
};

export default WarehouseView;