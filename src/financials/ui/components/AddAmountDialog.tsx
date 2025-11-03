import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AddAmountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  type: 'income' | 'expense';
  keyRef: string;
  loading?: boolean;
}

const AddAmountDialog: React.FC<AddAmountDialogProps> = ({
  open,
  onClose,
  onConfirm,
  type,
  keyRef,
  loading = false
}) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
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

  const isIncome = type === 'income';

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          {isIncome ? (
            <TrendingUp size={24} color="#22c55e" />
          ) : (
            <TrendingDown size={24} color="#ef4444" />
          )}
          <Typography variant="h6" fontWeight="bold">
            Add {isIncome ? 'Income' : 'Expense'}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Reference: <strong>{keyRef}</strong>
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          label={`${isIncome ? 'Income' : 'Expense'} Amount`}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
          type="number"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        
        <Typography variant="body2" color="textSecondary">
          This amount will be added to the current {type} for all orders with reference {keyRef}.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || !amount.trim()}
          sx={{
            backgroundColor: isIncome ? '#22c55e' : '#ef4444',
            '&:hover': {
              backgroundColor: isIncome ? '#16a34a' : '#dc2626',
            }
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Adding...' : `Add ${isIncome ? 'Income' : 'Expense'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAmountDialog;