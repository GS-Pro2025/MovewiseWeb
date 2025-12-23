/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Alert,
  CircularProgress,
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
  open,
  onClose,
  onConfirm,
  updateData,
  loading,
  isProcessing,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {updateData ? 'Update Results' : 'Confirm State Update'}
        {!updateData && !loading && !isProcessing && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            Update states for selected statement records
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading || isProcessing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Updating statement record states...
            </Typography>
          </Box>
        ) : updateData ? (
          <>
            {/* Summary Stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 2,
                mb: 3,
              }}
            >
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Total Updates
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {updateData.total_updates}
                </Typography>
              </Box>
              <Box sx={{ p: 2, backgroundColor: '#d4edda', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Successful
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#155724' }}>
                  {updateData.successful_updates}
                </Typography>
              </Box>
              <Box sx={{ p: 2, backgroundColor: '#f8d7da', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Failed
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#721c24' }}>
                  {updateData.failed_updates}
                </Typography>
              </Box>
            </Box>

            {/* Alert based on results */}
            {updateData.failed_updates === 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                All records updated successfully!
              </Alert>
            ) : updateData.failed_updates < updateData.total_updates ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Some records failed to update. Check details below.
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                All updates failed. Check details below.
              </Alert>
            )}

            {/* Results Table */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell width="50px" align="center">
                      Status
                    </TableCell>
                    <TableCell width="100px">Record ID</TableCell>
                    <TableCell width="120px">Previous State</TableCell>
                    <TableCell width="120px">New State</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {updateData.results.map((result: BulkUpdateResult, idx: number) => (
                    <TableRow
                      key={idx}
                      sx={{
                        backgroundColor: result.success ? '#f0f9ff' : '#fff5f5',
                      }}
                    >
                      <TableCell align="center">
                        {result.success ? (
                          <CheckCircleIcon sx={{ color: '#28a745', fontSize: '1.25rem' }} />
                        ) : (
                          <ErrorIcon sx={{ color: '#dc3545', fontSize: '1.25rem' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        #{result.statement_record_id}
                      </TableCell>
                      <TableCell>
                        {result.previous_state ? (
                          <Chip
                            label={result.previous_state}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.new_state ? (
                          <Chip label={result.new_state} size="small" color="primary" />
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <Typography variant="caption" color="success.main">
                            Updated successfully
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="error.main">
                            {result.error_message || 'Unknown error'}
                          </Typography>
                        )}
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
                Ready to Update Statement Record States
              </Typography>
              <Typography variant="body2">
                This operation will only update the <strong>state field</strong> of the selected statement records and
                <strong>the income and expense amount.</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                To update order amounts, use the "Apply to Orders" option after verification.
              </Typography>
            </Alert>
            <Typography variant="caption" color="textSecondary">
              Note: You can verify the changes after updating by refreshing the statements table.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {!updateData && (
          <Button
            onClick={onConfirm}
            variant="contained"
            color="primary"
            disabled={isProcessing}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Confirm Update'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkUpdateDialog;
