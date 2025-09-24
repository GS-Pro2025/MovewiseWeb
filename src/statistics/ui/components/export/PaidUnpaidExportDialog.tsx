import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress
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
  open,
  onClose,
  currentYear,
  currentStartWeek,
  currentEndWeek
}) => {
  const [exportMode, setExportMode] = useState<ExportDialogMode>({
    type: 'range',
    startWeek: currentStartWeek,
    endWeek: currentEndWeek,
    year: currentYear
  });
  
  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newType: 'range' | 'historic') => {
    setExportMode(prev => ({
      ...prev,
      type: newType,
      startWeek: newType === 'range' ? prev.startWeek : undefined,
      endWeek: newType === 'range' ? prev.endWeek : undefined,
      // El año se mantiene solo para compatibilidad, pero no se usa en historic
      year: prev.year
    }));
    setError(null);
  };

  const handleExport = async () => {
    setError(null);
    
    // Validaciones
    if (exportMode.type === 'range') {
      if (!exportMode.startWeek || !exportMode.endWeek) {
        setError('Please specify both start and end weeks');
        return;
      }
      if (exportMode.startWeek > exportMode.endWeek) {
        setError('Start week cannot be greater than end week');
        return;
      }
      if (exportMode.startWeek < 1 || exportMode.endWeek > 53) {
        setError('Weeks must be between 1 and 53');
        return;
      }
    }

    setIsExporting(true);
    
    try {
      // Obtener los datos según el modo seleccionado
      const data = await PaidUnpaidExportUtils.fetchDataForExport(exportMode);
      
      if (format === 'xlsx') {
        await PaidUnpaidExportUtils.exportToExcel(data, exportMode);
      } else {
        // Usar el nuevo método que abre en nueva ventana (patrón financialView)
        PaidUnpaidExportUtils.openPrintableReport(data, exportMode);
      }
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          border: '2px solid #0B2863'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #0B2863, #1e40af)',
        color: '#FFE67B',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Download size={24} />
        Export Payment Analytics
      </DialogTitle>
      
      <DialogContent sx={{ padding: '24px' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel 
              component="legend" 
              sx={{ 
                color: '#0B2863', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Database size={18} />
              Data Mode
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
                    <Typography variant="body1" fontWeight={600}>Week Range Export</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Export specific week range with customizable parameters
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="historic"
                control={<Radio sx={{ color: '#0B2863' }} />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>Historic Export</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Export all available historical data (all years and weeks)
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {exportMode.type === 'range' && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: '#0B2863', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Calendar size={18} />
              Week Range Configuration
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                label="Year"
                type="number"
                value={exportMode.year}
                onChange={(e) => setExportMode(prev => ({ ...prev, year: Number(e.target.value) }))}
                size="small"
                fullWidth
              />
              <TextField
                label="Start Week"
                type="number"
                inputProps={{ min: 1, max: 53 }}
                value={exportMode.startWeek || ''}
                onChange={(e) => setExportMode(prev => ({ ...prev, startWeek: Number(e.target.value) }))}
                size="small"
                fullWidth
              />
              <TextField
                label="End Week"
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

        {/* Solo mostrar info para modo histórico, no campos de entrada */}
        {exportMode.type === 'historic' && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: '#0B2863', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Calendar size={18} />
              Historic Data Export
            </Typography>
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              This will export all available historical payment data from the database. 
              No date range selection needed - all records will be included.
            </Alert>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box>
          <FormControl component="fieldset" fullWidth>
            <FormLabel 
              component="legend" 
              sx={{ 
                color: '#0B2863', 
                fontWeight: 600, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <FileText size={18} />
              Export Format
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
                    <span>Excel (.xlsx)</span>
                  </Box>
                }
              />
              <FormControlLabel
                value="pdf"
                control={<Radio sx={{ color: '#ef4444' }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileText size={16} color="#ef4444" />
                    <span>PDF Report</span>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button 
          onClick={onClose} 
          disabled={isExporting}
          sx={{ color: '#6b7280' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="contained"
          startIcon={isExporting ? <CircularProgress size={16} /> : <Download size={16} />}
          sx={{
            background: 'linear-gradient(135deg, #FFE67B, #fbbf24)',
            color: '#0B2863',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            }
          }}
        >
          {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaidUnpaidExportDialog;