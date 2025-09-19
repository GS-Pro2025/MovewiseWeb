import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { PaymentStatusStats } from '../../domain/PaymentStatusModels';

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
  // Calcular métricas financieras
  const totalIncome = currentStats.paidIncome + currentStats.unpaidIncome;
  const totalExpenses = currentStats.totalExpenses || 0;
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Métricas de la semana anterior
  const previousTotalIncome = previousStats.paidIncome + previousStats.unpaidIncome;
  const previousTotalExpenses = previousStats.totalExpenses || 0;
  const previousNetProfit = previousTotalIncome - previousTotalExpenses;

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

  // Datos para el gráfico de barras comparativo
  const barData = [
    {
      metric: 'This Week',
      income: totalIncome / 1000,
      expenses: totalExpenses / 1000,
      profit: netProfit / 1000
    },
    {
      metric: 'Last Week',
      income: previousTotalIncome / 1000,
      expenses: previousTotalExpenses / 1000,
      profit: previousNetProfit / 1000
    }
  ];

  if (loading) {
    return (
      <div 
        className="rounded-2xl shadow-lg p-6 border-2"
        style={{ 
          backgroundColor: '#ffffff',
          borderColor: '#0B2863'
        }}
      >
        <div className="flex items-center justify-center h-80">
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
            <span className="text-lg font-semibold" style={{ color: '#0B2863' }}>
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
        <span className={`text-xs ${isPositive ? '↗' : '↘'}`}>
          {isPositive ? '↗' : '↘'}
        </span>
        {prefix}{Math.abs(change).toFixed(1)}% vs last week
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

  // Tema personalizado para Nivo
  const nivoTheme = {
    background: 'transparent',
    text: {
      fontSize: 12,
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
          fontSize: 12,
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
          fontSize: 11,
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
        fontSize: 12,
        fill: '#0B2863',
        fontWeight: 600
      }
    }
  };

  return (
    <div 
      className="rounded-2xl shadow-lg p-6 border-2"
      style={{ 
        backgroundColor: '#ffffff',
        borderColor: '#0B2863'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <h3 className="text-2xl font-bold" style={{ color: '#0B2863' }}>
              Weekly Financial Summary
            </h3>
          </div>
          <p className="text-gray-600 font-medium">
            Payment status & financial overview
          </p>
        </div>
        <div className="text-right">
          <div 
            className="text-sm font-semibold mb-1"
            style={{ color: '#0B2863' }}
          >
            Total Orders
          </div>
          <div 
            className="text-3xl font-bold mb-1"
            style={{ color: '#0B2863' }}
          >
            {currentStats.totalOrders}
          </div>
          <ChangeIndicator change={changes.totalOrdersChange} />
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Income */}
        <div 
          className="border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
          style={{ 
            backgroundColor: '#f0f9ff',
            borderColor: '#0ea5e9'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">💰</div>
            <span 
              className="font-semibold text-lg"
              style={{ color: '#0B2863' }}
            >
              Total Income
            </span>
          </div>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: '#0ea5e9' }}
          >
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-sm text-gray-600 font-medium mb-1">
            Paid: <span className="font-bold text-green-600">{formatCurrency(currentStats.paidIncome)}</span>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Pending: <span className="font-bold text-yellow-600">{formatCurrency(currentStats.unpaidIncome)}</span>
          </div>
          <ChangeIndicator change={changes.totalIncomeChange || 0} />
        </div>

        {/* Total Expenses */}
        <div 
          className="border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
          style={{ 
            backgroundColor: '#fef2f2',
            borderColor: '#ef4444'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">💸</div>
            <span 
              className="font-semibold text-lg"
              style={{ color: '#0B2863' }}
            >
              Total Expenses
            </span>
          </div>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: '#ef4444' }}
          >
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Operating costs & expenses
          </div>
          <ChangeIndicator change={changes.totalExpenseChange || 0} positive={changes.totalExpenseChange !== undefined ? changes.totalExpenseChange < 0 : undefined} />
        </div>

        {/* Net Profit */}
        <div 
          className="border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
          style={{ 
            backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
            borderColor: netProfit >= 0 ? '#22c55e' : '#ef4444'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">{netProfit >= 0 ? '📈' : '📉'}</div>
            <span 
              className="font-semibold text-lg"
              style={{ color: '#0B2863' }}
            >
              Net Profit
            </span>
          </div>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {formatCurrency(netProfit)}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Margin: <span className={`font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </span>
          </div>
          <ChangeIndicator change={changes.netProfitChange || 0} />
        </div>
      </div>

      {/* Charts Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
        {/* Pie Chart - Payment Status */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-xl font-bold mb-4 text-center" style={{ color: '#0B2863' }}>
            Payment Distribution
          </h4>
          <div style={{ height: '300px' }}>
            <ResponsivePie
              data={pieData}
              theme={nivoTheme}
              margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.4}
              padAngle={2}
              cornerRadius={6}
              activeOuterRadiusOffset={8}
              colors={['#22c55e', '#f59e0b']}
              borderWidth={3}
              borderColor="#ffffff"
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#0B2863"
              arcLinkLabelsThickness={3}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="#ffffff"
              arcLabel={(d) => `${d.value}`}
              tooltip={({ datum }) => (
                <div
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    border: '2px solid #0B2863',
                    borderRadius: '8px',
                    color: '#0B2863',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>{datum.label}</div>
                  <div style={{ color: datum.color }}>
                    {datum.value} orders ({((datum.value / currentStats.totalOrders) * 100).toFixed(1)}%)
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Amount: {formatCurrency(datum.data.amount)}
                  </div>
                </div>
              )}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 20,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#0B2863',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 14,
                  symbolShape: 'circle'
                }
              ]}
            />
          </div>
        </div>

        {/* Bar Chart - Financial Comparison */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-xl font-bold mb-4 text-center" style={{ color: '#0B2863' }}>
            Weekly Comparison (in thousands)
          </h4>
          <div style={{ height: '300px' }}>
            <ResponsiveBar
              data={barData}
              theme={nivoTheme}
              keys={['income', 'expenses', 'profit']}
              indexBy="metric"
              margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
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
                tickRotation: 0,
                legend: 'Period',
                legendPosition: 'middle',
                legendOffset: 40
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Amount ($K)',
                legendPosition: 'middle',
                legendOffset: -60
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              animate={true}
              motionStiffness={90}
              motionDamping={15}
              tooltip={({ id, value, color, data }) => (
                <div
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    border: '2px solid #0B2863',
                    borderRadius: '8px',
                    color: '#0B2863',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>{data.metric}</div>
                  <div style={{ color }}>
                    {id}: ${value.toFixed(1)}K
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    ${(value * 1000).toLocaleString()}
                  </div>
                </div>
              )}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 8,
                  itemWidth: 100,
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

      {/* Summary Stats */}
      <div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t-2"
        style={{ borderTopColor: '#0B2863' }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            {currentStats.paidOrders}
          </div>
          <div className="text-sm font-semibold text-gray-600">Paid Orders</div>
          <div className="text-xs font-bold" style={{ color: '#22c55e' }}>
            {formatCurrency(currentStats.paidIncome)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
            {currentStats.unpaidOrders}
          </div>
          <div className="text-sm font-semibold text-gray-600">Unpaid Orders</div>
          <div className="text-xs font-bold" style={{ color: '#f59e0b' }}>
            {formatCurrency(currentStats.unpaidIncome)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-sm font-semibold text-gray-600">Total Expenses</div>
          <div className="text-xs text-gray-500">This Week</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold`} style={{ color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-sm font-semibold text-gray-600">Net Profit</div>
          <div className="text-xs text-gray-500">{profitMargin.toFixed(1)}% margin</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusChart;