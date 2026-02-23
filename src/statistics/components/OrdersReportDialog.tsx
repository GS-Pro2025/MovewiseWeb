import React from 'react';
import { useTranslation } from 'react-i18next';
import { OrderPaidUnpaidWeekRange } from '../domain/OrdersPaidUnpaidModels';
import { printOrdersReport, printUnpaidOrdersReport } from './OrdersProfitReportPrint';

interface OrdersReportDialogProps {
  show: boolean;
  selectedWeek: number | null;
  year: number;
  paidOrders: OrderPaidUnpaidWeekRange[];
  unpaidOrders: OrderPaidUnpaidWeekRange[];
  onClose: () => void;
}

const OrdersReportDialog: React.FC<OrdersReportDialogProps> = ({
  show, selectedWeek, year, paidOrders, unpaidOrders, onClose,
}) => {
  const { t } = useTranslation();

  if (!show || !selectedWeek) return null;

  const total = paidOrders.length + unpaidOrders.length;
  const paymentRate = total > 0
    ? ((paidOrders.length / total) * 100).toFixed(1)
    : '0.0';

  const tableHeaders = (
    color: string
  ) => ['table.orderRef', 'table.client', 'table.factory', 'table.date'].map(key => (
    <th key={key} className={`text-left py-3 px-4 text-sm font-semibold text-${color}-700`}>
      {t(`ordersReportDialog.${key}`)}
    </th>
  ));

  const orderRow = (
    order: OrderPaidUnpaidWeekRange,
    hoverColor: string,
    borderColor: string
  ) => (
    <tr key={order.key} className={`border-b border-${borderColor}-100 hover:bg-${hoverColor}-100`}>
      <td className="py-3 px-4 text-sm text-blue-600 font-mono font-bold">{order.key_ref}</td>
      <td className="py-3 px-4 text-sm text-gray-800">{order.client_name}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{order.customer_factory}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{order.date}</td>
    </tr>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            {t('ordersReportDialog.title', { week: selectedWeek })}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => printOrdersReport(selectedWeek, year, paidOrders, unpaidOrders)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-print"></i>
              {t('ordersReportDialog.printFull')}
            </button>
            {unpaidOrders.length > 0 && (
              <button
                onClick={() => printUnpaidOrdersReport(selectedWeek, year, unpaidOrders)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <i className="fas fa-exclamation-triangle"></i>
                {t('ordersReportDialog.printUnpaid')}
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { value: total,              label: t('ordersReportDialog.stats.totalOrders'),  bg: 'blue',   text: 'blue'   },
            { value: paidOrders.length,  label: t('ordersReportDialog.stats.paidOrders'),   bg: 'green',  text: 'green'  },
            { value: unpaidOrders.length,label: t('ordersReportDialog.stats.unpaidOrders'), bg: 'red',    text: 'red'    },
            { value: `${paymentRate}%`,  label: t('ordersReportDialog.stats.paymentRate'),  bg: 'purple', text: 'purple' },
          ].map(({ value, label, bg, text }) => (
            <div key={label} className={`bg-${bg}-50 rounded-lg p-4 text-center`}>
              <div className={`text-2xl font-bold text-${text}-600`}>{value}</div>
              <div className={`text-sm text-${text}-600 font-medium`}>{label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-6">

          {/* Paid Orders */}
          <div>
            <h5 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
              <i className="fas fa-check-circle"></i>
              {t('ordersReportDialog.paid.title', { count: paidOrders.length })}
            </h5>
            {paidOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                {t('ordersReportDialog.paid.empty')}
              </div>
            ) : (
              <div className="overflow-x-auto bg-green-50 rounded-lg">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-green-200">{tableHeaders('green')}</tr>
                  </thead>
                  <tbody>
                    {paidOrders.map(order => orderRow(order, 'green', 'green'))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Unpaid Orders */}
          <div>
            <h5 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {t('ordersReportDialog.unpaid.title', { count: unpaidOrders.length })}
              {unpaidOrders.length > 0 && (
                <button
                  onClick={() => printUnpaidOrdersReport(selectedWeek, year, unpaidOrders)}
                  className="ml-auto text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                >
                  <i className="fas fa-print mr-1"></i>
                  {t('ordersReportDialog.printUnpaid')}
                </button>
              )}
            </h5>
            {unpaidOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                {t('ordersReportDialog.unpaid.empty')}
              </div>
            ) : (
              <div className="overflow-x-auto bg-red-50 rounded-lg">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-red-200">{tableHeaders('red')}</tr>
                  </thead>
                  <tbody>
                    {unpaidOrders.map(order => orderRow(order, 'red', 'red'))}
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