import { useState, useEffect } from 'react';
import { fetchCompanyLoansSummary } from '../data/repositoryLoansSummary';
import { CompanyLoansSummaryResponse, LoansSummaryFilters } from '../domain/LoansSummaryModels';
import LoaderSpinner from '../../components/Login_Register/LoadingSpinner';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
  switch (status) {
    case 'unpaid':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'paid':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'canceled':
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    default:
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  }
};

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    cash: 'Cash',
    deduction: 'Payroll Deduction',
    transfer: 'Bank Transfer',
    check: 'Check'
  };
  return labels[method] || method;
};

const getPaymentMethodIcon = (method: string): string => {
  const icons: Record<string, string> = {
    cash: 'fa-money-bill-wave',
    deduction: 'fa-file-invoice-dollar',
    transfer: 'fa-university',
    check: 'fa-money-check'
  };
  return icons[method] || 'fa-credit-card';
};

const LoansSummary = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompanyLoansSummaryResponse | null>(null);
  const [filterMode, setFilterMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('4'); // Default: 4 semanas
  
  // Custom range states
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  });

  const getWeekDateRange = (year: number, week: number): { start: string; end: string } => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
    const endDate = new Date(startDate.getTime() + 6 * 86400000);

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  };

  const loadData = async (filters?: LoansSummaryFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCompanyLoansSummary(filters);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading loans summary');
      console.error('Error loading loans summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filters: LoansSummaryFilters = {};
    
    if (filterMode === 'preset') {
      if (selectedPeriod !== 'all') {
        filters.weeks = parseInt(selectedPeriod);
      }
    } else {
      // Custom range mode
      const { start, end } = getWeekDateRange(selectedYear, selectedWeek);
      filters.start_date = start;
      filters.end_date = end;
    }
    
    loadData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, filterMode, selectedYear, selectedWeek]);

  const handleRefresh = () => {
    const filters: LoansSummaryFilters = {};
    
    if (filterMode === 'preset') {
      if (selectedPeriod !== 'all') {
        filters.weeks = parseInt(selectedPeriod);
      }
    } else {
      const { start, end } = getWeekDateRange(selectedYear, selectedWeek);
      filters.start_date = start;
      filters.end_date = end;
    }
    
    loadData(filters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white rounded-xl border-2 border-blue-900">
        <div className="flex flex-col items-center gap-4">
          <LoaderSpinner />
          <span className="text-base font-semibold text-blue-900">Loading loans summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-300">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-bold mb-3 text-blue-900">Error Loading Loans Summary</h3>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg bg-blue-900"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { loans_summary, payments_summary, weekly_breakdown, overall, period } = data;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-900">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <i className="fas fa-hand-holding-usd"></i>
                Operator Loans Summary
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {period.start_date && period.end_date 
                  ? `${formatDate(period.start_date)} → ${formatDate(period.end_date)}`
                  : 'All historical data'}
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-2 bg-blue-900 text-white rounded-lg text-sm hover:bg-blue-800 transition-all disabled:opacity-50 font-semibold"
            >
              <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>

          {/* Filter Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('preset')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterMode === 'preset' 
                  ? 'bg-blue-900 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <i className="fas fa-clock mr-2"></i>
              Quick Periods
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterMode === 'custom' 
                  ? 'bg-blue-900 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              Custom Week
            </button>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filterMode === 'preset' ? (
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-semibold hover:border-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="1">Last Week</option>
                <option value="4">Last Month</option>
                <option value="12">Last Quarter</option>
                <option value="24">Last 6 Months</option>
                <option value="52">Last Year</option>
                <option value="all">All Time</option>
              </select>
            ) : (
              <>
                <YearPicker
                  year={selectedYear}
                  onYearSelect={setSelectedYear}
                  min={2015}
                  max={currentYear + 1}
                />
                <WeekPicker
                  week={selectedWeek}
                  onWeekSelect={setSelectedWeek}
                  min={1}
                  max={52}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3">
        {/* Info Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <i className="fas fa-info-circle text-yellow-600"></i>
            <p className="text-xs font-semibold text-yellow-800">
              Note: The first two cards (Total Pending & Active Loans) show <span className="underline">overall company statistics</span>. 
              The last two cards (Total Loaned & Total Paid) along with tables below are <span className="underline">filtered</span> by your selected time period.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pending */}
          <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-red-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <i className="fas fa-exclamation-circle text-red-600"></i>
            </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">OVERALL</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">PENDING</span>
              </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(overall.total_pending_amount)}</div>
          <div className="text-xs text-gray-600 mt-1">Total Pending Amount</div>
        </div>

        {/* Active Loans */}
        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-orange-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <i className="fas fa-file-invoice text-orange-600"></i>
            </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">OVERALL</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">ACTIVE</span>
              </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">{overall.active_loans_count}</div>
          <div className="text-xs text-gray-600 mt-1">Active Loans</div>
        </div>

        {/* Total Loaned */}
        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="fas fa-hand-holding-usd text-blue-600"></i>
            </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">FILTERED</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">{loans_summary.total_loans} LOANS</span>
              </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(loans_summary.total_amount_loaned)}</div>
          <div className="text-xs text-gray-600 mt-1">Total Amount Loaned</div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-green-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">FILTERED</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">{payments_summary.total_payments} PAYMENTS</span>
              </div>
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(payments_summary.total_amount_paid)}</div>
          <div className="text-xs text-gray-600 mt-1">Total Amount Paid</div>
        </div>
      </div>
      </div>

      {/* Breakdown Tables */}
      <div className="space-y-6">
        {/* Period Filter Info */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <i className="fas fa-filter text-blue-600"></i>
            <p className="text-xs font-semibold text-blue-800">
              The data below is <span className="underline">filtered</span> based on your selected time period.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loans by Status */}
        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-900">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie"></i>
            Loans by Status
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 text-sm">Status</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700 text-sm">Count</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700 text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loans_summary.by_status.map((item, index) => {
                  const colors = getStatusColor(item.status);
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${colors.bg} ${colors.text} ${colors.border} border`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-800">{item.count}</td>
                      <td className="py-3 px-3 text-right font-bold text-blue-900">{formatCurrency(item.total_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td className="py-3 px-3 font-bold text-blue-900">Total</td>
                  <td className="py-3 px-3 text-right font-bold text-blue-900">{loans_summary.total_loans}</td>
                  <td className="py-3 px-3 text-right font-bold text-blue-900">{formatCurrency(loans_summary.total_amount_loaned)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payments by Method */}
        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-900">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <i className="fas fa-wallet"></i>
            Payments by Method
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 text-sm">Method</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700 text-sm">Count</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700 text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments_summary.by_payment_method.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <i className={`fas ${getPaymentMethodIcon(item.payment_method)} text-green-600 text-xs`}></i>
                        </div>
                        <span className="font-medium text-gray-800 text-sm">{getPaymentMethodLabel(item.payment_method)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-800">{item.count}</td>
                    <td className="py-3 px-3 text-right font-bold text-green-600">{formatCurrency(item.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-50 border-t-2 border-green-200">
                  <td className="py-3 px-3 font-bold text-green-900">Total</td>
                  <td className="py-3 px-3 text-right font-bold text-green-900">{payments_summary.total_payments}</td>
                  <td className="py-3 px-3 text-right font-bold text-green-900">{formatCurrency(payments_summary.total_amount_paid)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      </div>

      {/* Weekly Breakdown */}
      {(weekly_breakdown.loans.length > 0 || weekly_breakdown.payments.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-900">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <i className="fas fa-calendar-week"></i>
            Weekly Breakdown
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Loans */}
            {weekly_breakdown.loans.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-arrow-circle-up text-blue-500"></i>
                  Loans per Week
                </h4>
                <div className="space-y-2">
                  {weekly_breakdown.loans.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                          <i className="fas fa-calendar text-blue-700 text-xs"></i>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{formatDate(item.week)}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-700">{formatCurrency(item.amount_loaned)}</div>
                        <div className="text-xs text-gray-500">{item.loans_count} loans</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Payments */}
            {weekly_breakdown.payments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-arrow-circle-down text-green-500"></i>
                  Payments per Week
                </h4>
                <div className="space-y-2">
                  {weekly_breakdown.payments.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                          <i className="fas fa-calendar-check text-green-700 text-xs"></i>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{formatDate(item.week)}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-700">{formatCurrency(item.amount_paid)}</div>
                        <div className="text-xs text-gray-500">{item.payments_count} payments</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-info-circle text-blue-700"></i>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm">About Operator Loans</h4>
            <p className="text-xs text-blue-700 mt-1">
              This summary shows all loans given to operators and their payment status. 
              The pending amount represents money that is still owed by operators. 
              Payments can be made via cash, payroll deduction, bank transfer, or check.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansSummary;
