import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  TextField, Button, Box, Typography, Divider, Alert, CircularProgress
} from '@mui/material';
import { FileSpreadsheet, FileText, Calendar, Database, Download } from 'lucide-react';
import { PaidUnpaidExportUtils } from './PaidUnpaidExportUtils';

export interface ExportDialogMode {
  type: 'range' | 'historic';
  startWeek?: number;
  endWeek?: number;
  year: number;
}

interface PaidUnpaidExportDialogProps {
  open: boolean;
  onClose: () => void;
  currentYear: number;
  currentStartWeek: number;
  currentEndWeek: number;
}

const PaidUnpaidExportDialog: React.FC<PaidUnpaidExportDialogProps> = ({
  open, onClose, currentYear, currentStartWeek, currentEndWeek
}) => {
  const { t } = useTranslation();

  const [exportMode, setExportMode] = useState<ExportDialogMode>({
    type: 'range',
    startWeek: currentStartWeek,
    endWeek: currentEndWeek,
    year: currentYear
  });
  const [format,      setFormat]      = useState<'xlsx' | 'pdf'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleModeChange = (newType: 'range' | 'historic') => {
    setExportMode(prev => ({
      ...prev,
      type: newType,
      startWeek: newType === 'range' ? prev.startWeek : undefined,
      endWeek:   newType === 'range' ? prev.endWeek   : undefined,
    }));
    setError(null);
  };

  const handleExport = async () => {
    setError(null);

    if (exportMode.type === 'range') {
      if (!exportMode.startWeek || !exportMode.endWeek) {
        setError(t('exportDialog.validation.specifyWeeks')); return;
      }
      if (exportMode.startWeek > exportMode.endWeek) {
        setError(t('exportDialog.validation.startBeforeEnd')); return;
      }
      if (exportMode.startWeek < 1 || exportMode.endWeek > 53) {
        setError(t('exportDialog.validation.weeksRange')); return;
      }
    }

    setIsExporting(true);
    try {
      const data = await PaidUnpaidExportUtils.fetchDataForExport(exportMode);
      if (format === 'xlsx') {
        await PaidUnpaidExportUtils.exportToExcel(data, exportMode);
      } else {
        PaidUnpaidExportUtils.openPrintableReport(data, exportMode);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('exportDialog.validation.failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const sectionLabelSx = {
    color: '#0B2863', fontWeight: 600, mb: 2,
    display: 'flex', alignItems: 'center', gap: 1
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', border: '2px solid #0B2863' } }}
    >
      {/* Title */}
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #0B2863, #1e40af)',
        color: '#FFE67B', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 2
      }}>
        <Download size={24} />
        {t('exportDialog.title')}
      </DialogTitle>

      <DialogContent sx={{ padding: '24px' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* ── Data Mode ── */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={sectionLabelSx}>
              <Database size={18} />
              {t('exportDialog.dataMode.label')}
            </FormLabel>
            <RadioGroup
              value={exportMode.type}
              onChange={(e) => handleModeChange(e.target.value as 'range' | 'historic')}
            >
              <FormControlLabel
                value="range"
                control={<Radio sx={{ color: '#0B2863' }} />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>{t('exportDialog.dataMode.range')}</Typography>
                    <Typography variant="caption" color="text.secondary">{t('exportDialog.dataMode.rangeDesc')}</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="historic"
                control={<Radio sx={{ color: '#0B2863' }} />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>{t('exportDialog.dataMode.historic')}</Typography>
                    <Typography variant="caption" color="text.secondary">{t('exportDialog.dataMode.historicDesc')}</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* ── Range Config ── */}
        {exportMode.type === 'range' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={sectionLabelSx}>
              <Calendar size={18} />
              {t('exportDialog.rangeConfig.title')}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                label={t('exportDialog.rangeConfig.year')}
                type="number"
                value={exportMode.year}
                onChange={(e) => setExportMode(prev => ({ ...prev, year: Number(e.target.value) }))}
                size="small"
                fullWidth
              />
              <TextField
                label={t('exportDialog.rangeConfig.startWeek')}
                type="number"
                inputProps={{ min: 1, max: 53 }}
                value={exportMode.startWeek || ''}
                onChange={(e) => setExportMode(prev => ({ ...prev, startWeek: Number(e.target.value) }))}
                size="small"
                fullWidth
              />
              <TextField
                label={t('exportDialog.rangeConfig.endWeek')}
                type="number"
                inputProps={{ min: 1, max: 53 }}
                value={exportMode.endWeek || ''}
                onChange={(e) => setExportMode(prev => ({ ...prev, endWeek: Number(e.target.value) }))}
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        )}

        {/* ── Historic Info ── */}
        {exportMode.type === 'historic' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={sectionLabelSx}>
              <Calendar size={18} />
              {t('exportDialog.historicConfig.title')}
            </Typography>
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              {t('exportDialog.historicConfig.info')}
            </Alert>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* ── Format ── */}
        <Box>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={sectionLabelSx}>
              <FileText size={18} />
              {t('exportDialog.format.label')}
            </FormLabel>
            <RadioGroup
              value={format}
              onChange={(e) => setFormat(e.target.value as 'xlsx' | 'pdf')}
              row
            >
              <FormControlLabel
                value="xlsx"
                control={<Radio sx={{ color: '#22c55e' }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileSpreadsheet size={16} color="#22c55e" />
                    <span>{t('exportDialog.format.excel')}</span>
                  </Box>
                }
              />
              <FormControlLabel
                value="pdf"
                control={<Radio sx={{ color: '#ef4444' }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileText size={16} color="#ef4444" />
                    <span>{t('exportDialog.format.pdf')}</span>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button onClick={onClose} disabled={isExporting} sx={{ color: '#6b7280' }}>
          {t('exportDialog.actions.cancel')}
        </Button>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="contained"
          startIcon={isExporting ? <CircularProgress size={16} /> : <Download size={16} />}
          sx={{
            background: 'linear-gradient(135deg, #FFE67B, #fbbf24)',
            color: '#0B2863', fontWeight: 600,
            '&:hover': { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }
          }}
        >
          {isExporting
            ? t('exportDialog.actions.exporting')
            : t('exportDialog.actions.export', { format: format.toUpperCase() })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaidUnpaidExportDialog;