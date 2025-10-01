import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Weight, Briefcase, TrendingUp, AlertCircle } from 'lucide-react';
import { fetchPredictedIncome, IncomeRegressionResponse } from '../../data/repositoryIncomeCalculator';
import { jobsAndToolRepository } from '../../../settings/jobAndTools/data/JobsAndToolsRepository';
import { JobModel } from '../../../settings/jobAndTools/data/JobsAndToolsRepository';

interface IncomeCalculatorProps {
  className?: string;
}

const IncomeCalculator: React.FC<IncomeCalculatorProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IncomeRegressionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedJob, setSelectedJob] = useState('');
  const [weight, setWeight] = useState<number>(2500);
  const [jobs, setJobs] = useState<JobModel[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [inputLabel, setInputLabel] = useState<'weight' | 'operators'>('weight');

  // Load jobs on component mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoadingJobs(true);
        const jobsList = await jobsAndToolRepository.listJobs();
        setJobs(jobsList);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobs();
  }, []);

  // Detect job type and change input label
  useEffect(() => {
    const jobLower = selectedJob.toLowerCase();
    if (jobLower === 'workhouse' || jobLower === 'warehouse') {
      setInputLabel('operators');
    } else {
      setInputLabel('weight');
    }
  }, [selectedJob]);

  const handleCalculate = async () => {
    if (!selectedJob || weight <= 0) {
      setError('Please select a job and enter a valid weight');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetchPredictedIncome(selectedJob, weight);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculating income');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedJob('');
    setWeight(2500);
    setResult(null);
    setError(null);
  };

  return (
    <div className={`${className}`}>
      <div 
        className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300"
        style={{ borderColor: '#059669' }}
      >
        {/* Header - Always visible */}
        <div 
          className="p-4 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: '#059669' }}
            >
              <Calculator size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: '#0B2863' }}>
                Income Predictor
              </h3>
              <p className="text-sm text-gray-600">
                Predict income by job & weight
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {result && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                style={{ backgroundColor: '#059669', color: 'white' }}
              >
                <DollarSign size={12} />
                ${result.data.predicted_income.toFixed(2)}
              </div>
            )}
            <div 
              className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <TrendingUp size={16} style={{ color: '#059669' }} />
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-emerald-200">
            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Job Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
                  <Briefcase size={14} className="inline mr-1" />
                  Job Type
                </label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                  disabled={loading || loadingJobs}
                >
                  <option value="">Select a job...</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.name}>
                      {job.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
                  {inputLabel === 'weight' ? (
                    <>
                      <Weight size={14} className="inline mr-1" />
                      Weight (lbs)
                    </>
                  ) : (
                    <>
                      <Briefcase size={14} className="inline mr-1" />
                      Number of operators
                    </>
                  )}
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                  placeholder={inputLabel === 'weight' ? "2500" : "Number of operators"}
                  min="1"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm font-semibold border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                disabled={loading}
              >
                Reset
              </button>
              <button
                onClick={handleCalculate}
                disabled={loading || !selectedJob || weight <= 0}
                className={`px-6 py-2 text-sm font-semibold rounded-lg text-white transition-all duration-200 flex items-center gap-2 ${
                  loading || !selectedJob || weight <= 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'hover:shadow-lg hover:-translate-y-0.5'
                }`}
                style={{
                  backgroundColor: loading || !selectedJob || weight <= 0 ? '#9ca3af' : '#059669'
                }}
              >
                {loading ? (
                  <>
                    <Calculator size={14} className="animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <Calculator size={14} />
                    Predict
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div 
                className="mt-4 p-4 rounded-xl border-2"
                style={{ 
                  backgroundColor: '#d1fae5', 
                  borderColor: '#059669' 
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2" style={{ color: '#0B2863' }}>
                      <DollarSign size={20} style={{ color: '#059669' }} />
                      Predicted Income
                    </h4>
                    <div className="mt-2 space-y-1 text-sm">
                      {inputLabel === 'weight' ? (
                        <p>
                          <span className="font-semibold">Weight:</span>{" "}
                          {result.data.value
                            ? Number(result.data.value).toLocaleString()
                            : "-"} lbs
                        </p>
                      ) : (
                        <p>
                          <span className="font-semibold">Operators:</span>{" "}
                          {result.data.value
                            ? Number(result.data.value).toLocaleString()
                            : "-"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div 
                      className="text-3xl font-bold"
                      style={{ color: '#059669' }}
                    >
                      ${result.data.predicted_income?.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      predicted by regression
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 bg-white/50 rounded-lg p-2">
                  💡 <strong>Tip:</strong> This is a prediction based on historical data for this job and {inputLabel === 'weight' ? 'weight' : 'operators'}.
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div 
                className="mt-4 p-3 rounded-lg border-2 flex items-start gap-2"
                style={{ 
                  backgroundColor: '#fef2f2', 
                  borderColor: '#ef4444' 
                }}
              >
                <AlertCircle size={16} className="text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Error</p>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Loading Jobs State */}
            {loadingJobs && (
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <Calculator size={14} className="animate-spin" />
                  Loading jobs...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeCalculator;