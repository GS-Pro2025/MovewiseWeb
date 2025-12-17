/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Typography,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Image, X, Gauge } from 'lucide-react';
import { LocalGasStation } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { fetchActiveTrucks, TruckByOrder } from '../repository/RepositoryTruck';
import { CreateCostFuelRepository } from '../repository/CreateCostFuelRepository';
import { CreateCostFuelRequest } from '../domain/CreateCostFuelModels';

interface CreateCostFuelDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FuelCostFormData {
  truck: number;
  cost_gl: number;
  fuel_qty: number;
  distance: number;
  cost_fuel: number;
  date: string;
  image?: string | null;
}

const CreateCostFuelDialog: React.FC<CreateCostFuelDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [trucks, setTrucks] = useState<TruckByOrder[]>([]);
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FuelCostFormData>({
    truck: 0,
    cost_gl: 0,
    fuel_qty: 0,
    distance: 0,
    cost_fuel: 0,
    date: new Date().toISOString().split('T')[0],
    image: null,
  });

  // Calculate total cost when fuel_qty or cost_gl change
  useEffect(() => {
    const totalCost = formData.fuel_qty * formData.cost_gl;
    setFormData(prev => ({ ...prev, cost_fuel: totalCost }));
  }, [formData.fuel_qty, formData.cost_gl]);

  // Load trucks when dialog opens
  useEffect(() => {
    if (open) {
      loadActiveTrucks();
    }
  }, [open]);

  const loadActiveTrucks = async () => {
    setLoadingTrucks(true);
    try {
      const trucksData = await fetchActiveTrucks();
      setTrucks(trucksData);
      if (trucksData.length === 0) {
        enqueueSnackbar('No active trucks available', { variant: 'warning' });
      }
    } catch (error) {
      console.error('Error loading trucks:', error);
      enqueueSnackbar('Error loading active trucks', { variant: 'error' });
    } finally {
      setLoadingTrucks(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setFormData(prev => ({ ...prev, image: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
  };

  const handleInputChange = (field: keyof FuelCostFormData, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.truck === 0) {
      enqueueSnackbar('Please select a truck', { variant: 'error' });
      return;
    }

    if (formData.fuel_qty <= 0) {
      enqueueSnackbar('Fuel quantity must be greater than 0', { variant: 'error' });
      return;
    }

    if (formData.cost_gl <= 0) {
      enqueueSnackbar('Cost per gallon must be greater than 0', { variant: 'error' });
      return;
    }

    if (formData.distance <= 0) {
      enqueueSnackbar('Distance must be greater than 0', { variant: 'error' });
      return;
    }

    setLoading(true);
    enqueueSnackbar('Creating fuel cost record...', { variant: 'info' });

    try {
      const request: CreateCostFuelRequest = {
        truck: formData.truck,
        cost_fuel: formData.cost_fuel,
        cost_gl: formData.cost_gl,
        fuel_qty: formData.fuel_qty,
        distance: formData.distance,
        date: formData.date,
        orders: [], // Sin órdenes asociadas por ahora
        image: formData.image || undefined,
      };

      const response = await CreateCostFuelRepository.createCostFuel(request);
      
      enqueueSnackbar(response.messUser || 'Fuel cost record created successfully! 🚛⛽', { 
        variant: 'success' 
      });

      // Reset form
      setFormData({
        truck: 0,
        cost_gl: 0,
        fuel_qty: 0,
        distance: 0,
        cost_fuel: 0,
        date: new Date().toISOString().split('T')[0],
        image: null,
      });
      setImagePreview(null);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating fuel cost:', error);
      enqueueSnackbar(`Error: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      setFormData({
        truck: 0,
        cost_gl: 0,
        fuel_qty: 0,
        distance: 0,
        cost_fuel: 0,
        date: new Date().toISOString().split('T')[0],
        image: null,
      });
      setImagePreview(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
        }
      }}
    >
      {/* Custom Header */}
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0B2863 0%, #1e3a8a 100%)',
            p: 3,
            borderRadius: '16px 16px 0 0',
            color: 'white',
            position: 'relative'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <LocalGasStation fontSize="large" />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Create Fuel Cost Record
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Register a new fuel expense
                </Typography>
              </Box>
            </Box>
            <Button
              onClick={handleClose}
              disabled={loading}
              sx={{
                color: 'white',
                minWidth: 'auto',
                p: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <X size={24} />
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {loadingTrucks ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress sx={{ color: '#0B2863' }} />
              <Typography sx={{ ml: 2 }}>Loading trucks...</Typography>
            </Box>
          ) : trucks.length === 0 ? (
            <Box textAlign="center" py={8}>
              <LocalGasStation sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No trucks available
              </Typography>
              <Typography color="text.secondary">
                You need active trucks to create a fuel cost record
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Truck Selection Section */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold', mb: 2 }}>
                  Select Truck
                </Typography>
                <FormControl fullWidth required>
                  <InputLabel>Choose a truck</InputLabel>
                  <Select
                    value={formData.truck}
                    onChange={(e) => handleInputChange('truck', e.target.value as number)}
                    label="Choose a truck"
                    sx={{ bgcolor: 'white' }}
                  >
                    <MenuItem value={0} disabled>
                      <em>Select a truck</em>
                    </MenuItem>
                    {trucks.map((truck) => (
                      <MenuItem key={truck.id_truck} value={truck.id_truck}>
                        {truck.number_truck} - {truck.name} ({truck.type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>

              <Divider sx={{ my: 3 }} />

              {/* Date Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold', mb: 2 }}>
                  Date
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#0B2863' },
                      '&.Mui-focused fieldset': { borderColor: '#0B2863' }
                    }
                  }}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Distance Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Gauge size={20} />
                  Distance
                </Typography>
                <TextField
                  fullWidth
                  required
                  label="Distance"
                  type="number"
                  value={formData.distance || ''}
                  onChange={(e) => handleInputChange('distance', Number(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mi</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#0B2863' },
                      '&.Mui-focused fieldset': { borderColor: '#0B2863' }
                    }
                  }}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Fuel Section */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold', mb: 3 }}>
                  <LocalGasStation sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Fuel Information
                </Typography>

                <Box sx={{
                  display: 'flex',
                  gap: 3,
                  flexDirection: { xs: 'column', md: 'row' },
                  '& > *': { flex: 1 }
                }}>
                  <TextField
                    fullWidth
                    required
                    label="Fuel Quantity"
                    type="number"
                    inputProps={{ step: 0.01, min: 0 }}
                    value={formData.fuel_qty || ''}
                    onChange={(e) => handleInputChange('fuel_qty', Number(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">gl</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#0B2863' },
                        '&.Mui-focused fieldset': { borderColor: '#0B2863' }
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    required
                    label="Price per Gallon"
                    type="number"
                    inputProps={{ step: 0.01, min: 0 }}
                    value={formData.cost_gl || ''}
                    onChange={(e) => handleInputChange('cost_gl', Number(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#0B2863' },
                        '&.Mui-focused fieldset': { borderColor: '#0B2863' }
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Total Cost"
                    type="number"
                    value={formData.cost_fuel.toFixed(2)}
                    InputProps={{
                      readOnly: true,
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: '#f0f9ff',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: '#0B2863'
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#0B2863', borderWidth: 2 }
                      }
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Image Section */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Image size={20} />
                  Fuel Receipt Image (Optional)
                </Typography>

                {imagePreview ? (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, position: 'relative' }}>
                    <img
                      src={imagePreview}
                      alt="Receipt preview"
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <Button
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.9)' },
                        minWidth: 'auto',
                        p: 1,
                      }}
                    >
                      <X size={20} />
                    </Button>
                  </Paper>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                      border: '2px dashed #cbd5e1',
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#0B2863', bgcolor: '#f1f5f9' },
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      id="fuel-receipt-upload"
                    />
                    <label htmlFor="fuel-receipt-upload" style={{ cursor: 'pointer' }}>
                      <Image size={48} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Click to upload receipt image
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        PNG, JPG up to 10MB
                      </Typography>
                    </label>
                  </Paper>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{
            mr: 2,
            borderColor: '#d1d5db',
            color: '#6b7280',
            '&:hover': { borderColor: '#9ca3af', bgcolor: '#f9fafb' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || trucks.length === 0 || formData.truck === 0}
          sx={{
            backgroundColor: '#0B2863',
            px: 4,
            py: 1,
            '&:hover': { backgroundColor: '#1e3a8a' },
            '&:disabled': { backgroundColor: '#cbd5e1' }
          }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LocalGasStation />}
        >
          {loading ? 'Creating...' : 'Create Fuel Cost'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCostFuelDialog;
