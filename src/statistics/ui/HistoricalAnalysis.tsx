import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { fetchHistoricalJobWeight, processHistoricalJobWeightData } from '../data/repositoryStatistics';
import { WeightRange, HistoricalJobWeightResponse, ProcessedHistoricalData } from '../domain/HistoricalJobWeightModels';

const HistoricalAnalysis: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalJobWeightResponse | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedHistoricalData[]>([]);
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'trends' | 'analytics'>('overview');
  
  // Color palette constants
  const COLORS = {
    primary: '#0B2863',
    secondary: '#F09F52', 
    success: '#22c55e',
    danger: '#ef4444',
    background: '#f8fafc',
    white: '#ffffff'
  };

  // Enhanced weight ranges
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

  // Prepare data for different chart types
  const prepareBarData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    return processedData.map((rangeData, index) => ({
      range: rangeData.weightRange.replace(' lbs', ''),
      orders: rangeData.totalOrdersInRange,
      percentage: parseFloat(rangeData.rangePercentage.toFixed(1)),
      avgIncome: rangeData.jobs.length > 0 
        ? parseFloat((rangeData.jobs.reduce((sum, job) => sum + job.averageIncome, 0) / rangeData.jobs.length).toFixed(2))
        : 0,
      color: index % 2 === 0 ? COLORS.primary : COLORS.secondary
    }));
  };

  const preparePieData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    const allJobs = processedData.flatMap(range => 
      range.jobs.map(job => ({
        id: job.jobName,
        label: job.jobName,
        value: job.ordersCount,
        income: job.averageIncome
      }))
    );
    
    const groupedJobs = allJobs.reduce((acc, job) => {
      const existing = acc.find(j => j.id === job.id);
      if (existing) {
        existing.value += job.value;
        existing.income = (existing.income + job.income) / 2;
      } else {
        acc.push(job);
      }
      return acc;
    }, [] as any[]);
    
    // Extended color palette for more variety
    const colorPalette = [
      COLORS.primary, COLORS.secondary, COLORS.success, 
      '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16', '#ec4899',
      '#f97316', '#3b82f6', '#10b981', '#ef4444', '#6366f1',
      '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'
    ];
    
    return groupedJobs
      .sort((a, b) => b.value - a.value)
      .slice(0, 12) // Show more job types
      .map((job, index) => ({
        ...job,
        label: job.label.length > 15 ? job.label.substring(0, 12) + '...' : job.label,
        color: colorPalette[index % colorPalette.length]
      }));
  };

  const prepareLineData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    // Get ALL unique job types, not just top 6
    const allUniqueJobs = [...new Set(processedData.flatMap(range => 
      range.jobs.map(job => job.jobName)
    ))];

    // Extended color palette for more job types
    const colorPalette = [
      COLORS.primary, COLORS.secondary, COLORS.success, 
      '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16', '#ec4899',
      '#f97316', '#3b82f6', '#10b981', '#ef4444', '#6366f1',
      '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'
    ];

    return allUniqueJobs.map((jobName, index) => ({
      id: jobName.length > 15 ? jobName.substring(0, 12) + '...' : jobName,
      color: colorPalette[index % colorPalette.length],
      data: processedData.map((range) => {
        const jobInRange = range.jobs.find(j => j.jobName === jobName);
        return {
          x: range.weightRange.replace(' lbs', ''),
          y: jobInRange ? jobInRange.ordersCount : 0
        };
      })
    }));
  };

  const prepareComparisonData = () => {
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

  // Custom button component
  const Button: React.FC<{
    primary?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    icon?: string;
  }> = ({ primary = false, children, onClick, disabled, className = '', icon }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        backgroundColor: primary ? COLORS.primary : 'transparent',
        color: primary ? COLORS.white : COLORS.primary,
        border: !primary ? `2px solid ${COLORS.primary}` : 'none'
      }}
    >
      {icon && <i className={icon}></i>}
      {children}
    </button>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.background }}>
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-4">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent"
              style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}
            ></div>
            <span className="text-xl font-semibold" style={{ color: COLORS.primary }}>
              Loading Analytics Dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.background }}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div 
            className="text-center p-8 rounded-2xl shadow-lg border-2"
            style={{ backgroundColor: COLORS.white, borderColor: COLORS.danger }}
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.danger }}>
              Error Loading Data
            </h3>
            <p className="text-gray-600 mb-6 text-lg">{error}</p>
            <Button primary onClick={() => loadHistoricalData(weightRanges)} icon="fas fa-refresh">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.background }}>
      {/* Main Header Card */}
      <div 
        className="rounded-2xl shadow-lg border-2 p-8 mb-6"
        style={{ backgroundColor: COLORS.white, borderColor: COLORS.primary }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">📊</span>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>
                Historical Weight Analytics
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Advanced insights with modern visualizations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => loadHistoricalData(weightRanges)} disabled={loading} icon="fas fa-sync-alt">
              Refresh Data
            </Button>
            <Button primary onClick={handleEditRanges} icon="fas fa-edit">
              Edit Ranges
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { 
              title: 'Total Orders', 
              value: historicalData?.total_orders || 0, 
              icon: '📦', 
              color: COLORS.primary 
            },
            { 
              title: 'Weight Ranges', 
              value: processedData.length, 
              icon: '⚖️', 
              color: COLORS.secondary 
            },
            { 
              title: 'Job Types', 
              value: processedData.reduce((sum, range) => sum + range.jobs.length, 0), 
              icon: '🏷️', 
              color: COLORS.success 
            },
            { 
              title: 'Avg Income', 
              value: `${(() => {
                const allJobs = processedData.flatMap(range => range.jobs);
                const avgIncome = allJobs.length > 0 
                  ? allJobs.reduce((sum, job) => sum + job.averageIncome, 0) / allJobs.length 
                  : 0;
                return avgIncome.toFixed(0);
              })()}`, 
              icon: '💰', 
              color: '#8b5cf6',
              subtitle: 'Per Job Type'
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl shadow-md border-2 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              style={{ backgroundColor: COLORS.white, borderColor: stat.color }}
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-600">{stat.title}</div>
              {stat.subtitle && (
                <div className="text-xs text-gray-500">{stat.subtitle}</div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced View Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold" style={{ color: COLORS.primary }}>
            📈 Visualization:
          </span>
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'detailed', label: 'Job Types', icon: '🥧' },
            { key: 'trends', label: 'Trends', icon: '📈' },
            { key: 'analytics', label: 'Analytics', icon: '🔍' }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-md flex items-center gap-2 ${
                activeView === view.key ? 'shadow-md -translate-y-0.5' : ''
              }`}
              style={{
                backgroundColor: activeView === view.key ? COLORS.primary : COLORS.white,
                color: activeView === view.key ? COLORS.white : COLORS.primary,
                border: `2px solid ${COLORS.primary}`
              }}
            >
              <span>{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {/* Weight Ranges Display */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: COLORS.primary }}>
            ⚖️ Current Weight Ranges:
          </h3>
          <div className="flex flex-wrap gap-3">
            {weightRanges.map((range, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full text-sm font-semibold border-2"
                style={{ 
                  backgroundColor: index % 2 === 0 ? COLORS.primary : COLORS.secondary,
                  color: COLORS.white,
                  borderColor: index % 2 === 0 ? COLORS.primary : COLORS.secondary
                }}
              >
                {range.min} - {range.max} lbs
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Visualizations */}
      {processedData.length > 0 && (
        <div 
          className="rounded-2xl shadow-lg border-2 p-8"
          style={{ backgroundColor: COLORS.white, borderColor: COLORS.primary }}
        >
          {activeView === 'overview' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📊</span>
                <h3 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                  Orders Distribution by Weight Range
                </h3>
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
                  colors={{ datum: 'color' }}
                  borderRadius={8}
                  borderWidth={2}
                  borderColor={COLORS.white}
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
                  labelTextColor={COLORS.white}
                  animate={true}
                  motionStiffness={90}
                  motionDamping={15}
                  tooltip={({ indexValue, value, data }) => (
                    <div 
                      className="p-4 rounded-xl shadow-lg border-2"
                      style={{ backgroundColor: COLORS.white, borderColor: COLORS.primary }}
                    >
                      <strong style={{ color: COLORS.primary }}>{indexValue}</strong><br />
                      Orders: <span style={{ color: COLORS.success }}>{value}</span><br />
                      Percentage: <span style={{ color: COLORS.secondary }}>{data.percentage}%</span><br />
                      Avg Income: <span style={{ color: COLORS.success }}>${data.avgIncome}</span>
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          {activeView === 'detailed' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🥧</span>
                <h3 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                  Job Type Distribution Analysis
                </h3>
              </div>
              <div style={{ height: 500 }}>
                <ResponsivePie
                  data={preparePieData()}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ datum: 'color' }}
                  borderWidth={3}
                  borderColor={COLORS.white}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor={COLORS.primary}
                  arcLinkLabelsThickness={3}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={COLORS.white}
                  animate={true}
                  motionStiffness={90}
                  motionDamping={15}
                  tooltip={({ datum }) => (
                    <div 
                      className="p-4 rounded-xl shadow-lg border-2"
                      style={{ backgroundColor: COLORS.white, borderColor: COLORS.primary }}
                    >
                      <strong style={{ color: COLORS.primary }}>{datum.data.id}</strong><br />
                      Orders: <span style={{ color: COLORS.success }}>{datum.value}</span><br />
                      Avg Income: <span style={{ color: COLORS.success }}>${datum.data.income?.toFixed(2)}</span>
                    </div>
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
                      itemTextColor: COLORS.primary,
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
                <span className="text-3xl">📈</span>
                <h3 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                  Job Trends Across Weight Ranges
                </h3>
              </div>
              <div style={{ height: 500 }}>
                <ResponsiveLine
                  data={prepareLineData()}
                  margin={{ top: 50, right: 110, bottom: 100, left: 80 }}
                  xScale={{ type: 'point' }}
                  yScale={{
                    type: 'linear',
                    min: 0,
                    max: 'auto',
                    stacked: false,
                    reverse: false
                  }}
                  yFormat=" >-.0f"
                  curve="cardinal"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    orient: 'bottom',
                    tickSize: 5,
                    tickPadding: 10,
                    tickRotation: -45,
                    legend: 'Weight Ranges',
                    legendOffset: 80,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    orient: 'left',
                    tickSize: 5,
                    tickPadding: 10,
                    tickRotation: 0,
                    legend: 'Number of Orders',
                    legendOffset: -60,
                    legendPosition: 'middle'
                  }}
                  pointSize={10}
                  pointColor={COLORS.white}
                  pointBorderWidth={3}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  colors={{ datum: 'color' }}
                  lineWidth={4}
                  enableArea={true}
                  areaOpacity={0.1}
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
                      itemTextColor: COLORS.primary
                    }
                  ]}
                  animate={true}
                  motionStiffness={90}
                  motionDamping={15}
                />
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🔍</span>
                <h3 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                  Advanced Analytics Dashboard
                </h3>
              </div>
              
              {/* Multi-metric comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Orders Chart */}
                <div 
                  className="p-6 rounded-xl border-2"
                  style={{ borderColor: COLORS.primary, backgroundColor: '#fefefe' }}
                >
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.primary }}>
                    📊 Orders by Range
                  </h4>
                  <div style={{ height: 300 }}>
                    <ResponsiveBar
                      data={prepareComparisonData()}
                      keys={['orders']}
                      indexBy="range"
                      margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                      padding={0.3}
                      colors={[COLORS.primary]}
                      borderRadius={6}
                      borderWidth={2}
                      borderColor={COLORS.white}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Orders',
                        legendPosition: 'middle',
                        legendOffset: -40
                      }}
                      labelTextColor={COLORS.white}
                      animate={true}
                      motionStiffness={90}
                      motionDamping={15}
                    />
                  </div>
                </div>

                {/* Income Chart */}
                <div 
                  className="p-6 rounded-xl border-2"
                  style={{ borderColor: COLORS.success, backgroundColor: '#fefefe' }}
                >
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.success }}>
                    💰 Average Income
                  </h4>
                  <div style={{ height: 300 }}>
                    <ResponsiveBar
                      data={prepareComparisonData()}
                      keys={['avgIncome']}
                      indexBy="range"
                      margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                      padding={0.3}
                      colors={[COLORS.success]}
                      borderRadius={6}
                      borderWidth={2}
                      borderColor={COLORS.white}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Avg Income ($)',
                        legendPosition: 'middle',
                        legendOffset: -60
                      }}
                      labelTextColor={COLORS.white}
                      animate={true}
                      motionStiffness={90}
                      motionDamping={15}
                    />
                  </div>
                </div>
              </div>

              {/* Job Types Pie Chart */}
              <div 
                className="p-6 rounded-xl border-2 mb-8"
                style={{ borderColor: COLORS.secondary, backgroundColor: '#fefefe' }}
              >
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.secondary }}>
                  🥧 Top Job Types Distribution
                </h4>
                <div style={{ height: 400 }}>
                  <ResponsivePie
                    data={preparePieData()}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ datum: 'color' }}
                    borderWidth={3}
                    borderColor={COLORS.white}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor={COLORS.primary}
                    arcLinkLabelsThickness={3}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={COLORS.white}
                    tooltip={({ datum }) => (
                      <div 
                        className="p-4 rounded-xl shadow-lg border-2"
                        style={{ backgroundColor: COLORS.white, borderColor: COLORS.primary }}
                      >
                        <strong style={{ color: COLORS.primary }}>{datum.data.id}</strong><br />
                        Orders: <span style={{ color: COLORS.success }}>{datum.value}</span><br />
                        Avg Income: <span style={{ color: COLORS.success }}>${datum.data.income?.toFixed(2)}</span>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Detailed Analytics Table */}
              <div 
                className="p-6 rounded-xl border-2"
                style={{ borderColor: COLORS.primary, backgroundColor: '#fefefe' }}
              >
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.primary }}>
                  📋 Detailed Job Analytics
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr 
                        className="border-b-2"
                        style={{ 
                          backgroundColor: COLORS.primary,
                          borderColor: COLORS.primary 
                        }}
                      >
                        <th className="text-left py-4 px-6 font-bold text-white">Weight Range</th>
                        <th className="text-left py-4 px-6 font-bold text-white">Job Type</th>
                        <th className="text-center py-4 px-6 font-bold text-white">Orders</th>
                        <th className="text-center py-4 px-6 font-bold text-white">Avg Income</th>
                        <th className="text-center py-4 px-6 font-bold text-white">Range %</th>
                        <th className="text-center py-4 px-6 font-bold text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.flatMap(rangeData =>
                        rangeData.jobs.map((job, jobIndex) => (
                          <tr 
                            key={`${rangeData.weightRange}-${jobIndex}`} 
                            className={`border-b transition-all duration-200 hover:shadow-md ${
                              jobIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                            }`}
                            style={{ borderColor: '#e5e7eb' }}
                          >
                            <td className="py-4 px-6 font-medium" style={{ color: COLORS.primary }}>
                              {rangeData.weightRange}
                            </td>
                            <td className="py-4 px-6 font-semibold text-gray-800 capitalize">
                              {job.jobName}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span 
                                className="px-3 py-1 rounded-full font-bold text-sm"
                                style={{ 
                                  backgroundColor: COLORS.primary + '20',
                                  color: COLORS.primary 
                                }}
                              >
                                {job.ordersCount}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span 
                                className="px-3 py-1 rounded-full font-bold text-sm"
                                style={{ 
                                  backgroundColor: COLORS.success + '20',
                                  color: COLORS.success 
                                }}
                              >
                                ${job.averageIncome.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span 
                                className="px-3 py-1 rounded-full font-bold text-sm"
                                style={{ 
                                  backgroundColor: COLORS.secondary + '20',
                                  color: COLORS.secondary 
                                }}
                              >
                                {job.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span 
                                className={`px-3 py-1 rounded-full font-bold text-sm ${
                                  job.ordersCount > 50 
                                    ? 'text-white'
                                    : job.ordersCount > 20 
                                    ? 'text-white'
                                    : ''
                                }`}
                                style={{ 
                                  backgroundColor: job.ordersCount > 50 
                                    ? COLORS.success 
                                    : job.ordersCount > 20 
                                    ? COLORS.secondary 
                                    : COLORS.primary + '40',
                                  color: job.ordersCount > 50 
                                    ? COLORS.white 
                                    : job.ordersCount > 20 
                                    ? COLORS.white 
                                    : COLORS.primary
                                }}
                              >
                                {job.ordersCount > 50 ? '🔥 High' : job.ordersCount > 20 ? '📈 Medium' : '📊 Low'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Range Editor Modal */}
      {showRangeEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(11, 40, 99, 0.1)' }}
          onClick={handleCancelEdit}
        >
          <div
            className="rounded-2xl shadow-xl border-2 p-8 w-full max-w-3xl mx-4"
            style={{ backgroundColor: COLORS.white, borderColor: COLORS.primary }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚖️</span>
                <h3 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                  Edit Weight Ranges
                </h3>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-2 rounded-xl transition-all duration-200 hover:shadow-md"
                style={{ color: COLORS.primary, border: `2px solid ${COLORS.primary}` }}
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {tempRanges.map((range, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-4 rounded-xl border-2"
                  style={{ borderColor: COLORS.primary + '40' }}
                >
                  <span 
                    className="px-3 py-2 rounded-lg font-bold text-sm"
                    style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                  >
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-3 flex-1">
                    <label className="font-semibold" style={{ color: COLORS.primary }}>Min:</label>
                    <input
                      type="number"
                      value={range.min}
                      onChange={(e) => handleRangeChange(index, 'min', Number(e.target.value))}
                      className="w-32 px-3 py-2 border-2 rounded-lg font-medium"
                      style={{ borderColor: COLORS.primary }}
                    />
                    <label className="font-semibold" style={{ color: COLORS.primary }}>Max:</label>
                    <input
                      type="number"
                      value={range.max}
                      onChange={(e) => handleRangeChange(index, 'max', Number(e.target.value))}
                      className="w-32 px-3 py-2 border-2 rounded-lg font-medium"
                      style={{ borderColor: COLORS.primary }}
                    />
                    <span className="font-medium text-gray-600">lbs</span>
                  </div>
                  <button
                    onClick={() => handleRemoveRange(index)}
                    className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                    style={{ color: COLORS.danger, border: `2px solid ${COLORS.danger}` }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button onClick={handleAddRange} icon="fas fa-plus">
                  Add Range
                </Button>
                <Button onClick={resetToDefaults} icon="fas fa-undo">
                  Reset to Defaults
                </Button>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button primary onClick={handleSaveRanges} icon="fas fa-save">
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {processedData.length === 0 && !loading && (
        <div 
          className="text-center p-12 rounded-2xl shadow-lg border-2"
          style={{ backgroundColor: COLORS.white, borderColor: COLORS.primary }}
        >
          <div className="text-8xl mb-6">📊</div>
          <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.primary }}>
            No Historical Data Available
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            No data found for the current weight ranges. Try adjusting the ranges or check back later.
          </p>
          <Button primary onClick={handleEditRanges} icon="fas fa-edit">
            Configure Weight Ranges
          </Button>
        </div>
      )}

      {/* AI-Powered Insights Footer */}
      {processedData.length > 0 && (
        <div 
          className="mt-6 p-6 rounded-2xl shadow-lg border-2"
          style={{ backgroundColor: COLORS.white, borderColor: COLORS.secondary }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🧠</span>
            <h3 className="text-2xl font-bold" style={{ color: COLORS.secondary }}>
              AI-Powered Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(() => {
              const allJobs = processedData.flatMap(range => range.jobs);
              const topJob = allJobs.sort((a, b) => b.ordersCount - a.ordersCount)[0];
              const highestIncome = allJobs.sort((a, b) => b.averageIncome - a.averageIncome)[0];
              const mostBalanced = allJobs.sort((a, b) => (b.ordersCount * b.averageIncome) - (a.ordersCount * a.averageIncome))[0];
              
              return [
                {
                  title: 'Most Popular Job',
                  value: topJob?.jobName || 'N/A',
                  detail: `${topJob?.ordersCount || 0} orders`,
                  icon: '🏆',
                  color: COLORS.primary
                },
                {
                  title: 'Highest Income',
                  value: highestIncome?.jobName || 'N/A',
                  detail: `${highestIncome?.averageIncome?.toFixed(2) || 0}`,
                  icon: '💎',
                  color: COLORS.success
                },
                {
                  title: 'Best Balance',
                  value: mostBalanced?.jobName || 'N/A',
                  detail: `${mostBalanced?.ordersCount || 0} orders × ${mostBalanced?.averageIncome?.toFixed(2) || 0}`,
                  icon: '🎯',
                  color: COLORS.secondary
                }
              ];
            })().map((insight, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl border-2 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-1"
                style={{ backgroundColor: COLORS.white, borderColor: insight.color }}
              >
                <div className="text-2xl mb-2">{insight.icon}</div>
                <h4 className="font-bold mb-2" style={{ color: insight.color }}>
                  {insight.title}
                </h4>
                <p className="font-semibold text-gray-800 mb-1">{insight.value}</p>
                <p className="text-sm text-gray-600">{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalAnalysis;