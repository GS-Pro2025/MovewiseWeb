import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Search, 
  Package, 
  Scale, 
  Tag, 
  DollarSign,
  RefreshCw,
  Settings,
  Plus,
  Undo,
  Save,
  X,
  Trash2,
  Trophy,
  Gem,
  Target,
  Brain,
  AlertTriangle
} from 'lucide-react';
import { fetchHistoricalJobWeight, processHistoricalJobWeightData } from '../data/repositoryStatistics';
import { WeightRange, HistoricalJobWeightResponse, ProcessedHistoricalData } from '../domain/HistoricalJobWeightModels';

const HistoricalAnalysis: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalJobWeightResponse | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedHistoricalData[]>([]);
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'trends' | 'analytics'>('overview');
  
  // Theme constants
  const THEME = {
    primary: '#1e40af',
    secondary: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    purple: '#8b5cf6',
    background: '#f8fafc',
    surface: '#ffffff',
    muted: '#64748b',
    text: '#1e293b'
  };

  const CHART_COLORS = [
    THEME.primary, THEME.secondary, THEME.success, THEME.purple, 
    THEME.warning, '#06b6d4', '#84cc16', '#ec4899',
    '#f97316', '#3b82f6', '#10b981', '#ef4444', '#6366f1',
    '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'
  ];

  const [weightRanges, setWeightRanges] = useState<WeightRange[]>([
    { min: 0, max: 500 },
    { min: 501, max: 1500 },
    { min: 1501, max: 3000 },
    { min: 3001, max: 5000 },
    { min: 5001, max: 8000 },
    { min: 8001, max: 15000 }
  ]);
  
  const [showRangeEditor, setShowRangeEditor] = useState<boolean>(false);
  const [tempRanges, setTempRanges] = useState<WeightRange[]>([]);

  // Load historical data
  const loadHistoricalData = useCallback(async (ranges: WeightRange[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchHistoricalJobWeight(ranges);
      setHistoricalData(data);
      
      const processed = processHistoricalJobWeightData(data);
      setProcessedData(processed);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading historical data');
      console.error('Error loading historical data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistoricalData(weightRanges);
  }, [loadHistoricalData, weightRanges]);

  // Data preparation functions
  interface PieDataItem {
    id: string;
    label: string;
    value: number;
    income: number;
    color?: string;
  }

  const prepareBarData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    return processedData.map((rangeData, index) => ({
      range: rangeData.weightRange.replace(' lbs', ''),
      orders: rangeData.totalOrdersInRange,
      percentage: parseFloat(rangeData.rangePercentage.toFixed(1)),
      avgIncome: rangeData.jobs.length > 0 
        ? parseFloat((rangeData.jobs.reduce((sum, job) => sum + job.averageIncome, 0) / rangeData.jobs.length).toFixed(2))
        : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  };

  const preparePieData = (): PieDataItem[] => {
    if (!processedData || processedData.length === 0) return [];
    
    const allJobs = processedData.flatMap(range => 
      range.jobs.map(job => ({
        id: job.jobName,
        label: job.jobName,
        value: job.ordersCount,
        income: job.averageIncome
      }))
    );
    
    const groupedJobs = allJobs.reduce((acc: PieDataItem[], job) => {
      const existing = acc.find(j => j.id === job.id);
      if (existing) {
        existing.value += job.value;
        existing.income = (existing.income + job.income) / 2;
      } else {
        acc.push(job);
      }
      return acc;
    }, []);
    
    return groupedJobs
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
      .map((job) => ({
        ...job,
        label: job.label.length > 15 ? job.label.substring(0, 12) + '...' : job.label
      }));
  };

  const prepareLineData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    const allUniqueJobs = [...new Set(processedData.flatMap(range => 
      range.jobs.map(job => job.jobName)
    ))];

    return allUniqueJobs.map((jobName, index) => ({
      id: jobName.length > 15 ? jobName.substring(0, 12) + '...' : jobName,
      color: CHART_COLORS[index % CHART_COLORS.length],
      data: processedData.map((range) => {
        const jobInRange = range.jobs.find(j => j.jobName === jobName);
        return {
          x: range.weightRange.replace(' lbs', ''),
          y: jobInRange ? jobInRange.ordersCount : 0
        };
      })
    }));
  };

  const prepareAnalyticsData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    return processedData.map(range => {
      const totalIncome = range.jobs.reduce((sum, job) => sum + (job.averageIncome * job.ordersCount), 0);
      const avgIncome = range.jobs.length > 0 
        ? range.jobs.reduce((sum, job) => sum + job.averageIncome, 0) / range.jobs.length 
        : 0;
      
      return {
        range: range.weightRange.replace(' lbs', ''),
        orders: range.totalOrdersInRange,
        avgIncome: parseFloat(avgIncome.toFixed(2)),
        totalRevenue: parseFloat((totalIncome / 1000).toFixed(2)),
        jobTypes: range.jobs.length
      };
    });
  };

  // Handler functions
  const handleEditRanges = () => {
    setTempRanges([...weightRanges]);
    setShowRangeEditor(true);
  };

  const handleSaveRanges = () => {
    setWeightRanges([...tempRanges]);
    setShowRangeEditor(false);
  };

  const handleCancelEdit = () => {
    setTempRanges([]);
    setShowRangeEditor(false);
  };

  const handleAddRange = () => {
    setTempRanges([...tempRanges, { min: 0, max: 1000 }]);
  };

  const handleRemoveRange = (index: number) => {
    const newRanges = tempRanges.filter((_, i) => i !== index);
    setTempRanges(newRanges);
  };

  const handleRangeChange = (index: number, field: 'min' | 'max', value: number) => {
    const newRanges = [...tempRanges];
    newRanges[index][field] = value;
    setTempRanges(newRanges);
  };

  const resetToDefaults = () => {
    const defaultRanges = [
      { min: 0, max: 500 },
      { min: 501, max: 1500 },
      { min: 1501, max: 3000 },
      { min: 3001, max: 5000 },
      { min: 5001, max: 8000 },
      { min: 8001, max: 15000 }
    ];
    setWeightRanges(defaultRanges);
    setShowRangeEditor(false);
  };

  // Reusable Components
  const Button: React.FC<{
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }> = ({ 
    variant = 'outline', 
    size = 'md', 
    children, 
    onClick, 
    disabled, 
    className = ''
  }) => {
    const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-opacity-50';
    
    const variantClasses = {
      primary: `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      secondary: `bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      danger: `bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      outline: `border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 focus:ring-blue-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  const Card: React.FC<{
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }> = ({ children, className = '', hover = false, onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-lg border border-slate-200 ${hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
  }> = ({ title, value, Icon, color, subtitle }) => (
    <Card hover className="p-6 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8" style={{ color }} />
      <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </Card>
  );

  // Calculate insights
  const insights = (() => {
    if (!processedData.length) return { topJob: null, highestIncome: null, mostBalanced: null };
    
    const allJobs = processedData.flatMap(range => range.jobs);
    const topJob = allJobs.sort((a, b) => b.ordersCount - a.ordersCount)[0];
    const highestIncome = allJobs.sort((a, b) => b.averageIncome - a.averageIncome)[0];
    const mostBalanced = allJobs.sort((a, b) => (b.ordersCount * b.averageIncome) - (a.ordersCount * a.averageIncome))[0];
    
    return { topJob, highestIncome, mostBalanced };
  })();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-xl font-semibold text-blue-600">Loading Analytics Dashboard...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="text-center p-8 border-red-200">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h3 className="text-2xl font-bold mb-4 text-red-600">Error Loading Data</h3>
            <p className="text-slate-600 mb-6 text-lg">{error}</p>
            <Button variant="primary" onClick={() => loadHistoricalData(weightRanges)}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </Card>
        </div>
      )}

      {/* Main content - only show when not loading and no error */}
      {!loading && !error && (
        <>
          {/* Header */}
          <Card className="p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <BarChart3 className="h-10 w-10 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Historical Weight Analytics</h1>
                  <p className="text-lg text-slate-600 mt-2">Advanced insights with modern visualizations</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => loadHistoricalData(weightRanges)} disabled={loading}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </Button>
                <Button variant="primary" onClick={handleEditRanges}>
                  <Settings className="h-4 w-4" />
                  Edit Ranges
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Orders"
                value={historicalData?.total_orders || 0}
                Icon={Package}
                color={THEME.primary}
              />
              <StatCard
                title="Weight Ranges"
                value={processedData.length}
                Icon={Scale}
                color={THEME.secondary}
              />
              <StatCard
                title="Job Types"
                value={processedData.reduce((sum, range) => sum + range.jobs.length, 0)}
                Icon={Tag}
                color={THEME.success}
              />
              <StatCard
                title="Avg Income"
                value={(() => {
                  const allJobs = processedData.flatMap(range => range.jobs);
                  const avgIncome = allJobs.length > 0 
                    ? allJobs.reduce((sum, job) => sum + job.averageIncome, 0) / allJobs.length 
                    : 0;
                  return `$${avgIncome.toFixed(0)}`;
                })()}
                Icon={DollarSign}
                color={THEME.purple}
                subtitle="Per Job Type"
              />
            </div>

            {/* View Toggle */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-slate-800" />
              <span className="text-lg font-semibold text-slate-800">Visualization:</span>
              {[
                { key: 'overview', label: 'Overview', Icon: BarChart3 },
                { key: 'detailed', label: 'Job Types', Icon: PieChart },
                { key: 'trends', label: 'Trends', Icon: TrendingUp },
                { key: 'analytics', label: 'Analytics', Icon: Search }
              ].map(view => (
                <button
                  key={view.key}
                  onClick={() => setActiveView(view.key as 'overview' | 'detailed' | 'trends' | 'analytics')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border-2 ${
                    activeView === view.key 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md -translate-y-0.5' 
                      : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <view.Icon className="h-4 w-4" />
                  {view.label}
                </button>
              ))}
            </div>

            {/* Weight Ranges Display */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Scale className="h-5 w-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-800">Current Weight Ranges:</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {weightRanges.map((range, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full text-sm font-medium text-white border-2"
                    style={{ 
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      borderColor: CHART_COLORS[index % CHART_COLORS.length]
                    }}
                  >
                    {range.min} - {range.max} lbs
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Main Content */}
          {processedData.length > 0 && (
            <Card className="p-8 mb-6">
              {activeView === 'overview' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-800">Orders Distribution by Weight Range</h3>
                  </div>
                  <div style={{ height: 500 }}>
                    <ResponsiveBar
                      data={prepareBarData()}
                      keys={['orders']}
                      indexBy="range"
                      margin={{ top: 50, right: 80, bottom: 100, left: 100 }}
                      padding={0.3}
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={({ index }) => CHART_COLORS[index % CHART_COLORS.length]}
                      borderRadius={8}
                      borderWidth={2}
                      borderColor="#ffffff"
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 10,
                        tickRotation: -45,
                        legend: 'Weight Ranges (lbs)',
                        legendPosition: 'middle',
                        legendOffset: 80
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 10,
                        tickRotation: 0,
                        legend: 'Number of Orders',
                        legendPosition: 'middle',
                        legendOffset: -80
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor="#ffffff"
                      animate={true}
                      motionConfig="gentle"
                      tooltip={({ indexValue, value, data }) => (
                        <Card className="p-4">
                          <div className="text-slate-800">
                            <strong className="text-blue-600">{indexValue}</strong><br />
                            Orders: <span className="text-emerald-500 font-semibold">{value}</span><br />
                            Percentage: <span className="text-amber-500 font-semibold">{data.percentage}%</span><br />
                            Avg Income: <span className="text-emerald-500 font-semibold">${data.avgIncome}</span>
                          </div>
                        </Card>
                      )}
                    />
                  </div>
                </div>
              )}

              {activeView === 'detailed' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <PieChart className="h-8 w-8 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-800">Job Type Distribution Analysis</h3>
                  </div>
                  <div style={{ height: 500 }}>
                    <ResponsivePie
                      data={preparePieData()}
                      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={[
                        '#1e40af', // azul
                        '#f59e0b', // ámbar
                        '#10b981', // verde
                        '#8b5cf6', // violeta
                        '#f59e0b', // ámbar
                        '#06b6d4', // cyan
                        '#84cc16', // lima
                        '#ec4899', // rosa
                        '#f97316', // naranja
                        '#3b82f6', // azul claro
                        '#10b981', // verde esmeralda
                        '#ef4444', // rojo
                        '#6366f1', // índigo
                        '#14b8a6', // teal
                        '#f59e0b', // ámbar
                        '#8b5cf6', // violeta
                        '#06b6d4', // cyan
                        '#84cc16'  // lima
                      ]}
                      borderWidth={3}
                      borderColor="#ffffff"
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor={THEME.text}
                      arcLinkLabelsThickness={3}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor="#ffffff"
                      animate={true}
                      motionConfig="gentle"
                      tooltip={({ datum }) => (
                        <Card className="p-4">
                          <div className="text-slate-800">
                            <strong className="text-blue-600">{datum.data.id}</strong><br />
                            Orders: <span className="text-emerald-500 font-semibold">{datum.value}</span><br />
                            Avg Income: <span className="text-emerald-500 font-semibold">${datum.data.income?.toFixed(2)}</span>
                          </div>
                        </Card>
                      )}
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          justify: false,
                          translateX: 0,
                          translateY: 56,
                          itemsSpacing: 0,
                          itemWidth: 100,
                          itemHeight: 18,
                          itemTextColor: THEME.text,
                          itemDirection: 'left-to-right',
                          itemOpacity: 1,
                          symbolSize: 18,
                          symbolShape: 'circle'
                        }
                      ]}
                    />
                  </div>
                </div>
              )}

              {activeView === 'trends' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-800">Job Trends Across Weight Ranges</h3>
                  </div>
                  <div style={{ height: 500 }}>
                    <ResponsiveLine
                      data={prepareLineData()}
                      margin={{ top: 50, right: 110, bottom: 100, left: 80 }}
                      xScale={{ type: 'point' }}
                      yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false }}
                      yFormat=" >-.0f"
                      curve="cardinal"
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 10,
                        tickRotation: -45,
                        legend: 'Weight Ranges',
                        legendOffset: 80,
                        legendPosition: 'middle'
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 10,
                        tickRotation: 0,
                        legend: 'Number of Orders',
                        legendOffset: -60,
                        legendPosition: 'middle'
                      }}
                      pointSize={10}
                      pointColor="#ffffff"
                      pointBorderWidth={3}
                      pointBorderColor={{ from: 'serieColor' }}
                      pointLabelYOffset={-12}
                      useMesh={true}
                      colors={{ datum: 'color' }}
                      lineWidth={4}
                      enableArea={true}
                      areaOpacity={0.1}
                      animate={true}
                      motionConfig="gentle"
                      legends={[
                        {
                          anchor: 'bottom-right',
                          direction: 'column',
                          justify: false,
                          translateX: 100,
                          translateY: 0,
                          itemsSpacing: 0,
                          itemDirection: 'left-to-right',
                          itemWidth: 80,
                          itemHeight: 20,
                          itemOpacity: 0.75,
                          symbolSize: 12,
                          symbolShape: 'circle',
                          symbolBorderColor: 'rgba(0, 0, 0, .5)',
                          itemTextColor: THEME.text
                        }
                      ]}
                    />
                  </div>
                </div>
              )}

              {activeView === 'analytics' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Search className="h-8 w-8 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-800">Advanced Analytics Dashboard</h3>
                  </div>
                  
                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <Card className="p-6">
                      <h4 className="text-xl font-bold mb-4 text-blue-600 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Orders by Range
                      </h4>
                      <div style={{ height: 300 }}>
                        <ResponsiveBar
                          data={prepareAnalyticsData()}
                          keys={['orders']}
                          indexBy="range"
                          margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                          padding={0.3}
                          colors={({ index }) => CHART_COLORS[index % CHART_COLORS.length]}
                          borderRadius={6}
                          borderWidth={2}
                          borderColor="#ffffff"
                          axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
                          axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Orders',
                            legendPosition: 'middle',
                            legendOffset: -40
                          }}
                          labelTextColor="#ffffff"
                          animate={true}
                          motionConfig="gentle"
                        />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h4 className="text-xl font-bold mb-4 text-emerald-600 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Average Income
                      </h4>
                      <div style={{ height: 300 }}>
                        <ResponsiveBar
                          data={prepareAnalyticsData()}
                          keys={['avgIncome']}
                          indexBy="range"
                          margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                          padding={0.3}
                          colors={({ index }) => CHART_COLORS[(index + 2) % CHART_COLORS.length]}
                          borderRadius={6}
                          borderWidth={2}
                          borderColor="#ffffff"
                          axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
                          axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Avg Income ($)',
                            legendPosition: 'middle',
                            legendOffset: -60
                          }}
                          labelTextColor="#ffffff"
                          animate={true}
                          motionConfig="gentle"
                        />
                      </div>
                    </Card>
                  </div>

                  {/* Detailed Table */}
                  <Card className="p-6">
                    <h4 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Detailed Job Analytics
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-blue-600 text-white">
                            <th className="text-left py-4 px-6 font-semibold">Weight Range</th>
                            <th className="text-left py-4 px-6 font-semibold">Job Type</th>
                            <th className="text-center py-4 px-6 font-semibold">Orders</th>
                            <th className="text-center py-4 px-6 font-semibold">Avg Income</th>
                            <th className="text-center py-4 px-6 font-semibold">Range %</th>
                            <th className="text-center py-4 px-6 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processedData.flatMap(rangeData =>
                            rangeData.jobs.map((job, jobIndex) => (
                              <tr 
                                key={`${rangeData.weightRange}-${jobIndex}`} 
                                className={`border-b transition-all duration-200 hover:bg-slate-50 ${
                                  jobIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                }`}
                              >
                                <td className="py-4 px-6 font-medium text-blue-600">
                                  {rangeData.weightRange}
                                </td>
                                <td className="py-4 px-6 font-semibold text-slate-800 capitalize">
                                  {job.jobName}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className="px-3 py-1 rounded-full font-semibold text-sm bg-blue-100 text-blue-800">
                                    {job.ordersCount}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className="px-3 py-1 rounded-full font-semibold text-sm bg-emerald-100 text-emerald-800">
                                    ${job.averageIncome.toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className="px-3 py-1 rounded-full font-semibold text-sm bg-amber-100 text-amber-800">
                                    {job.percentage.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span 
                                    className={`px-3 py-1 rounded-full font-semibold text-sm ${
                                      job.ordersCount > 50 
                                        ? 'bg-emerald-500 text-white'
                                        : job.ordersCount > 20 
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {job.ordersCount > 50 ? 'High' : job.ordersCount > 20 ? 'Medium' : 'Low'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
            </Card>
          )}

          {/* Range Editor Modal */}
          {showRangeEditor && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={handleCancelEdit}
            >
              <Card
                className="w-full max-w-3xl mx-4 p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Scale className="h-8 w-8 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-800">Edit Weight Ranges</h3>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 rounded-lg border-2 border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {tempRanges.map((range, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-4 rounded-lg border-2 border-slate-200 bg-slate-50"
                    >
                      <span className="px-3 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-3 flex-1">
                        <label className="font-semibold text-slate-700">Min:</label>
                        <input
                          type="number"
                          value={range.min}
                          onChange={(e) => handleRangeChange(index, 'min', Number(e.target.value))}
                          className="w-32 px-3 py-2 border-2 border-slate-300 rounded-lg font-medium focus:border-blue-500 focus:outline-none"
                        />
                        <label className="font-semibold text-slate-700">Max:</label>
                        <input
                          type="number"
                          value={range.max}
                          onChange={(e) => handleRangeChange(index, 'max', Number(e.target.value))}
                          className="w-32 px-3 py-2 border-2 border-slate-300 rounded-lg font-medium focus:border-blue-500 focus:outline-none"
                        />
                        <span className="font-medium text-slate-600">lbs</span>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveRange(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Button onClick={handleAddRange}>
                      <Plus className="h-4 w-4" />
                      Add Range
                    </Button>
                    <Button onClick={resetToDefaults}>
                      <Undo className="h-4 w-4" />
                      Reset to Defaults
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleCancelEdit}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveRanges}>
                      <Save className="h-4 w-4" />
                      Apply Changes
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {processedData.length === 0 && (
            <Card className="text-center p-12">
              <BarChart3 className="mx-auto mb-6 h-20 w-20 text-slate-400" />
              <h3 className="text-2xl font-bold mb-4 text-slate-800">No Historical Data Available</h3>
              <p className="text-lg text-slate-600 mb-6">
                No data found for the current weight ranges. Try adjusting the ranges or check back later.
              </p>
              <Button variant="primary" onClick={handleEditRanges}>
                <Settings className="h-4 w-4" />
                Configure Weight Ranges
              </Button>
            </Card>
          )}

          {/* Insights Footer */}
          {processedData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-8 w-8 text-amber-600" />
                <h3 className="text-2xl font-bold text-amber-600">AI-Powered Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card hover className="p-4 text-center border-blue-200">
                  <Trophy className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                  <h4 className="font-bold mb-2 text-blue-600">Most Popular Job</h4>
                  <p className="font-semibold text-slate-800 mb-1">{insights.topJob?.jobName || 'N/A'}</p>
                  <p className="text-sm text-slate-600">{insights.topJob?.ordersCount || 0} orders</p>
                </Card>
                
                <Card hover className="p-4 text-center border-emerald-200">
                  <Gem className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                  <h4 className="font-bold mb-2 text-emerald-600">Highest Income</h4>
                  <p className="font-semibold text-slate-800 mb-1">{insights.highestIncome?.jobName || 'N/A'}</p>
                  <p className="text-sm text-slate-600">${insights.highestIncome?.averageIncome?.toFixed(2) || 0}</p>
                </Card>
                
                <Card hover className="p-4 text-center border-amber-200">
                  <Target className="mx-auto mb-2 h-8 w-8 text-amber-600" />
                  <h4 className="font-bold mb-2 text-amber-600">Best Balance</h4>
                  <p className="font-semibold text-slate-800 mb-1">{insights.mostBalanced?.jobName || 'N/A'}</p>
                  <p className="text-sm text-slate-600">
                    {insights.mostBalanced?.ordersCount || 0} orders × ${insights.mostBalanced?.averageIncome?.toFixed(2) || 0}
                  </p>
                </Card>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default HistoricalAnalysis;