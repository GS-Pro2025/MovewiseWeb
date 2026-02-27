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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    if (open && operatorId) loadLoans();
  }, [open, operatorId, statusFilter]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLoansByOperator(operatorId, statusFilter || undefined);
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('operators.loansDialog.snackbar.statusError'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const getStatusChip = (status: LoanStatus) => {
    const config: Record<LoanStatus, { color: 'error' | 'success' | 'default'; labelKey: string }> = {
      unpaid:   { color: 'error',   labelKey: 'operators.loansDialog.status.unpaid' },
      paid:     { color: 'success', labelKey: 'operators.loansDialog.status.paid' },
      canceled: { color: 'default', labelKey: 'operators.loansDialog.status.canceled' },
    };
    const { color, labelKey } = config[status];
    return <Chip size="small" color={color} label={t(labelKey)} />;
  };

  const totalUnpaid = loans
    .filter(l => parseFloat(l.remaining_amount) > 0)
    .reduce((sum, l) => sum + parseFloat(l.remaining_amount), 0);

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
    setTimeout(() => setIsRefreshing(false), 800);
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
      enqueueSnackbar(
        t('operators.loansDialog.snackbar.statusUpdated', { status: newStatus }),
        { variant: 'success' }
      );
      handleCloseStatusMenu();
      setIsRefreshing(true);
      loadLoans();
      setTimeout(() => setIsRefreshing(false), 800);
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t('operators.loansDialog.snackbar.statusError'),
        { variant: 'error' }
      );
    }
  };

  const canCancelLoan = (loan: Loan): boolean =>
    parseFloat(loan.total_paid) === 0 && loan.status !== 'canceled';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.5)' },
      }}
    >
      {/* ── Title ── */}
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
          <Typography variant="h6">
            {t('operators.loansDialog.title', { name: operatorName })}
          </Typography>
          {loans.length > 0 && (
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {t('operators.loansDialog.loanCount', {
                count: loans.length,
                unpaid: loans.filter(l => parseFloat(l.remaining_amount) > 0).length,
              })}
            </Typography>
          )}
        </Box>
        {totalUnpaid > 0 ? (
          <Chip
            label={t('operators.loansDialog.totalUnpaid', { amount: formatCurrency(totalUnpaid) })}
            color="error"
            sx={{ fontWeight: 'bold' }}
          />
        ) : loans.length > 0 ? (
          <Chip label={t('operators.loansDialog.allPaid')} color="success" sx={{ fontWeight: 'bold' }} />
        ) : null}
      </DialogTitle>

      {/* ── Content ── */}
      <DialogContent sx={{ mt: 2 }}>
        {/* Status filter */}
        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('operators.loansDialog.statusFilter.label')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('operators.loansDialog.statusFilter.label')}
              onChange={(e) => setStatusFilter(e.target.value as LoanStatus | '')}
            >
              <MenuItem value="">{t('operators.loansDialog.statusFilter.all')}</MenuItem>
              <MenuItem value="unpaid">{t('operators.loansDialog.statusFilter.unpaid')}</MenuItem>
              <MenuItem value="paid">{t('operators.loansDialog.statusFilter.paid')}</MenuItem>
              <MenuItem value="canceled">{t('operators.loansDialog.statusFilter.canceled')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : loans.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography>{t('operators.loansDialog.empty')}</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('operators.loansDialog.table.description')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">{t('operators.loansDialog.table.totalAmount')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">{t('operators.loansDialog.table.paid')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">{t('operators.loansDialog.table.remaining')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('operators.loansDialog.table.progress')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('operators.loansDialog.table.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('operators.loansDialog.table.created')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('operators.loansDialog.table.actions')}</TableCell>
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
                        backgroundColor: !isPaid ? '#fef2f2' : '#f0fdf4',
                        '@keyframes slideInFade': {
                          '0%': { opacity: 0, transform: 'translateX(-20px)' },
                          '100%': { opacity: 1, transform: 'translateX(0)' },
                        },
                        '@keyframes pulse': {
                          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
                          '50%': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
                        },
                        animation: isRefreshing
                          ? `slideInFade 0.5s ease-out ${index * 0.05}s both, pulse 0.8s ease-in-out ${index * 0.05}s`
                          : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {/* Description */}
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{loan.description}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('operators.loansDialog.table.createdBy', { name: loan.created_by_name })}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Amounts */}
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(loan.total_amount_to_pay)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#22c55e', fontWeight: 'medium' }}>
                        {formatCurrency(loan.total_paid)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 'medium' }}>
                        {formatCurrency(loan.remaining_amount)}
                      </TableCell>

                      {/* Progress bar */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 60, height: 6, backgroundColor: '#e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
                            <Box
                              sx={{
                                width: `${parseFloat(loan.payment_percentage)}%`,
                                height: '100%',
                                backgroundColor: isPaid ? '#22c55e' : '#3b82f6',
                                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 35 }}>
                            {parseFloat(loan.payment_percentage).toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusChip(actualStatus as LoanStatus)}</TableCell>

                      {/* Dates */}
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{formatDate(loan.created_at)}</Typography>
                          {loan.updated_at !== loan.created_at && (
                            <Typography variant="caption" color="text.secondary">
                              {t('operators.loansDialog.table.updated', { date: formatDate(loan.updated_at) })}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {!isPaid && loan.status !== 'canceled' && loan.status !== 'paid' && (
                            <>
                              <Tooltip title={t('operators.loansDialog.tooltips.registerPayment')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPaymentDialog(loan)}
                                  sx={{ color: '#10b981', '&:hover': { backgroundColor: '#d1fae5' } }}
                                >
                                  <DollarSign size={18} />
                                </IconButton>
                              </Tooltip>
                              {canCancelLoan(loan) && (
                                <Tooltip title={t('operators.loansDialog.tooltips.cancelLoan')}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedLoanForStatus(loan);
                                      setTimeout(() => handleUpdateStatus('canceled'), 0);
                                    }}
                                    sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fee2e2' } }}
                                  >
                                    <Ban size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                          {(isPaid || loan.status === 'paid' || loan.status === 'canceled') && (
                            <Typography variant="caption" color="text.secondary">—</Typography>
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

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          {t('operators.loansDialog.closeButton')}
        </Button>
      </DialogActions>

      {/* ── Register Payment Dialog ── */}
      {selectedLoanForPayment && (
        <RegisterPaymentDialog
          open={isPaymentDialogOpen}
          onClose={handleClosePaymentDialog}
          loan={selectedLoanForPayment}
          onPaymentRegistered={handlePaymentRegistered}
        />
      )}

      {/* ── Context / Status Menu ── */}
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
              boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
            },
          },
        }}
      >
        {selectedLoanForStatus &&
          selectedLoanForStatus.status !== 'canceled' &&
          selectedLoanForStatus.status !== 'paid' &&
          parseFloat(selectedLoanForStatus.remaining_amount) > 0 && (
            <>
              <MenuItem onClick={() => {
                handleCloseStatusMenu();
                handleOpenPaymentDialog(selectedLoanForStatus);
              }}>
                <ListItemIcon><DollarSign size={18} color="#10b981" /></ListItemIcon>
                <ListItemText>{t('operators.loansDialog.menu.registerPayment')}</ListItemText>
              </MenuItem>
              {canCancelLoan(selectedLoanForStatus) && (
                <MenuItem onClick={() => handleUpdateStatus('canceled')}>
                  <ListItemIcon><Ban size={18} color="#ef4444" /></ListItemIcon>
                  <ListItemText sx={{ color: '#ef4444' }}>
                    {t('operators.loansDialog.menu.cancelLoan')}
                  </ListItemText>
                </MenuItem>
              )}
            </>
          )}
        {selectedLoanForStatus &&
          (selectedLoanForStatus.status === 'paid' ||
            selectedLoanForStatus.status === 'canceled' ||
            parseFloat(selectedLoanForStatus.remaining_amount) === 0) && (
            <MenuItem disabled>
              <ListItemText>{t('operators.loansDialog.menu.noActions')}</ListItemText>
            </MenuItem>
          )}
      </Menu>
    </Dialog>
  );
};

export default OperatorLoansDialog;