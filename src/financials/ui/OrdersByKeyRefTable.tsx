/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Menu, MenuItem, Divider } from "@mui/material";
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
    const updatedOrder: UpdatePaymentData = { expense, income, payStatus: 1 };
    await updateOrder(selectedOrder.key, updatedOrder);
    setSelectedOrder(null);
    enqueueSnackbar('Payment registered', { variant: 'success' });
    setPaymentDialogOpen(false);
    if (onOrderPaid) onOrderPaid();
  };

  const handleContextMenu = (event: React.MouseEvent, order: OrderSummary) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4, order });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  // ── Shared cell class ──
  const td = "px-2 py-1.5 text-[11px] text-gray-700 whitespace-nowrap";
  const th = "px-2 py-2 text-left text-[10px] font-semibold text-white uppercase tracking-wide whitespace-nowrap";

  return (
    <div>
      {/* Compact header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Ref:</span>
        <span className="text-[11px] font-bold text-[#0B2863] bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
          {keyRef}
        </span>
        <span className="ml-auto text-[10px] text-gray-400">{orders.length} orders</span>
      </div>

      {/* Table */}
      <div className="rounded border border-gray-200 bg-white overflow-auto max-h-72">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0B2863]">
              <th className={th}>Ops</th>
              <th className={th}>Date</th>
              <th className={th}>Location</th>
              <th className={`${th} text-right`}>Income</th>
              <th className={`${th} text-right`}>Total Cost</th>
              <th className={`${th} text-right`}>Fuel</th>
              <th className={`${th} text-right`}>Bonus</th>
              <th className={th}>Status</th>
              <th className={th}>Pay</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order.key}
                className="border-b border-gray-100 transition-colors cursor-context-menu"
                style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                onContextMenu={(e) => handleContextMenu(e as any, order)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f6ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb'; }}
              >
                {/* Operators button */}
                <td className={td}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewOperators(order.key); }}
                    className="p-1 rounded border border-[#0B2863] text-[#0B2863] hover:bg-[#0B2863] hover:text-white transition-colors"
                    title="View Operators"
                  >
                    <VisibilityIcon sx={{ fontSize: 13 }} />
                  </button>
                </td>

                {/* Date */}
                <td className={td}>{order.date}</td>

                {/* Location */}
                <td className={td}>
                  <span className="truncate max-w-[120px] block" title={order.state}>
                    {order.state}
                  </span>
                </td>

                {/* Income */}
                <td className={`${td} text-right font-semibold text-green-600`}>
                  ${order.income?.toLocaleString() || 0}
                </td>

                {/* Total Cost */}
                <td className={`${td} text-right`}>
                  ${order.summary?.totalCost?.toLocaleString() || 0}
                </td>

                {/* Fuel */}
                <td className={`${td} text-right`}>
                  ${order.summary?.fuelCost?.toLocaleString() || 0}
                </td>

                {/* Bonus */}
                <td className={`${td} text-right`}>
                  ${order.summary?.bonus?.toLocaleString() || 0}
                </td>

                {/* Status */}
                <td className={td}>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium
                    ${order.payStatus === 1
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-amber-50 text-amber-700 border border-amber-300'}`}>
                    {order.payStatus === 1 ? 'Paid' : 'Unpaid'}
                  </span>
                </td>

                {/* Pay button */}
                <td className={td}>
                  <button
                    onClick={() => handlePayClick(order)}
                    disabled={order.payStatus === 1}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-colors
                      ${order.payStatus === 1
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white'}`}
                  >
                    <PaymentIcon sx={{ fontSize: 11 }} />
                    Pay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <span className="text-2xl mb-1">📦</span>
            <p className="text-[11px]">No orders for this reference</p>
          </div>
        )}
      </div>

      {/* Compact footer */}
      {orders.length > 0 && (
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <span className="text-[10px] text-gray-400">
            <span className="text-green-600 font-semibold">{orders.filter(o => o.payStatus === 1).length}</span> paid
          </span>
          <span className="text-[10px] text-gray-400">
            <span className="text-amber-600 font-semibold">{orders.filter(o => o.payStatus === 0).length}</span> unpaid
          </span>
          <span className="ml-auto text-[10px] font-semibold text-gray-600">
            Total income: <span className="text-green-600">${orders.reduce((s, o) => s + (o.income ?? 0), 0).toLocaleString()}</span>
          </span>
        </div>
      )}

      {/* Context Menu */}
      <Menu
        open={!!contextMenu}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        onContextMenu={(e) => e.preventDefault()}
        PaperProps={{ sx: { minWidth: 150, borderRadius: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } }}
      >
        <MenuItem
          dense
          onClick={() => {
            if (contextMenu?.order) { setSelectedOrder(contextMenu.order); setPaymentDialogOpen(true); }
            handleCloseContextMenu();
          }}
          sx={{ fontSize: '0.72rem', gap: 1, '&:hover': { backgroundColor: 'rgba(11,40,99,0.08)' } }}
        >
          <TrendingUp size={13} color="#0B2863" /> Add Income
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            if (contextMenu?.order) { setSelectedOrder(contextMenu.order); setPaymentDialogOpen(true); }
            handleCloseContextMenu();
          }}
          sx={{ fontSize: '0.72rem', gap: 1, '&:hover': { backgroundColor: 'rgba(11,40,99,0.08)' } }}
        >
          <TrendingDown size={13} color="#6b7280" /> Add Expense
        </MenuItem>
        <Divider />
        <MenuItem
          dense
          onClick={() => {
            if (contextMenu?.order) onViewOperators(contextMenu.order.key);
            handleCloseContextMenu();
          }}
          sx={{ fontSize: '0.72rem', gap: 1, '&:hover': { backgroundColor: 'rgba(11,40,99,0.08)' } }}
        >
          <Eye size={13} color="#0B2863" /> View Operators
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