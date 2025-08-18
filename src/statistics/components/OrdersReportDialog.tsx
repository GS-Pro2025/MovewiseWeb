import React from 'react';
import { OrderPaidUnpaidWeekRange } from '../domain/OrdersPaidUnpaidModels';
import { printOrdersReport } from './OrdersProfitReportPrint';

interface OrdersReportDialogProps {
  show: boolean;
  selectedWeek: number | null;
  year: number;
  paidOrders: OrderPaidUnpaidWeekRange[];
  unpaidOrders: OrderPaidUnpaidWeekRange[];
  onClose: () => void;
}

const OrdersReportDialog: React.FC<OrdersReportDialogProps> = ({
  show,
  selectedWeek,
  year,
  paidOrders,
  unpaidOrders,
  onClose,
}) => {
  if (!show || !selectedWeek) return null;

  const handlePrintReport = () => {
    printOrdersReport(selectedWeek, year, paidOrders, unpaidOrders);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            Orders Profit Report - Week {selectedWeek}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-print"></i>
              Print Report
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{paidOrders.length + unpaidOrders.length}</div>
            <div className="text-sm text-blue-600 font-medium">Total Orders</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{paidOrders.length}</div>
            <div className="text-sm text-green-600 font-medium">Paid Orders</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{unpaidOrders.length}</div>
            <div className="text-sm text-red-600 font-medium">Unpaid Orders</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {((paidOrders.length / (paidOrders.length + unpaidOrders.length)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-600 font-medium">Payment Rate</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Paid Orders Section */}
          <div>
            <h5 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
              <i className="fas fa-check-circle"></i>
              Paid Orders ({paidOrders.length})
            </h5>
            {paidOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                No paid orders for this week.
              </div>
            ) : (
              <div className="overflow-x-auto bg-green-50 rounded-lg">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-green-200">
                      <th className="text-left py-3 px-4 text-sm text-green-700 font-semibold">Order Ref</th>
                      <th className="text-left py-3 px-4 text-sm text-green-700 font-semibold">Client</th>
                      <th className="text-left py-3 px-4 text-sm text-green-700 font-semibold">Factory</th>
                      <th className="text-left py-3 px-4 text-sm text-green-700 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidOrders.map((order) => (
                      <tr key={order.key} className="border-b border-green-100 hover:bg-green-100">
                        <td className="py-3 px-4 text-sm text-blue-600 font-mono font-bold">{order.key_ref}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{order.client_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.customer_factory}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Unpaid Orders Section */}
          <div>
            <h5 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              Unpaid Orders ({unpaidOrders.length})
            </h5>
            {unpaidOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                No unpaid orders for this week.
              </div>
            ) : (
              <div className="overflow-x-auto bg-red-50 rounded-lg">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-red-200">
                      <th className="text-left py-3 px-4 text-sm text-red-700 font-semibold">Order Ref</th>
                      <th className="text-left py-3 px-4 text-sm text-red-700 font-semibold">Client</th>
                      <th className="text-left py-3 px-4 text-sm text-red-700 font-semibold">Factory</th>
                      <th className="text-left py-3 px-4 text-sm text-red-700 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidOrders.map((order) => (
                      <tr key={order.key} className="border-b border-red-100 hover:bg-red-100">
                        <td className="py-3 px-4 text-sm text-blue-600 font-mono font-bold">{order.key_ref}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{order.client_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.customer_factory}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersReportDialog;