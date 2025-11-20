/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import StatementsTable from './StatementsList';
import OCRUploadDialog from '../../financials/ui/OCRUploadDialog';
import DocaiResultDialog from '../../financials/ui/DocaiResultDialog';
import { processDocaiStatement, ProcessMode, DocaiProcessResult } from '../../financials/data/repositoryDOCAI';
import { useSnackbar } from 'notistack';

// Helper: devuelve número de semana ISO (1..53)
function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = tmp.getUTCDay() || 7; // Monday=1 ... Sunday=7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const StatementPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // OCR states (reused from FinancialView behavior)
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStep, setOcrStep] = useState<string>('Setting data');
  const [docaiDialogOpen, setDocaiDialogOpen] = useState(false);
  const [docaiDialogResult, setDocaiDialogResult] = useState<any>(null);

  // Handler to start processing OCR files (keeps behavior consistent with FinancialView)
  const handleOcrUpload = async (processMode: ProcessMode = 'full_process', targetWeek?: number, targetYear?: number) => {
    if (ocrFiles.length === 0) return;
    setOcrLoading(true);
    setOcrStep('Preparing files...');
    enqueueSnackbar(`Starting document processing in ${processMode} mode...`, { variant: 'info' });

    const results: any[] = [];
    try {
      for (const file of ocrFiles) {
        setOcrStep(`Processing ${file.name}...`);
        try {
          const res = await processDocaiStatement(file, processMode, targetWeek, targetYear) as DocaiProcessResult;
          const isSuccess = res.success !== false;
          results.push({
            name: file.name,
            success: isSuccess,
            message: res.message || (isSuccess ? 'Success' : 'Failed'),
            processMode: res.process_mode || processMode,
            processing_type: res.processing_type, // Agregar processing_type
            data: res.data,
            ocr_text: res.ocr_text,
            parsed_orders: res.data?.parsed_orders || res.regular_orders_data?.parsed_orders,
            update_result: res.update_result || res.data?.update_summary || res.data?.save_summary,
            other_transactions_data: res.other_transactions_data, // Agregar other_transactions_data
            other_transactions_page: res.other_transactions_page,
            total_pages_scanned: res.total_pages_scanned,
          });

          // set first successful result for detailed dialog
          if (isSuccess && !docaiDialogResult) {
            setDocaiDialogResult({
              message: res.message,
              processing_type: res.processing_type,
              other_transactions_page: res.other_transactions_page,
              total_pages_scanned: res.total_pages_scanned,
              ocr_text: res.ocr_text,
              parsed_orders: res.data?.parsed_orders || res.regular_orders_data?.parsed_orders,
              update_result: res.update_result || res.data?.update_summary || res.data?.save_summary,
              update_summary: res.data?.update_summary || res.regular_orders_data?.update_summary,
              other_transactions_data: res.other_transactions_data,
              data: res.data,
            });
          }
        } catch (err: any) {
          results.push({
            name: file.name,
            success: false,
            message: err?.message || 'Error processing file',
          });
        }
      }

      setOcrResults(results);
      enqueueSnackbar(`Processed ${results.filter(r => r.success).length}/${results.length} files`, { variant: results.every(r => r.success) ? 'success' : 'warning' });

      // Open result dialog if we prepared a docai result
      if (docaiDialogResult || results.length > 0) {
        setDocaiDialogOpen(true);
      }
    } catch (err: any) {
      enqueueSnackbar(`Unexpected error: ${err?.message || err}`, { variant: 'error' });
    } finally {
      setOcrLoading(false);
      setOcrStep('Done');
    }
  };

  const handleOcrClose = () => {
    setOcrDialogOpen(false);
    // keep results if user wants to see them
  };

  const handleProcessMore = () => {
    setOcrFiles([]);
    setOcrResults([]);
    setDocaiDialogResult(null);
    setOcrDialogOpen(true);
  };

  const handleViewDetailedResults = () => {
    setOcrDialogOpen(false);
    setDocaiDialogOpen(true);
  };

  const handleDocaiDialogClose = () => {
    setDocaiDialogOpen(false);
    setDocaiDialogResult(null);
    setOcrResults([]);
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        borderRadius: 2,
        p: 2
      }}>
        {/* Header with Upload button on the right (filters area) */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0 }}>
              Statements
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage statement records and imports
            </Typography>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setOcrDialogOpen(true)}
              className="px-4 py-2 rounded-xl text-white font-semibold"
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                boxShadow: '0 6px 18px rgba(34,197,94,0.15)'
              }}
            >
              Upload PDFs (OCR)
            </button>
          </div>
        </div>

        <StatementsTable />

        {/* OCR dialogs reused from financials */}
        <OCRUploadDialog
          open={ocrDialogOpen}
          loading={ocrLoading}
          step={ocrStep}
          files={ocrFiles}
          results={ocrResults}
          onClose={handleOcrClose}
          onFilesSelected={(files: File[]) => setOcrFiles(files)}
          onUpload={handleOcrUpload}
          onProcessMore={handleProcessMore}
          onViewDetails={handleViewDetailedResults}
          hasDetailedResults={!!docaiDialogResult}
          currentWeek={getISOWeek(new Date())}
          currentYear={new Date().getFullYear()}
        />

        <DocaiResultDialog
          open={docaiDialogOpen}
          onClose={handleDocaiDialogClose}
          result={docaiDialogResult}
        />
      </Box>
    </Container>
  );
};

export default StatementPage;