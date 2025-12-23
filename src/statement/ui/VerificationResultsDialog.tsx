/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
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
  Collapse,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { VerifyStatementRecordsResponse } from '../domain/StatementModels';

interface VerificationResultsDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyChanges: (updates: Array<{ statement_record_id: number; new_state: string }>) => void;
  onApplyToOrders: (verification: any) => void;
  verificationData: VerifyStatementRecordsResponse | null;
  loading: boolean;
}

const VerificationResultsDialog: React.FC<VerificationResultsDialogProps> = ({
  open,
  onClose,
  onApplyChanges,
  onApplyToOrders,
  verificationData,
  loading,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedForUpdate, setSelectedForUpdate] = useState<Set<number>>(new Set());

  const toggleRowExpand = (recordId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const toggleSelectForUpdate = (recordId: number) => {
    setSelectedForUpdate((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (verificationData && selectedForUpdate.size !== verificationData.verifications.length) {
      setSelectedForUpdate(
        new Set(verificationData.verifications.map((v) => v.statement_record_id))
      );
    } else {
      setSelectedForUpdate(new Set());
    }
  };

  const handleApplyChanges = () => {
    if (!verificationData) return;

    const updates = verificationData.verifications
      .filter((v) => selectedForUpdate.has(v.statement_record_id))
      .map((v) => ({
        statement_record_id: v.statement_record_id,
        new_state: v.suggested_state,
      }));

    if (updates.length > 0) {
      onApplyChanges(updates);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'Exists':
        return 'success';
      case 'Processed':
        return 'info';
      case 'Not_exists':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDifferenceBgColor = (income: string, expense: string) => {
    const incomeVal = parseFloat(income || '0');
    const expenseVal = parseFloat(expense || '0');

    if (Math.abs(incomeVal) < 0.01 && Math.abs(expenseVal) < 0.01) {
      return '#d4edda'; // Light green for perfect match
    } else if (Math.abs(incomeVal) < 1 && Math.abs(expenseVal) < 1) {
      return '#fff3cd'; // Light yellow for minor difference
    } else {
      return '#f8d7da'; // Light red for significant difference
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Verification Results
        {verificationData && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Total Records: {verificationData.total_records} | With Matches:{' '}
            {verificationData.records_with_matches} | Without Matches:{' '}
            {verificationData.records_without_matches}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : verificationData ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Select records to update. The suggested state will be applied to selected records and the statement record income will be updated according to the orders.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAll}
              >
                {selectedForUpdate.size === verificationData.verifications.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell align="center" width="50px">
                      <input
                        type="checkbox"
                        checked={
                          selectedForUpdate.size ===
                          verificationData.verifications.length
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell width="100px">Key Ref</TableCell>
                    <TableCell align="center" width="120px">
                      Current State
                    </TableCell>
                    <TableCell align="center" width="120px">
                      Suggested State
                    </TableCell>
                    <TableCell align="center" width="100px">
                      Matches
                    </TableCell>
                    <TableCell align="center" width="80px">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verificationData.verifications.map((verification) => (
                    <React.Fragment key={verification.statement_record_id}>
                      <TableRow
                        hover
                        sx={{
                          backgroundColor: selectedForUpdate.has(
                            verification.statement_record_id
                          )
                            ? '#e3f2fd'
                            : 'inherit',
                        }}
                      >
                        <TableCell align="center">
                          <input
                            type="checkbox"
                            checked={selectedForUpdate.has(
                              verification.statement_record_id
                            )}
                            onChange={() =>
                              toggleSelectForUpdate(verification.statement_record_id)
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {verification.keyref}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={verification.current_state}
                            size="small"
                            color={getStateColor(verification.current_state)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={verification.suggested_state}
                            size="small"
                            color={getStateColor(verification.suggested_state)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {verification.has_matches ? (
                            <Chip
                              label={`${verification.matching_orders_count} order(s)`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              label="No matches"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() =>
                              toggleRowExpand(verification.statement_record_id)
                            }
                          >
                            {expandedRows.has(verification.statement_record_id) ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0 }}>
                          <Collapse
                            in={expandedRows.has(verification.statement_record_id)}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ py: 2, px: 2 }}>
                              {/* Statement vs Orders Comparison */}
                              <Box
                                sx={{
                                  mb: 2,
                                  p: 2,
                                  backgroundColor: getDifferenceBgColor(
                                    verification.income_difference,
                                    verification.expense_difference
                                  ),
                                  borderRadius: 1,
                                }}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                  Amount Comparison
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      Statement Income
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600 }}>
                                      ${parseFloat(verification.statement_income).toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      Orders Income
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600 }}>
                                      ${parseFloat(verification.total_orders_income).toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      Difference
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontWeight: 600,
                                        color:
                                          Math.abs(
                                            parseFloat(verification.income_difference)
                                          ) < 0.01
                                            ? 'green'
                                            : 'red',
                                      }}
                                    >
                                      ${parseFloat(verification.income_difference).toFixed(2)}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 1 }}>
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      Statement Expense
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600 }}>
                                      ${parseFloat(verification.statement_expense).toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      Orders Expense
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600 }}>
                                      ${parseFloat(verification.total_orders_expense).toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      Difference
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontWeight: 600,
                                        color:
                                          Math.abs(
                                            parseFloat(verification.expense_difference)
                                          ) < 0.01
                                            ? 'green'
                                            : 'red',
                                      }}
                                    >
                                      ${parseFloat(verification.expense_difference).toFixed(2)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>

                              {/* Matching Orders Table */}
                              {verification.matching_orders.length > 0 ? (
                                <Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                      Matching Orders ({verification.matching_orders.length})
                                    </Typography>
                                    {verification.has_matches && (
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => onApplyToOrders(verification)}
                                        sx={{ minWidth: '140px' }}
                                      >
                                        Apply to Orders
                                      </Button>
                                    )}
                                  </Box>
                                  <TableContainer>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                          <TableCell>Order Key</TableCell>
                                          <TableCell align="right">Income</TableCell>
                                          <TableCell align="right">Expense</TableCell>
                                          <TableCell>Date</TableCell>
                                          <TableCell>Status</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {verification.matching_orders.map((order, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell sx={{ fontSize: '0.875rem' }}>
                                              {order.order_key.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell align="right">
                                              ${parseFloat(order.income).toFixed(2)}
                                            </TableCell>
                                            <TableCell align="right">
                                              ${parseFloat(order.expense).toFixed(2)}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.875rem' }}>
                                              {new Date(order.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                              <Chip
                                                label={order.status}
                                                size="small"
                                                variant="outlined"
                                              />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Box>
                              ) : (
                                <Alert severity="warning">
                                  No matching orders found for this statement record
                                </Alert>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography>No verification data available</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleApplyChanges}
          variant="contained"
          color="primary"
          disabled={selectedForUpdate.size === 0}
        >
          Apply Changes ({selectedForUpdate.size})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerificationResultsDialog;
