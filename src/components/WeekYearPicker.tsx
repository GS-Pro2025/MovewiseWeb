import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, Hash } from 'lucide-react';

interface WeekYearPickerProps {
  value: { week: number; year: number };
  onChange: (value: { week: number; year: number }) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

interface WeekData {
  week: number;
  startDate: Date;
  endDate: Date;
  isCurrentWeek: boolean;
}

const WeekYearPicker: React.FC<WeekYearPickerProps> = ({
  value,
  onChange,
  label = "Select Week & Year",
  disabled = false,
  size = 'medium'
}) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.year);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Helper function to get ISO week number
  const getISOWeek = (date: Date): number => {
    const d = new Date(date);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Helper function to get start of week
  const getWeekStart = (year: number, week: number): Date => {
    const jan1 = new Date(year, 0, 1);
    const days = (week - 1) * 7;
    const weekStart = new Date(jan1.getTime() + days * 24 * 60 * 60 * 1000);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(weekStart.setDate(diff));
  };

  // Generate weeks for the year
  const generateWeeksForYear = (year: number): WeekData[] => {
    const weeks: WeekData[] = [];
    const currentDate = new Date();
    const currentWeek = getISOWeek(currentDate);
    const currentYear = currentDate.getFullYear();

    for (let week = 1; week <= 52; week++) {
      const startDate = getWeekStart(year, week);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      weeks.push({
        week,
        startDate,
        endDate,
        isCurrentWeek: week === currentWeek && year === currentYear
      });
    }

    return weeks;
  };

  const weeksData = useMemo(() => generateWeeksForYear(viewYear), [viewYear]);

  // Get formatted week range
  const getWeekRange = (weekData: WeekData) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = weekData.startDate.toLocaleDateString('en-US', options);
    const end = weekData.endDate.toLocaleDateString('en-US', options);
    return `${start} - ${end}`;
  };

  // Get current selection display
  const getCurrentSelectionText = () => {
    const weekData = weeksData.find(w => w.week === value.week);
    if (weekData) {
      return `Week ${value.week}, ${value.year} (${getWeekRange(weekData)})`;
    }
    return `Week ${value.week}, ${value.year}`;
  };

  const handleWeekSelect = (week: number) => {
    onChange({ week, year: viewYear });
    setOpen(false);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setViewYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  // Calendar view component usando Box en lugar de Grid
  const CalendarView = () => (
    <Box 
      sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: 1,
        maxHeight: 400, 
        overflow: 'auto' 
      }}
    >
      {weeksData.map((weekData) => (
        <Card
          key={weekData.week}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: 
              value.week === weekData.week && value.year === viewYear 
                ? 'primary.light' 
                : weekData.isCurrentWeek 
                  ? 'info.light' 
                  : 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
              transform: 'translateY(-2px)',
              boxShadow: 2
            },
            border: value.week === weekData.week && value.year === viewYear 
              ? '2px solid' 
              : '1px solid',
            borderColor: 
              value.week === weekData.week && value.year === viewYear 
                ? 'primary.main' 
                : 'divider'
          }}
          onClick={() => handleWeekSelect(weekData.week)}
        >
          <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Week {weekData.week}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {getWeekRange(weekData)}
            </Typography>
            {weekData.isCurrentWeek && (
              <Chip label="Current" size="small" color="info" sx={{ mt: 0.5 }} />
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  // List view component
  const ListView = () => (
    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
      {weeksData.map((weekData) => (
        <Card
          key={weekData.week}
          sx={{
            mb: 1,
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: 
              value.week === weekData.week && value.year === viewYear 
                ? 'primary.light' 
                : weekData.isCurrentWeek 
                  ? 'info.light' 
                  : 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
              transform: 'translateX(4px)',
              boxShadow: 2
            },
            border: value.week === weekData.week && value.year === viewYear 
              ? '2px solid' 
              : '1px solid',
            borderColor: 
              value.week === weekData.week && value.year === viewYear 
                ? 'primary.main' 
                : 'divider'
          }}
          onClick={() => handleWeekSelect(weekData.week)}
        >
          <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Week {weekData.week}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getWeekRange(weekData)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {weekData.isCurrentWeek && (
                <Chip label="Current" size="small" color="info" />
              )}
              {value.week === weekData.week && value.year === viewYear && (
                <Chip label="Selected" size="small" color="primary" />
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        disabled={disabled}
        size={size}
        startIcon={<Calendar size={size === 'small' ? 16 : 20} />}
        sx={{
          textTransform: 'none',
          justifyContent: 'flex-start',
          minWidth: 200,
          fontWeight: 500
        }}
      >
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {label}
          </Typography>
          <Typography variant="body2">
            {getCurrentSelectionText()}
          </Typography>
        </Box>
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={24} color="#1976d2" />
              <Typography variant="h6">Select Week & Year</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Calendar View">
                <IconButton
                  onClick={() => setViewMode('calendar')}
                  color={viewMode === 'calendar' ? 'primary' : 'default'}
                >
                  <CalendarDays size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <Hash size={20} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Year Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, gap: 2 }}>
            <IconButton onClick={() => handleYearChange('prev')}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h5" fontWeight="bold" sx={{ minWidth: 80, textAlign: 'center' }}>
              {viewYear}
            </Typography>
            <IconButton onClick={() => handleYearChange('next')}>
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Week Selection */}
          {viewMode === 'calendar' ? <CalendarView /> : <ListView />}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              const currentDate = new Date();
              const currentWeek = getISOWeek(currentDate);
              const currentYear = currentDate.getFullYear();
              onChange({ week: currentWeek, year: currentYear });
              setOpen(false);
            }}
          >
            Today
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WeekYearPicker;