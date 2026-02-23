import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Menu, MenuItem, ListItemIcon, ListItemText, Divider,
  Typography, Box, useMediaQuery, useTheme,
} from '@mui/material';
import PictureAsPdfIcon    from '@mui/icons-material/PictureAsPdf';
import TableViewIcon       from '@mui/icons-material/TableView';
import CloudDownloadIcon   from '@mui/icons-material/CloudDownload';
import BarChartIcon        from '@mui/icons-material/BarChart';        // ← reemplaza 📊
import TipsAndUpdatesIcon  from '@mui/icons-material/TipsAndUpdates';  // ← reemplaza 💡
import { FileDown } from 'lucide-react';
import { OrdersPaidUnpaidWeekRangeResponse } from '../../../domain/OrdersPaidUnpaidModels';
import { PaidUnpaidExportUtils } from './PaidUnpaidExportUtils';

export interface ExportMode {
  type: 'range' | 'historic';
  startWeek?: number;
  endWeek?: number;
  year: number;
}

interface PaidUnpaidExportMenuProps {
  rawData: OrdersPaidUnpaidWeekRangeResponse | null;
  exportMode: ExportMode;
  disabled?: boolean;
  fullWidth?: boolean;
}

const PaidUnpaidExportMenu: React.FC<PaidUnpaidExportMenuProps> = ({
  rawData, exportMode, disabled = false, fullWidth = false
}) => {
  const { t } = useTranslation();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl,    setAnchorEl]   = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClose = () => setAnchorEl(null);

  const handleExportExcel = async () => {
    setIsExporting(true);
    handleClose();
    try {
      await PaidUnpaidExportUtils.exportToExcel(rawData, exportMode);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    handleClose();
    try {
      PaidUnpaidExportUtils.exportToPDF(rawData, exportMode);
    } finally {
      setIsExporting(false);
    }
  };

  const summary = rawData
    ? { totalOrders: rawData.total_paid + rawData.total_unpaid }
    : { totalOrders: 0 };

  const isDisabled = disabled || isExporting || !rawData;

  const buttonLabel = isExporting
    ? t('exportMenu.button.exporting')
    : isMobile
      ? t('exportMenu.button.exportMobile')
      : fullWidth
        ? t('exportMenu.button.exportFull')
        : t('exportMenu.button.exportMobile');

  const headerSubtitle = exportMode.type === 'range'
    ? t('exportMenu.header.rangeSubtitle',    { start: exportMode.startWeek, end: exportMode.endWeek, year: exportMode.year, total: summary.totalOrders })
    : t('exportMenu.header.historicSubtitle', { year: exportMode.year, total: summary.totalOrders });

  const footerHint = exportMode.type === 'range'
    ? t('exportMenu.footer.rangeHint',    { start: exportMode.startWeek, end: exportMode.endWeek })
    : t('exportMenu.footer.historicHint', { year: exportMode.year });

  const activeGradient   = 'linear-gradient(135deg, #FFE67B 0%, #fbbf24 100%)';
  const hoverGradient    = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
  const disabledGradient = '#d1d5db';

  return (
    <>
      {/* Export Button */}
      <button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={isDisabled}
        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 justify-center ${
          fullWidth ? 'w-full' : isMobile ? 'min-w-[120px]' : 'min-w-[140px]'
        } ${isDisabled ? 'cursor-not-allowed' : ''}`}
        style={{
          background: isDisabled ? disabledGradient : activeGradient,
          color: isDisabled ? '#6b7280' : '#0B2863',
          minHeight: '48px'
        }}
        onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.background = hoverGradient; }}
        onMouseLeave={(e) => { if (!isDisabled) e.currentTarget.style.background = activeGradient; }}
      >
        {isExporting
          ? <CloudDownloadIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
          : <FileDown size={isMobile ? 16 : 18} />}
        <span className="font-bold">{buttonLabel}</span>
      </button>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            border: '2px solid #0B2863',
            minWidth: isMobile ? '260px' : '280px',
            maxWidth: isMobile ? '90vw' : '320px',
            padding: '8px 0',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          padding: isMobile ? '12px 16px 8px 16px' : '16px 20px 12px 20px',
          background: '#0B2863',
          borderRadius: '12px 12px 0 0',
          margin: '-8px 0px 8px 0px'
        }}>
          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            sx={{
              color: '#FFE67B', fontWeight: 700,
              fontSize: isMobile ? '1rem' : '1.1rem',
              display: 'flex', alignItems: 'center', gap: 1
            }}
          >
            {/* ✅ BarChartIcon reemplaza 📊 */}
            <BarChartIcon sx={{ fontSize: isMobile ? 18 : 22, color: '#FFE67B' }} />
            {t('exportMenu.header.title')}
          </Typography>
          <Typography variant="body2" sx={{
            color: '#ffffff', fontSize: isMobile ? '0.75rem' : '0.85rem', mt: 0.5, opacity: 0.9
          }}>
            {headerSubtitle}
          </Typography>
        </Box>

        {/* Excel */}
        <MenuItem
          onClick={handleExportExcel}
          disabled={isExporting}
          sx={{
            padding: isMobile ? '10px 16px' : '12px 20px',
            borderRadius: '8px',
            margin: isMobile ? '4px 8px' : '4px 12px',
            transition: 'all 0.2s ease',
            '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.1)', transform: 'translateX(4px)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: isMobile ? '36px' : '40px' }}>
            <TableViewIcon sx={{ color: '#22c55e', fontSize: isMobile ? 20 : 24 }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '0.95rem', color: '#0B2863' }}>
              {t('exportMenu.excel.label')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: isMobile ? '0.7rem' : '0.75rem', display: isMobile ? 'none' : 'block' }}>
              {t('exportMenu.excel.description')}
            </Typography>
          </ListItemText>
        </MenuItem>

        {/* PDF */}
        <MenuItem
          onClick={handleExportPDF}
          disabled={isExporting}
          sx={{
            padding: isMobile ? '10px 16px' : '12px 20px',
            borderRadius: '8px',
            margin: isMobile ? '4px 8px' : '4px 12px',
            transition: 'all 0.2s ease',
            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)', transform: 'translateX(4px)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: isMobile ? '36px' : '40px' }}>
            <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: isMobile ? 20 : 24 }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '0.95rem', color: '#0B2863' }}>
              {t('exportMenu.pdf.label')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: isMobile ? '0.7rem' : '0.75rem', display: isMobile ? 'none' : 'block' }}>
              {t('exportMenu.pdf.description')}
            </Typography>
          </ListItemText>
        </MenuItem>

        <Divider sx={{ margin: isMobile ? '6px 12px' : '8px 16px', borderColor: '#0B2863', opacity: 0.3 }} />

        {/* Footer */}
        <Box sx={{ padding: isMobile ? '6px 16px' : '8px 20px' }}>
          <Typography variant="caption" sx={{
            color: '#0B2863', fontSize: isMobile ? '0.7rem' : '0.75rem',
            display: 'flex', alignItems: 'center', gap: 1, lineHeight: 1.3
          }}>
            {/* ✅ TipsAndUpdatesIcon reemplaza 💡 */}
            <TipsAndUpdatesIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#fbbf24', flexShrink: 0 }} />
            <span>{footerHint}</span>
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default PaidUnpaidExportMenu;