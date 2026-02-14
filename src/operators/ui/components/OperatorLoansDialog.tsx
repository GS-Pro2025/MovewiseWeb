import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { DollarSign, Ban } from 'lucide-react';
import { Loan, LoanStatus } from '../../domain/LoanModels';
import { fetchLoansByOperator, updateLoanStatus } from '../../data/RepositoryLoans';
import RegisterPaymentDialog from './RegisterPaymentDialog';
import { useSnackbar } from 'notistack';

interface OperatorLoansDialogProps {
  open: boolean;
  onClose: () => void;
  operatorId: number;
  operatorName: string;
}

const OperatorLoansDialog: React.FC<OperatorLoansDialogProps> = ({
  open,
  onClose,
  operatorId,
  operatorName,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LoanStatus | ''>('');
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedLoanForStatus, setSelectedLoanForStatus] = useState<Loan | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (open && operatorId) {
      loadLoans();
    }
  }, [open, operatorId, statusFilter]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLoansByOperator(
        operatorId,
        statusFilter || undefined
      );
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading loans');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: LoanStatus) => {
    const statusConfig = {
      unpaid: { color: 'error' as const, label: 'Unpaid' },
      paid: { color: 'success' as const, label: 'Paid' },
      canceled: { color: 'default' as const, label: 'Canceled' },
    };

    const config = statusConfig[status];
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalUnpaid = loans
    .filter((loan) => parseFloat(loan.remaining_amount) > 0)
    .reduce((sum, loan) => sum + parseFloat(loan.remaining_amount), 0);

  const handleOpenPaymentDialog = (loan: Loan) => {
    setSelectedLoanForPayment(loan);
    setIsPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setIsPaymentDialogOpen(false);
    setSelectedLoanForPayment(null);
  };

  const handlePaymentRegistered = () => {
    setIsRefreshing(true);
    loadLoans();
    // Reset animation after it completes
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleContextMenu = (event: React.MouseEvent, loan: Loan) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuPosition({ top: event.clientY, left: event.clientX });
    setSelectedLoanForStatus(loan);
    setStatusMenuAnchor(null);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
    setContextMenuPosition(null);
    setSelectedLoanForStatus(null);
  };

  const handleUpdateStatus = async (newStatus: LoanStatus) => {
    if (!selectedLoanForStatus) return;

    try {
      await updateLoanStatus(selectedLoanForStatus.id_loan, newStatus);
      enqueueSnackbar(`Loan status updated to ${newStatus}`, { variant: 'success' });
      handleCloseStatusMenu();
      setIsRefreshing(true);
      loadLoans();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating status';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const canCancelLoan = (loan: Loan): boolean => {
    return parseFloat(loan.total_paid) === 0 && loan.status !== 'canceled';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#0B2863',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6">Loans - {operatorName}</Typography>
          {loans.length > 0 && (
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {loans.length} loan(s) | {loans.filter(l => parseFloat(l.remaining_amount) > 0).length} unpaid
            </Typography>
          )}
        </Box>
        {totalUnpaid > 0 ? (
          <Chip
            label={`Total Unpaid: ${formatCurrency(totalUnpaid)}`}
            color="error"
            sx={{ fontWeight: 'bold' }}
          />
        ) : loans.length > 0 ? (
          <Chip
            label="All Paid"
            color="success"
            sx={{ fontWeight: 'bold' }}
          />
        ) : null}
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value as LoanStatus | '')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : loans.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <Typography>No loans found for this operator</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Total Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Paid
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Remaining
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Progress
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan, index) => {
                  const isPaid = parseFloat(loan.remaining_amount) === 0;
                  const hasPayments = parseFloat(loan.total_paid) > 0;
                  const actualStatus = isPaid ? 'paid' : hasPayments ? 'unpaid' : loan.status;
                  
                  return (
                    <TableRow
                      key={loan.id_loan}
                      onContextMenu={(e) => handleContextMenu(e, loan)}
                      sx={{
                        '&:hover': { backgroundColor: '#f9fafb' },
                        backgroundColor: !isPaid ? '#fef2f2' : isPaid ? '#f0fdf4' : 'inherit',
                        '@keyframes slideInFade': {
                          '0%': {
                            opacity: 0,
                            transform: 'translateX(-20px)',
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'translateX(0)',
                          },
                        },
                        '@keyframes pulse': {
                          '0%, 100%': {
                            boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)',
                          },
                          '50%': {
                            boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)',
                          },
                        },
                        animation: isRefreshing 
                          ? `slideInFade 0.5s ease-out ${index * 0.05}s both, pulse 0.8s ease-in-out ${index * 0.05}s`
                          : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{loan.description}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created by: {loan.created_by_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(loan.total_amount_to_pay)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#22c55e', fontWeight: 'medium' }}>
                        {formatCurrency(loan.total_paid)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 'medium' }}>
                        {formatCurrency(loan.remaining_amount)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 6,
                              backgroundColor: '#e5e7eb',
                              borderRadius: 1,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${parseFloat(loan.payment_percentage)}%`,
                                height: '100%',
                                backgroundColor: isPaid ? '#22c55e' : '#3b82f6',
                                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 35 }}>
                            {parseFloat(loan.payment_percentage).toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getStatusChip(actualStatus as LoanStatus)}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{formatDate(loan.created_at)}</Typography>
                          {loan.updated_at !== loan.created_at && (
                            <Typography variant="caption" color="text.secondary">
                              Updated: {formatDate(loan.updated_at)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {!isPaid && loan.status !== 'canceled' && loan.status !== 'paid' && (
                            <>
                              <Tooltip title="Register Payment">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPaymentDialog(loan)}
                                  sx={{
                                    color: '#10b981',
                                    '&:hover': {
                                      backgroundColor: '#d1fae5',
                                    },
                                  }}
                                >
                                  <DollarSign size={18} />
                                </IconButton>
                              </Tooltip>
                              {canCancelLoan(loan) && (
                                <Tooltip title="Cancel Loan">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedLoanForStatus(loan);
                                      setTimeout(() => handleUpdateStatus('canceled'), 0);
                                    }}
                                    sx={{
                                      color: '#ef4444',
                                      '&:hover': {
                                        backgroundColor: '#fee2e2',
                                      },
                                    }}
                                  >
                                    <Ban size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                          {(isPaid || loan.status === 'paid' || loan.status === 'canceled') && (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Close
        </Button>
      </DialogActions>

      {/* Register Payment Dialog */}
      {selectedLoanForPayment && (
        <RegisterPaymentDialog
          open={isPaymentDialogOpen}
          onClose={handleClosePaymentDialog}
          loan={selectedLoanForPayment}
          onPaymentRegistered={handlePaymentRegistered}
        />
      )}

      {/* Status Update Menu (Right-click) */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor) || Boolean(contextMenuPosition)}
        onClose={handleCloseStatusMenu}
        anchorReference={contextMenuPosition ? 'anchorPosition' : 'anchorEl'}
        anchorPosition={contextMenuPosition || undefined}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
            }
          }
        }}
      >
        {selectedLoanForStatus && selectedLoanForStatus.status !== 'canceled' && selectedLoanForStatus.status !== 'paid' && parseFloat(selectedLoanForStatus.remaining_amount) > 0 && (
          <>
            <MenuItem onClick={() => {
              handleCloseStatusMenu();
              handleOpenPaymentDialog(selectedLoanForStatus);
            }}>
              <ListItemIcon>
                <DollarSign size={18} color="#10b981" />
              </ListItemIcon>
              <ListItemText>Register Payment</ListItemText>
            </MenuItem>
            {canCancelLoan(selectedLoanForStatus) && (
              <MenuItem onClick={() => handleUpdateStatus('canceled')}>
                <ListItemIcon>
                  <Ban size={18} color="#ef4444" />
                </ListItemIcon>
                <ListItemText sx={{ color: '#ef4444' }}>Cancel Loan</ListItemText>
              </MenuItem>
            )}
          </>
        )}
        {selectedLoanForStatus && (selectedLoanForStatus.status === 'paid' || selectedLoanForStatus.status === 'canceled' || parseFloat(selectedLoanForStatus.remaining_amount) === 0) && (
          <MenuItem disabled>
            <ListItemText>No actions available</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Dialog>
  );
};

export default OperatorLoansDialog;
