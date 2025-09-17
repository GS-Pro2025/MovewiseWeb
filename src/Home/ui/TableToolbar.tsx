import React from 'react';
import { Box, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { TableData } from '../domain/TableData';

interface TableToolbarProps {
  data: TableData[];
  selectedRows: TableData[];
  onExportExcel: (data: TableData[], filename: string) => void;
  onExportPDF: (data: TableData[], filename: string) => void;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  data,
  selectedRows,
  onExportExcel,
  onExportPDF,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        flexWrap: 'wrap',
      }}
    >
      <Button
        onClick={() => onExportExcel(data, 'orders_all_data')}
        startIcon={<FileDownloadIcon />}
        variant="outlined"
        color="primary"
        disabled={data.length === 0}
      >
        Export Excel (All)
      </Button>
      
      <Button
        onClick={() => onExportExcel(selectedRows, 'orders_selected')}
        startIcon={<FileDownloadIcon />}
        variant="outlined"
        color="primary"
        disabled={selectedRows.length === 0}
      >
        Export Excel (Selected)
      </Button>
      
      <Button
        onClick={() => onExportPDF(data, 'orders_all_data')}
        startIcon={<PictureAsPdfIcon />}
        variant="outlined"
        color="secondary"
        disabled={data.length === 0}
      >
        Export PDF (All)
      </Button>
      
      <Button
        onClick={() => onExportPDF(selectedRows, 'orders_selected')}
        startIcon={<PictureAsPdfIcon />}
        variant="outlined"
        color="secondary"
        disabled={selectedRows.length === 0}
      >
        Export PDF (Selected)
      </Button>
    </Box>
  );
};