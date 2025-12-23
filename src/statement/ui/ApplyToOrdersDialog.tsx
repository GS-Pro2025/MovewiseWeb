/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';
import { VerificationItem, ApplyToOrdersResponse } from '../domain/StatementModels';

interface ApplyToOrdersDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (action: 'auto' | 'overwrite' | 'add') => void;
  verification: VerificationItem | null;
  loading: boolean;
  applyResult: ApplyToOrdersResponse | null;
}

const ApplyToOrdersDialog: React.FC<ApplyToOrdersDialogProps> = ({
  open,
  onClose,
  onApply,
  verification,
  loading,
  applyResult,
}) => {
  const [selectedAction, setSelectedAction] = useState<'auto' | 'overwrite' | 'add'>('auto');

  const handleApply = () => {
    onApply(selectedAction);
  };

  const hasOrdersWithValues = verification?.matching_orders.some(
    (order) => parseFloat(order.income) > 0 || parseFloat(order.expense) > 0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {applyResult ? 'Apply Results' : 'Apply Statement to Orders'}
        {verification && !applyResult && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            Key Ref: {verification.keyref} - {verification.matching_orders_count} order(s)
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Applying amounts to orders...
            </Typography>
          </Box>
        ) : applyResult ? (
          // Show Results
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, mb: 3 }}>
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Total Orders
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {applyResult.total_orders}
                </Typography>
              </Box>
              <Box sx={{ p: 2, backgroundColor: '#d4edda', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Updated
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#155724' }}>
                  {applyResult.orders_updated}
                </Typography>
              </Box>
              <Box sx={{ p: 2, backgroundColor: '#fff3cd', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Skipped
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#856404' }}>
                  {applyResult.orders_skipped}
                </Typography>
              </Box>
              <Box sx={{ p: 2, backgroundColor: '#f8d7da', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Failed
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#721c24' }}>
                  {applyResult.orders_failed}
                </Typography>
              </Box>
            </Box>

            {applyResult.orders_failed === 0 && applyResult.orders_updated > 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Successfully applied amounts to {applyResult.orders_updated} order(s)!
              </Alert>
            ) : applyResult.orders_failed > 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Some orders failed to update. Check details below.
              </Alert>
            ) : applyResult.orders_skipped > 0 && applyResult.orders_updated === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                All orders were skipped because they already have values.
              </Alert>
            ) : null}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Distribution per Order:
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Income
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  ${parseFloat(applyResult.distribution_per_order.income).toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Expense
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  ${parseFloat(applyResult.distribution_per_order.expense).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell width="50px" align="center">Status</TableCell>
                    <TableCell>Order Key</TableCell>
                    <TableCell align="right">Previous Income</TableCell>
                    <TableCell align="right">New Income</TableCell>
                    <TableCell align="right">Previous Expense</TableCell>
                    <TableCell align="right">New Expense</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applyResult.order_results.map((result, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        backgroundColor: result.success
                          ? result.action_taken === 'skipped'
                            ? '#fffbf0'
                            : '#f0f9ff'
                          : '#fff5f5',
                      }}
                    >
                      <TableCell align="center">
                        {result.success ? (
                          <CheckCircleIcon sx={{ color: '#28a745', fontSize: '1.25rem' }} />
                        ) : (
                          <ErrorIcon sx={{ color: '#dc3545', fontSize: '1.25rem' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {result.order_key.substring(0, 8)}...
                      </TableCell>
                      <TableCell align="right">${parseFloat(result.previous_income).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ${parseFloat(result.new_income).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">${parseFloat(result.previous_expense).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ${parseFloat(result.new_expense).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={result.action_taken}
                          size="small"
                          color={
                            result.action_taken === 'skipped'
                              ? 'default'
                              : result.success
                              ? 'success'
                              : 'error'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : verification ? (
          // Show Action Selection
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This statement record has <strong>{verification.matching_orders_count} matching order(s)</strong>.
                Choose how to apply the amounts.
              </Typography>
            </Alert>

            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Statement Amounts:
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Income
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    ${parseFloat(verification.statement_income).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Expense
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    ${parseFloat(verification.statement_expense).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {hasOrdersWithValues && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ⚠️ Some orders already have values
                </Typography>
                <Typography variant="caption">
                  Choose your action carefully to avoid overwriting existing data.
                </Typography>
              </Alert>
            )}

            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Select Action:
              </FormLabel>
              <RadioGroup value={selectedAction} onChange={(e) => setSelectedAction(e.target.value as any)}>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    value="auto"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Auto (Recommended)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Only updates orders with income/expense at 0 or NULL. Safe option that won't overwrite
                          existing data.
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    value="overwrite"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Overwrite
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Replaces all order amounts with distributed values from the statement. Use when you trust
                          the statement over existing orders.
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box>
                  <FormControlLabel
                    value="add"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Add
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Adds distributed statement amounts to existing order values. Use when you want to combine
                          both sources.
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </RadioGroup>
            </FormControl>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Distribution:</strong> Amounts will be divided equally among all {verification.matching_orders_count} order(s).
                Each order will receive ${(parseFloat(verification.statement_income) / verification.matching_orders_count).toFixed(2)} income
                and ${(parseFloat(verification.statement_expense) / verification.matching_orders_count).toFixed(2)} expense.
              </Typography>
            </Alert>
          </>
        ) : (
          <Typography>No verification data available</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {!applyResult && verification && (
          <Button onClick={handleApply} variant="contained" color="primary" disabled={loading}>
            Apply to Orders
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ApplyToOrdersDialog;
