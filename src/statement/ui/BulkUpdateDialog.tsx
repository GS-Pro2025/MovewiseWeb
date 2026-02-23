/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Typography, Alert, CircularProgress,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';
import { BulkUpdateStatementResponse, BulkUpdateResult } from '../domain/StatementModels';

interface BulkUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  updateData: BulkUpdateStatementResponse | null;
  loading: boolean;
  isProcessing: boolean;
}

const BulkUpdateDialog: React.FC<BulkUpdateDialogProps> = ({
  open, onClose, onConfirm, updateData, loading, isProcessing,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {updateData ? t('bulkUpdate.titleResult') : t('bulkUpdate.titleConfirm')}
        {!updateData && !loading && !isProcessing && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            {t('bulkUpdate.subtitle')}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading || isProcessing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              {t('bulkUpdate.updating')}
            </Typography>
          </Box>
        ) : updateData ? (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
              {[
                { label: t('bulkUpdate.totalUpdates'), value: updateData.total_updates, bg: '#f5f5f5', color: undefined },
                { label: t('bulkUpdate.successful'), value: updateData.successful_updates, bg: '#d4edda', color: '#155724' },
                { label: t('bulkUpdate.failed'), value: updateData.failed_updates, bg: '#f8d7da', color: '#721c24' },
              ].map(({ label, value, bg, color }) => (
                <Box key={label} sx={{ p: 2, backgroundColor: bg, borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary">{label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color }}>{value}</Typography>
                </Box>
              ))}
            </Box>

            {updateData.failed_updates === 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>{t('bulkUpdate.successAlert')}</Alert>
            ) : updateData.failed_updates < updateData.total_updates ? (
              <Alert severity="warning" sx={{ mb: 2 }}>{t('bulkUpdate.warningAlert')}</Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>{t('bulkUpdate.errorAlert')}</Alert>
            )}

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell width="50px" align="center">{t('bulkUpdate.status')}</TableCell>
                    <TableCell width="100px">{t('bulkUpdate.recordId')}</TableCell>
                    <TableCell width="120px">{t('bulkUpdate.previousState')}</TableCell>
                    <TableCell width="120px">{t('bulkUpdate.newState')}</TableCell>
                    <TableCell>{t('bulkUpdate.message')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {updateData.results.map((result: BulkUpdateResult, idx: number) => (
                    <TableRow key={idx} sx={{ backgroundColor: result.success ? '#f0f9ff' : '#fff5f5' }}>
                      <TableCell align="center">
                        {result.success
                          ? <CheckCircleIcon sx={{ color: '#28a745', fontSize: '1.25rem' }} />
                          : <ErrorIcon sx={{ color: '#dc3545', fontSize: '1.25rem' }} />}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>#{result.statement_record_id}</TableCell>
                      <TableCell>
                        {result.previous_state
                          ? <Chip label={result.previous_state} size="small" variant="outlined" />
                          : <Typography variant="caption" color="textSecondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {result.new_state
                          ? <Chip label={result.new_state} size="small" color="primary" />
                          : <Typography variant="caption" color="textSecondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {result.success
                          ? <Typography variant="caption" color="success.main">{t('bulkUpdate.updatedSuccess')}</Typography>
                          : <Typography variant="caption" color="error.main">{result.error_message || t('bulkUpdate.unknownError')}</Typography>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {t('bulkUpdate.readyTitle')}
              </Typography>
              <Typography variant="body2"
                dangerouslySetInnerHTML={{ __html: t('bulkUpdate.readyDesc') }} />
              <Typography variant="body2" sx={{ mt: 1 }}>{t('bulkUpdate.readyNote')}</Typography>
            </Alert>
            <Typography variant="caption" color="textSecondary">{t('bulkUpdate.footerNote')}</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>{t('bulkUpdate.close')}</Button>
        {!updateData && (
          <Button onClick={onConfirm} variant="contained" color="primary" disabled={isProcessing}>
            {isProcessing ? <CircularProgress size={24} /> : t('bulkUpdate.confirmButton')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkUpdateDialog;