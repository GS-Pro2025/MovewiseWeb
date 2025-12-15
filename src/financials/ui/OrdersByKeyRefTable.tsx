/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Typography, Menu, MenuItem, Divider } from "@mui/material";
import type { OrderSummary } from "../domain/OrderSummaryModel";
import PaymentDialog from "../../Home/ui/PaymentDialog";
import { updateOrder } from "../data/SummaryCostRepository";
import { enqueueSnackbar } from "notistack";
import { UpdatePaymentData } from "../domain/ModelOrderUpdate";
import PaymentIcon from "@mui/icons-material/AttachMoney";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";

interface OrdersByKeyRefTableProps {
  orders: OrderSummary[];
  keyRef: string;
  onOrderPaid?: () => void;
  onViewOperators: (orderId: string) => void;
}

const OrdersByKeyRefTable = ({ orders, keyRef, onOrderPaid, onViewOperators }: OrdersByKeyRefTableProps) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    order: OrderSummary | null;
  } | null>(null);

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
    if (onOrderPaid) onOrderPaid();
  };

  const handleContextMenu = (event: React.MouseEvent, order: OrderSummary) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      order,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const ViewOperatorsButton = ({ orderId }: { orderId: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onViewOperators(orderId);
      }}
      className="p-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
      style={{
        color: '#0B2863',
        borderColor: '#0B2863',
        backgroundColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#0B2863';
        e.currentTarget.style.color = '#ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#0B2863';
      }}
      title="View Operators"
    >
      <VisibilityIcon sx={{ fontSize: 18 }} />
    </button>
  );

  const PayButton = ({ order }: { order: OrderSummary }) => {
    const isPaid = order.payStatus === 1;
    return (
      <button
        onClick={() => handlePayClick(order)}
        disabled={isPaid}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          isPaid
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md hover:-translate-y-0.5'
        }`}
      >
        <PaymentIcon sx={{ fontSize: 16 }} />
        Pay
      </button>
    );
  };

  const PayStatusChip = ({ status }: { status: number }) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
        status === 1 
          ? 'bg-green-500 text-white' 
          : 'text-white'
      }`}
      style={{
        backgroundColor: status === 1 ? '#22c55e' : '#FFE67B',
        color: status === 1 ? '#ffffff' : '#0B2863'
      }}
    >
      {status === 1 ? 'Paid' : 'Unpaid'}
    </span>
  );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #0B2863' }}>
        <Typography 
          variant="h6" 
          className="!font-bold !flex !items-center !gap-2"
          style={{ color: '#0B2863' }}
        >
          📋 Reference: <span style={{ color: '#FFE67B', backgroundColor: '#0B2863', padding: '4px 12px', borderRadius: '8px' }}>{keyRef}</span>
        </Typography>
      </div>

      {/* Table Container */}
      <div 
        className="rounded-xl shadow-lg border-2 bg-white overflow-auto max-h-96"
        style={{ borderColor: '#0B2863' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: '#0B2863' }}>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Operators
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Income
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Total Cost
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Fuel Cost
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Bonus
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {orders.map((order, index) => (
                <tr 
                  key={order.key}
                  className="transition-colors duration-200 border-b border-gray-200 cursor-context-menu"
                  style={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                  }}
                  onContextMenu={(e) => handleContextMenu(e as any, order)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e0f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                  }}
                >
                  {/* Operators */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ViewOperatorsButton orderId={order.key} />
                    </div>
                  </td>

                  {/* Order ID */}
                  <td className="px-4 py-3">
                    <Typography 
                      variant="body2" 
                      className="!font-semibold !truncate !max-w-[120px]"
                      style={{ color: '#0B2863' }}
                      title={order.key}
                    >
                      {order.key}
                    </Typography>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    <Typography 
                      variant="body2" 
                      className="!font-medium"
                      style={{ color: '#0B2863' }}
                    >
                      {order.date}
                    </Typography>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3">
                    <Typography 
                      variant="body2" 
                      className="!font-medium !truncate !max-w-[150px]"
                      style={{ color: '#0B2863' }}
                      title={order.state}
                    >
                      {order.state}
                    </Typography>
                  </td>

                  {/* Income */}
                  <td className="px-4 py-3">
                    <Typography 
                      variant="body2" 
                      className="!font-bold"
                      style={{ color: '#22c55e' }}
                    >
                      ${order.income?.toLocaleString() || 0}
                    </Typography>
                  </td>

                  {/* Total Cost */}
                  <td className="px-4 py-3">
                    <Typography 
                      variant="body2" 
                      className="!font-bold"
                      style={{ color: '#000000' }}
                    >
                      ${order.summary?.totalCost?.toLocaleString() || 0}
                    </Typography>
                  </td>

                  {/* Fuel Cost */}
                  <td className="px-4 py-3">
                    <Typography 
                      variant="body2" 
                      className="!font-bold"
                      style={{ color: '#000000' }}
                    >
                      ${order.summary?.fuelCost?.toLocaleString() || 0}
                    </Typography>
                  </td>

                  {/* Bonus */}
                  <td className="px-4 py-3">
                    <Typography 
                      variant="body2" 
                      className="!font-bold"
                      style={{ color: '#000000' }}
                    >
                      ${order.summary?.bonus?.toLocaleString() || 0}
                    </Typography>
                  </td>

                  {/* Pay Status */}
                  <td className="px-4 py-3">
                    <PayStatusChip status={order.payStatus} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <PayButton order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">📦</span>
              <Typography 
                variant="h6" 
                className="!font-semibold"
                style={{ color: '#0B2863' }}
              >
                No orders found
              </Typography>
              <Typography variant="body2" className="!text-gray-500">
                No orders available for this reference
              </Typography>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div 
        className="mt-4 p-3 rounded-lg flex justify-between items-center"
        style={{ backgroundColor: '#FFE67B' }}
      >
        <Typography 
          variant="body1" 
          className="!font-semibold"
          style={{ color: '#0B2863' }}
        >
          Total Orders: {orders.length}
        </Typography>
        <div className="flex gap-4">
          <Typography 
            variant="body2" 
            className="!font-medium"
            style={{ color: '#0B2863' }}
          >
            Paid: <span className="font-bold text-green-600">{orders.filter(o => o.payStatus === 1).length}</span>
          </Typography>
          <Typography 
            variant="body2" 
            className="!font-medium"
            style={{ color: '#0B2863' }}
          >
            Unpaid: <span className="font-bold">{orders.filter(o => o.payStatus === 0).length}</span>
          </Typography>
        </div>
      </div>

      {/* Context Menu */}
      <Menu
        open={!!contextMenu}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        onContextMenu={(e) => e.preventDefault()}
      >
        <MenuItem
          onClick={() => {
            if (contextMenu?.order) {
              setSelectedOrder(contextMenu.order);
              setPaymentDialogOpen(true);
            }
            handleCloseContextMenu();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: 'rgba(11, 40, 99, 0.1)'
            }
          }}
        >
          <TrendingUp size={18} style={{ color: '#0B2863' }} />
          <span>Add Income</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu?.order) {
              setSelectedOrder(contextMenu.order);
              setPaymentDialogOpen(true);
            }
            handleCloseContextMenu();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: 'rgba(11, 40, 99, 0.1)'
            }
          }}
        >
          <TrendingDown size={18} style={{ color: '#0B2863' }} />
          <span>Add Expense</span>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (contextMenu?.order) {
              onViewOperators(contextMenu.order.key);
            }
            handleCloseContextMenu();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: 'rgba(11, 40, 99, 0.1)'
            }
          }}
        >
          <Eye size={18} style={{ color: '#0B2863' }} />
          <span>View Operators</span>
        </MenuItem>
      </Menu>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        expense={selectedOrder?.summary?.expense ?? 0}
        income={selectedOrder?.income ?? 0}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
};

export default OrdersByKeyRefTable;