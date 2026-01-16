// components/FinancialControls.tsx
import React from 'react';
import {
  TextField,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Calendar, Search, RotateCcw } from 'lucide-react';
import { SuperOrder } from '../domain/ModelsOCR';
import ExportMenuComponent from './ExportMenuComponent';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';

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
}

const FinancialControls: React.FC<FinancialControlsProps> = (props) => {
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
  } = props;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <div className="border rounded-xl p-3 mb-4 space-y-3">

      {/* PERIOD */}
      {showWeekControls && (
        <div className="flex flex-wrap items-center gap-2">
          <WeekPicker week={week} onWeekSelect={onWeekChange} min={1} max={53} />
          <YearPicker year={year} onYearSelect={onYearChange} min={2020} max={new Date().getFullYear() + 2} />

          <div className="flex items-center gap-2 text-xs text-gray-700 border rounded-lg px-2 py-1">
            <Calendar size={14} />
            W{week} {year}: {weekRange.start} → {weekRange.end}
          </div>
        </div>
      )}

      {/* SEARCH */}
      <div className="flex flex-wrap items-center gap-2">
        <TextField
          size="small"
          value={searchRef}
          onChange={(e) => onSearchRefChange(e.target.value)}
          placeholder="Search reference"
          onKeyDown={(e) => e.key === 'Enter' && searchRef && onSearch()}
          sx={{ minWidth: isMobile ? '100%' : 220 }}
          InputProps={{
            startAdornment: <Search size={16} className="mr-2 text-gray-500" />,
          }}
        />

        <Button
          size="small"
          variant="contained"
          onClick={onSearch}
          disabled={searchLoading || !searchRef}
        >
          {searchLoading ? <RotateCcw size={14} className="animate-spin" /> : 'Search'}
        </Button>

        {hasSearchResults && (
          <Button
            size="small"
            variant="outlined"
            onClick={onClearSearch}
            startIcon={<RotateCcw size={14} />}
          >
            Clear
          </Button>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="small"
          variant="contained"
          color="success"
          startIcon={<UploadFileIcon />}
          onClick={onUploadClick}
        >
          Upload OCR
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

      {/* SEARCH RESULT INDICATOR */}
      {hasSearchResults && (
        <div className="text-xs text-gray-600 border-t pt-2">
          Results for <b>{searchRef}</b> — {exportData.length} orders
        </div>
      )}
    </div>
  );
};

export default FinancialControls;
