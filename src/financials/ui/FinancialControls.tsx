// components/FinancialControls.tsx
import React, { useState, useRef } from 'react';
import {
  TextField,
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Calendar, Search, RotateCcw } from 'lucide-react';
import { SuperOrder } from '../domain/ModelsOCR';
import ExportMenuComponent from './ExportMenuComponent';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';
import { useTranslation } from 'react-i18next';

// ── Tooltip ────────────────────────────────────────────────────────────────────
const ScopeTooltip: React.FC<{ children: React.ReactNode; content: React.ReactNode }> = ({ children, content }) => {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
    >
      {children}
      {on && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] pointer-events-none w-64">
          <span className="block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
            {content}
          </span>
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-l border-t border-gray-200 rotate-45" />
        </span>
      )}
    </span>
  );
};

interface FinancialControlsProps {
  week: number;
  onWeekChange: (week: number) => void;
  year: number;
  onYearChange: (year: number) => void;
  weekRange: { start: string; end: string };
  showWeekControls: boolean;

  searchRef: string;
  onSearchRefChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  searchLoading: boolean;
  hasSearchResults: boolean;

  onUploadClick: () => void;

  exportData: SuperOrder[];
  isSearchResults: boolean;
  loading: boolean;

  onViewExpenseBreakdown?: () => void;

  searchScope: 'week' | 'global';
  onSearchScopeChange: (scope: 'week' | 'global') => void;
  currentWeek: number;
  currentYear: number;
}

const FinancialControls: React.FC<FinancialControlsProps> = (props) => {
  const { t } = useTranslation();
  const {
    week,
    onWeekChange,
    year,
    onYearChange,
    weekRange,
    showWeekControls,
    searchRef,
    onSearchRefChange,
    onSearch,
    onClearSearch,
    searchLoading,
    hasSearchResults,
    onUploadClick,
    exportData,
    isSearchResults,
    loading,
    searchScope,
    onSearchScopeChange,
    currentWeek,
    currentYear,
  } = props;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const Section: React.FC<{ title: string; className?: string; children: React.ReactNode }> = ({ title, className = '', children }) => (
    <div className={className}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{title}</div>
      {children}
    </div>
  );

  const scopeBtn = (scope: 'week' | 'global', label: string) => (
    <button
      type="button"
      onClick={() => onSearchScopeChange(scope)}
      className={`px-3 h-full text-xs font-semibold transition-colors ${searchScope === scope ? 'bg-[#0B2863] text-white' : 'bg-white text-[#0B2863] hover:bg-blue-50'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">

        {/* PERIOD */}
        {showWeekControls && (
          <Section title={t('financialControls.sectionPeriod')}>
            <div className="flex flex-wrap items-center gap-2">
              <WeekPicker week={week} onWeekSelect={onWeekChange} min={1} max={53} />
              <YearPicker year={year} onYearSelect={onYearChange} min={2020} max={new Date().getFullYear() + 2} />
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 whitespace-nowrap">
                <Calendar size={14} />
                {weekRange.start} → {weekRange.end}
              </div>
            </div>
          </Section>
        )}

        {/* SEARCH */}
        <Section title={t('financialControls.sectionSearch')} className={isMobile ? 'w-full' : 'flex-1 min-w-[320px]'}>
          <div className="flex flex-wrap items-center gap-2">
            <TextField
              size="small"
              value={searchRef}
              onChange={(e) => onSearchRefChange(e.target.value)}
              placeholder={t('financialControls.searchPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && searchRef && onSearch()}
              sx={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}
              InputProps={{
                startAdornment: <Search size={16} className="mr-2 text-gray-500" />,
              }}
            />

            {/* Scope toggle */}
            <div className="inline-flex h-8 rounded-lg border border-[#0B2863] overflow-hidden">
              <ScopeTooltip
                content={
                  <div className="px-3 py-2 text-xs text-gray-700">
                    <p className="font-semibold text-[#0B2863] mb-1">{t('financialControls.tooltipWeekTitle', { week: currentWeek, year: currentYear })}</p>
                    <p>{t('financialControls.tooltipWeekDesc')}</p>
                  </div>
                }
              >
                {scopeBtn('week', `W${currentWeek} ${currentYear}`)}
              </ScopeTooltip>
              <ScopeTooltip
                content={
                  <div className="px-3 py-2 text-xs text-gray-700">
                    <p className="font-semibold text-[#0B2863] mb-1">{t('financialControls.tooltipGlobalTitle')}</p>
                    <p>{t('financialControls.tooltipGlobalDesc')}</p>
                  </div>
                }
              >
                {scopeBtn('global', t('financialControls.scopeGlobal'))}
              </ScopeTooltip>
            </div>

            <Button size="small" variant="contained" onClick={onSearch} disabled={searchLoading || !searchRef}>
              {searchLoading ? <RotateCcw size={14} className="animate-spin" /> : t('financialControls.search')}
            </Button>

            {hasSearchResults && (
              <Button size="small" variant="outlined" onClick={onClearSearch} startIcon={<RotateCcw size={14} />}>
                {t('financialControls.clear')}
              </Button>
            )}
          </div>
        </Section>

        {/* ACTIONS */}
        <Section title={t('financialControls.sectionActions')} className={isMobile ? 'w-full' : 'ml-auto'}>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="small" variant="contained" color="success" startIcon={<UploadFileIcon />} onClick={onUploadClick}>
              {t('financialControls.uploadOcr')}
            </Button>
            <ExportMenuComponent
              superOrders={exportData}
              isSearchResults={isSearchResults}
              week={week}
              year={year}
              weekRange={weekRange}
              disabled={loading}
            />
          </div>
        </Section>
      </div>

      {/* SEARCH RESULT INDICATOR */}
      {hasSearchResults && (
        <div className="mt-3 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          {searchScope === 'week'
            ? t('financialControls.searchResultInfoWeek', { ref: searchRef, week: currentWeek, year: currentYear, count: exportData.length })
            : t('financialControls.searchResultInfoGlobal', { ref: searchRef, count: exportData.length })}
        </div>
      )}
    </div>
  );
};

export default FinancialControls;