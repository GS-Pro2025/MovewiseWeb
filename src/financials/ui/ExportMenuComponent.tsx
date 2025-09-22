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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { FileDown } from 'lucide-react';
import { SuperOrder } from '../domain/ModelsOCR';
import { ExportUtils } from '../util/ExportUtils';

interface ExportMenuComponentProps {
  superOrders: SuperOrder[];
  isSearchResults?: boolean;
  week?: number;
  year?: number;
  weekRange?: { start: string; end: string };
  disabled?: boolean;
  fullWidth?: boolean; // Nueva prop para responsividad
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
      // Cambiar esta línea para usar la nueva función sin await
      ExportUtils.exportToPDF(superOrders, isSearchResults, week, year, weekRange);
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
      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 justify-center ${
        fullWidth ? 'w-full' : isMobile ? 'min-w-[120px]' : 'min-w-[140px]'
      } ${
        disabled || isExporting || superOrders.length === 0
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
      }`}
      style={{
        background: disabled || isExporting || superOrders.length === 0 
          ? '#d1d5db' 
          : 'linear-gradient(135deg, #FFE67B 0%, #fbbf24 100%)',
        color: disabled || isExporting || superOrders.length === 0 ? '#6b7280' : '#0B2863',
        minHeight: '48px'
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
      {isExporting ? (
        <CloudDownloadIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
      ) : (
        <FileDown size={isMobile ? 16 : 18} />
      )}
      <span className="font-bold">
        {isExporting 
          ? (isMobile ? 'Exporting...' : 'Exporting...') 
          : (isMobile ? 'Export' : fullWidth ? 'Export Data' : 'Export')
        }
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
            minWidth: isMobile ? '260px' : '280px',
            maxWidth: isMobile ? '90vw' : '320px',
            padding: '8px 0',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          }
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            padding: isMobile ? '12px 16px 8px 16px' : '16px 20px 12px 20px',
            background: '#0B2863',
            borderRadius: '12px 12px 0 0',
            margin: '-8px -0px 8px -0px'
          }}
        >
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{ 
              color: '#FFE67B', 
              fontWeight: 700,
              fontSize: isMobile ? '1rem' : '1.1rem',
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
              fontSize: isMobile ? '0.75rem' : '0.85rem',
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
            padding: isMobile ? '10px 16px' : '12px 20px',
            borderRadius: '8px',
            margin: isMobile ? '4px 8px' : '4px 12px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              transform: 'translateX(4px)',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: isMobile ? '36px' : '40px' }}>
            <TableViewIcon sx={{ color: '#22c55e', fontSize: isMobile ? 20 : 24 }} />
          </ListItemIcon>
          <ListItemText>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600, 
                fontSize: isMobile ? '0.875rem' : '0.95rem', 
                color: '#0B2863' 
              }}
            >
              Export to Excel
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#6b7280',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                display: isMobile ? 'none' : 'block'
              }}
            >
              Complete data with formatting (.xlsx)
            </Typography>
          </ListItemText>
        </MenuItem>

        {/* PDF Export Option */}
        <MenuItem 
          onClick={handleExportPDF} 
          disabled={isExporting}
          sx={{
            padding: isMobile ? '10px 16px' : '12px 20px',
            borderRadius: '8px',
            margin: isMobile ? '4px 8px' : '4px 12px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              transform: 'translateX(4px)',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: isMobile ? '36px' : '40px' }}>
            <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: isMobile ? 20 : 24 }} />
          </ListItemIcon>
          <ListItemText>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600, 
                fontSize: isMobile ? '0.875rem' : '0.95rem', 
                color: '#0B2863' 
              }}
            >
              Export to PDF
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#6b7280',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                display: isMobile ? 'none' : 'block'
              }}
            >
              Professional report with summary (.pdf)
            </Typography>
          </ListItemText>
        </MenuItem>

        <Divider sx={{ 
          margin: isMobile ? '6px 12px' : '8px 16px', 
          borderColor: '#0B2863', 
          opacity: 0.3 
        }} />
        
        {/* Footer Info */}
        <Box sx={{ padding: isMobile ? '6px 16px' : '8px 20px' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#0B2863', 
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              lineHeight: 1.3
            }}
          >
            💡 <span>
              {isSearchResults 
                ? 'Search results' 
                : `Week ${week}, ${year}`
              } data will be exported
            </span>
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default ExportMenuComponent;