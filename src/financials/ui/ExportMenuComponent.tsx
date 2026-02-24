import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Chip
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { FileDown, TrendingUp, Calendar } from 'lucide-react';
import { SuperOrder } from '../domain/ModelsOCR';
import { ExportUtils } from '../util/ExportUtils';
import { useTranslation } from 'react-i18next';

interface ExportMenuComponentProps {
  superOrders: SuperOrder[];
  isSearchResults?: boolean;
  week?: number;
  year?: number;
  weekRange?: { start: string; end: string };
  disabled?: boolean;
  fullWidth?: boolean;
}

const ExportMenuComponent: React.FC<ExportMenuComponentProps> = ({
  superOrders,
  isSearchResults = false,
  week,
  year,
  weekRange,
  disabled = false,
  fullWidth = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    handleClose();
    try {
      await ExportUtils.exportToExcel(superOrders, isSearchResults, week, year);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    handleClose();
    try {
      ExportUtils.exportToPDF(superOrders, isSearchResults, week, year, weekRange);
    } finally {
      setIsExporting(false);
    }
  };

  const getDataSummary = () =>
    superOrders.reduce(
      (acc, order) => ({
        totalOrders: acc.totalOrders + 1,
        totalProfit: acc.totalProfit + order.totalProfit,
        paidOrders: acc.paidOrders + (order.payStatus === 1 ? 1 : 0),
      }),
      { totalOrders: 0, totalProfit: 0, paidOrders: 0 }
    );

  const summary = getDataSummary();
  const isDisabled = disabled || isExporting || superOrders.length === 0;

  const ExportButton = () => (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 justify-center ${
        fullWidth ? 'w-full' : isMobile ? 'min-w-[100px]' : 'min-w-[120px]'
      } ${isDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'}`}
      style={{
        background: isDisabled ? '#e5e7eb' : 'linear-gradient(135deg, #FFE67B 0%, #fbbf24 100%)',
        color: isDisabled ? '#9ca3af' : '#0B2863',
        minHeight: '36px',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) e.currentTarget.style.background = 'linear-gradient(135deg, #FFE67B 0%, #fbbf24 100%)';
      }}
    >
      {isExporting ? <CloudDownloadIcon sx={{ fontSize: 16 }} className="animate-spin" /> : <FileDown size={14} />}
      <span className="font-medium">{isExporting ? '...' : t('exportMenu.export')}</span>
    </button>
  );

  return (
    <>
      <ExportButton />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #0B2863',
            minWidth: isMobile ? '220px' : '240px',
            maxWidth: isMobile ? '90vw' : '280px',
            py: 0.5,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: '#0B2863', borderBottom: '1px solid #FFE67B' }}>
          <Typography variant="subtitle2" sx={{ color: '#FFE67B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon sx={{ fontSize: 16 }} />
            {t('exportMenu.title')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip
              label={t('exportMenu.ordersCount', { count: summary.totalOrders })}
              size="small"
              sx={{ height: '20px', fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <Chip
              icon={<TrendingUp size={10} />}
              label={`$${summary.totalProfit.toLocaleString()}`}
              size="small"
              sx={{ height: '20px', fontSize: '0.65rem', bgcolor: 'rgba(34, 197, 94, 0.3)', color: 'white' }}
            />
          </Box>
        </Box>

        {/* Excel */}
        <MenuItem
          onClick={handleExportExcel}
          disabled={isExporting}
          sx={{ py: 1, px: 2, mx: 1, my: 0.5, borderRadius: '6px', '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            <TableViewIcon sx={{ color: '#22c55e', fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#0B2863' }}>
              {t('exportMenu.excel')}
            </Typography>
          </ListItemText>
        </MenuItem>

        {/* PDF */}
        <MenuItem
          onClick={handleExportPDF}
          disabled={isExporting}
          sx={{ py: 1, px: 2, mx: 1, my: 0.5, borderRadius: '6px', '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#0B2863' }}>
              {t('exportMenu.pdf')}
            </Typography>
          </ListItemText>
        </MenuItem>

        {/* Footer */}
        <Box sx={{ px: 2, py: 1, borderTop: '1px solid #e5e7eb', mt: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={12} style={{ color: '#6b7280' }} />
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              {isSearchResults
                ? t('exportMenu.searchResults')
                : t('exportMenu.weekYear', { week, year })}
            </Typography>
          </Box>
        </Box>
      </Menu>
    </>
  );
};

export default ExportMenuComponent;