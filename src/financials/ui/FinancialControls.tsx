// components/FinancialControls.tsx
import React from 'react';
import {TextField, Typography, useMediaQuery, useTheme, Button} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { SuperOrder } from '../domain/ModelsOCR';
import ExportMenuComponent from './ExportMenuComponent';
import { Calendar, Search, RotateCcw } from 'lucide-react';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';

interface FinancialControlsProps {
  // Week controls
  week: number;
  onWeekChange: (week: number) => void;
  year: number;
  onYearChange: (year: number) => void;
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
  loading: boolean;

  onViewExpenseBreakdown?: () => void;
}

const FinancialControls: React.FC<FinancialControlsProps> = ({
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
  onViewExpenseBreakdown,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isLaptopSmall = useMediaQuery('(max-width: 1420px)'); // Para pantallas entre 1024-1420px
  const isDesktopSmall = useMediaQuery('(max-width: 1200px)'); // Para ajustes adicionales

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && searchRef.trim() && !searchLoading) {
      onSearch();
    }
  };

  const SearchButton = ({ 
    onClick, 
    disabled, 
    children,
    fullWidth = false
  }: { 
    onClick: () => void, 
    disabled: boolean, 
    children: React.ReactNode,
    fullWidth?: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 justify-center ${
        fullWidth ? 'w-full' : ''
      } ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
      }`}
      style={{
        backgroundColor: disabled ? '#d1d5db' : '#0B2863',
        minHeight: '48px'
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

  const ClearButton = ({ onClick, fullWidth = false }: { onClick: () => void, fullWidth?: boolean }) => (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 hover:shadow-md flex items-center gap-2 justify-center ${
        fullWidth ? 'w-full' : ''
      }`}
      style={{
        color: '#0B2863',
        borderColor: '#0B2863',
        backgroundColor: 'transparent',
        minHeight: '48px'
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
      <RotateCcw size={16} />
      {!isMobile && 'Clear Search'}
    </button>
  );

  const UploadButton = ({ onClick, fullWidth = false }: { onClick: () => void, fullWidth?: boolean }) => (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 justify-center ${
        fullWidth ? 'w-full' : ''
      }`}
      style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        minHeight: '48px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      }}
    >
      <UploadFileIcon />
      {!isMobile ? 'Upload PDFs (OCR)' : 'Upload'}
    </button>
  );

  return (
    <div 
      className="rounded-2xl shadow-lg border-2 mb-8"
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderColor: '#0B2863',
        padding: isMobile ? '16px' : '24px'
      }}
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="space-y-4">
          {/* Week Controls - Mobile */}
          {showWeekControls && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', overflow: 'visible' }}>
                    <WeekPicker
                      week={week}
                      onWeekSelect={(w) => onWeekChange(w)}
                      min={1}
                      max={53}
                      className=""
                    />
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', overflow: 'visible' }}>
                    <YearPicker
                      year={year}
                      onYearSelect={(y) => onYearChange(y)}
                      min={2020}
                      max={new Date().getFullYear() + 2}
                      className=""
                    />
                  </div>
                </div>
              </div>
               <div 
                 className="flex items-center gap-2 px-3 py-3 rounded-lg border-2"
                 style={{ 
                   backgroundColor: '#FFE67B',
                   borderColor: '#0B2863',
                   color: '#0B2863'
                 }}
               >
                 <Calendar size={18} />
                 <Typography variant="body2" className="!font-bold">
                   Week {week}, {year}: {weekRange.start} → {weekRange.end}
                 </Typography>
               </div>
             </div>
           )}
          
          {/* Search Controls - Mobile */}
          <div className="space-y-3">
            <TextField
              label="Search by Reference"
              value={searchRef}
              onChange={(e) => onSearchRefChange(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              fullWidth
              sx={{ 
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
              InputProps={{
                startAdornment: (
                  <Search size={20} style={{ color: '#0B2863', marginRight: '8px' }} />
                )
              }}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <SearchButton
                onClick={onSearch}
                disabled={searchLoading || !searchRef.trim()}
                fullWidth
              >
                {searchLoading ? (
                  <>
                    <RotateCcw size={16} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Search
                  </>
                )}
              </SearchButton>
              
              {hasSearchResults && (
                <ClearButton onClick={onClearSearch} fullWidth />
              )}
            </div>
          </div>
          
          {/* Action Controls - Mobile */}
          <div className="grid grid-cols-1 gap-3">
            <UploadButton onClick={onUploadClick} fullWidth />
            
            <div className="w-full">
              <ExportMenuComponent
                superOrders={exportData}
                isSearchResults={isSearchResults}
                week={week}
                year={year}
                weekRange={weekRange}
                disabled={loading}
                fullWidth
              />
            </div>
          </div>
        </div>
      ) : (
        /* Desktop/Tablet Layout */
        <div className={`flex ${isTablet || isLaptopSmall ? 'flex-col' : 'flex-row'} gap-4 ${isTablet || isLaptopSmall ? 'items-stretch' : 'items-start'}`}>
          {/* Week Controls - Desktop/Tablet */}
          {showWeekControls && (
            <div className={`flex ${isTablet || isLaptopSmall ? 'flex-row justify-between' : 'flex-col'} gap-4 items-start ${isTablet || isLaptopSmall ? 'w-full' : ''}`}>
              <div className="flex flex-col gap-2">
                <div className={`grid ${isTablet || isLaptopSmall ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <div style={{ minWidth: isTablet || isLaptopSmall ? 80 : 100 }}>
                    <div style={{ position: 'relative', overflow: 'visible' }}>
                      <WeekPicker
                        week={week}
                        onWeekSelect={(w) => onWeekChange(w)}
                        min={1}
                        max={53}
                        className=""
                      />
                    </div>
                  </div>
                  <div style={{ minWidth: isTablet || isLaptopSmall ? 80 : 100 }}>
                    <div style={{ position: 'relative', overflow: 'visible' }}>
                      <YearPicker
                        year={year}
                        onYearSelect={(y) => onYearChange(y)}
                        min={2020}
                        max={new Date().getFullYear() + 2}
                        className=""
                      />
                    </div>
                  </div>
                </div>
               </div>
               <div className={`flex flex-col items-start ${isTablet || isLaptopSmall ? 'min-w-[120px]' : 'min-w-[180px]'}`}>
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
                   <Calendar size={18} />
                   <Typography variant={isTablet || isLaptopSmall ? "caption" : "body2"} className="!font-bold">
                     {isDesktopSmall ? `W${week} ${year}` : `W${week}, ${year}: ${weekRange.start} → ${weekRange.end}`}
                   </Typography>
                 </div>
               </div>
             </div>
           )}
          
          {/* Search Controls - Desktop/Tablet */}
          <div className={`flex gap-3 items-center ${isTablet || isLaptopSmall ? 'flex-wrap w-full' : 'flex-nowrap'}`}>
            <div className="relative">
              <TextField
                label="Search by Reference"
                value={searchRef}
                onChange={(e) => onSearchRefChange(e.target.value)}
                onKeyPress={handleKeyPress}
                size="small"
                sx={{ 
                  minWidth: isTablet ? 180 : isLaptopSmall ? 200 : 250,
                  width: isTablet || isLaptopSmall ? '100%' : 'auto',
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
                InputProps={{
                  startAdornment: (
                    <Search size={20} style={{ color: '#0B2863', marginRight: '8px' }} />
                  )
                }}
              />
            </div>
            
            <div className={`flex gap-2 ${isTablet || isLaptopSmall ? 'w-full' : ''}`}>
              <SearchButton
                onClick={onSearch}
                disabled={searchLoading || !searchRef.trim()}
                fullWidth={isTablet || isLaptopSmall}
              >
                {searchLoading ? (
                  <>
                    <RotateCcw size={16} className="animate-spin" />
                    {!isTablet && !isLaptopSmall && 'Searching...'}
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    {!isTablet && !isLaptopSmall && 'Search'}
                  </>
                )}
              </SearchButton>
              
              {hasSearchResults && (
                <ClearButton onClick={onClearSearch} fullWidth={isTablet || isLaptopSmall} />
              )}
            </div>
          </div>
          
          {/* Action Controls - Desktop/Tablet */}
          <div className={`flex ${isTablet || isLaptopSmall ? 'flex-wrap gap-2 w-full' : 'gap-4 ml-auto'} ${isTablet || isLaptopSmall ? 'justify-center' : ''}`}>
            <div className={isTablet || isLaptopSmall ? 'w-full' : ''}>
              <UploadButton onClick={onUploadClick} fullWidth={isTablet || isLaptopSmall} />
            </div>
             
            <div className={`flex gap-2 ${isTablet || isLaptopSmall ? 'w-full' : ''}`}>
              <div className={isTablet || isLaptopSmall ? 'flex-1' : ''}>
                <ExportMenuComponent
                  superOrders={exportData}
                  isSearchResults={isSearchResults}
                  week={week}
                  year={year}
                  weekRange={weekRange}
                  disabled={loading}
                  fullWidth={isTablet || isLaptopSmall}
                />
              </div>
              <div className={isTablet || isLaptopSmall ? 'flex-1' : ''}>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ 
                    minHeight: '48px', 
                    fontWeight: 600,
                    width: isTablet || isLaptopSmall ? '100%' : 'auto',
                    fontSize: isTablet ? '0.75rem' : isLaptopSmall ? '0.8rem' : '0.875rem'
                  }}
                  onClick={onViewExpenseBreakdown}
                >
                  {isTablet ? 'Expenses' : isLaptopSmall ? 'Expense Breakdown' : 'View Expense Breakdown'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Indicator */}
      {hasSearchResults && (
        <div 
          className="p-4 rounded-xl border-2"
          style={{ 
            backgroundColor: 'rgba(255, 230, 123, 0.3)',
            borderColor: '#FFE67B',
            marginTop: '24px'
          }}
        >
          <div className="flex items-center gap-2">
            <Search size={isMobile ? 20 : 24} style={{ color: '#0B2863' }} />
            <Typography 
              variant={isMobile ? "body2" : "body1"}
              className="!font-semibold"
              style={{ color: '#0B2863' }}
            >
              Search Results for "{searchRef}" 
              <span 
                className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-green-500"
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