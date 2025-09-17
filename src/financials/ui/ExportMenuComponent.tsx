// components/ExportMenuComponent.tsx
import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { SuperOrder } from '../domain/ModelsOCR';
import { ExportUtils } from '../util/ExportUtils';

interface ExportMenuComponentProps {
  superOrders: SuperOrder[];
  isSearchResults?: boolean;
  week?: number;
  year?: number;
  weekRange?: { start: string; end: string };
  disabled?: boolean;
}

const ExportMenuComponent: React.FC<ExportMenuComponentProps> = ({
  superOrders,
  isSearchResults = false,
  week,
  year,
  weekRange,
  disabled = false
}) => {
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
      await ExportUtils.exportToPDF(superOrders, isSearchResults, week, year, weekRange);
    } finally {
      setIsExporting(false);
    }
  };

  const getDataSummary = () => {
    const totals = superOrders.reduce((acc, order) => ({
      totalOrders: acc.totalOrders + 1,
      totalProfit: acc.totalProfit + order.totalProfit,
      paidOrders: acc.paidOrders + (order.payStatus === 1 ? 1 : 0)
    }), { totalOrders: 0, totalProfit: 0, paidOrders: 0 });

    return totals;
  };

  const summary = getDataSummary();

  const ExportButton = () => (
    <button
      onClick={handleClick}
      disabled={disabled || isExporting || superOrders.length === 0}
      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center ${
        disabled || isExporting || superOrders.length === 0
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
      }`}
      style={{
        background: disabled || isExporting || superOrders.length === 0 
          ? '#d1d5db' 
          : 'linear-gradient(135deg, #FFE67B 0%, #fbbf24 100%)',
        color: disabled || isExporting || superOrders.length === 0 ? '#6b7280' : '#0B2863'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isExporting && superOrders.length > 0) {
          e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isExporting && superOrders.length > 0) {
          e.currentTarget.style.background = 'linear-gradient(135deg, #FFE67B 0%, #fbbf24 100%)';
        }
      }}
    >
      {isExporting ? <CloudDownloadIcon /> : <GetAppIcon />}
      <span className="font-bold">
        {isExporting ? 'Exporting...' : 'Export Data'}
      </span>
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
            borderRadius: '16px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            border: '2px solid #0B2863',
            minWidth: '280px',
            padding: '8px 0',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          }
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            padding: '16px 20px 12px 20px',
            background: '#0B2863',
            borderRadius: '12px 12px 0 0',
            margin: '-8px -0px 8px -0px'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#FFE67B', 
              fontWeight: 700,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            📊 Export Financial Data
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#ffffff', 
              fontSize: '0.85rem',
              mt: 0.5,
              opacity: 0.9
            }}
          >
            {summary.totalOrders} orders • ${summary.totalProfit.toLocaleString()} profit
          </Typography>
        </Box>

        {/* Excel Export Option */}
        <MenuItem 
          onClick={handleExportExcel} 
          disabled={isExporting}
          sx={{
            padding: '12px 20px',
            borderRadius: '8px',
            margin: '4px 12px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              transform: 'translateX(4px)',
            }
          }}
        >
          <ListItemIcon>
            <TableViewIcon sx={{ color: '#22c55e', fontSize: 24 }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#0B2863' }}>
              Export to Excel
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Complete data with formatting (.xlsx)
            </Typography>
          </ListItemText>
        </MenuItem>

        {/* PDF Export Option */}
        <MenuItem 
          onClick={handleExportPDF} 
          disabled={isExporting}
          sx={{
            padding: '12px 20px',
            borderRadius: '8px',
            margin: '4px 12px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              transform: 'translateX(4px)',
            }
          }}
        >
          <ListItemIcon>
            <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 24 }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#0B2863' }}>
              Export to PDF
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Professional report with summary (.pdf)
            </Typography>
          </ListItemText>
        </MenuItem>

        <Divider sx={{ margin: '8px 16px', borderColor: '#0B2863', opacity: 0.3 }} />
        
        {/* Footer Info */}
        <Box sx={{ padding: '8px 20px' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#0B2863', 
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            💡 <span>
              {isSearchResults ? 'Search results' : `Week ${week}, ${year}`} data will be exported
            </span>
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default ExportMenuComponent;