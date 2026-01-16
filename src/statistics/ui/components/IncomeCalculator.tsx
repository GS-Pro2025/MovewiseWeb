import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Weight,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import {
  fetchPredictedIncome,
  IncomeRegressionResponse
} from '../../data/repositoryIncomeCalculator';
import {
  jobsAndToolRepository,
  JobModel
} from '../../../settings/jobAndTools/data/JobsAndToolsRepository';

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
  const [value, setValue] = useState<number | ''>(2500);
  const [jobs, setJobs] = useState<JobModel[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [inputLabel, setInputLabel] = useState<'weight' | 'operators'>('weight');

  // Load jobs
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

  // Detect job type
  useEffect(() => {
    const jobLower = selectedJob.toLowerCase();
    if (jobLower === 'workhouse' || jobLower === 'warehouse') {
      setInputLabel('operators');
      setValue((prev) => (prev === '' || prev < 1 ? 1 : prev));
    } else {
      setInputLabel('weight');
      setValue((prev) => (prev === '' || prev < 100 ? 100 : prev));
    }
  }, [selectedJob]);

  const minValue = inputLabel === 'weight' ? 100 : 1;

  const handleCalculate = async () => {
    if (!selectedJob || value === '' || value < minValue) {
      setError(
        inputLabel === 'weight'
          ? 'Weight must be at least 100 lbs'
          : 'At least 1 operator is required'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetchPredictedIncome(selectedJob, value);
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
    setValue(2500);
    setResult(null);
    setError(null);
  };

  return (
    <div className={className}>
      <div
        className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 shadow-lg"
        style={{ borderColor: '#059669' }}
      >
        {/* Header */}
        <div
          className="p-4 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600">
              <Calculator size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-blue-900">
                Income Predictor
              </h3>
              <p className="text-sm text-gray-600">
                Predict income by job & value
              </p>
            </div>
          </div>

          {result && (
            <div className="text-sm font-bold text-emerald-700">
              ${result.data.predicted_income.toFixed(2)}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-emerald-200">
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {/* Job */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  <Briefcase size={14} className="inline mr-1" />
                  Job Type
                </label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full px-3 py-2 border-2 rounded-lg"
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
                <label className="block text-sm font-semibold mb-2">
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
                  min={minValue}
                  step={1}
                  value={value}
                  onChange={(e) =>
                    setValue(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border-2 rounded-lg"
                  placeholder={`Minimum ${minValue}`}
                />
                {value !== '' && value < minValue && (
                  <p className="text-xs text-red-500 mt-1">
                    Minimum allowed is {minValue}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 border rounded-lg"
                disabled={loading}
              >
                Reset
              </button>
              <button
                onClick={handleCalculate}
                disabled={loading || !selectedJob || value === '' || value < minValue}
                className="px-6 py-2 rounded-lg text-white font-semibold"
                style={{
                  backgroundColor:
                    loading || !selectedJob || value === '' || value < minValue
                      ? '#9ca3af'
                      : '#059669'
                }}
              >
                {loading ? 'Predicting...' : 'Predict'}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg border border-red-400 bg-red-50 flex gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeCalculator;
