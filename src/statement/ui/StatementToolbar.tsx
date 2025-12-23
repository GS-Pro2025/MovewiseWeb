import React from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import { FileSpreadsheet, FileText, RefreshCw, CheckCircle } from 'lucide-react';
import { StatementRecord } from '../domain/StatementModels';

interface StatementToolbarProps {
  data: StatementRecord[];
  selectedRows: StatementRecord[];
  onExportExcel: (data: StatementRecord[], filename: string) => void;
  onExportPDF: (data: StatementRecord[], filename: string) => void;
  onRefresh: () => void;
  onVerifyRecords?: (records: StatementRecord[]) => void;
}

export const StatementToolbar: React.FC<StatementToolbarProps> = ({
  data,
  selectedRows,
  onExportExcel,
  onExportPDF,
  onRefresh,
  onVerifyRecords
}) => {
  const handleExportExcel = () => {
    const exportData = selectedRows.length > 0 ? selectedRows : data;
    const filename = `statements_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    onExportExcel(exportData, filename);
  };

  const handleExportPDF = () => {
    const exportData = selectedRows.length > 0 ? selectedRows : data;
    const filename = `statements_export_${new Date().toISOString().split('T')[0]}.pdf`;
    onExportPDF(exportData, filename);
  };

  const handleVerify = () => {
    if (onVerifyRecords && selectedRows.length > 0) {
      // Company ID is automatically extracted from JWT token
      onVerifyRecords(selectedRows);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" color="primary">
          Statement Records
        </Typography>
        <Chip 
          label={`${data.length} total`} 
          size="small" 
          variant="outlined" 
          color="primary" 
        />
        {selectedRows.length > 0 && (
          <Chip 
            label={`${selectedRows.length} selected`} 
            size="small" 
            color="secondary" 
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {onVerifyRecords && (
          <Tooltip
            title={selectedRows.length === 0 ? 'Please select at least one statement record to verify' : 'Verify selected records against existing orders'}
            arrow
            placement="top"
          >
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckCircle size={16} />}
                onClick={handleVerify}
                disabled={selectedRows.length === 0}
                sx={{ minWidth: '140px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
              >
                Verify Records
              </Button>
            </span>
          </Tooltip>
        )}
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshCw size={16} />}
          onClick={onRefresh}
          sx={{ minWidth: '100px' }}
        >
          Refresh
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileSpreadsheet size={16} />}
          onClick={handleExportExcel}
          disabled={data.length === 0}
          sx={{ minWidth: '120px' }}
        >
          Excel
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileText size={16} />}
          onClick={handleExportPDF}
          disabled={data.length === 0}
          sx={{ minWidth: '120px' }}
        >
          PDF
        </Button>
      </Box>
    </Box>
  );
};