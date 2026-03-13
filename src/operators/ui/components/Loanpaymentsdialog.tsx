import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { History, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchLoanPayments, LoanPaymentRecord } from '../../data/RepositoryLoans';
import { Loan } from '../../domain/LoanModels';

interface LoanPaymentsDialogProps {
  open: boolean;
  onClose: () => void;
  loan: Loan;
}

const PAYMENT_METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cash:       { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  transfer:   { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd' },
  check:      { bg: '#fefce8', text: '#854d0e', border: '#fde047' },
  card:       { bg: '#f5f3ff', text: '#5b21b6', border: '#c4b5fd' },
  deduction:  { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  other:      { bg: '#f9fafb', text: '#374151', border: '#d1d5db' },
};

const fmt = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(num);
};

const fmtDate = (d: string): string => {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return d; }
};

const LoanPaymentsDialog: React.FC<LoanPaymentsDialogProps> = ({ open, onClose, loan }) => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<LoanPaymentRecord[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLoanPayments(loan.id_loan);
        // más reciente primero
        setPayments([...data].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading payments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, loan.id_loan]);

  const totalPaid   = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const loanTotal   = parseFloat(loan.total_amount_to_pay);
  const remaining   = parseFloat(loan.remaining_amount);
  const paidPct     = loanTotal > 0 ? (totalPaid / loanTotal) * 100 : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.5)' },
      }}
    >
      {/* ── Title ── */}
      <DialogTitle sx={{ backgroundColor: '#0B2863', color: 'white', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <History size={18} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              {t('loanPayments.title', 'Payment History')}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              #{loan.id_loan} · {loan.description || t('loanPayments.noDescription', 'No description')}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* ── Loan summary bar ── */}
        <Box
          sx={{
            mb: 3, p: 2.5, borderRadius: 2,
            border: '1px solid #e0e7ff',
            backgroundColor: '#f8faff',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            {[
              { label: t('loanPayments.summary.total', 'Total Loan'),     value: fmt(loan.total_amount_to_pay), color: '#1e40af' },
              { label: t('loanPayments.summary.paid', 'Total Paid'),      value: fmt(loan.total_paid),          color: '#166534' },
              { label: t('loanPayments.summary.remaining', 'Remaining'),  value: fmt(remaining),                color: '#9a3412' },
              { label: t('loanPayments.summary.payments', 'Payments'),    value: payments.length,               color: '#5b21b6' },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ textAlign: 'center', flex: '1 1 80px' }}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          {/* Progress bar */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('loanPayments.summary.recovery', 'Recovery rate')}
              </Typography>
              <Typography variant="caption" fontWeight="bold">{paidPct.toFixed(1)}%</Typography>
            </Box>
            <Box sx={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${Math.min(paidPct, 100)}%`,
                  borderRadius: 4,
                  backgroundColor:
                    paidPct >= 75 ? '#22c55e'
                    : paidPct >= 50 ? '#eab308'
                    : paidPct >= 25 ? '#f97316'
                    : '#ef4444',
                  transition: 'width 0.8s ease',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* ── Content ── */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : payments.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center', py: 8, color: 'text.secondary',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
            }}
          >
            <TrendingDown size={40} strokeWidth={1.2} />
            <Typography variant="body2">
              {t('loanPayments.empty', 'No payments registered for this loan yet.')}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8faff' }}>
                  {[
                    t('loanPayments.table.date',    'Date'),
                    t('loanPayments.table.amount',  'Amount'),
                    t('loanPayments.table.method',  'Method'),
                    t('loanPayments.table.by',      'Registered by'),
                    t('loanPayments.table.remaining','Remaining after'),
                    t('loanPayments.table.notes',   'Notes'),
                  ].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p, idx) => {
                  const methodStyle = PAYMENT_METHOD_COLORS[p.payment_method] ?? PAYMENT_METHOD_COLORS.other;
                  const isFirst = idx === 0; // más reciente

                  return (
                    <TableRow
                      key={p.id_payment}
                      sx={{
                        '&:hover': { backgroundColor: '#f0f9ff' },
                        backgroundColor: isFirst ? '#f0fdf4' : 'inherit',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* Date */}
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={isFirst ? 600 : 400}>
                            {fmtDate(p.created_at)}
                          </Typography>
                          {isFirst && (
                            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                              {t('loanPayments.table.latest', 'Latest')}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#166534' }}>
                          {fmt(p.amount)}
                        </Typography>
                      </TableCell>

                      {/* Method */}
                      <TableCell>
                        <Chip
                          label={p.payment_method_display}
                          size="small"
                          sx={{
                            backgroundColor: methodStyle.bg,
                            color: methodStyle.text,
                            border: `1px solid ${methodStyle.border}`,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>

                      {/* Created by */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {p.created_by_name}
                        </Typography>
                      </TableCell>

                      {/* Remaining after this payment */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ color: parseFloat(p.missing_amount) === 0 ? '#166534' : '#9a3412' }}
                        >
                          {fmt(p.missing_amount)}
                          {parseFloat(p.missing_amount) === 0 && (
                            <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#16a34a' }}>
                              ✓
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>

                      {/* Notes */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: p.notes ? 'normal' : 'italic' }}>
                          {p.notes || '—'}
                        </Typography>
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
          {t('loanPayments.close', 'Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoanPaymentsDialog;