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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { createLoanPayment } from '../../data/RepositoryLoans';
import { Loan, PaymentMethod } from '../../domain/LoanModels';

interface RegisterPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  loan: Loan;
  onPaymentRegistered?: () => void;
}

const RegisterPaymentDialog: React.FC<RegisterPaymentDialogProps> = ({
  open,
  onClose,
  loan,
  onPaymentRegistered,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: '' as PaymentMethod | '',
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    amount: '',
    payment_method: '',
    notes: '',
  });

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'card', label: 'Card' },
    { value: 'deduction', label: 'Salary Deduction' },
    { value: 'other', label: 'Other' },
  ];

  const handleClose = () => {
    if (!loading) {
      setFormData({ amount: '', payment_method: '', notes: '' });
      setValidationErrors({ amount: '', payment_method: '', notes: '' });
      setError(null);
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      amount: '',
      payment_method: '',
      notes: '',
    };

    let isValid = true;

    // Validate amount
    if (!formData.amount || formData.amount.trim() === '') {
      errors.amount = 'Amount is required';
      isValid = false;
    } else {
      const amount = parseFloat(formData.amount);
      const remainingAmount = parseFloat(loan.remaining_amount);
      
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be greater than 0';
        isValid = false;
      } else if (amount > remainingAmount) {
        errors.amount = `Amount cannot exceed remaining amount ($${remainingAmount.toFixed(2)})`;
        isValid = false;
      }
    }

    // Validate payment method
    if (!formData.payment_method) {
      errors.payment_method = 'Payment method is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createLoanPayment({
        loan_id: loan.id_loan,
        amount: formData.amount,
        payment_method: formData.payment_method as PaymentMethod,
        notes: formData.notes.trim(),
      });

      enqueueSnackbar('Payment registered successfully', { variant: 'success' });
      
      if (onPaymentRegistered) {
        onPaymentRegistered();
      }
      
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error registering payment';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData({ ...formData, amount: value });
      if (validationErrors.amount) {
        setValidationErrors({ ...validationErrors, amount: '' });
      }
    }
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const handlePayFullAmount = () => {
    setFormData({ ...formData, amount: loan.remaining_amount });
    if (validationErrors.amount) {
      setValidationErrors({ ...validationErrors, amount: '' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            backgroundColor: '#0B2863',
            color: 'white',
            pb: 2,
          }}
        >
          <Typography variant="h6">Register Payment</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Loan ID: {loan.id_loan} - {loan.description}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loan Summary */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: '#f0f9ff',
              borderRadius: 1,
              border: '1px solid #bfdbfe',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Loan:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatCurrency(loan.total_amount_to_pay)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Already Paid:
              </Typography>
              <Typography variant="body2" fontWeight="medium" color="#22c55e">
                {formatCurrency(loan.total_paid)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Remaining:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="#ef4444">
                {formatCurrency(loan.remaining_amount)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <TextField
                label="Payment Amount"
                type="text"
                value={formData.amount}
                onChange={handleAmountChange}
                error={!!validationErrors.amount}
                helperText={validationErrors.amount || `Maximum: ${formatCurrency(loan.remaining_amount)}`}
                required
                fullWidth
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                placeholder="0.00"
              />
              <Button
                size="small"
                onClick={handlePayFullAmount}
                sx={{ mt: 1 }}
                disabled={loading}
              >
                Pay Full Amount
              </Button>
            </Box>

            <FormControl fullWidth required error={!!validationErrors.payment_method}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formData.payment_method}
                label="Payment Method"
                onChange={(e) => {
                  setFormData({ ...formData, payment_method: e.target.value as PaymentMethod });
                  if (validationErrors.payment_method) {
                    setValidationErrors({ ...validationErrors, payment_method: '' });
                  }
                }}
                disabled={loading}
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.payment_method && (
                <FormHelperText>{validationErrors.payment_method}</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
              placeholder="e.g., Payment for March 2026 payroll deduction"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            sx={{
              backgroundColor: '#0B2863',
              '&:hover': {
                backgroundColor: '#082050',
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Registering...
              </>
            ) : (
              'Register Payment'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RegisterPaymentDialog;
