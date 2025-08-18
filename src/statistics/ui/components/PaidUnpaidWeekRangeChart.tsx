/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePaidUnpaidData } from '../../hooks/usePaidUnpaidData';
import { getWeekRange, getAvailableYears } from '../../utils/dateUtils';
import { PaidUnpaidChartData, OrderPaidUnpaidWeekRange } from '../../domain/OrdersPaidUnpaidModels';
import OrdersReportDialog from '../../components/OrdersReportDialog';

interface PaidUnpaidWeekRangeChartProps {
  initialYear?: number;
  initialStartWeek?: number;
  initialEndWeek?: number;
}

const PaidUnpaidWeekRangeChart: React.FC<PaidUnpaidWeekRangeChartProps> = ({
  initialYear = new Date().getFullYear(),
  initialStartWeek = 1,
  initialEndWeek = 10
}) => {
  const {
    loading,
    error,
    chartData,
    rawData,
    year,
    startWeek,
    endWeek,
    pendingStartWeek,
    pendingEndWeek,
    setYear,
    setStartWeek,
    setEndWeek,
    setPendingStartWeek,
    setPendingEndWeek,
    loadPaidUnpaidData,
    handleTryAgain,
  } = usePaidUnpaidData(initialYear, initialStartWeek, initialEndWeek);

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  const handleStartWeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingStartWeek(Number(e.target.value));
  };

  const handleEndWeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingEndWeek(Number(e.target.value));
  };

  const handleStartWeekConfirm = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (pendingStartWeek >= 1 && pendingStartWeek <= 53) {
        setStartWeek(pendingStartWeek);
      }
    }
  };

  const handleEndWeekConfirm = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (pendingEndWeek >= 1 && pendingEndWeek <= 53) {
        setEndWeek(pendingEndWeek);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const range = getWeekRange(year, data.week);
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">
            Week {label} <span className="text-xs text-gray-500">({range.start} - {range.end})</span>
          </p>
          <div className="space-y-1">
            <p className="text-green-600">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Paid: {data.paid} ({data.paidPercentage.toFixed(1)}%)
            </p>
            <p className="text-red-600">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Unpaid: {data.unpaid} ({data.unpaidPercentage.toFixed(1)}%)
            </p>
            <p className="text-gray-700 font-medium">
              Total: {data.total} orders
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handler para click en barra
  const handleBarClick = (data: PaidUnpaidChartData) => {
    setSelectedWeek(data.week);
    setShowDialog(true);
  };

  // Obtener órdenes pagadas y no pagadas de la semana seleccionada
  const paidOrders: OrderPaidUnpaidWeekRange[] =
    selectedWeek && rawData
      ? rawData.orders_by_week[String(selectedWeek)]?.filter(o => o.paid) || []
      : [];

  const unpaidOrders: OrderPaidUnpaidWeekRange[] =
    selectedWeek && rawData
      ? rawData.orders_by_week[String(selectedWeek)]?.filter(o => !o.paid) || []
      : [];

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Chart Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleTryAgain}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              <i className="fas fa-chart-bar text-purple-600 mr-3"></i>
              Paid vs Unpaid Orders by Week
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Track payment status across week ranges
            </p>
            <p className="text-xs text-blue-600 mt-2">
              {(() => {
                const start = getWeekRange(year, startWeek).start;
                const end = getWeekRange(year, endWeek).end;
                return `Selected range: ${start} → ${end}`;
              })()}
            </p>
          </div>
          <button
            onClick={loadPaidUnpaidData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
            Refresh
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            >
              {getAvailableYears().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Start Week:</label>
            <input
              type="number"
              min="1"
              max="53"
              value={pendingStartWeek}
              onChange={handleStartWeekInput}
              onKeyDown={handleStartWeekConfirm}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">End Week:</label>
            <input
              type="number"
              min="1"
              max="53"
              value={pendingEndWeek}
              onChange={handleEndWeekInput}
              onKeyDown={handleEndWeekConfirm}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {rawData && (
            <div className="flex items-center gap-4 ml-auto text-sm">
              <span className="text-gray-600">
                Total: <span className="font-semibold">{rawData.total_paid + rawData.total_unpaid}</span>
              </span>
              <span className="text-green-600">
                Paid: <span className="font-semibold">{rawData.total_paid}</span>
              </span>
              <span className="text-red-600">
                Unpaid: <span className="font-semibold">{rawData.total_unpaid}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <i className="fas fa-spinner animate-spin text-purple-600 text-xl"></i>
            <span className="text-gray-600">Loading chart data...</span>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              onClick={(e: any) => {
                if (e && e.activeLabel) {
                  const weekData = chartData.find(w => w.week === e.activeLabel);
                  if (weekData) handleBarClick(weekData);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="week" 
                stroke="#6b7280"
                tickFormatter={(value) => `W${value}`}
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={({ x, y, payload }) => {
                  const range = getWeekRange(year, payload.value);
                  return (
                    <g>
                      <title>{`${range.start} - ${range.end}`}</title>
                      <text x={x} y={y + 10} textAnchor="middle" fill="#6b7280" fontSize={12}>
                        {`W${payload.value}`}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="paid" 
                stackId="orders"
                fill="#10b981" 
                name="Paid Orders"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="unpaid" 
                stackId="orders"
                fill="#ef4444" 
                name="Unpaid Orders"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dialog de órdenes */}
      <OrdersReportDialog
        show={showDialog}
        selectedWeek={selectedWeek}
        year={year}
        paidOrders={paidOrders}
        unpaidOrders={unpaidOrders}
        onClose={() => setShowDialog(false)}
      />

      {/* No Data State */}
      {!loading && chartData.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <i className="fas fa-chart-bar text-gray-300 text-4xl mb-4"></i>
            <p className="text-gray-500">No data available for the selected week range</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaidUnpaidWeekRangeChart;