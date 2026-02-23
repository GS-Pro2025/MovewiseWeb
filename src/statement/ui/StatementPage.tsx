/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography } from '@mui/material';
import StatementsTable from './StatementsList';
import OCRUploadDialog from '../../financials/ui/OCRUploadDialog';
import DocaiResultDialog from '../../financials/ui/DocaiResultDialog';
import VerificationResultsDialog from './VerificationResultsDialog';
import BulkUpdateDialog from './BulkUpdateDialog';
import ApplyToOrdersDialog from './ApplyToOrdersDialog';
import { processDocaiStatement, ProcessMode, DocaiProcessResult } from '../../financials/data/repositoryDOCAI';
import { verifyStatementRecords, bulkUpdateStatementStates, applyStatementToOrders } from '../data/StatementRepository';
import { VerifyStatementRecordsResponse, BulkUpdateStatementResponse, StatementRecord, VerificationItem, ApplyToOrdersResponse } from '../domain/StatementModels';
import { useSnackbar } from 'notistack';

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const StatementPage: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStep, setOcrStep] = useState<string>('Setting data');
  const [docaiDialogOpen, setDocaiDialogOpen] = useState(false);
  const [docaiDialogResult, setDocaiDialogResult] = useState<any>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<VerifyStatementRecordsResponse | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState<BulkUpdateStatementResponse | null>(null);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Array<{ statement_record_id: number; new_state: string }>>([]);
  const [applyToOrdersDialogOpen, setApplyToOrdersDialogOpen] = useState(false);
  const [currentVerification, setCurrentVerification] = useState<VerificationItem | null>(null);
  const [applyToOrdersLoading, setApplyToOrdersLoading] = useState(false);
  const [applyToOrdersResult, setApplyToOrdersResult] = useState<ApplyToOrdersResponse | null>(null);

  const handleOcrUpload = async (processMode: ProcessMode = 'full_process', targetWeek?: number, targetYear?: number) => {
    if (ocrFiles.length === 0) return;
    setOcrLoading(true);
    setOcrStep('Preparing files...');
    enqueueSnackbar(t('statementPage.startingMode', { mode: processMode }), { variant: 'info' });

    const results: any[] = [];
    try {
      for (const file of ocrFiles) {
        setOcrStep(`Processing ${file.name}...`);
        try {
          const res = await processDocaiStatement(file, processMode, targetWeek, targetYear) as DocaiProcessResult;
          const isSuccess = res.success !== false;
          results.push({
            name: file.name, success: isSuccess,
            message: res.message || (isSuccess ? 'Success' : 'Failed'),
            processMode: res.process_mode || processMode,
            processing_type: res.processing_type,
            data: res.data, ocr_text: res.ocr_text,
            parsed_orders: res.data?.parsed_orders || res.regular_orders_data?.parsed_orders,
            update_result: res.update_result || res.data?.update_summary || res.data?.save_summary,
            other_transactions_data: res.other_transactions_data,
            other_transactions_page: res.other_transactions_page,
            total_pages_scanned: res.total_pages_scanned,
          });
          if (isSuccess && !docaiDialogResult) {
            setDocaiDialogResult({
              message: res.message, processing_type: res.processing_type,
              other_transactions_page: res.other_transactions_page,
              total_pages_scanned: res.total_pages_scanned,
              ocr_text: res.ocr_text,
              parsed_orders: res.data?.parsed_orders || res.regular_orders_data?.parsed_orders,
              update_result: res.update_result || res.data?.update_summary || res.data?.save_summary,
              update_summary: res.data?.update_summary || res.regular_orders_data?.update_summary,
              other_transactions_data: res.other_transactions_data, data: res.data,
            });
          }
        } catch (err: any) {
          results.push({ name: file.name, success: false, message: err?.message || 'Error processing file' });
        }
      }
      setOcrResults(results);
      enqueueSnackbar(
        t('statementPage.processedFiles', { success: results.filter(r => r.success).length, total: results.length }),
        { variant: results.every(r => r.success) ? 'success' : 'warning' }
      );
      if (docaiDialogResult || results.length > 0) setDocaiDialogOpen(true);
    } catch (err: any) {
      enqueueSnackbar(t('statementPage.unexpectedError', { message: err?.message || err }), { variant: 'error' });
    } finally {
      setOcrLoading(false); setOcrStep('Done');
    }
  };

  const handleVerifyRecords = async (selectedRecords: StatementRecord[]) => {
    if (selectedRecords.length === 0) {
      enqueueSnackbar(t('statementPage.verifyWarning'), { variant: 'warning' }); return;
    }
    setVerificationLoading(true);
    try {
      const result = await verifyStatementRecords(selectedRecords.map(r => r.id));
      setVerificationData(result);
      setVerificationDialogOpen(true);
      if (result.warning) {
        enqueueSnackbar(t('statementPage.verifyWarningMissing', { warning: result.warning, ids: result.missing_ids?.join(', ') }), { variant: 'warning' });
      }
      enqueueSnackbar(t('statementPage.verifiedSuccess', { count: result.total_records }), { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(t('statementPage.verifyFailed', { message: error.message }), { variant: 'error' });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleApplyChanges = (updates: Array<{ statement_record_id: number; new_state: string }>) => {
    setPendingUpdates(updates);
    setVerificationDialogOpen(false);
    setBulkUpdateDialogOpen(true);
    setBulkUpdateData(null);
  };

  const handleConfirmBulkUpdate = async () => {
    if (pendingUpdates.length === 0) {
      enqueueSnackbar(t('statementPage.noUpdates'), { variant: 'warning' }); return;
    }
    setBulkUpdateLoading(true);
    try {
      const result = await bulkUpdateStatementStates(pendingUpdates);
      setBulkUpdateData(result);
      enqueueSnackbar(
        t('statementPage.updatedRecords', { success: result.successful_updates, total: result.total_updates }),
        { variant: result.failed_updates === 0 ? 'success' : 'warning' }
      );
    } catch (error: any) {
      enqueueSnackbar(t('statementPage.updateFailed', { message: error.message }), { variant: 'error' });
    } finally {
      setBulkUpdateLoading(false); setPendingUpdates([]);
    }
  };

  const handleConfirmApplyToOrders = async (action: 'auto' | 'overwrite' | 'add') => {
    if (!currentVerification) return;
    setApplyToOrdersLoading(true);
    try {
      const result = await applyStatementToOrders(currentVerification.statement_record_id, action);
      setApplyToOrdersResult(result);
      enqueueSnackbar(
        t('statementPage.appliedOrders', { updated: result.orders_updated, skipped: result.orders_skipped }),
        { variant: result.orders_failed > 0 ? 'warning' : 'success' }
      );
    } catch (error: any) {
      enqueueSnackbar(t('statementPage.applyFailed', { message: error.message }), { variant: 'error' });
    } finally {
      setApplyToOrdersLoading(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', borderRadius: 2, p: 2 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0 }}>
              {t('statementPage.title')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {t('statementPage.subtitle')}
            </Typography>
          </div>
          <button
            onClick={() => setOcrDialogOpen(true)}
            className="px-4 py-2 rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 6px 18px rgba(34,197,94,0.15)' }}>
            {t('statementPage.uploadButton')}
          </button>
        </div>

        <StatementsTable onVerifyRecords={handleVerifyRecords} />

        <OCRUploadDialog open={ocrDialogOpen} loading={ocrLoading} step={ocrStep} files={ocrFiles}
          results={ocrResults} onClose={() => setOcrDialogOpen(false)}
          onFilesSelected={(files: File[]) => setOcrFiles(files)} onUpload={handleOcrUpload}
          onProcessMore={() => { setOcrFiles([]); setOcrResults([]); setDocaiDialogResult(null); setOcrDialogOpen(true); }}
          onViewDetails={() => { setOcrDialogOpen(false); setDocaiDialogOpen(true); }}
          hasDetailedResults={!!docaiDialogResult}
          currentWeek={getISOWeek(new Date())} currentYear={new Date().getFullYear()}
        />

        <DocaiResultDialog open={docaiDialogOpen}
          onClose={() => { setDocaiDialogOpen(false); setDocaiDialogResult(null); setOcrResults([]); }}
          result={docaiDialogResult} />

        <VerificationResultsDialog open={verificationDialogOpen}
          onClose={() => { setVerificationDialogOpen(false); setVerificationData(null); }}
          onApplyChanges={handleApplyChanges}
          onApplyToOrders={(v) => { setCurrentVerification(v); setApplyToOrdersResult(null); setApplyToOrdersDialogOpen(true); }}
          verificationData={verificationData} loading={verificationLoading} />

        <BulkUpdateDialog open={bulkUpdateDialogOpen} onClose={() => { setBulkUpdateDialogOpen(false); setBulkUpdateData(null); setPendingUpdates([]); }}
          onConfirm={handleConfirmBulkUpdate} updateData={bulkUpdateData}
          loading={bulkUpdateLoading} isProcessing={bulkUpdateLoading} />

        <ApplyToOrdersDialog open={applyToOrdersDialogOpen}
          onClose={() => { setApplyToOrdersDialogOpen(false); setCurrentVerification(null); setApplyToOrdersResult(null); }}
          onApply={handleConfirmApplyToOrders} verification={currentVerification}
          loading={applyToOrdersLoading} applyResult={applyToOrdersResult} />
      </Box>
    </Container>
  );
};

export default StatementPage;