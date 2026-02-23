/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Alert, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Divider,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip,
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
  open, onClose, onApply, verification, loading, applyResult,
}) => {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState<'auto' | 'overwrite' | 'add'>('auto');

  const hasOrdersWithValues = verification?.matching_orders.some(
    (order) => parseFloat(order.income) > 0 || parseFloat(order.expense) > 0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {applyResult ? t('applyToOrders.titleResult') : t('applyToOrders.titleConfirm')}
        {verification && !applyResult && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            {t('applyToOrders.keyRef', { keyref: verification.keyref, count: verification.matching_orders_count })}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              {t('applyToOrders.applying')}
            </Typography>
          </Box>
        ) : applyResult ? (
          <>
            {/* Summary stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, mb: 3 }}>
              {[
                { label: t('applyToOrders.totalOrders'), value: applyResult.total_orders, bg: '#f5f5f5', color: undefined },
                { label: t('applyToOrders.updated'), value: applyResult.orders_updated, bg: '#d4edda', color: '#155724' },
                { label: t('applyToOrders.skipped'), value: applyResult.orders_skipped, bg: '#fff3cd', color: '#856404' },
                { label: t('applyToOrders.failed'), value: applyResult.orders_failed, bg: '#f8d7da', color: '#721c24' },
              ].map(({ label, value, bg, color }) => (
                <Box key={label} sx={{ p: 2, backgroundColor: bg, borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary">{label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color }}>{value}</Typography>
                </Box>
              ))}
            </Box>

            {applyResult.orders_failed === 0 && applyResult.orders_updated > 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('applyToOrders.successAlert', { count: applyResult.orders_updated })}
              </Alert>
            ) : applyResult.orders_failed > 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>{t('applyToOrders.warningAlert')}</Alert>
            ) : applyResult.orders_skipped > 0 && applyResult.orders_updated === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>{t('applyToOrders.skippedAlert')}</Alert>
            ) : null}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {t('applyToOrders.distributionPerOrder')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              {[
                { label: t('applyToOrders.income'), value: applyResult.distribution_per_order.income },
                { label: t('applyToOrders.expense'), value: applyResult.distribution_per_order.expense },
              ].map(({ label, value }) => (
                <Box key={label}>
                  <Typography variant="caption" color="textSecondary">{label}</Typography>
                  <Typography sx={{ fontWeight: 600 }}>${parseFloat(value).toFixed(2)}</Typography>
                </Box>
              ))}
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell width="50px" align="center">{t('applyToOrders.status') ?? 'Status'}</TableCell>
                    <TableCell>{t('applyToOrders.orderKey')}</TableCell>
                    <TableCell align="right">{t('applyToOrders.previousIncome')}</TableCell>
                    <TableCell align="right">{t('applyToOrders.newIncome')}</TableCell>
                    <TableCell align="right">{t('applyToOrders.previousExpense')}</TableCell>
                    <TableCell align="right">{t('applyToOrders.newExpense')}</TableCell>
                    <TableCell align="center">{t('applyToOrders.action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applyResult.order_results.map((result, idx) => (
                    <TableRow key={idx} sx={{
                      backgroundColor: result.success
                        ? result.action_taken === 'skipped' ? '#fffbf0' : '#f0f9ff'
                        : '#fff5f5',
                    }}>
                      <TableCell align="center">
                        {result.success
                          ? <CheckCircleIcon sx={{ color: '#28a745', fontSize: '1.25rem' }} />
                          : <ErrorIcon sx={{ color: '#dc3545', fontSize: '1.25rem' }} />}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {result.order_key.substring(0, 8)}...
                      </TableCell>
                      <TableCell align="right">${parseFloat(result.previous_income).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>${parseFloat(result.new_income).toFixed(2)}</TableCell>
                      <TableCell align="right">${parseFloat(result.previous_expense).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>${parseFloat(result.new_expense).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Chip label={result.action_taken} size="small"
                          color={result.action_taken === 'skipped' ? 'default' : result.success ? 'success' : 'error'}
                          variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : verification ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2"
                dangerouslySetInnerHTML={{ __html: t('applyToOrders.matchingOrders', { count: verification.matching_orders_count }) }} />
            </Alert>

            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t('applyToOrders.statementAmounts')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {[
                  { label: t('applyToOrders.income'), value: verification.statement_income },
                  { label: t('applyToOrders.expense'), value: verification.statement_expense },
                ].map(({ label, value }) => (
                  <Box key={label}>
                    <Typography variant="caption" color="textSecondary">{label}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>${parseFloat(value).toFixed(2)}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {hasOrdersWithValues && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('applyToOrders.warningValues')}</Typography>
                <Typography variant="caption">{t('applyToOrders.warningValuesCaption')}</Typography>
              </Alert>
            )}

            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                {t('applyToOrders.selectAction')}
              </FormLabel>
              <RadioGroup value={selectedAction} onChange={(e) => setSelectedAction(e.target.value as any)}>
                {[
                  { value: 'auto', title: t('applyToOrders.autoTitle'), desc: t('applyToOrders.autoDesc') },
                  { value: 'overwrite', title: t('applyToOrders.overwriteTitle'), desc: t('applyToOrders.overwriteDesc') },
                  { value: 'add', title: t('applyToOrders.addTitle'), desc: t('applyToOrders.addDesc') },
                ].map(({ value, title, desc }, i, arr) => (
                  <React.Fragment key={value}>
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel value={value} control={<Radio />} label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{title}</Typography>
                          <Typography variant="caption" color="textSecondary">{desc}</Typography>
                        </Box>
                      } />
                    </Box>
                    {i < arr.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </RadioGroup>
            </FormControl>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption" dangerouslySetInnerHTML={{
                __html: t('applyToOrders.distributionNote', {
                  count: verification.matching_orders_count,
                  income: (parseFloat(verification.statement_income) / verification.matching_orders_count).toFixed(2),
                  expense: (parseFloat(verification.statement_expense) / verification.matching_orders_count).toFixed(2),
                })
              }} />
            </Alert>
          </>
        ) : (
          <Typography>{t('applyToOrders.noVerification')}</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>{t('applyToOrders.close')}</Button>
        {!applyResult && verification && (
          <Button onClick={() => onApply(selectedAction)} variant="contained" color="primary" disabled={loading}>
            {t('applyToOrders.applyButton')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ApplyToOrdersDialog;