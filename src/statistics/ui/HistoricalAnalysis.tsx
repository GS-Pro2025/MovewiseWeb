import React, { useState, useEffect, useCallback } from 'react';
import { fetchHistoricalJobWeight, processHistoricalJobWeightData } from '../data/repositoryStatistics';
import { WeightRange, HistoricalJobWeightResponse, ProcessedHistoricalData } from '../domain/HistoricalJobWeightModels';

const HistoricalAnalysis: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalJobWeightResponse | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedHistoricalData[]>([]);
  
  // Estados para los rangos de peso
  const [weightRanges, setWeightRanges] = useState<WeightRange[]>([
    { min: 0, max: 999 },
    { min: 1000, max: 4999 },
    { min: 5000, max: 9999 },
    { min: 10000, max: 19999 }
  ]);
  
  const [showRangeEditor, setShowRangeEditor] = useState<boolean>(false);
  const [tempRanges, setTempRanges] = useState<WeightRange[]>([]);

  // Cargar datos históricos
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

  // Handlers para editar rangos
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
      { min: 0, max: 999 },
      { min: 1000, max: 4999 },
      { min: 5000, max: 9999 }
    ];
    setWeightRanges(defaultRanges);
    setShowRangeEditor(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <i className="fas fa-spinner animate-spin text-blue-600 text-xl"></i>
          <span className="text-gray-600">Loading historical analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Historical Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadHistoricalData(weightRanges)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Historical Job Weight Analysis</h2>
            <p className="text-gray-600 mt-1">
              Analyze job types and income across different weight ranges
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadHistoricalData(weightRanges)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
              Refresh
            </button>
            <button
              onClick={handleEditRanges}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-edit"></i>
              Edit Ranges
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {historicalData?.total_orders || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Orders</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {processedData.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Weight Ranges</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {processedData.reduce((sum, range) => sum + range.jobs.length, 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Job Types Found</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${processedData.reduce((sum, range) => 
                sum + range.jobs.reduce((jobSum, job) => jobSum + (job.averageIncome * job.ordersCount), 0), 0
              ).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Income</div>
          </div>
        </div>

        {/* Current Weight Ranges */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Current Weight Ranges:</h3>
          <div className="flex flex-wrap gap-2">
            {weightRanges.map((range, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {range.min} - {range.max} lbs
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Range Editor Modal */}
      {showRangeEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
          onClick={handleCancelEdit}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Weight Ranges</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {tempRanges.map((range, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm text-gray-600">Min:</label>
                    <input
                      type="number"
                      value={range.min}
                      onChange={(e) => handleRangeChange(index, 'min', Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <label className="text-sm text-gray-600">Max:</label>
                    <input
                      type="number"
                      value={range.max}
                      onChange={(e) => handleRangeChange(index, 'max', Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-500">lbs</span>
                  </div>
                  <button
                    onClick={() => handleRemoveRange(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={handleAddRange}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                >
                  <i className="fas fa-plus"></i>
                  Add Range
                </button>
                <button
                  onClick={resetToDefaults}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                >
                  <i className="fas fa-undo"></i>
                  Reset to Defaults
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Data Analysis */}
      <div className="space-y-6">
        {processedData.map((rangeData, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {rangeData.weightRange}
                </h3>
                <p className="text-sm text-gray-600">
                  {rangeData.totalOrdersInRange} orders ({rangeData.rangePercentage.toFixed(1)}% of total)
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {rangeData.totalOrdersInRange}
                </div>
                <div className="text-xs text-gray-500">orders</div>
              </div>
            </div>

            {rangeData.jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rangeData.jobs.map((job, jobIndex) => (
                  <div
                    key={jobIndex}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-gray-800 capitalize text-sm">
                        {job.jobName}
                      </span>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {job.ordersCount} orders
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Income:</span>
                        <span className="font-medium text-green-600">
                          ${job.averageIncome.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">% of Range:</span>
                        <span className="font-medium text-blue-600">
                          {job.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${job.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-inbox text-2xl mb-2"></i>
                <p>No job data available for this weight range</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {processedData.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <i className="fas fa-chart-bar text-4xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Historical Data</h3>
          <p className="text-gray-600">
            No historical data found for the current weight ranges. Try adjusting the ranges or check back later.
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalAnalysis;