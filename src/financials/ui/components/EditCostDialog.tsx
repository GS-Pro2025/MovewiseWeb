/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Cost } from '../../domain/ModelsCost';
import { updateCostAmountApi } from '../../data/CostRepository';
import { enqueueSnackbar } from 'notistack';

interface EditCostDialogProps {
  open: boolean;
  cost: Cost | null;
  onClose: () => void;
  onSuccess: (updatedCost: Cost) => void;
}

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const EditCostDialog: React.FC<EditCostDialogProps> = ({ open, cost, onClose, onSuccess }) => {
  const [action, setAction] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cost) return null;

  const currentAmount = Number(cost.cost);
  const amountValue = amount ? parseFloat(amount) : 0;
  const resultingAmount = action === 'add' 
    ? currentAmount + amountValue 
    : currentAmount - amountValue;

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const updatedCost = await updateCostAmountApi(cost.id_cost, action, parseFloat(amount));
      enqueueSnackbar(`Cost ${action === 'add' ? 'increased' : 'decreased'} successfully`, { 
        variant: 'success' 
      });
      onSuccess(updatedCost);
      handleClose();
    } catch (err: any) {
      const errorMessage = err.message || `Error ${action === 'add' ? 'adding to' : 'subtracting from'} cost`;
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError(null);
    setAction('add');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', color: '#0B2863' }}>
        Edit Cost: {cost.description}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {/* Current cost display */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f9ff', borderRadius: 1, border: '1px solid #0B2863' }}>
          <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
            Current Amount:
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
            {formatCurrency(currentAmount)}
          </Typography>
        </Box>

        {/* Action toggle */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Action:
          </Typography>
          <ToggleButtonGroup
            value={action}
            exclusive
            onChange={(_, newAction) => {
              if (newAction) setAction(newAction);
            }}
            fullWidth
          >
            <ToggleButton value="add" sx={{ color: '#22c55e', '&.Mui-selected': { bgcolor: '#dcfce7', color: '#22c55e' } }}>
              + Add
            </ToggleButton>
            <ToggleButton value="subtract" sx={{ color: '#ef4444', '&.Mui-selected': { bgcolor: '#fee2e2', color: '#ef4444' } }}>
              - Subtract
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Amount input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            fullWidth
            placeholder="0.00"
            inputProps={{ step: '0.01', min: '0' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#0B2863',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0B2863',
                },
              },
              '& .MuiInputBase-input': {
                color: '#0B2863',
              },
            }}
          />
        </Box>

        {/* Preview of resulting amount */}
        {amount && (
          <Box sx={{ mb: 3, p: 2, bgcolor: action === 'add' ? '#dcfce7' : '#fee2e2', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
              Resulting Amount ({action === 'add' ? '+' : '-'} {formatCurrency(amountValue)}):
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                color: resultingAmount < 0 ? '#ef4444' : (action === 'add' ? '#22c55e' : '#f59e0b')
              }}
            >
              {formatCurrency(resultingAmount)}
            </Typography>
            {resultingAmount < 0 && (
              <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 1 }}>
                ⚠️ Warning: Resulting amount cannot be negative
              </Typography>
            )}
          </Box>
        )}

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose}
          sx={{ color: '#666' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!amount || parseFloat(amount) <= 0 || loading || resultingAmount < 0}
          sx={{
            backgroundColor: action === 'add' ? '#22c55e' : '#f59e0b',
            '&:hover': {
              backgroundColor: action === 'add' ? '#16a34a' : '#d97706',
            },
            '&:disabled': {
              backgroundColor: '#ccc',
            }
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {action === 'add' ? 'Add' : 'Subtract'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCostDialog;
