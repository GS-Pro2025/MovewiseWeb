import { useState } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import type { OrderSummary } from "../domain/OrderSummaryModel";
import PaymentDialog from "../../Home/ui/PaymentDialog";
import { updateOrder } from "../data/SummaryCostRepository";
import { enqueueSnackbar } from "notistack";
import { UpdatePaymentData } from "../domain/ModelOrderUpdate";
import PaymentIcon from "@mui/icons-material/AttachMoney";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface OrdersByKeyRefTableProps {
  orders: OrderSummary[];
  keyRef: string;
  onOrderPaid?: () => void;
  onViewOperators: (orderId: string) => void; // Nueva prop añadida
}

const OrdersByKeyRefTable = ({ orders, keyRef, onOrderPaid, onViewOperators }: OrdersByKeyRefTableProps) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);

  const handlePayClick = (order: OrderSummary) => {
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async (expense: number, income: number) => {
    if (!selectedOrder) return;
    const updatedOrder: UpdatePaymentData = {
      expense: expense,
      income: income,
      payStatus: 1,
    };
    await updateOrder(selectedOrder.key, updatedOrder);
    setSelectedOrder(null);
    enqueueSnackbar('Payment registered', { variant: 'success' });
    setPaymentDialogOpen(false);
    if (onOrderPaid) onOrderPaid(); // Notifica al padre para refrescar
  };

  const columns: MRT_ColumnDef<OrderSummary>[] = [
    {
      header: "Operators",
      id: "operators",
      size: 80,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onViewOperators(row.original.key);
            }}
            title="View Operators"
            sx={{
              minWidth: 0,
              px: 1,
              py: 0.5,
              fontSize: 18,
              fontWeight: 'bold',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    { accessorKey: "key", header: "Order ID" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "state", header: "Location" },
    { accessorKey: "income", header: "Income" },
    {
      accessorKey: "summary.totalCost",
      header: "Total Cost",
      Cell: ({ row }) => row.original.summary?.totalCost ?? 0,
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
      header: "Actions",
      id: "actions",
      size: 120,
      Cell: ({ row }) => {
        const isPaid = row.original.payStatus === 1;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PaymentIcon />}
              disabled={isPaid}
              onClick={() => handlePayClick(row.original)}
            >
              Pay
            </Button>
          </Box>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Reference: <b>{keyRef}</b>
      </Typography>
      <MaterialReactTable
        columns={columns}
        data={orders}
        enableStickyHeader
        muiTableContainerProps={{ sx: { maxHeight: 400 } }}
        enablePagination={false}
        enableSorting={false}
        enableColumnFilters={false}
        enableTopToolbar={false}
        enableBottomToolbar={false}
      />
      <PaymentDialog
        open={paymentDialogOpen}
        expense={selectedOrder?.summary?.expense ?? 0}
        income={selectedOrder?.income ?? 0}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={handleConfirmPayment}
      />
    </Box>
  );
};

export default OrdersByKeyRefTable;