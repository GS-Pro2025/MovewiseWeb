// components/FinancialControls.tsx
import React from 'react';
import {TextField, Typography} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { SuperOrder } from '../domain/ModelsOCR';
import ExportMenuComponent from './ExportMenuComponent';

interface FinancialControlsProps {
  // Week controls
  week: number;
  onWeekChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  weekRange: { start: string; end: string };
  showWeekControls: boolean;

  // Search controls
  searchRef: string;
  onSearchRefChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  searchLoading: boolean;
  hasSearchResults: boolean;

  // Upload controls
  onUploadClick: () => void;

  // Export controls
  exportData: SuperOrder[];
  isSearchResults: boolean;
  year: number;
  loading: boolean;
}

const FinancialControls: React.FC<FinancialControlsProps> = ({
  week,
  onWeekChange,
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
  year,
  loading
}) => {
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && searchRef.trim() && !searchLoading) {
      onSearch();
    }
  };

  const SearchButton = ({ 
    onClick, 
    disabled, 
    children 
  }: { 
    onClick: () => void, 
    disabled: boolean, 
    children: React.ReactNode 
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
      }`}
      style={{
        backgroundColor: disabled ? '#d1d5db' : '#0B2863'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#1e40af';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#0B2863';
        }
      }}
    >
      {children}
    </button>
  );

  const ClearButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 hover:shadow-md"
      style={{
        color: '#0B2863',
        borderColor: '#0B2863',
        backgroundColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#0B2863';
        e.currentTarget.style.color = '#ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#0B2863';
      }}
    >
      Clear Search
    </button>
  );

  const UploadButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
      style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      }}
    >
      <UploadFileIcon />
      Upload PDFs (OCR)
    </button>
  );

  return (
    <div 
      className="rounded-2xl shadow-lg border-2 p-6 mb-8"
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderColor: '#0B2863'
      }}
    >
      <div className="flex flex-wrap gap-4 items-center">
        {/* Week Controls */}
        {showWeekControls && (
          <>
            <div className="flex flex-col gap-2">
              <TextField
                label="Week"
                type="number"
                value={week}
                onChange={onWeekChange}
                inputProps={{ min: 1, max: 53 }}
                size="small"
                sx={{ 
                  minWidth: 100,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#0B2863',
                      borderWidth: 2
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFE67B'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0B2863'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#0B2863',
                    fontWeight: 600
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#0B2863'
                  }
                }}
              />
            </div>
            <div className="flex flex-col items-start min-w-[180px]">
              <Typography variant="caption" className="!font-semibold !mb-1" style={{ color: '#0B2863' }}>
                Period
              </Typography>
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: '#FFE67B',
                  borderColor: '#0B2863',
                  color: '#0B2863'
                }}
              >
                <span className="text-lg">📅</span>
                <Typography variant="body2" className="!font-bold">
                  {weekRange.start} → {weekRange.end}
                </Typography>
              </div>
            </div>
          </>
        )}
        
        {/* Search Controls */}
        <div className="flex gap-3 items-center flex-wrap">
          <TextField
            label="🔍 Search by Reference"
            value={searchRef}
            onChange={(e) => onSearchRefChange(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            sx={{ 
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '& fieldset': {
                  borderColor: '#0B2863',
                  borderWidth: 2
                },
                '&:hover fieldset': {
                  borderColor: '#FFE67B'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0B2863'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#0B2863',
                fontWeight: 600
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0B2863'
              }
            }}
            placeholder="Enter order reference..."
          />
          
          <SearchButton
            onClick={onSearch}
            disabled={searchLoading || !searchRef.trim()}
          >
            {searchLoading ? '🔄 Searching...' : 'Search'}
          </SearchButton>
          
          {hasSearchResults && (
            <ClearButton onClick={onClearSearch} />
          )}
        </div>
        
        {/* Action Controls */}
        <div className="flex gap-4 ml-auto">
          <UploadButton onClick={onUploadClick} />
          
          <ExportMenuComponent
            superOrders={exportData}
            isSearchResults={isSearchResults}
            week={week}
            year={year}
            weekRange={weekRange}
            disabled={loading}
          />
        </div>
      </div>

      {/* Search Results Indicator */}
      {hasSearchResults && (
        <div 
          className="mt-6 p-4 rounded-xl border-2"
          style={{ 
            backgroundColor: 'rgba(255, 230, 123, 0.3)',
            borderColor: '#FFE67B'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <Typography 
              variant="body1" 
              className="!font-semibold"
              style={{ color: '#0B2863' }}
            >
              Search Results for "{searchRef}" 
              <span 
                className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-sm font-bold text-white bg-green-500"
              >
                {exportData.length} orders found
              </span>
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialControls;