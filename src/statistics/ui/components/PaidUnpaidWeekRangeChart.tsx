/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as echarts from 'echarts';
import { usePaidUnpaidData } from '../../hooks/usePaidUnpaidData';
import { getWeekRange } from '../../utils/dateUtils';
import { OrderPaidUnpaidWeekRange } from '../../domain/OrdersPaidUnpaidModels';
import OrdersReportDialog from '../../components/OrdersReportDialog';
import {
  BarChart3, Calendar, RefreshCw, Package, CheckCircle,
  Trophy, AlertTriangle, RotateCcw, Target, Activity, FileDown, TrendingUp
} from 'lucide-react';
import PaidUnpaidExportDialog from './export/PaidUnpaidExportDialog';
import YearPicker from '../../../components/YearPicker';
import WeekPicker from '../../../components/WeekPicker';

interface PaidUnpaidWeekRangeChartProps {
  initialYear?: number;
  initialStartWeek?: number;
  initialEndWeek?: number;
}

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
interface ModernCardProps   { children: React.ReactNode; className?: string; }
interface MetricCardProps   {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
  trend?: number;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  children, onClick, disabled = false, variant = "primary", className = "", size = "default"
}) => {
  const sizeClasses: Record<ButtonSize, string> = {
    small:   "px-3 py-2 text-sm",
    default: "px-4 py-2 sm:px-6 sm:py-3",
    large:   "px-6 py-3 sm:px-8 sm:py-4"
  };
  const baseClasses = `${sizeClasses[size]} rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 border-2 text-sm sm:text-base`;

  if (variant === "primary") {
    return (
      <button onClick={onClick} disabled={disabled}
        className={`${baseClasses} text-white hover:shadow-lg hover:-translate-y-0.5 ${className}`}
        style={{ backgroundColor: '#0B2863', borderColor: '#0B2863' }}>
        {children}
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${baseClasses} hover:shadow-md hover:-translate-y-0.5 ${className}`}
      style={{ color: '#0B2863', borderColor: '#0B2863', backgroundColor: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFE67B'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
      {children}
    </button>
  );
};

const ModernCard: React.FC<ModernCardProps> = ({ children, className = "" }) => (
  <div className={`bg-white border-2 rounded-xl shadow-lg p-4 sm:p-6 ${className}`} style={{ borderColor: '#0B2863' }}>
    {children}
  </div>
);

const MetricCard: React.FC<MetricCardProps> = ({ value, label, icon: Icon, color = "#0B2863", trend }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth < 640;
  return (
    <ModernCard className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color }}>{value}</div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">{label}</div>
          {trend !== undefined && (
            <div className={`text-xs font-bold mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="text-3xl opacity-70">
          <Icon size={isMobile ? 24 : 32} color={color} />
        </div>
      </div>
    </ModernCard>
  );
};

const PaidUnpaidWeekRangeChart: React.FC<PaidUnpaidWeekRangeChartProps> = ({
  initialYear, initialStartWeek, initialEndWeek
}) => {
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const currentWeek = Math.ceil((new Date().getTime() - new Date(currentYear, 0, 1).getTime()) / 604800000);

  const safeYear      = (initialYear      && !isNaN(initialYear)      && initialYear >= 2000)           ? initialYear      : currentYear;
  const safeStartWeek = (initialStartWeek && !isNaN(initialStartWeek) && initialStartWeek >= 1 && initialStartWeek <= 53) ? initialStartWeek : Math.max(1, currentWeek - 5);
  const safeEndWeek   = (initialEndWeek   && !isNaN(initialEndWeek)   && initialEndWeek >= 1 && initialEndWeek <= 53)     ? initialEndWeek   : Math.min(53, currentWeek);

  const [windowWidth, setWindowWidth]       = useState(window.innerWidth);
  const [selectedWeek, setSelectedWeek]     = useState<number | null>(null);
  const [showDialog, setShowDialog]         = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [chartReady, setChartReady]         = useState(false);

  const chartRef      = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const chartContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
      setChartReady(false);
    }
    if (node !== null) {
      chartRef.current = node;
      try {
        node.innerHTML = '';
        chartInstance.current = echarts.init(node, null, { renderer: 'canvas', useDirtyRect: false });
        setChartReady(true);
      } catch (error) {
        console.error('Error initializing ECharts:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    loading, error, chartData, rawData,
    year, startWeek, endWeek,
    setYear, setStartWeek, setEndWeek,
    setPendingStartWeek, setPendingEndWeek,
    loadPaidUnpaidData, handleTryAgain,
  } = usePaidUnpaidData(safeYear, safeStartWeek, safeEndWeek);

  const isMobile = windowWidth < 640;

  const totalStats = chartData.reduce((acc, week) => ({
    totalOrders: acc.totalOrders + week.total,
    totalPaid:   acc.totalPaid   + week.paid,
    totalUnpaid: acc.totalUnpaid + week.unpaid,
    avgPaidPercentage: 0,
    bestWeek: !acc.bestWeek || (week.total > (acc.bestWeek?.total || 0)) ? week : acc.bestWeek,
  }), { totalOrders: 0, totalPaid: 0, totalUnpaid: 0, avgPaidPercentage: 0, bestWeek: undefined as any });

  if (totalStats.totalOrders > 0) {
    totalStats.avgPaidPercentage = (totalStats.totalPaid / totalStats.totalOrders) * 100;
  }

  useEffect(() => {
    return () => { chartInstance.current?.dispose(); chartInstance.current = null; };
  }, []);

  // ── Chart update ──
  useEffect(() => {
    if (!chartInstance.current || !chartReady || loading) return;
    if (chartData.length === 0) { chartInstance.current.clear(); return; }

    const weeks      = chartData.map(w => `W${w.week}`);
    const paidData   = chartData.map(w => w.paid);
    const unpaidData = chartData.map(w => w.unpaid);
    const totalData  = chartData.map(w => w.total);

    const option: echarts.EChartsOption = {
      title: {
        text: t('paidUnpaidChart.chart.title'),
        left: 'center',
        textStyle: { color: '#0B2863', fontSize: isMobile ? 16 : 20, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(11, 40, 99, 0.1)' } },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#0B2863',
        borderWidth: 2,
        textStyle: { color: '#0B2863', fontSize: isMobile ? 11 : 13 },
        padding: isMobile ? 8 : 12,
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const dataIndex = params[0].dataIndex;
          if (dataIndex === undefined || dataIndex >= chartData.length) return '';
          const weekNum = chartData[dataIndex].week;
          const range = getWeekRange(year, weekNum);
          let result = `<div style="font-weight:bold;margin-bottom:8px;font-size:${isMobile ? '13px' : '15px'}">${t('paidUnpaidChart.chart.tooltipWeek', { week: weekNum })}</div>`;
          result += `<div style="color:#6B7280;font-size:${isMobile ? '11px' : '12px'};margin-bottom:8px">${range.start} → ${range.end}</div>`;
          params.forEach((item: any) => {
            const color = item.color || '#0B2863';
            const value = item.value ?? 0;
            result += `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>
              <span style="flex:1;">${item.seriesName}:</span>
              <span style="font-weight:bold;margin-left:12px;">${value}</span>
            </div>`;
          });
          return result;
        }
      },
      legend: {
        data: [
          t('paidUnpaidChart.chart.seriesPaid'),
          t('paidUnpaidChart.chart.seriesUnpaid'),
          t('paidUnpaidChart.chart.seriesTotal'),
        ],
        top: isMobile ? 35 : 40,
        textStyle: { color: '#374151', fontSize: isMobile ? 11 : 13, fontWeight: 600 },
        itemGap: isMobile ? 15 : 20
      },
      grid: { left: isMobile ? '12%' : '8%', right: isMobile ? '8%' : '5%', top: isMobile ? 80 : 90, bottom: isMobile ? 80 : 70, containLabel: true },
      dataZoom: [
        {
          type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100,
          height: isMobile ? 20 : 25, bottom: isMobile ? 35 : 25,
          borderColor: '#0B2863', fillerColor: 'rgba(11,40,99,0.15)',
          handleStyle: { color: '#0B2863', borderColor: '#0B2863' },
          dataBackground: { lineStyle: { color: '#0B2863' }, areaStyle: { color: 'rgba(11,40,99,0.2)' } },
          selectedDataBackground: { lineStyle: { color: '#0B2863' }, areaStyle: { color: 'rgba(11,40,99,0.3)' } },
          textStyle: { fontSize: isMobile ? 10 : 11 }
        },
        { type: 'inside', xAxisIndex: [0], start: 0, end: 100 }
      ],
      xAxis: {
        type: 'category', data: weeks,
        axisLabel: { rotate: isMobile ? 45 : 0, color: '#374151', fontSize: isMobile ? 10 : 12, fontWeight: 600 },
        axisLine: { lineStyle: { color: '#0B2863', width: 2 } },
        axisTick: { lineStyle: { color: '#0B2863' } }
      },
      yAxis: {
        type: 'value',
        name: t('paidUnpaidChart.chart.yAxisLabel'),
        nameTextStyle: { color: '#0B2863', fontSize: isMobile ? 11 : 13, fontWeight: 'bold' },
        axisLabel: { color: '#374151', fontSize: isMobile ? 10 : 12 },
        axisLine: { lineStyle: { color: '#0B2863', width: 2 } },
        splitLine: { lineStyle: { color: '#E5E7EB', type: 'dashed' } }
      },
      series: [
        {
          name: t('paidUnpaidChart.chart.seriesPaid'),
          type: 'bar', stack: 'orders', data: paidData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#34D399' }, { offset: 1, color: '#10B981' }]),
            borderRadius: [0, 0, 4, 4]
          },
          emphasis: { itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#10B981' }, { offset: 1, color: '#059669' }]) } },
          barWidth: isMobile ? '60%' : '50%'
        },
        {
          name: t('paidUnpaidChart.chart.seriesUnpaid'),
          type: 'bar', stack: 'orders', data: unpaidData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#FBBF24' }, { offset: 1, color: '#F59E0B' }]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: { itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: '#D97706' }]) } }
        },
        {
          name: t('paidUnpaidChart.chart.seriesTotal'),
          type: 'line', data: totalData, smooth: true,
          symbol: 'circle', symbolSize: isMobile ? 6 : 8,
          lineStyle: { color: '#0B2863', width: isMobile ? 3 : 4, shadowColor: 'rgba(11,40,99,0.3)', shadowBlur: 10, shadowOffsetY: 3 },
          itemStyle: { color: '#0B2863', borderColor: '#fff', borderWidth: 2 },
          emphasis: { scale: true, itemStyle: { color: '#FFE67B', borderColor: '#0B2863', borderWidth: 3 } },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(11,40,99,0.2)' }, { offset: 1, color: 'rgba(11,40,99,0.02)' }]) }
        }
      ],
      animation: true, animationDuration: 800, animationEasing: 'cubicOut'
    };

    try {
      chartInstance.current.setOption(option, true);
      chartInstance.current.off('click');
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series' && params.dataIndex !== undefined) {
          setSelectedWeek(chartData[params.dataIndex].week);
          setShowDialog(true);
        }
      });
      setTimeout(() => chartInstance.current?.resize(), 100);
    } catch (error) {
      console.error('Error setting chart option:', error);
    }
  }, [chartData, loading, year, isMobile, chartReady, t]);

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const paidOrders: OrderPaidUnpaidWeekRange[] =
    selectedWeek && rawData ? ((rawData as any)?.orders_by_week?.[String(selectedWeek)]?.filter((o: any) => o.paid)  || []) : [];
  const unpaidOrders: OrderPaidUnpaidWeekRange[] =
    selectedWeek && rawData ? ((rawData as any)?.orders_by_week?.[String(selectedWeek)]?.filter((o: any) => !o.paid) || []) : [];

  const handlePresetClick = (weeks: number) => {
    const cw = Math.ceil((new Date().getTime() - new Date(year, 0, 1).getTime()) / 604800000);
    const start = Math.max(1, cw - weeks);
    const end   = Math.min(53, cw);
    setStartWeek(start); setEndWeek(end);
    setPendingStartWeek(start); setPendingEndWeek(end);
    setTimeout(() => loadPaidUnpaidData(), 200);
  };

  const presets = [
    { weeks: 4,  label: t('paidUnpaidChart.controls.preset4')  },
    { weeks: 12, label: t('paidUnpaidChart.controls.preset12') },
    { weeks: 26, label: t('paidUnpaidChart.controls.preset26') },
  ];

  /* ── ERROR ── */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <ModernCard className="max-w-md mx-auto mt-20">
          <div className="text-center">
            <div className="text-red-500 mb-4"><AlertTriangle size={isMobile ? 32 : 40} className="mx-auto" /></div>
            <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ color: '#0B2863' }}>{t('paidUnpaidChart.error.title')}</h3>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <ModernButton onClick={handleTryAgain}>
              <RotateCcw size={16} /> {t('paidUnpaidChart.error.retry')}
            </ModernButton>
          </div>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-full mx-auto space-y-4 sm:space-y-6">

        {/* Header */}
        <ModernCard>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <BarChart3 size={16} className="text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#0B2863' }}>
                  {t('paidUnpaidChart.header.title')}
                </h1>
              </div>
              {chartData.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="text-cyan-600 text-sm font-bold">
                    {isMobile
                      ? `W${startWeek}-W${endWeek}`
                      : `${getWeekRange(year, startWeek).start} → ${getWeekRange(year, endWeek).end}`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <ModernButton onClick={loadPaidUnpaidData} disabled={loading} size="small">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  : <RefreshCw size={16} />}
                {t('paidUnpaidChart.header.refresh')}
              </ModernButton>
              <ModernButton onClick={() => setExportDialogOpen(true)} variant="secondary" size="small" disabled={loading || !rawData}>
                <FileDown size={16} /> {t('paidUnpaidChart.header.export')}
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Metrics */}
        {!loading && chartData.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard value={totalStats.totalOrders}                             label={t('paidUnpaidChart.metrics.totalOrders')} icon={Package}     color="#0B2863"  />
            <MetricCard value={totalStats.totalPaid}                               label={t('paidUnpaidChart.metrics.paidOrders')}  icon={CheckCircle} color="#10B981"  />
            <MetricCard value={`${totalStats.avgPaidPercentage.toFixed(1)}%`}      label={t('paidUnpaidChart.metrics.successRate')} icon={TrendingUp}  color="#10B981"  />
            <MetricCard value={totalStats.bestWeek?.week ? `W${totalStats.bestWeek.week}` : 'N/A'} label={t('paidUnpaidChart.metrics.peakWeek')} icon={Trophy} color="#F59E0B" />
          </div>
        )}

        {/* Controls */}
        <ModernCard>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <h3 className="font-bold mb-3 text-base flex items-center gap-2" style={{ color: '#0B2863' }}>
                <Calendar size={18} /> {t('paidUnpaidChart.controls.periodSelection')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs font-bold mb-2">{t('paidUnpaidChart.controls.year')}</label>
                  <YearPicker year={year} onYearSelect={setYear} disabled={loading} className="w-full" />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold mb-2">{t('paidUnpaidChart.controls.startWeek')}</label>
                  <WeekPicker week={startWeek} onWeekSelect={setStartWeek} min={1} max={53} className="w-full" />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold mb-2">{t('paidUnpaidChart.controls.endWeek')}</label>
                  <WeekPicker week={endWeek} onWeekSelect={setEndWeek} min={1} max={53} className="w-full" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-base flex items-center gap-2" style={{ color: '#0B2863' }}>
                <Target size={18} /> {t('paidUnpaidChart.controls.quickPresets')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {presets.map(({ weeks, label }) => (
                  <ModernButton key={weeks} variant="secondary" onClick={() => handlePresetClick(weeks)} size="small" className="w-full" disabled={loading}>
                    {label}
                  </ModernButton>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          {rawData && !loading && (
            <div className="mt-6 pt-6 border-t-2" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-bold mb-3 text-base flex items-center gap-2" style={{ color: '#0B2863' }}>
                <Activity size={18} /> {t('paidUnpaidChart.summary.title')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <div className="font-bold text-lg" style={{ color: '#0B2863' }}>{(rawData?.total_paid || 0) + (rawData?.total_unpaid || 0)}</div>
                  <div className="text-gray-600 text-xs font-medium">{t('paidUnpaidChart.summary.total')}</div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <div className="text-green-600 font-bold text-lg">{rawData?.total_paid || 0}</div>
                  <div className="text-gray-600 text-xs font-medium">{t('paidUnpaidChart.summary.paid')}</div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <div className="font-bold text-lg" style={{ color: '#F59E0B' }}>{rawData?.total_unpaid || 0}</div>
                  <div className="text-gray-600 text-xs font-medium">{t('paidUnpaidChart.summary.unpaid')}</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <div className="text-blue-600 font-bold text-lg">
                    {(() => {
                      const totalPaid   = rawData?.total_paid   || 0;
                      const totalUnpaid = rawData?.total_unpaid || 0;
                      const total = totalPaid + totalUnpaid;
                      return total > 0 ? ((totalPaid / total) * 100).toFixed(1) : '0.0';
                    })()}%
                  </div>
                  <div className="text-gray-600 text-xs font-medium">{t('paidUnpaidChart.summary.rate')}</div>
                </div>
              </div>
            </div>
          )}
        </ModernCard>

        {/* Loading */}
        {loading && (
          <ModernCard>
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="font-bold text-xl mb-2" style={{ color: '#0B2863' }}>{t('paidUnpaidChart.loading.title')}</div>
                <div className="text-gray-600 text-sm">{t('paidUnpaidChart.loading.subtitle', { weeks: endWeek - startWeek + 1 })}</div>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Chart */}
        {!loading && chartData.length > 0 && (
          <ModernCard>
            <div className="mb-4">
              <div className="text-sm text-gray-600">
                {t('paidUnpaidChart.chart.chartStatus', {
                  status: chartReady ? t('paidUnpaidChart.chart.initialized') : t('paidUnpaidChart.chart.notInitialized'),
                  count: chartData.length
                })}
              </div>
            </div>
            <div style={{ width: '100%', height: isMobile ? '400px' : '500px', position: 'relative' }}>
              <div ref={chartContainerRef} style={{ width: '100%', height: '100%', border: '2px solid #0B2863', backgroundColor: '#FFFFFF' }} />
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 text-sm font-bold">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>{isMobile ? t('paidUnpaidChart.chart.clickHintMobile') : t('paidUnpaidChart.chart.clickHintDesktop')}</span>
              </div>
            </div>
          </ModernCard>
        )}

        {/* No Data */}
        {!loading && chartData.length === 0 && (
          <ModernCard>
            <div className="text-center py-20">
              <div className="text-6xl mb-6 opacity-50">
                <BarChart3 size={72} className="mx-auto text-gray-400" />
              </div>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#0B2863' }}>{t('paidUnpaidChart.noData.title')}</h3>
              <p className="text-gray-600 text-sm mb-8 max-w-md mx-auto px-4">
                {isMobile ? t('paidUnpaidChart.noData.descMobile') : t('paidUnpaidChart.noData.descDesktop')}
              </p>
              <div className="space-y-4">
                <ModernButton onClick={loadPaidUnpaidData}>
                  <RefreshCw size={16} /> {t('paidUnpaidChart.noData.rescan')}
                </ModernButton>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <ModernButton variant="secondary" onClick={() => handlePresetClick(12)} size="small">{t('paidUnpaidChart.noData.try12')}</ModernButton>
                  <ModernButton variant="secondary" onClick={() => handlePresetClick(26)} size="small">{t('paidUnpaidChart.noData.try26')}</ModernButton>
                </div>
              </div>
            </div>
          </ModernCard>
        )}
      </div>

      <OrdersReportDialog
        show={showDialog} selectedWeek={selectedWeek} year={year}
        paidOrders={paidOrders} unpaidOrders={unpaidOrders}
        onClose={() => setShowDialog(false)}
      />
      <PaidUnpaidExportDialog
        open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}
        currentYear={year} currentStartWeek={startWeek} currentEndWeek={endWeek}
      />
    </div>
  );
};

export default PaidUnpaidWeekRangeChart;