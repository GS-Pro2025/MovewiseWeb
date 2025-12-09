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
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CreateExtraIncomeRequest, ExtraIncome } from '../../domain/ExtraIncomeModels';
import { createExtraIncome } from '../../data/ExtraIncomeRepository';
import { enqueueSnackbar } from 'notistack';

interface CreateExtraIncomeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newIncome: ExtraIncome) => void;
}

const INCOME_TYPES = [
  { value: 'BONUS', label: 'Bonus' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'INCENTIVE', label: 'Incentive' },
  { value: 'OTHER', label: 'Other' },
];

const CreateExtraIncomeDialog: React.FC<CreateExtraIncomeDialogProps> = ({ 
  open, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<CreateExtraIncomeRequest>({
    value: 0,
    description: '',
    type: 'BONUS',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: any }>) => {
    const { name, value } = e.target as any;
    setError(null);
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async () => {
    // Validations
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.value <= 0) {
      setError('Value must be greater than 0');
      return;
    }

    if (!formData.date) {
      setError('Date is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createExtraIncome(formData);
      enqueueSnackbar('Extra income created successfully', { variant: 'success' });
      onSuccess(response.data);
      handleClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Error creating extra income';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      value: 0,
      description: '',
      type: 'BONUS',
      date: new Date().toISOString().split('T')[0],
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', color: '#0B2863' }}>
        Create New Extra Income
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Description */}
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            fullWidth
            placeholder="e.g., Bonus por excelencia"
            disabled={loading}
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
              '& .MuiInputBase-input::placeholder': {
                color: '#999',
                opacity: 0.7,
              },
            }}
          />

          {/* Value */}
          <TextField
            label="Amount"
            name="value"
            type="number"
            value={formData.value || ''}
            onChange={handleInputChange}
            fullWidth
            inputProps={{ step: '0.01', min: '0' }}
            disabled={loading}
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

          {/* Type */}
          <TextField
            select
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            fullWidth
            disabled={loading}
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
          >
            {INCOME_TYPES.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Date */}
          <TextField
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            fullWidth
            disabled={loading}
            InputLabelProps={{
              shrink: true,
            }}
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

          {/* Preview */}
          {formData.value > 0 && (
            <Box
              sx={{
                p: 2,
                bgcolor: '#e8f5e9',
                borderRadius: 1,
                border: '1px solid #4caf50',
                mt: 1,
              }}
            >
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                Preview:
              </div>
              <div style={{ fontWeight: 'bold', color: '#22c55e' }}>
                ${formData.value.toFixed(2)} - {formData.description || 'Untitled'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
                {formData.type} • {formData.date}
              </div>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ color: '#666' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.description.trim() || formData.value <= 0 || loading}
          sx={{
            backgroundColor: '#22c55e',
            '&:hover': {
              backgroundColor: '#16a34a',
            },
            '&:disabled': {
              backgroundColor: '#ccc',
            }
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              Creating...
            </>
          ) : (
            'Create Income'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateExtraIncomeDialog;
