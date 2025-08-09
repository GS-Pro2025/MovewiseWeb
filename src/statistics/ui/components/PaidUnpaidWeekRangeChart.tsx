/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchOrdersPaidUnpaidWeekRange, processPaidUnpaidChartData } from '../../data/repositoryStatistics';
import { PaidUnpaidChartData, OrdersPaidUnpaidWeekRangeResponse, OrderPaidUnpaidWeekRange } from '../../domain/OrdersPaidUnpaidModels';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<PaidUnpaidChartData[]>([]);
  const [rawData, setRawData] = useState<OrdersPaidUnpaidWeekRangeResponse | null>(null);
  
  // Estados para los filtros
  const [year, setYear] = useState<number>(initialYear);
  const [startWeek, setStartWeek] = useState<number>(initialStartWeek);
  const [endWeek, setEndWeek] = useState<number>(initialEndWeek);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const loadPaidUnpaidData = async () => {
    if (startWeek > endWeek) {
      setError('Start week cannot be greater than end week');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchOrdersPaidUnpaidWeekRange(startWeek, endWeek, year);
      const processedData = processPaidUnpaidChartData(data);
      
      setRawData(data);
      setChartData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading paid/unpaid data');
      console.error('Error loading paid/unpaid data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaidUnpaidData();
  }, [year, startWeek, endWeek]);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  const handleStartWeekChange = (newStartWeek: number) => {
    if (newStartWeek >= 1 && newStartWeek <= 53) {
      setStartWeek(newStartWeek);
    }
  };

  const handleEndWeekChange = (newEndWeek: number) => {
    if (newEndWeek >= 1 && newEndWeek <= 53) {
      setEndWeek(newEndWeek);
    }
  };

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">Week {label}</p>
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

  // Obtener órdenes no pagadas de la semana seleccionada
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
            onClick={loadPaidUnpaidData}
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
              value={startWeek}
              onChange={(e) => handleStartWeekChange(Number(e.target.value))}
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
              value={endWeek}
              onChange={(e) => handleEndWeekChange(Number(e.target.value))}
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
              // Evento click en barra
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
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `W${value}`}
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

      {/* Dialog de órdenes no pagadas */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                Unpaid Orders - Week {selectedWeek}
              </h4>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            {unpaidOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No unpaid orders for this week.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm text-gray-700">Order Ref</th>
                      <th className="text-left py-2 px-3 text-sm text-gray-700">Client</th>
                      <th className="text-left py-2 px-3 text-sm text-gray-700">Factory</th>
                      <th className="text-left py-2 px-3 text-sm text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidOrders.map((order) => (
                      <tr key={order.key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-sm text-blue-600 font-mono">{order.key_ref}</td>
                        <td className="py-2 px-3 text-sm text-gray-800">{order.client_name}</td>
                        <td className="py-2 px-3 text-sm text-gray-600">{order.customer_factory}</td>
                        <td className="py-2 px-3 text-sm text-gray-600">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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