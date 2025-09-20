/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { PaymentStatusStats } from '../../domain/PaymentStatusModels';
import { 
  BarChart3, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Target,
  PiggyBank
} from 'lucide-react';

interface PaymentStatusChartProps {
  currentStats: PaymentStatusStats;
  previousStats: PaymentStatusStats;
  changes: {
    totalOrdersChange: number;
    paidOrdersChange: number;
    unpaidOrdersChange: number;
    paidPercentageChange: number;
    totalIncomeChange?: number;
    totalExpenseChange?: number;
    netProfitChange?: number;
  };
  loading?: boolean;
}

const PaymentStatusChart: React.FC<PaymentStatusChartProps> = ({
  currentStats,
  previousStats,
  changes,
  loading = false
}) => {
  // Función helper para asegurar que los valores son números válidos
  const safeNumber = (value: number | undefined | null): number => {
    return typeof value === 'number' && !isNaN(value) ? value : 0;
  };

  // Calcular métricas financieras con validación
  const paidIncome = safeNumber(currentStats.paidIncome);
  const unpaidIncome = safeNumber(currentStats.unpaidIncome);
  const totalIncome = paidIncome + unpaidIncome;
  const totalExpenses = safeNumber(currentStats.totalExpenses);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Métricas de la semana anterior con validación
  const previousPaidIncome = safeNumber(previousStats.paidIncome);
  const previousUnpaidIncome = safeNumber(previousStats.unpaidIncome);
  const previousTotalIncome = previousPaidIncome + previousUnpaidIncome;
  const previousTotalExpenses = safeNumber(previousStats.totalExpenses);
  const previousNetProfit = previousTotalIncome - previousTotalExpenses;

  // Debug: Agregar logs para diagnosticar
  console.log('PaymentStatusChart Debug:', {
    currentStats,
    paidIncome,
    unpaidIncome,
    totalIncome,
    totalExpenses,
    netProfit
  });

  // Datos para el gráfico de pie de Nivo
  const pieData = [
    {
      id: 'paid',
      label: 'Paid Orders',
      value: currentStats.paidOrders,
      color: '#22c55e',
      amount: currentStats.paidIncome
    },
    {
      id: 'unpaid',
      label: 'Unpaid Orders',
      value: currentStats.unpaidOrders,
      color: '#f59e0b',
      amount: currentStats.unpaidIncome
    }
  ];

  // Datos para el gráfico de barras comparativo - convertir explícitamente a números
  const barData = [
    {
      metric: 'This Week',
      income: Number((totalIncome / 1000).toFixed(2)),
      expenses: Number((totalExpenses / 1000).toFixed(2)),
      profit: Number((netProfit / 1000).toFixed(2))
    },
    {
      metric: 'Last Week',
      income: Number((previousTotalIncome / 1000).toFixed(2)),
      expenses: Number((previousTotalExpenses / 1000).toFixed(2)),
      profit: Number((previousNetProfit / 1000).toFixed(2))
    }
  ];

  if (loading) {
    return (
      <div 
        className="rounded-2xl shadow-lg p-4 sm:p-6 border-2"
        style={{ 
          backgroundColor: '#ffffff',
          borderColor: '#0B2863'
        }}
      >
        <div className="flex items-center justify-center h-60 sm:h-80">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
              <div 
                className="w-12 h-12 border-4 rounded-full animate-spin absolute top-0 left-0"
                style={{ 
                  borderColor: '#0B2863',
                  borderTopColor: 'transparent'
                }}
              ></div>
            </div>
            <span className="text-lg font-semibold text-center" style={{ color: '#0B2863' }}>
              Loading payment status...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const ChangeIndicator = ({ change, positive, prefix = '' }: { change: number, positive?: boolean, prefix?: string }) => {
    if (change === 0) return null;
    
    const isPositive = positive !== undefined ? positive : change > 0;
    return (
      <div className={`text-xs flex items-center gap-1 mt-1 font-semibold ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span className="hidden sm:inline">{prefix}{Math.abs(change).toFixed(1)}% vs last week</span>
        <span className="sm:hidden">{prefix}{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  };

  // Tema responsivo para Nivo
  const nivoTheme = {
    background: 'transparent',
    text: {
      fontSize: 11,
      fill: '#0B2863',
      fontWeight: 600
    },
    axis: {
      domain: {
        line: {
          stroke: '#0B2863',
          strokeWidth: 2
        }
      },
      legend: {
        text: {
          fontSize: 11,
          fill: '#0B2863',
          fontWeight: 600
        }
      },
      ticks: {
        line: {
          stroke: '#0B2863',
          strokeWidth: 1
        },
        text: {
          fontSize: 10,
          fill: '#0B2863'
        }
      }
    },
    grid: {
      line: {
        stroke: '#e5e7eb',
        strokeWidth: 1
      }
    },
    legends: {
      text: {
        fontSize: 10,
        fill: '#0B2863',
        fontWeight: 600
      }
    }
  };

  return (
    <div 
      className="rounded-2xl shadow-lg p-4 sm:p-6 border-2 w-full overflow-x-auto"
      style={{ 
        backgroundColor: '#ffffff',
        borderColor: '#0B2863'
      }}
    >
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <BarChart3 size={28} className="sm:w-8 sm:h-8" style={{ color: '#0B2863' }} />
            <h3 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: '#0B2863' }}>
              Weekly Financial Summary
            </h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Payment status & financial overview
          </p>
        </div>
        <div className="text-center sm:text-right flex-shrink-0">
          <div 
            className="text-sm font-semibold mb-1"
            style={{ color: '#0B2863' }}
          >
            Total Orders
          </div>
          <div 
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: '#0B2863' }}
          >
            {currentStats.totalOrders}
          </div>
          <ChangeIndicator change={changes.totalOrdersChange} />
        </div>
      </div>

      {/* Financial Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Total Income */}
        <div 
          className="border-2 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
          style={{ 
            backgroundColor: '#f0f9ff',
            borderColor: '#0ea5e9'
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <DollarSign size={20} className="sm:w-6 sm:h-6" style={{ color: '#0ea5e9' }} />
            <span 
              className="font-semibold text-base sm:text-lg"
              style={{ color: '#0B2863' }}
            >
              Total Income
            </span>
          </div>
          <div 
            className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2"
            style={{ color: '#0ea5e9' }}
          >
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
            Paid: <span className="font-bold text-green-600">{formatCurrency(currentStats.paidIncome)}</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
            Pending: <span className="font-bold text-yellow-600">{formatCurrency(currentStats.unpaidIncome)}</span>
          </div>
          <ChangeIndicator change={changes.totalIncomeChange || 0} />
        </div>

        {/* Total Expenses */}
        <div 
          className="border-2 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
          style={{ 
            backgroundColor: '#fef2f2',
            borderColor: '#ef4444'
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <CreditCard size={20} className="sm:w-6 sm:h-6" style={{ color: '#ef4444' }} />
            <span 
              className="font-semibold text-base sm:text-lg"
              style={{ color: '#0B2863' }}
            >
              Total Expenses
            </span>
          </div>
          <div 
            className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2"
            style={{ color: '#ef4444' }}
          >
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
            Operating costs & expenses
          </div>
          <ChangeIndicator change={changes.totalExpenseChange || 0} positive={changes.totalExpenseChange !== undefined ? changes.totalExpenseChange < 0 : undefined} />
        </div>

        {/* Net Profit */}
        <div 
          className="border-2 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1"
          style={{ 
            backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
            borderColor: netProfit >= 0 ? '#22c55e' : '#ef4444'
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            {netProfit >= 0 ? (
              <TrendingUp size={20} className="sm:w-6 sm:h-6" style={{ color: '#22c55e' }} />
            ) : (
              <TrendingDown size={20} className="sm:w-6 sm:h-6" style={{ color: '#ef4444' }} />
            )}
            <span 
              className="font-semibold text-base sm:text-lg"
              style={{ color: '#0B2863' }}
            >
              Net Profit
            </span>
          </div>
          <div 
            className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2"
            style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {formatCurrency(netProfit)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
            Margin: <span className={`font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </span>
          </div>
          <ChangeIndicator change={changes.netProfitChange || 0} />
        </div>
      </div>

      {/* Charts Container - Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6">
        {/* Pie Chart - Payment Status */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200">
          <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center flex items-center justify-center gap-2" style={{ color: '#0B2863' }}>
            <Target size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Payment Distribution</span>
            <span className="sm:hidden">Payments</span>
          </h4>
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsivePie
              data={pieData}
              theme={nivoTheme}
              margin={{ 
                top: 15, 
                right: window.innerWidth < 640 ? 40 : window.innerWidth < 1024 ? 60 : 80, 
                bottom: window.innerWidth < 640 ? 60 : 80, 
                left: window.innerWidth < 640 ? 40 : window.innerWidth < 1024 ? 60 : 80 
              }}
              innerRadius={0.4}
              padAngle={2}
              cornerRadius={6}
              activeOuterRadiusOffset={8}
              colors={['#22c55e', '#f59e0b']}
              borderWidth={3}
              borderColor="#ffffff"
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#0B2863"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={15}
              arcLabelsTextColor="#ffffff"
              arcLabel={(d) => `${d.value}`}
              enableArcLinkLabels={window.innerWidth >= 640}
              tooltip={({ datum }) => (
                <div
                  style={{
                    background: '#ffffff',
                    padding: '8px 12px',
                    border: '2px solid #0B2863',
                    borderRadius: '8px',
                    color: '#0B2863',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    maxWidth: '200px'
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>{datum.label}</div>
                  <div style={{ color: datum.color }}>
                    {datum.value} orders ({((datum.value / currentStats.totalOrders) * 100).toFixed(1)}%)
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Amount: {formatCurrency(datum.data.amount)}
                  </div>
                </div>
              )}
              legends={[
                {
                  anchor: 'bottom',
                  direction: window.innerWidth < 640 ? 'column' : 'row',
                  justify: false,
                  translateX: 0,
                  translateY: window.innerWidth < 640 ? 45 : 56,
                  itemsSpacing: window.innerWidth < 640 ? 8 : 20,
                  itemWidth: window.innerWidth < 640 ? 80 : 100,
                  itemHeight: 18,
                  itemTextColor: '#0B2863',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 12,
                  symbolShape: 'circle'
                }
              ]}
            />
          </div>
        </div>

        {/* Bar Chart - Financial Comparison */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200">
          <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center flex items-center justify-center gap-2" style={{ color: '#0B2863' }}>
            <BarChart3 size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden lg:inline">Weekly Comparison (in thousands)</span>
            <span className="lg:hidden">Weekly Compare ($K)</span>
          </h4>
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveBar
              data={barData}
              theme={nivoTheme}
              keys={['income', 'expenses', 'profit']}
              indexBy="metric"
              margin={{ 
                top: 15, 
                right: window.innerWidth < 640 ? 60 : window.innerWidth < 1024 ? 80 : 100, 
                bottom: window.innerWidth < 640 ? 60 : 80, 
                left: window.innerWidth < 640 ? 50 : window.innerWidth < 1024 ? 60 : 80 
              }}
              padding={0.2}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={['#0ea5e9', '#ef4444', '#22c55e']}
              borderRadius={4}
              borderWidth={2}
              borderColor="#ffffff"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: window.innerWidth < 640 ? -45 : 0,
                legend: window.innerWidth >= 640 ? 'Period' : '',
                legendPosition: 'middle',
                legendOffset: window.innerWidth < 640 ? 50 : 40
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: window.innerWidth >= 640 ? 'Amount ($K)' : '$K',
                legendPosition: 'middle',
                legendOffset: window.innerWidth < 640 ? -40 : -60
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              animate={true}
              motionConfig="gentle"
              tooltip={({ id, value, color, data }) => (
                <div
                  style={{
                    background: '#ffffff',
                    padding: '8px 12px',
                    border: '2px solid #0B2863',
                    borderRadius: '8px',
                    color: '#0B2863',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    maxWidth: '180px'
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>{data.metric}</div>
                  <div style={{ color }}>
                    {id}: ${value.toFixed(1)}K
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    ${(value * 1000).toLocaleString()}
                  </div>
                </div>
              )}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: window.innerWidth < 1024 ? 'bottom' : 'bottom-right',
                  direction: window.innerWidth < 1024 ? 'row' : 'column',
                  justify: false,
                  translateX: window.innerWidth < 1024 ? 0 : 120,
                  translateY: window.innerWidth < 1024 ? 50 : 0,
                  itemsSpacing: window.innerWidth < 1024 ? 15 : 8,
                  itemWidth: window.innerWidth < 1024 ? 70 : 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 12,
                  itemTextColor: '#0B2863',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats - Responsive Grid */}
      <div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2"
        style={{ borderTopColor: '#0B2863' }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-1 sm:mb-2">
            <Receipt size={14} className="sm:w-4 sm:h-4" style={{ color: '#22c55e' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: '#22c55e' }}>
            {currentStats.paidOrders}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-gray-600">Paid Orders</div>
          <div className="text-xs font-bold" style={{ color: '#22c55e' }}>
            {formatCurrency(currentStats.paidIncome)}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1 sm:mb-2">
            <Receipt size={14} className="sm:w-4 sm:h-4" style={{ color: '#f59e0b' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: '#f59e0b' }}>
            {currentStats.unpaidOrders}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-gray-600">Unpaid Orders</div>
          <div className="text-xs font-bold" style={{ color: '#f59e0b' }}>
            {formatCurrency(currentStats.unpaidIncome)}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1 sm:mb-2">
            <CreditCard size={14} className="sm:w-4 sm:h-4" style={{ color: '#ef4444' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: '#ef4444' }}>
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-gray-600">Total Expenses</div>
          <div className="text-xs text-gray-500">This Week</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1 sm:mb-2">
            <PiggyBank size={14} className="sm:w-4 sm:h-4" style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }} />
          </div>
          <div className={`text-xl sm:text-2xl font-bold`} style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-gray-600">Net Profit</div>
          <div className="text-xs text-gray-500">{profitMargin.toFixed(1)}% margin</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusChart;