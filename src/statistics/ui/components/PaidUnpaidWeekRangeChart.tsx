/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { usePaidUnpaidData } from '../../hooks/usePaidUnpaidData';
import { getWeekRange, getAvailableYears } from '../../utils/dateUtils';
import { OrderPaidUnpaidWeekRange } from '../../domain/OrdersPaidUnpaidModels';
import OrdersReportDialog from '../../components/OrdersReportDialog';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Package, 
  CheckCircle, 
  Trophy, 
  Database,
  AlertTriangle,
  RotateCcw,
  PieChart,
  LineChart,
  Target,
  Activity
} from 'lucide-react';
import PaidUnpaidExportMenu from './export/PaidUnpaidExportMenu';

interface PaidUnpaidWeekRangeChartProps {
  initialYear?: number;
  initialStartWeek?: number;
  initialEndWeek?: number;
}

// Define types for component props
type ButtonSize = 'small' | 'default' | 'large';
type ButtonVariant = 'primary' | 'secondary';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
  size?: ButtonSize;
}

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
}

interface MetricCardProps {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
}

interface ModernInputProps {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: string;
  min?: string;
  max?: string;
}

interface ModernSelectProps {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const PaidUnpaidWeekRangeChart: React.FC<PaidUnpaidWeekRangeChartProps> = ({
  initialYear = new Date().getFullYear(),
  initialStartWeek = 1,
  initialEndWeek = 10
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    dataMode,
    setYear,
    setStartWeek,
    setEndWeek,
    setPendingStartWeek,
    setPendingEndWeek,
    loadPaidUnpaidData,
    switchToHistoricMode,
    switchToRangeMode,
    handleTryAgain,
  } = usePaidUnpaidData(initialYear, initialStartWeek, initialEndWeek);

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Responsive breakpoints
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

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

  // Responsive Nivo theme
  const responsiveTheme = {
    background: 'transparent',
    text: {
      fontSize: isMobile ? 10 : isTablet ? 11 : 12,
      fill: '#0B2863',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
    },
    axis: {
      domain: {
        line: {
          stroke: '#0B2863',
          strokeWidth: isMobile ? 1 : 2
        }
      },
      legend: {
        text: {
          fontSize: isMobile ? 11 : isTablet ? 12 : 13,
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
          fontSize: isMobile ? 9 : isTablet ? 10 : 11,
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
        fontSize: isMobile ? 10 : isTablet ? 11 : 12,
        fill: '#374151',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }
    },
    tooltip: {
      container: {
        background: 'rgba(255, 255, 255, 0.98)',
        color: '#0B2863',
        fontSize: isMobile ? 11 : 12,
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '3px solid #0B2863',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }
    }
  };

  // Responsive chart margins
  const getChartMargins = () => {
    if (isMobile) {
      return { top: 20, right: 40, bottom: 50, left: 40 };
    } else if (isTablet) {
      return { top: 30, right: 80, bottom: 50, left: 50 };
    } else {
      return { top: 50, right: 130, bottom: 50, left: 60 };
    }
  };

  // Custom responsive tooltips
  const ModernBarTooltip = ({ id, value, data }: any) => {
    const range = getWeekRange(year, data.weekNumber);
    return (
      <div className="bg-white border-2 rounded-xl p-3 sm:p-4 shadow-xl max-w-[200px] sm:max-w-none" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0B2863' }}></div>
          <span className="font-bold text-base sm:text-lg" style={{ color: '#0B2863' }}>
            {data.week}
          </span>
        </div>
        <div className="text-gray-600 text-xs mb-3 font-medium">
          <span className="hidden sm:inline">{range.start} → {range.end}</span>
          <span className="sm:hidden">{range.start.split('-').slice(1).join('/')}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-xs sm:text-sm font-medium">{id}:</span>
          <span className="font-bold text-base sm:text-lg" style={{ color: id === 'Paid' ? '#22c55e' : '#F09F52' }}>
            {value}
          </span>
        </div>
        <div className="text-xs text-gray-500 text-center mt-3 bg-gray-50 px-2 py-1 rounded">
          <span className="hidden sm:inline">Click for details</span>
          <span className="sm:hidden">Tap for details</span>
        </div>
      </div>
    );
  };

  const ModernLineTooltip = ({ point }: any) => {
    const range = getWeekRange(year, point.data.weekNumber);
    return (
      <div className="bg-white border-2 rounded-xl p-3 sm:p-4 shadow-xl max-w-[200px] sm:max-w-none" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: point.color }}></div>
          <span className="font-bold text-base sm:text-lg" style={{ color: '#0B2863' }}>
            {point.data.x}
          </span>
        </div>
        <div className="text-gray-600 text-xs mb-3 font-medium">
          <span className="hidden sm:inline">{range.start} → {range.end}</span>
          <span className="sm:hidden">{range.start.split('-').slice(1).join('/')}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-xs sm:text-sm font-medium">{point.serieId}:</span>
          <span className="font-bold text-lg sm:text-xl" style={{ color: point.color }}>
            {point.data.y}
          </span>
        </div>
        <div className="text-xs text-gray-500 text-center mt-3 bg-gray-50 px-2 py-1 rounded">
          <span className="hidden sm:inline">Click for details</span>
          <span className="sm:hidden">Tap for details</span>
        </div>
      </div>
    );
  };

  // Responsive components with proper typing
  const ModernButton: React.FC<ModernButtonProps> = ({ 
    children, 
    onClick, 
    disabled = false, 
    variant = "primary", 
    className = "", 
    size = "default" 
  }) => {
    const sizeClasses: Record<ButtonSize, string> = {
      small: "px-3 py-2 text-sm",
      default: "px-4 py-2 sm:px-6 sm:py-3",
      large: "px-6 py-3 sm:px-8 sm:py-4"
    };

    const baseClasses = `${sizeClasses[size]} rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 border-2 text-sm sm:text-base`;
    
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

  const ModernCard: React.FC<ModernCardProps> = ({ children, className = "" }) => (
    <div className={`bg-white border-2 rounded-xl shadow-lg p-4 sm:p-6 ${className}`} style={{ borderColor: '#0B2863' }}>
      {children}
    </div>
  );

  const MetricCard: React.FC<MetricCardProps> = ({ value, label, icon: Icon, color = "#0B2863" }) => (
    <ModernCard className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color }}>{value}</div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">{label}</div>
        </div>
        <div className="text-2xl sm:text-3xl opacity-70">
          <Icon size={isMobile ? 20 : isTablet ? 24 : 28} color={color} />
        </div>
      </div>
    </ModernCard>
  );

  const ModernInput: React.FC<ModernInputProps> = ({ 
    value, 
    onChange, 
    onKeyDown, 
    disabled, 
    className = "", 
    ...props 
  }) => (
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

  const ModernSelect: React.FC<ModernSelectProps> = ({ 
    value, 
    onChange, 
    disabled, 
    children, 
    className = "" 
  }) => (
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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <ModernCard className="max-w-md mx-auto mt-20">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle size={isMobile ? 32 : 40} className="mx-auto" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ color: '#0B2863' }}>System Error</h3>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <ModernButton onClick={handleTryAgain}>
              <RotateCcw size={16} />
              Retry Connection
            </ModernButton>
          </div>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-full mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <ModernCard>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <BarChart3 size={isMobile ? 12 : 16} className="text-white" />
                </div>
                <h1 className="text-lg sm:text-2xl font-bold" style={{ color: '#0B2863' }}>
                  <span className="hidden sm:inline">Payment Analytics Dashboard</span>
                  <span className="sm:hidden">Payment Analytics</span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                <span className="hidden sm:inline">Real-time payment tracking with advanced visualization engine</span>
                <span className="sm:hidden">Real-time payment tracking</span>
              </p>
              {chartData.length > 0 && (
                <div className="flex items-center gap-2 mt-2 sm:mt-3">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="text-cyan-600 text-xs sm:text-sm font-bold">
                    {(() => {
                      const start = getWeekRange(year, startWeek).start;
                      const end = getWeekRange(year, endWeek).end;
                      if (isMobile) {
                        return `W${startWeek}-W${endWeek}`;
                      }
                      return `${start} → ${end}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <ModernButton onClick={loadPaidUnpaidData} disabled={loading} size={isMobile ? "small" : "default"}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw size={16} />
                )}
                {loading ? 'SYNCING' : 'REFRESH'}
              </ModernButton>
              <ModernButton 
                onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')} 
                variant="secondary"
                size={isMobile ? "small" : "default"}
              >
                {chartType === 'bar' ? <BarChart3 size={16} /> : <LineChart size={16} />}
                {chartType === 'bar' ? 'BARS' : 'LINES'}
              </ModernButton>
              
              {/* Nuevo botón de export */}
              <PaidUnpaidExportMenu
                rawData={rawData}
                exportMode={{
                  type: dataMode.type,
                  startWeek: dataMode.startWeek,
                  endWeek: dataMode.endWeek,
                  year: dataMode.year
                }}
                disabled={loading || !rawData}
              />
            </div>
          </div>
        </ModernCard>

        {/* Metrics Grid */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard 
              value={totalStats.totalOrders} 
              label="Total Orders" 
              icon={Package}
              color="#0B2863"
            />
            <MetricCard 
              value={`${totalStats.avgPaidPercentage.toFixed(1)}%`} 
              label="Success Rate" 
              icon={CheckCircle}
              color="#22c55e"
            />
            <MetricCard 
              value={`W${totalStats.bestWeek?.week}`} 
              label="Peak Week" 
              icon={Trophy}
              color="#FFE67B"
            />
            <MetricCard 
              value={chartData.length} 
              label="Dataset Size" 
              icon={Database}
              color="#0B2863"
            />
          </div>
        )}

        {/* Controls */}
        <ModernCard>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2" style={{ color: '#0B2863' }}>
                <Calendar size={18} />
                Temporal Controls
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1">Year</label>
                  <ModernSelect 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
                    disabled={loading}
                  >
                    {getAvailableYears().map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </ModernSelect>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1">Start Week</label>
                  <ModernInput
                    type="number"
                    min="1"
                    max="53"
                    value={pendingStartWeek}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      setPendingStartWeek(newValue);
                      // Actualizar automáticamente si el valor es válido
                      if (newValue >= 1 && newValue <= 53) {
                        setStartWeek(newValue);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && pendingStartWeek >= 1 && pendingStartWeek <= 53) {
                        setStartWeek(pendingStartWeek);
                      }
                    }}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1">End Week</label>
                  <ModernInput
                    type="number"
                    min="1"
                    max="53"
                    value={pendingEndWeek}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      setPendingEndWeek(newValue);
                      // Actualizar automáticamente si el valor es válido
                      if (newValue >= 1 && newValue <= 53) {
                        setEndWeek(newValue);
                      }
                    }}
                    onKeyDown={(e) => {
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
              <h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2" style={{ color: '#0B2863' }}>
                <Target size={18} />
                Data Mode
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <ModernButton
                  variant={dataMode.type === 'range' ? 'primary' : 'secondary'}
                  onClick={switchToRangeMode}
                  size="small"
                  disabled={loading}
                >
                  Week Range Mode
                </ModernButton>
                <ModernButton
                  variant={dataMode.type === 'historic' ? 'primary' : 'secondary'}
                  onClick={switchToHistoricMode}
                  size="small"
                  disabled={loading}
                >
                  Historic Mode
                </ModernButton>
              </div>
              
              <h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2" style={{ color: '#0B2863' }}>
                <Target size={18} />
                Quick Presets
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { weeks: 4, label: isMobile ? '4 weeks' : 'Last 4 weeks' },
                  { weeks: 8, label: isMobile ? '8 weeks' : 'Last 8 weeks' },
                  { weeks: 12, label: isMobile ? '12 weeks' : 'Last 12 weeks' },
                  { weeks: 26, label: isMobile ? '6 months' : 'Last 6 months' }
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
                    size="small"
                  >
                    {label}
                  </ModernButton>
                ))}
              </div>
            </div>
          </div>

          {/* Live Stats */}
          {rawData && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-bold mb-3 text-base sm:text-lg flex items-center gap-2" style={{ color: '#0B2863' }}>
                <Activity size={18} />
                Real-time Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <div className="font-bold text-base sm:text-lg" style={{ color: '#0B2863' }}>
                    {rawData.total_paid + rawData.total_unpaid}
                  </div>
                  <div className="text-gray-600 text-xs font-medium">TOTAL</div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <div className="text-green-600 font-bold text-base sm:text-lg">{rawData.total_paid}</div>
                  <div className="text-gray-600 text-xs font-medium">PAID</div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <div className="font-bold text-base sm:text-lg" style={{ color: '#F09F52' }}>{rawData.total_unpaid}</div>
                  <div className="text-gray-600 text-xs font-medium">UNPAID</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <div className="text-blue-600 font-bold text-base sm:text-lg">
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
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="text-center">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 rounded-full"></div>
                  <div 
                    className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"
                  ></div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin absolute top-2 left-2 sm:top-3 sm:left-3" style={{ animationDirection: 'reverse' }}></div>
                </div>
                <div className="font-bold text-lg sm:text-xl mb-2" style={{ color: '#0B2863' }}>Processing Data</div>
                <div className="text-gray-600 text-sm">
                  <span className="hidden sm:inline">Analyzing {endWeek - startWeek + 1} weeks • {chartType.toUpperCase()} mode</span>
                  <span className="sm:hidden">Analyzing {endWeek - startWeek + 1} weeks</span>
                </div>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Charts Layout */}
        {!loading && chartData.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {/* Main Chart */}
            <ModernCard>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    {chartType === 'bar' ? <BarChart3 size={isMobile ? 12 : 16} className="text-white" /> : <LineChart size={isMobile ? 12 : 16} className="text-white" />}
                  </div>
                  <h3 className="font-bold text-base sm:text-xl" style={{ color: '#0B2863' }}>
                    <span className="hidden lg:inline">{chartType === 'bar' ? 'Bar Analysis' : 'Trend Analysis'}</span>
                    <span className="lg:hidden">{chartType === 'bar' ? 'Bars' : 'Trends'}</span>
                  </h3>
                </div>
              </div>
              
              <div style={{ height: isMobile ? '300px' : isTablet ? '400px' : '450px' }}>
                {chartType === 'bar' ? (
                  <ResponsiveBar
                    data={nivoBarData}
                    keys={['Paid', 'Unpaid']}
                    indexBy="week"
                    margin={getChartMargins()}
                    padding={0.15}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={['#22c55e', '#F09F52']}
                    theme={responsiveTheme}
                    borderRadius={6}
                    borderWidth={2}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: isMobile ? -45 : 0,
                      legend: isMobile ? '' : 'Week',
                      legendPosition: 'middle',
                      legendOffset: isMobile ? 40 : 35
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: isMobile ? '' : 'Orders',
                      legendPosition: 'middle',
                      legendOffset: isMobile ? -35 : -45
                    }}
                    enableGridY={true}
                    enableGridX={false}
                    enableLabel={false}
                    legends={isDesktop ? [
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
                    ] : []}
                    animate={true}
                    motionConfig="gentle"
                    onClick={handleChartClick}
                    tooltip={ModernBarTooltip}
                  />
                ) : (
                  <ResponsiveLine
                    data={nivoLineData}
                    margin={getChartMargins()}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                    theme={responsiveTheme}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: isMobile ? -45 : 0,
                      legend: isMobile ? '' : 'Week',
                      legendOffset: isMobile ? 40 : 35,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: isMobile ? '' : 'Orders',
                      legendOffset: isMobile ? -35 : -45,
                      legendPosition: 'middle'
                    }}
                    enableGridX={false}
                    enableGridY={true}
                    colors={['#22c55e', '#F09F52', '#0B2863']}
                    lineWidth={isMobile ? 3 : 4}
                    pointSize={isMobile ? 6 : 8}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={isMobile ? 2 : 3}
                    pointBorderColor={{ from: 'serieColor' }}
                    useMesh={true}
                    animate={true}
                    motionConfig="gentle"
                    legends={isDesktop ? [
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
                    ] : []}
                    onClick={handleChartClick}
                    tooltip={ModernLineTooltip}
                  />
                )}
              </div>
              
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 text-xs sm:text-sm font-bold">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">Click to drill down</span>
                  <span className="sm:hidden">Tap to drill down</span>
                </div>
              </div>
            </ModernCard>

            {/* Bottom Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Distribution Chart */}
              <ModernCard>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <PieChart size={isMobile ? 16 : 20} style={{ color: '#0B2863' }} />
                  <h3 className="font-bold text-base sm:text-xl" style={{ color: '#0B2863' }}>Distribution</h3>
                </div>
                
                <div style={{ height: isMobile ? '200px' : '280px' }}>
                  <ResponsivePie
                    data={nivoPieData}
                    margin={{ 
                      top: 20, 
                      right: 20, 
                      bottom: 20, 
                      left: 20 
                    }}
                    innerRadius={0.4}
                    padAngle={2}
                    cornerRadius={6}
                    activeOuterRadiusOffset={12}
                    colors={['#22c55e', '#F09F52']}
                    theme={responsiveTheme}
                    borderWidth={3}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#0B2863"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="#ffffff"
                    enableArcLinkLabels={!isMobile}
                    animate={true}
                    motionConfig="gentle"
                    transitionMode="pushIn"
                  />
                </div>
                
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Paid</span>
                    </div>
                    <span className="text-green-600 font-bold text-base sm:text-lg">{totalStats.totalPaid}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F09F52' }}></div>
                      <span className="text-gray-700 text-xs sm:text-sm font-medium">Unpaid</span>
                    </div>
                    <span className="font-bold text-base sm:text-lg" style={{ color: '#F09F52' }}>{totalStats.totalUnpaid}</span>
                  </div>
                  <div className="border-t-2 pt-3" style={{ borderColor: '#e5e7eb' }}>
                    <div className="text-center">
                      <div className="font-bold text-xl sm:text-2xl" style={{ color: '#0B2863' }}>{totalStats.totalOrders}</div>
                      <div className="text-gray-600 text-xs sm:text-sm font-medium">Total Records</div>
                    </div>
                  </div>
                </div>
              </ModernCard>

              {/* Performance Metrics */}
              <ModernCard>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <TrendingUp size={isMobile ? 12 : 16} className="text-white" />
                  </div>
                  <h3 className="font-bold text-base sm:text-xl" style={{ color: '#0B2863' }}>Metrics</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 sm:p-4">
                    <div className="text-green-600 font-bold text-2xl sm:text-3xl">
                      {totalStats.avgPaidPercentage.toFixed(1)}%
                    </div>
                    <div className="text-gray-700 text-xs sm:text-sm font-bold mb-3">Success Rate</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 sm:h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${totalStats.avgPaidPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                      <div className="font-bold text-base sm:text-lg" style={{ color: '#F09F52' }}>W{totalStats.bestWeek?.week}</div>
                      <div className="text-gray-600 text-xs font-medium">Peak Week</div>
                    </div>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                      <div className="text-blue-600 font-bold text-base sm:text-lg">{chartData.length}</div>
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
            <div className="text-center py-12 sm:py-20">
              <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 opacity-50">
                <BarChart3 size={isMobile ? 48 : 72} className="mx-auto text-gray-400" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-4" style={{ color: '#0B2863' }}>No Data Detected</h3>
              <p className="text-gray-600 text-sm mb-6 sm:mb-8 max-w-md mx-auto px-4">
                <span className="hidden sm:inline">
                  No payment records found in the specified temporal range. 
                  Expand search parameters or verify data availability.
                </span>
                <span className="sm:hidden">
                  No payment records found. Try expanding the search range.
                </span>
              </p>
              <div className="space-y-4">
                <ModernButton onClick={loadPaidUnpaidData}>
                  <RefreshCw size={16} />
                  Rescan Database
                </ModernButton>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
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
                    size="small"
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
                    size="small"
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