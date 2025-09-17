/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { usePaidUnpaidData } from '../../hooks/usePaidUnpaidData';
import { getWeekRange, getAvailableYears } from '../../utils/dateUtils';
import { OrderPaidUnpaidWeekRange } from '../../domain/OrdersPaidUnpaidModels';
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
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Transform data for Nivo charts
  const nivoBarData = chartData.map(week => ({
    week: `W${week.week}`,
    'Paid': week.paid,
    'Unpaid': week.unpaid,
    weekNumber: week.week,
    paidPercentage: week.paidPercentage,
    unpaidPercentage: week.unpaidPercentage,
    total: week.total
  }));

  const nivoLineData = [
    {
      id: 'Paid',
      color: '#22c55e',
      data: chartData.map(week => ({
        x: `W${week.week}`,
        y: week.paid,
        weekNumber: week.week
      }))
    },
    {
      id: 'Unpaid',
      color: '#F09F52',
      data: chartData.map(week => ({
        x: `W${week.week}`,
        y: week.unpaid,
        weekNumber: week.week
      }))
    },
    {
      id: 'Total',
      color: '#0B2863',
      data: chartData.map(week => ({
        x: `W${week.week}`,
        y: week.total,
        weekNumber: week.week
      }))
    }
  ];

  // Calculate statistics
  const totalStats = chartData.reduce((acc, week) => ({
    totalOrders: acc.totalOrders + week.total,
    totalPaid: acc.totalPaid + week.paid,
    totalUnpaid: acc.totalUnpaid + week.unpaid,
    avgPaidPercentage: 0,
    bestWeek: acc.bestWeek?.total > week.total ? acc.bestWeek : week,
    worstWeek: acc.worstWeek?.total < week.total ? acc.worstWeek : week
  }), {
    totalOrders: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    avgPaidPercentage: 0,
    bestWeek: chartData[0],
    worstWeek: chartData[0]
  });

  if (totalStats.totalOrders > 0) {
    totalStats.avgPaidPercentage = (totalStats.totalPaid / totalStats.totalOrders) * 100;
  }

  const nivoPieData = [
    {
      id: 'Paid',
      label: 'Paid Orders',
      value: totalStats.totalPaid,
      color: '#22c55e'
    },
    {
      id: 'Unpaid',
      label: 'Unpaid Orders',
      value: totalStats.totalUnpaid,
      color: '#F09F52'
    }
  ];

  // Event handlers
  const handleChartClick = (data: any) => {
    if (data?.data?.weekNumber) {
      setSelectedWeek(data.data.weekNumber);
      setShowDialog(true);
    } else if (data?.weekNumber) {
      setSelectedWeek(data.weekNumber);
      setShowDialog(true);
    }
  };

  const paidOrders: OrderPaidUnpaidWeekRange[] =
    selectedWeek && rawData
      ? rawData.orders_by_week[String(selectedWeek)]?.filter(o => o.paid) || []
      : [];

  const unpaidOrders: OrderPaidUnpaidWeekRange[] =
    selectedWeek && rawData
      ? rawData.orders_by_week[String(selectedWeek)]?.filter(o => !o.paid) || []
      : [];

  // Light theme for Nivo
  const lightTheme = {
    background: 'transparent',
    text: {
      fontSize: 11,
      fill: '#0B2863',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
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
          fontWeight: 600,
          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
        }
      },
      ticks: {
        line: {
          stroke: '#0B2863',
          strokeWidth: 1
        },
        text: {
          fontSize: 10,
          fill: '#374151',
          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
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
        fontSize: 11,
        fill: '#374151',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }
    },
    tooltip: {
      container: {
        background: 'rgba(255, 255, 255, 0.98)',
        color: '#0B2863',
        fontSize: 12,
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '3px solid #0B2863',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }
    }
  };

  // Custom tooltips
  const ModernBarTooltip = ({ id, value, data }: any) => {
    const range = getWeekRange(year, data.weekNumber);
    return (
      <div className="bg-white border-2 rounded-xl p-4 shadow-xl" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0B2863' }}></div>
          <span className="font-bold text-lg" style={{ color: '#0B2863' }}>
            {data.week}
          </span>
        </div>
        <div className="text-gray-600 text-xs mb-3 font-medium">
          {range.start} → {range.end}
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-sm font-medium">{id}:</span>
          <span className="font-bold text-lg" style={{ color: id === 'Paid' ? '#22c55e' : '#F09F52' }}>
            {value}
          </span>
        </div>
        <div className="text-xs text-gray-500 text-center mt-3 bg-gray-50 px-2 py-1 rounded">
          Click for details
        </div>
      </div>
    );
  };

  const ModernLineTooltip = ({ point }: any) => {
    const range = getWeekRange(year, point.data.weekNumber);
    return (
      <div className="bg-white border-2 rounded-xl p-4 shadow-xl" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: point.color }}></div>
          <span className="font-bold text-lg" style={{ color: '#0B2863' }}>
            {point.data.x}
          </span>
        </div>
        <div className="text-gray-600 text-xs mb-3 font-medium">
          {range.start} → {range.end}
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-sm font-medium">{point.serieId}:</span>
          <span className="font-bold text-xl" style={{ color: point.color }}>
            {point.data.y}
          </span>
        </div>
        <div className="text-xs text-gray-500 text-center mt-3 bg-gray-50 px-2 py-1 rounded">
          Click for details
        </div>
      </div>
    );
  };

  // Modern components
  const ModernButton = ({ children, onClick, disabled = false, variant = "primary", className = "" }: any) => {
    const baseClasses = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 border-2";
    
    if (variant === "primary") {
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className={`${baseClasses} text-white hover:shadow-lg hover:-translate-y-0.5 ${className}`}
          style={{ backgroundColor: '#0B2863', borderColor: '#0B2863' }}
        >
          {children}
        </button>
      );
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} hover:shadow-md hover:-translate-y-0.5 ${className}`}
        style={{ color: '#0B2863', borderColor: '#0B2863', backgroundColor: 'transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#FFE67B';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {children}
      </button>
    );
  };

  const ModernCard = ({ children, className = "" }: any) => (
    <div className={`bg-white border-2 rounded-xl shadow-lg p-6 ${className}`} style={{ borderColor: '#0B2863' }}>
      {children}
    </div>
  );

  const MetricCard = ({ value, label, icon, color = "#0B2863" }: any) => (
    <ModernCard className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
        <div className="text-3xl opacity-70">{icon}</div>
      </div>
    </ModernCard>
  );

  const ModernInput = ({ value, onChange, onKeyDown, disabled, className = "", ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={`border-2 rounded-lg px-3 py-2 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${className}`}
      style={{ borderColor: '#0B2863', color: '#0B2863' }}
      {...props}
    />
  );

  const ModernSelect = ({ value, onChange, disabled, children, className = "" }: any) => (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`border-2 rounded-lg px-3 py-2 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${className}`}
      style={{ borderColor: '#0B2863', color: '#0B2863' }}
    >
      {children}
    </select>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <ModernCard className="max-w-md mx-auto mt-20">
          <div className="text-center">
            <div className="text-red-500 mb-4 text-4xl">⚠</div>
            <h3 className="text-xl font-bold mb-3" style={{ color: '#0B2863' }}>System Error</h3>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <ModernButton onClick={handleTryAgain}>Retry Connection</ModernButton>
          </div>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="min-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <ModernCard>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">📊</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: '#0B2863' }}>Payment Analytics Dashboard</h1>
              </div>
              <p className="text-gray-600 text-sm font-medium">
                Real-time payment tracking with advanced visualization engine
              </p>
              {chartData.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="text-cyan-600 text-sm font-bold">
                    {(() => {
                      const start = getWeekRange(year, startWeek).start;
                      const end = getWeekRange(year, endWeek).end;
                      return `${start} → ${end}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <ModernButton onClick={loadPaidUnpaidData} disabled={loading}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '🔄'
                )}
                {loading ? 'SYNCING' : 'REFRESH'}
              </ModernButton>
              <ModernButton onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')} variant="secondary">
                {chartType === 'bar' ? '📊' : '📈'} {chartType === 'bar' ? 'BARS' : 'LINES'}
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Metrics Grid */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              value={totalStats.totalOrders} 
              label="Total Orders" 
              icon="📦"
              color="#0B2863"
            />
            <MetricCard 
              value={`${totalStats.avgPaidPercentage.toFixed(1)}%`} 
              label="Success Rate" 
              icon="✅"
              color="#22c55e"
            />
            <MetricCard 
              value={`W${totalStats.bestWeek?.week}`} 
              label="Peak Week" 
              icon="🏆"
              color="#FFE67B"
            />
            <MetricCard 
              value={chartData.length} 
              label="Dataset Size" 
              icon="📈"
              color="#0B2863"
            />
          </div>
        )}

        {/* Controls */}
        <ModernCard>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-4 text-lg" style={{ color: '#0B2863' }}>Temporal Controls</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">Year</label>
                  <ModernSelect 
                    value={year} 
                    onChange={(e: any) => setYear(Number(e.target.value))}
                    disabled={loading}
                  >
                    {getAvailableYears().map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </ModernSelect>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">Start Week</label>
                  <ModernInput
                    type="number"
                    min="1"
                    max="53"
                    value={pendingStartWeek}
                    onChange={(e: any) => setPendingStartWeek(Number(e.target.value))}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter' && pendingStartWeek >= 1 && pendingStartWeek <= 53) {
                        setStartWeek(pendingStartWeek);
                      }
                    }}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">End Week</label>
                  <ModernInput
                    type="number"
                    min="1"
                    max="53"
                    value={pendingEndWeek}
                    onChange={(e: any) => setPendingEndWeek(Number(e.target.value))}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter' && pendingEndWeek >= 1 && pendingEndWeek <= 53) {
                        setEndWeek(pendingEndWeek);
                      }
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-lg" style={{ color: '#0B2863' }}>Quick Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { weeks: 4, label: 'Last 4 weeks' },
                  { weeks: 8, label: 'Last 8 weeks' },
                  { weeks: 12, label: 'Last 12 weeks' },
                  { weeks: 26, label: 'Last 6 months' }
                ].map(({ weeks, label }) => (
                  <ModernButton
                    key={weeks}
                    variant="secondary"
                    onClick={() => {
                      const currentWeek = Math.ceil((new Date().getTime() - new Date(year, 0, 1).getTime()) / 604800000);
                      const start = Math.max(1, currentWeek - weeks);
                      const end = Math.min(53, currentWeek);
                      setStartWeek(start);
                      setEndWeek(end);
                      setPendingStartWeek(start);
                      setPendingEndWeek(end);
                    }}
                    className="text-sm py-2"
                  >
                    {label}
                  </ModernButton>
                ))}
              </div>
            </div>
          </div>

          {/* Live Stats */}
          {rawData && (
            <div className="mt-6 pt-6 border-t-2" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-bold mb-3 text-lg" style={{ color: '#0B2863' }}>Real-time Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <div className="font-bold text-lg" style={{ color: '#0B2863' }}>
                    {rawData.total_paid + rawData.total_unpaid}
                  </div>
                  <div className="text-gray-600 text-xs font-medium">TOTAL</div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <div className="text-green-600 font-bold text-lg">{rawData.total_paid}</div>
                  <div className="text-gray-600 text-xs font-medium">PAID</div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <div className="font-bold text-lg" style={{ color: '#FFE67B' }}>{rawData.total_unpaid}</div>
                  <div className="text-gray-600 text-xs font-medium">UNPAID</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <div className="text-blue-600 font-bold text-lg">
                    {((rawData.total_paid / (rawData.total_paid + rawData.total_unpaid)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-gray-600 text-xs font-medium">RATE</div>
                </div>
              </div>
            </div>
          )}
        </ModernCard>

        {/* Loading State */}
        {loading && (
          <ModernCard>
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin absolute top-3 left-3" style={{ animationDirection: 'reverse' }}></div>
                </div>
                <div className="font-bold text-xl mb-2" style={{ color: '#0B2863' }}>Processing Data</div>
                <div className="text-gray-600 text-sm">
                  Analyzing {endWeek - startWeek + 1} weeks • {chartType.toUpperCase()} mode
                </div>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Charts Layout */}
        {!loading && chartData.length > 0 && (
          <div className="space-y-6">
            {/* Main Chart */}
            <ModernCard>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">{chartType === 'bar' ? '📊' : '📈'}</span>
                  </div>
                  <h3 className="font-bold text-xl" style={{ color: '#0B2863' }}>
                    {chartType === 'bar' ? 'Bar Analysis' : 'Trend Analysis'}
                  </h3>
                </div>
              </div>
              
              <div style={{ height: '450px' }}>
                {chartType === 'bar' ? (
                  <ResponsiveBar
                    data={nivoBarData}
                    keys={['Paid', 'Unpaid']}
                    indexBy="week"
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    padding={0.15}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={['#22c55e', '#F09F52']}
                    theme={lightTheme}
                    borderRadius={6}
                    borderWidth={2}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Week',
                      legendPosition: 'middle',
                      legendOffset: 35
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Orders',
                      legendPosition: 'middle',
                      legendOffset: -45
                    }}
                    enableGridY={true}
                    enableGridX={false}
                    enableLabel={false}
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
                        symbolSize: 16,
                        symbolShape: 'square'
                      }
                    ]}
                    animate={true}
                    motionConfig="gentle"
                    onClick={handleChartClick}
                    tooltip={ModernBarTooltip}
                  />
                ) : (
                  <ResponsiveLine
                    data={nivoLineData}
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                    theme={lightTheme}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Week',
                      legendOffset: 35,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Orders',
                      legendOffset: -45,
                      legendPosition: 'middle'
                    }}
                    enableGridX={false}
                    enableGridY={true}
                    colors={['#22c55e', '#F09F52', '#0B2863']}
                    lineWidth={4}
                    pointSize={8}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={3}
                    pointBorderColor={{ from: 'serieColor' }}
                    useMesh={true}
                    animate={true}
                    motionConfig="gentle"
                    legends={[
                      {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 8,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 16,
                        symbolShape: 'circle'
                      }
                    ]}
                    onClick={handleChartClick}
                    tooltip={ModernLineTooltip}
                  />
                )}
              </div>
              
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 text-sm font-bold">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Click to drill down
                </div>
              </div>
            </ModernCard>

            {/* Bottom Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution Chart */}
              <ModernCard>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="font-bold text-xl" style={{ color: '#0B2863' }}>Distribution</h3>
                </div>
                
                <div style={{ height: '280px' }}>
                  <ResponsivePie
                    data={nivoPieData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.4}
                    padAngle={2}
                    cornerRadius={6}
                    activeOuterRadiusOffset={12}
                    colors={['#22c55e', '#FFE67B']}
                    theme={lightTheme}
                    borderWidth={3}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#0B2863"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="#ffffff"
                    enableArcLinkLabels={false}
                    animate={true}
                    motionConfig="gentle"
                    transitionMode="pushIn"
                  />
                </div>
                
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 text-sm font-medium">Paid</span>
                    </div>
                    <span className="text-green-600 font-bold text-lg">{totalStats.totalPaid}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F09F52' }}></div>
                      <span className="text-gray-700 text-sm font-medium">Unpaid</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: '#F09F52' }}>{totalStats.totalUnpaid}</span>
                  </div>
                  <div className="border-t-2 pt-3" style={{ borderColor: '#e5e7eb' }}>
                    <div className="text-center">
                      <div className="font-bold text-2xl" style={{ color: '#0B2863' }}>{totalStats.totalOrders}</div>
                      <div className="text-gray-600 text-sm font-medium">Total Records</div>
                    </div>
                  </div>
                </div>
              </ModernCard>

              {/* Performance Metrics */}
              <ModernCard>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">📈</span>
                  </div>
                  <h3 className="font-bold text-xl" style={{ color: '#0B2863' }}>Metrics</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                    <div className="text-green-600 font-bold text-3xl">
                      {totalStats.avgPaidPercentage.toFixed(1)}%
                    </div>
                    <div className="text-gray-700 text-sm font-bold mb-3">Success Rate</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${totalStats.avgPaidPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                      <div className="font-bold text-lg" style={{ color: '#F09F52' }}>W{totalStats.bestWeek?.week}</div>
                      <div className="text-gray-600 text-xs font-medium">Peak Week</div>
                    </div>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                      <div className="text-blue-600 font-bold text-lg">{chartData.length}</div>
                      <div className="text-gray-600 text-xs font-medium">Samples</div>
                    </div>
                  </div>
                </div>
              </ModernCard>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && chartData.length === 0 && (
          <ModernCard>
            <div className="text-center py-20">
              <div className="text-6xl mb-6 opacity-50">📊</div>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#0B2863' }}>No Data Detected</h3>
              <p className="text-gray-600 text-sm mb-8 max-w-md mx-auto">
                No payment records found in the specified temporal range. 
                Expand search parameters or verify data availability.
              </p>
              <div className="space-y-4">
                <ModernButton onClick={loadPaidUnpaidData}>
                  🔄 Rescan Database
                </ModernButton>
                <div className="flex gap-2 justify-center">
                  <ModernButton 
                    variant="secondary" 
                    onClick={() => {
                      const currentWeek = Math.ceil((new Date().getTime() - new Date(year, 0, 1).getTime()) / 604800000);
                      const start = Math.max(1, currentWeek - 12);
                      const end = Math.min(53, currentWeek);
                      setStartWeek(start);
                      setEndWeek(end);
                      setPendingStartWeek(start);
                      setPendingEndWeek(end);
                    }}
                    className="text-sm"
                  >
                    Try 12 weeks
                  </ModernButton>
                  <ModernButton 
                    variant="secondary" 
                    onClick={() => {
                      const currentWeek = Math.ceil((new Date().getTime() - new Date(year, 0, 1).getTime()) / 604800000);
                      const start = Math.max(1, currentWeek - 26);
                      const end = Math.min(53, currentWeek);
                      setStartWeek(start);
                      setEndWeek(end);
                      setPendingStartWeek(start);
                      setPendingEndWeek(end);
                    }}
                    className="text-sm"
                  >
                    Try 26 weeks
                  </ModernButton>
                </div>
              </div>
            </div>
          </ModernCard>
        )}
      </div>

      {/* Orders Dialog */}
      <OrdersReportDialog
        show={showDialog}
        selectedWeek={selectedWeek}
        year={year}
        paidOrders={paidOrders}
        unpaidOrders={unpaidOrders}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
};

export default PaidUnpaidWeekRangeChart;