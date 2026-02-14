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
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    amount: '',
    description: '',
  });

  const handleClose = () => {
    if (!loading) {
      setFormData({ amount: '', description: '' });
      setValidationErrors({ amount: '', description: '' });
      setError(null);
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      amount: '',
      description: '',
    };

    let isValid = true;

    // Validate amount
    if (!formData.amount || formData.amount.trim() === '') {
      errors.amount = 'Amount is required';
      isValid = false;
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be greater than 0';
        isValid = false;
      }
    }

    // Validate description
    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.trim().length < 5) {
      errors.description = 'Description must be at least 5 characters';
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

      await createLoan({
        operator: operatorId,
        total_amount_to_pay: formData.amount,
        description: formData.description.trim(),
      });

      enqueueSnackbar('Loan created successfully', { variant: 'success' });
      
      if (onLoanCreated) {
        onLoanCreated();
      }
      
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating loan';
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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, description: e.target.value });
    if (validationErrors.description) {
      setValidationErrors({ ...validationErrors, description: '' });
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
          backdropFilter: 'blur(8px)',
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
          <Typography variant="h6">Create Loan</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            For: {operatorName}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
            <TextField
              label="Loan Amount"
              type="text"
              value={formData.amount}
              onChange={handleAmountChange}
              error={!!validationErrors.amount}
              helperText={validationErrors.amount || 'Enter the total amount to be paid'}
              required
              fullWidth
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder="0.00"
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={handleDescriptionChange}
              error={!!validationErrors.description}
              helperText={validationErrors.description || 'Provide a description for this loan'}
              required
              fullWidth
              multiline
              rows={4}
              disabled={loading}
              placeholder="e.g., Emergency loan for medical expenses"
            />

            <Box
              sx={{
                p: 2,
                backgroundColor: '#f0f9ff',
                borderRadius: 1,
                border: '1px solid #bfdbfe',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> The loan will be created with status "unpaid". 
                The operator will be able to make payments towards this loan over time.
              </Typography>
            </Box>
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
                Creating...
              </>
            ) : (
              'Create Loan'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateLoanDialog;
