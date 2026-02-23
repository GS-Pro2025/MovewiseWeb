import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, FileText, DollarSign, TrendingUp, TrendingDown, Filter, Calendar } from 'lucide-react';
import { WeekSummary } from '../domain/StatementModels';
import WeekPicker from '../../components/WeekPicker';

interface StatementFiltersProps {
  week: number;
  year: number;
  weekRange: { start: string; end: string };
  searchQuery: string;
  onWeekChange: (week: number) => void;
  onYearChange: (year: number) => void;
  onSearchQueryChange: (query: string) => void;
  weekSummary: WeekSummary | null;
  totalRecords: number;
}

const COLORS = {
  primary: '#0B2863', secondary: '#F09F52', success: '#22c55e',
  error: '#ef4444', warning: '#f59e0b', gray: '#6b7280',
};

export const StatementFilters: React.FC<StatementFiltersProps> = ({
  week, year, weekRange, searchQuery,
  onWeekChange, onYearChange, onSearchQueryChange,
  weekSummary, totalRecords,
}) => {
  const { t } = useTranslation();

  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
  };

  const getStateChipColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'processed':  return COLORS.success;
      case 'exists':     return COLORS.warning;
      case 'not_exists': return COLORS.error;
      default:           return COLORS.gray;
    }
  };

  const formatStateName = (state: string): string => {
    switch (state.toLowerCase()) {
      case 'not_exists': return t('statementFilters.stateNotExists');
      case 'exists':     return t('statementFilters.stateExists');
      case 'processed':  return t('statementFilters.stateProcessed');
      default:           return state;
    }
  };

  const focusStyle = { onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.boxShadow = '0 0 0 3px rgba(11, 40, 99, 0.3)'; }, onBlur: (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.boxShadow = 'none'; } };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4 mb-4 overflow-hidden" style={{ borderColor: COLORS.primary }}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={18} className="flex-shrink-0" style={{ color: COLORS.primary }} />
        <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: COLORS.primary }}>
          {t('statementFilters.title', { week, year })}
        </h3>
      </div>

      {/* Week / Year / Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div className="relative w-full">
          <label className="block text-xs font-bold mb-1" style={{ color: COLORS.primary }}>
            {t('statementFilters.weekLabel')}
          </label>
          <WeekPicker week={week} onWeekSelect={onWeekChange} min={1} max={53} />
        </div>

        <div className="w-full">
          <label className="block text-xs font-bold mb-1" style={{ color: COLORS.primary }}>
            {t('statementFilters.yearLabel')}
          </label>
          <input type="number" value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value) || new Date().getFullYear())}
            min={2020} max={2030}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ borderColor: COLORS.primary }}
            {...focusStyle}
          />
        </div>

        <div className="col-span-1 sm:col-span-2 flex items-center gap-2 p-2 rounded-lg border overflow-hidden" style={{ borderColor: COLORS.secondary }}>
          <Calendar size={14} className="flex-shrink-0" style={{ color: COLORS.secondary }} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: COLORS.gray }}>
              {t('statementFilters.dateRange')}
            </span>
            <span className="text-xs font-bold truncate" style={{ color: COLORS.primary }}>
              {weekRange.start} → {weekRange.end}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t my-3" style={{ borderColor: COLORS.primary }} />

      {/* Search */}
      <div className="flex items-center gap-2 mb-2">
        <Filter size={14} className="flex-shrink-0" style={{ color: COLORS.primary }} />
        <h4 className="text-xs sm:text-sm font-bold" style={{ color: COLORS.primary }}>
          {t('statementFilters.searchTitle')}
        </h4>
      </div>

      <div className="w-full mb-3">
        <label className="block text-xs font-bold mb-1" style={{ color: COLORS.primary }}>
          {t('statementFilters.searchLabel')}
        </label>
        <input type="text" value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t('statementFilters.searchPlaceholder')}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
          style={{ borderColor: COLORS.primary }}
          {...focusStyle}
        />
        <p className="text-xs mt-1" style={{ color: COLORS.gray }}>
          {t('statementFilters.searchHelper')}
        </p>
      </div>

      <div className="border-t my-3" style={{ borderColor: COLORS.primary }} />

      {/* Week Summary */}
      {weekSummary && (
        <div>
          <h4 className="text-xs sm:text-sm font-bold mb-3" style={{ color: COLORS.primary }}>
            {t('statementFilters.weekSummary')}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: <FileText size={16} style={{ color: COLORS.primary }} />, label: t('statementFilters.records'), value: totalRecords, color: COLORS.primary, border: COLORS.primary },
              { icon: <TrendingUp size={16} style={{ color: COLORS.success }} />, label: t('statementFilters.income'), value: formatCurrency(weekSummary.total_income), color: COLORS.success, border: COLORS.success },
              { icon: <TrendingDown size={16} style={{ color: COLORS.error }} />, label: t('statementFilters.expense'), value: formatCurrency(weekSummary.total_expense), color: COLORS.error, border: COLORS.error },
              {
                icon: <DollarSign size={16} style={{ color: parseFloat(weekSummary.net_amount) >= 0 ? COLORS.success : COLORS.error }} />,
                label: t('statementFilters.net'),
                value: formatCurrency(weekSummary.net_amount),
                color: parseFloat(weekSummary.net_amount) >= 0 ? COLORS.success : COLORS.error,
                border: parseFloat(weekSummary.net_amount) >= 0 ? COLORS.success : COLORS.error,
              },
            ].map(({ icon, label, value, color, border }) => (
              <div key={label} className="rounded-lg p-2 sm:p-3 border-2 shadow-sm" style={{ borderColor: border }}>
                <div className="flex items-center gap-2 mb-1">
                  {icon}
                  <span className="text-xs font-semibold truncate" style={{ color: COLORS.gray }}>{label}</span>
                </div>
                <p className="text-sm sm:text-lg font-bold truncate" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {weekSummary.state_breakdown && Object.keys(weekSummary.state_breakdown).length > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-gray-50 overflow-hidden">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.gray }}>
                {t('statementFilters.statusBreakdown')}
              </p>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {Object.entries(weekSummary.state_breakdown).map(([state, count]) => (
                  <span key={state}
                    className="px-2 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                    style={{ backgroundColor: getStateChipColor(state) }}>
                    {formatStateName(state)}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};