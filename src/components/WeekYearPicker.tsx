import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Card, CardContent, IconButton, Tooltip, Chip
} from "@mui/material";
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, Hash } from "lucide-react";

interface WeekYearPickerProps {
  value: { week: number; year: number };
  onChange: (value: { week: number; year: number }) => void;
  label?: string;
  disabled?: boolean;
  size?: "small" | "medium";
}

interface WeekData {
  week: number;
  startDate: Date;
  endDate: Date;
  isCurrentWeek: boolean;
}

const WeekYearPicker: React.FC<WeekYearPickerProps> = ({
  value, onChange, label, disabled = false, size = "medium"
}) => {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("weekYearPicker.label");

  const [open,     setOpen]     = useState(false);
  const [viewYear, setViewYear] = useState(value.year);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const getISOWeek = (date: Date): number => {
    const d = new Date(date);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getWeekStart = (year: number, week: number): Date => {
    const jan1 = new Date(year, 0, 1);
    const days = (week - 1) * 7;
    const weekStart = new Date(jan1.getTime() + days * 24 * 60 * 60 * 1000);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(weekStart.setDate(diff));
  };

  const generateWeeksForYear = (year: number): WeekData[] => {
    const currentDate = new Date();
    const currentWeek = getISOWeek(currentDate);
    const currentYear = currentDate.getFullYear();
    return Array.from({ length: 52 }, (_, i) => {
      const week = i + 1;
      const startDate = getWeekStart(year, week);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      return { week, startDate, endDate, isCurrentWeek: week === currentWeek && year === currentYear };
    });
  };

  const weeksData = useMemo(() => generateWeeksForYear(viewYear), [viewYear]);

  const getWeekRange = (weekData: WeekData) => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${weekData.startDate.toLocaleDateString("en-US", options)} - ${weekData.endDate.toLocaleDateString("en-US", options)}`;
  };

  const getCurrentSelectionText = () => {
    const weekData = weeksData.find(w => w.week === value.week);
    return weekData
      ? `${t("weekYearPicker.week", { week: value.week })}, ${value.year} (${getWeekRange(weekData)})`
      : `${t("weekYearPicker.week", { week: value.week })}, ${value.year}`;
  };

  const handleWeekSelect = (week: number) => { onChange({ week, year: viewYear }); setOpen(false); };

  const isSelected = (weekData: WeekData) => value.week === weekData.week && value.year === viewYear;

  const cardSx = (weekData: WeekData) => ({
    cursor: "pointer",
    transition: "all 0.2s",
    backgroundColor: isSelected(weekData) ? "primary.light" : weekData.isCurrentWeek ? "info.light" : "background.paper",
    "&:hover": { backgroundColor: "action.hover", boxShadow: 2 },
    border: isSelected(weekData) ? "2px solid" : "1px solid",
    borderColor: isSelected(weekData) ? "primary.main" : "divider",
  });

  const CalendarView = () => (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(4,1fr)" }, gap: 1, maxHeight: 400, overflow: "auto" }}>
      {weeksData.map((weekData) => (
        <Card key={weekData.week} sx={{ ...cardSx(weekData), "&:hover": { ...cardSx(weekData)["&:hover"], transform: "translateY(-2px)" } }} onClick={() => handleWeekSelect(weekData.week)}>
          <CardContent sx={{ p: 1.5, textAlign: "center" }}>
            <Typography variant="subtitle2" fontWeight="bold">{t("weekYearPicker.week", { week: weekData.week })}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{getWeekRange(weekData)}</Typography>
            {weekData.isCurrentWeek && <Chip label={t("weekYearPicker.currentChip")} size="small" color="info" sx={{ mt: 0.5 }} />}
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const ListView = () => (
    <Box sx={{ maxHeight: 400, overflow: "auto" }}>
      {weeksData.map((weekData) => (
        <Card key={weekData.week} sx={{ mb: 1, ...cardSx(weekData), "&:hover": { ...cardSx(weekData)["&:hover"], transform: "translateX(4px)" } }} onClick={() => handleWeekSelect(weekData.week)}>
          <CardContent sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">{t("weekYearPicker.week", { week: weekData.week })}</Typography>
              <Typography variant="body2" color="text.secondary">{getWeekRange(weekData)}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {weekData.isCurrentWeek && <Chip label={t("weekYearPicker.currentChip")} size="small" color="info" />}
              {isSelected(weekData)    && <Chip label={t("weekYearPicker.selectedChip")} size="small" color="primary" />}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <>
      <Button
        variant="outlined" onClick={() => setOpen(true)} disabled={disabled} size={size}
        startIcon={<Calendar size={size === "small" ? 16 : 20} />}
        sx={{ textTransform: "none", justifyContent: "flex-start", minWidth: 200, fontWeight: 500 }}
      >
        <Box sx={{ textAlign: "left" }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{resolvedLabel}</Typography>
          <Typography variant="body2">{getCurrentSelectionText()}</Typography>
        </Box>
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Calendar size={24} color="#1976d2" />
              <Typography variant="h6">{t("weekYearPicker.dialogTitle")}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title={t("weekYearPicker.calendarView")}>
                <IconButton onClick={() => setViewMode("calendar")} color={viewMode === "calendar" ? "primary" : "default"}>
                  <CalendarDays size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("weekYearPicker.listView")}>
                <IconButton onClick={() => setViewMode("list")} color={viewMode === "list" ? "primary" : "default"}>
                  <Hash size={20} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 3, gap: 2 }}>
            <IconButton onClick={() => setViewYear(p => p - 1)}><ChevronLeft /></IconButton>
            <Typography variant="h5" fontWeight="bold" sx={{ minWidth: 80, textAlign: "center" }}>{viewYear}</Typography>
            <IconButton onClick={() => setViewYear(p => p + 1)}><ChevronRight /></IconButton>
          </Box>
          {viewMode === "calendar" ? <CalendarView /> : <ListView />}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>{t("weekYearPicker.cancel")}</Button>
          <Button variant="contained" onClick={() => {
            const now = new Date();
            onChange({ week: getISOWeek(now), year: now.getFullYear() });
            setOpen(false);
          }}>
            {t("weekYearPicker.today")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WeekYearPicker;