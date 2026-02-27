import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { createLoan } from '../../data/RepositoryLoans';

interface CreateLoanDialogProps {
  open: boolean;
  onClose: () => void;
  operatorId: number;
  operatorName: string;
  onLoanCreated?: () => void;
}

const CreateLoanDialog: React.FC<CreateLoanDialogProps> = ({
  open,
  onClose,
  operatorId,
  operatorName,
  onLoanCreated,
}) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ amount: '', description: '' });
  const [validationErrors, setValidationErrors] = useState({ amount: '', description: '' });

  const handleClose = () => {
    if (!loading) {
      setFormData({ amount: '', description: '' });
      setValidationErrors({ amount: '', description: '' });
      setError(null);
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const errors = { amount: '', description: '' };
    let isValid = true;

    if (!formData.amount || formData.amount.trim() === '') {
      errors.amount = t('operators.createLoanDialog.validation.amountRequired');
      isValid = false;
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = t('operators.createLoanDialog.validation.amountPositive');
        isValid = false;
      }
    }

    if (!formData.description || formData.description.trim() === '') {
      errors.description = t('operators.createLoanDialog.validation.descriptionRequired');
      isValid = false;
    } else if (formData.description.trim().length < 5) {
      errors.description = t('operators.createLoanDialog.validation.descriptionMinLength');
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      await createLoan({
        operator: operatorId,
        total_amount_to_pay: formData.amount,
        description: formData.description.trim(),
      });

      enqueueSnackbar(t('operators.createLoanDialog.snackbar.success'), { variant: 'success' });
      if (onLoanCreated) onLoanCreated();
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : t('operators.createLoanDialog.snackbar.error');
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData({ ...formData, amount: value });
      if (validationErrors.amount)
        setValidationErrors({ ...validationErrors, amount: '' });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, description: e.target.value });
    if (validationErrors.description)
      setValidationErrors({ ...validationErrors, description: '' });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.5)' },
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* ── Title ── */}
        <DialogTitle sx={{ backgroundColor: '#0B2863', color: 'white', pb: 2 }}>
          <Typography variant="h6">{t('operators.createLoanDialog.title')}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {t('operators.createLoanDialog.forOperator', { name: operatorName })}
          </Typography>
        </DialogTitle>

        {/* ── Content ── */}
        <DialogContent sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
            {/* Amount */}
            <TextField
              label={t('operators.createLoanDialog.fields.amount')}
              type="text"
              value={formData.amount}
              onChange={handleAmountChange}
              error={!!validationErrors.amount}
              helperText={validationErrors.amount || t('operators.createLoanDialog.fields.amountHelper')}
              required
              fullWidth
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder={t('operators.createLoanDialog.fields.amountPlaceholder')}
            />

            {/* Description */}
            <TextField
              label={t('operators.createLoanDialog.fields.description')}
              value={formData.description}
              onChange={handleDescriptionChange}
              error={!!validationErrors.description}
              helperText={validationErrors.description || t('operators.createLoanDialog.fields.descriptionHelper')}
              required
              fullWidth
              multiline
              rows={4}
              disabled={loading}
              placeholder={t('operators.createLoanDialog.fields.descriptionPlaceholder')}
            />

            {/* Info note */}
            <Box sx={{ p: 2, backgroundColor: '#f0f9ff', borderRadius: 1, border: '1px solid #bfdbfe' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                dangerouslySetInnerHTML={{ __html: t('operators.createLoanDialog.note') }}
              />
            </Box>
          </Box>
        </DialogContent>

        {/* ── Actions ── */}
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={loading} variant="outlined" color="inherit">
            {t('operators.createLoanDialog.buttons.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            sx={{ backgroundColor: '#0B2863', '&:hover': { backgroundColor: '#082050' } }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                {t('operators.createLoanDialog.buttons.creating')}
              </>
            ) : (
              t('operators.createLoanDialog.buttons.create')
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateLoanDialog;