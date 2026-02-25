import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box, InputAdornment, CircularProgress
} from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddAmountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  type: 'income' | 'expense';
  keyRef: string;
  loading?: boolean;
}

const AddAmountDialog: React.FC<AddAmountDialogProps> = ({
  open, onClose, onConfirm, type, keyRef, loading = false
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const isIncome = type === 'income';

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('addAmountDialog.errors.invalidAmount'));
      return;
    }
    setError('');
    onConfirm(numAmount);
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          {isIncome
            ? <TrendingUp size={24} color="#22c55e" />
            : <TrendingDown size={24} color="#ef4444" />}
          <Typography variant="h6" fontWeight="bold">
            {isIncome ? t('addAmountDialog.title.income') : t('addAmountDialog.title.expense')}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {t('addAmountDialog.reference')}: <strong>{keyRef}</strong>
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          label={isIncome ? t('addAmountDialog.fields.incomeAmount') : t('addAmountDialog.fields.expenseAmount')}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          type="number"
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        <Typography variant="body2" color="textSecondary">
          {t('addAmountDialog.hint', { type: t(`addAmountDialog.types.${type}`), keyRef })}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading} sx={{ mr: 1 }}>
          {t('addAmountDialog.actions.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !amount.trim()}
          sx={{
            backgroundColor: isIncome ? '#22c55e' : '#ef4444',
            '&:hover': { backgroundColor: isIncome ? '#16a34a' : '#dc2626' },
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading
            ? t('addAmountDialog.actions.adding')
            : isIncome
              ? t('addAmountDialog.actions.addIncome')
              : t('addAmountDialog.actions.addExpense')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAmountDialog;