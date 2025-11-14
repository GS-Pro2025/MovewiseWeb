import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  TextField,
  Chip,
  Divider
} from '@mui/material';
import { CalendarDays, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { WeekSummary } from '../domain/StatementModels';
import WeekPicker from '../../components/WeekPicker';
 
interface StatementFiltersProps {
  week: number;
  year: number;
  weekRange: { start: string; end: string };
  stateFilter: string;
  shipperFilter: string;
  companyFilter: string;
  onWeekChange: (week: number) => void;
  onYearChange: (year: number) => void;
  onStateFilterChange: (state: string) => void;
  onShipperFilterChange: (shipper: string) => void;
  onCompanyFilterChange: (company: string) => void;
  weekSummary: WeekSummary | null;
  totalRecords: number;
}

export const StatementFilters: React.FC<StatementFiltersProps> = ({
  week,
  year,
  weekRange,
  stateFilter,
  shipperFilter,
  companyFilter,
  onWeekChange,
  onYearChange,
  onStateFilterChange,
  onShipperFilterChange,
  onCompanyFilterChange,
  weekSummary,
  totalRecords
}) => {
  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Función para obtener el color del chip según el estado
  const getStateChipColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'processed':
        return 'success';
      case 'exists':
        return 'warning';
      case 'not_exists':
        return 'error';
      default:
        return 'default';
    }
  };

  // Función para formatear el nombre del estado para mostrar
  const formatStateName = (state: string): string => {
    switch (state.toLowerCase()) {
      case 'not_exists':
        return 'Not Exists';
      case 'exists':
        return 'Exists';
      case 'processed':
        return 'Processed';
      default:
        return state;
    }
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }}>
      <CardContent>
        {/* Week and Year Selection */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CalendarDays size={24} color="#1976d2" />
          <Typography variant="h6" color="primary">
            Statement Records - Week {week}, {year}
          </Typography>
        </Box>
        
        {/* Week and Year Grid */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: 2,
            mb: 3
          }}
        >
          <Box sx={{ position: 'relative', overflow: 'visible' }}>
            <WeekPicker
              week={week}
              onWeekSelect={onWeekChange}
              min={1}
              max={53}
              className=""
            />
          </Box>
           <TextField
             label="Year"
             type="number"
             size="small"
             value={year}
             onChange={(e) => onYearChange(parseInt(e.target.value) || new Date().getFullYear())}
             inputProps={{ min: 2020, max: 2030 }}
             fullWidth
           />
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              gridColumn: { xs: '1', md: 'span 2' }
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Date Range:
            </Typography>
            <Chip 
              label={`${weekRange.start} to ${weekRange.end}`} 
              variant="outlined" 
              color="primary" 
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Filters */}
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          Filters
        </Typography>
        
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, 1fr)'
            },
            gap: 2,
            mb: 3
          }}
        >
          <TextField
            label="Filter by State"
            size="small"
            value={stateFilter}
            onChange={(e) => onStateFilterChange(e.target.value)}
            placeholder="Enter state..."
            fullWidth
          />
          <TextField
            label="Filter by Shipper"
            size="small"
            value={shipperFilter}
            onChange={(e) => onShipperFilterChange(e.target.value)}
            placeholder="Enter shipper name..."
            fullWidth
          />
          <TextField
            label="Filter by Company"
            size="small"
            value={companyFilter}
            onChange={(e) => onCompanyFilterChange(e.target.value)}
            placeholder="Enter company name..."
            fullWidth
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Week Summary Statistics */}
        {weekSummary && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
              Week Summary
            </Typography>
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(4, 1fr)'
                },
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={20} color="#666" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Records
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {totalRecords}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp size={20} color="#22c55e" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Income
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(weekSummary.total_income)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown size={20} color="#ef4444" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Expense
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(weekSummary.total_expense)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DollarSign size={20} color="#1976d2" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Net Amount
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={parseFloat(weekSummary.net_amount) >= 0 ? "success.main" : "error.main"}
                  >
                    {formatCurrency(weekSummary.net_amount)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* State Breakdown */}
            {weekSummary.state_breakdown && Object.keys(weekSummary.state_breakdown).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Status Breakdown:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(weekSummary.state_breakdown).map(([state, count]) => (
                    <Chip 
                      key={state}
                      label={`${formatStateName(state)}: ${count}`}
                      size="small"
                      variant="outlined"
                      color={getStateChipColor(state) as 'success' | 'warning' | 'error' | 'default'}
                      sx={{ fontWeight: 'medium' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};