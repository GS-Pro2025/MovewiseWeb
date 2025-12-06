/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
  Divider,
  Paper,
} from '@mui/material';
import { Image, Upload, Check, X } from 'lucide-react';
import { LocalGasStation, Speed, AttachMoney, Close } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { fetchTrucksByOrder, TruckByOrder } from '../repository/RepositoryTruck';
import { createFuelCost } from '../repository/FuelCostRepository';
import { FuelCostRequest } from '../domain/FuelCostModels';

interface AddFuelCostDialogProps {
  open: boolean;
  onClose: () => void;
  orderKey: string;
  orderRef: string;
  onSuccess?: () => void;
}

interface FuelCostData {
  truck: number;
  initial_odometer: number;
  final_odometer: number;
  fuel_qty: number;
  cost_gl: number;
  cost_fuel: number;
  image?: string | null; 
}

const AddFuelCostDialog: React.FC<AddFuelCostDialogProps> = ({
  open,
  onClose,
  orderKey,
  orderRef,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [trucks, setTrucks] = useState<TruckByOrder[]>([]);
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  
  const [formData, setFormData] = useState<FuelCostData>({
    truck: 0,
    initial_odometer: 0,
    final_odometer: 0,
    fuel_qty: 0,
    cost_gl: 0,
    cost_fuel: 0,
    image: null,
  });

  // Calculate distance when odometers change
  const distance = formData.final_odometer - formData.initial_odometer;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Calculate total cost when fuel_qty or cost_gl change
  useEffect(() => {
    const totalCost = formData.fuel_qty * formData.cost_gl;
    setFormData(prev => ({ ...prev, cost_fuel: totalCost }));
  }, [formData.fuel_qty, formData.cost_gl]);

  // Load trucks when dialog opens
  useEffect(() => {
    if (open && orderKey) {
      loadTrucks();
    }
  }, [open, orderKey]);

  const loadTrucks = async () => {
    setLoadingTrucks(true);
    try {
      const response = await fetchTrucksByOrder(orderKey);
      setTrucks(response.data);
      
      if (response.data.length === 0) {
        enqueueSnackbar('No trucks assigned to this order', { variant: 'warning' });
      }
    } catch (error) {
      console.error('Error loading trucks:', error);
      enqueueSnackbar('Error loading trucks for this order', { variant: 'error' });
      setTrucks([]);
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
    setFormData(prev => ({ ...prev, image: undefined }));
  };
  
  const handleInputChange = (field: keyof FuelCostData, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.truck === 0) {
      enqueueSnackbar('Please select a truck', { variant: 'error' });
      return;
    }

    if (formData.final_odometer <= formData.initial_odometer) {
      enqueueSnackbar('Final odometer must be greater than initial odometer', { variant: 'error' });
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

    setLoading(true);
    try {
      const fuelCostRequest: FuelCostRequest = {
        order: orderKey,
        truck: formData.truck,
        cost_fuel: formData.cost_fuel,
        cost_gl: formData.cost_gl,
        fuel_qty: formData.fuel_qty,
        identifier_1: `${orderRef}-${Date.now()}`,
        distance: distance,
        image: formData.image || undefined, // Agregar imagen si existe
      };

      await createFuelCost(fuelCostRequest);
      enqueueSnackbar('Fuel cost added successfully! 🚛⛽', { variant: 'success' });
      
      // Reset form
      setFormData({
        truck: 0,
        initial_odometer: 0,
        final_odometer: 0,
        fuel_qty: 0,
        cost_gl: 0,
        cost_fuel: 0,
        image: null,
      });
      setImagePreview(null);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error adding fuel cost:', error);
      enqueueSnackbar(`Error adding fuel cost: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      setFormData({
        truck: 0,
        initial_odometer: 0,
        final_odometer: 0,
        fuel_qty: 0,
        cost_gl: 0,
        cost_fuel: 0,
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
                  Add Fuel Cost
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Order: {orderRef}
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
              <Close />
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
                No trucks assigned
              </Typography>
              <Typography color="text.secondary">
                This order has no trucks assigned to it
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
                    <MenuItem value={0}>
                      <em>Select a truck</em>
                    </MenuItem>
                    {trucks.map((truck) => (
                      <MenuItem key={truck.id_truck} value={truck.id_truck}>
                        <Box sx={{ py: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {truck.name} - {truck.number_truck}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {truck.type.toUpperCase()} | {truck.category}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>

              <Divider sx={{ my: 3 }} />

              {/* Odometer Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold', mb: 3 }}>
                  <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Odometer Reading
                </Typography>
                
                {/* Responsive flex container for odometer fields */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 3, 
                  flexDirection: { xs: 'column', md: 'row' },
                  mb: 3
                }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      required
                      label="Initial Odometer"
                      type="number"
                      value={formData.initial_odometer || ''}
                      onChange={(e) => handleInputChange('initial_odometer', Number(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Speed sx={{ color: '#0B2863' }} />
                          </InputAdornment>
                        ),
                        endAdornment: <InputAdornment position="end">miles</InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#0B2863' },
                          '&.Mui-focused fieldset': { borderColor: '#0B2863' }
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      required
                      label="Final Odometer"
                      type="number"
                      value={formData.final_odometer || ''}
                      onChange={(e) => handleInputChange('final_odometer', Number(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Speed sx={{ color: '#0B2863' }} />
                          </InputAdornment>
                        ),
                        endAdornment: <InputAdornment position="end">miles</InputAdornment>,
                      }}
                      error={formData.final_odometer > 0 && formData.final_odometer <= formData.initial_odometer}
                      helperText={
                        formData.final_odometer > 0 && formData.final_odometer <= formData.initial_odometer
                          ? 'Final odometer must be greater than initial'
                          : ''
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#0B2863' },
                          '&.Mui-focused fieldset': { borderColor: '#0B2863' }
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Calculated Distance */}
                {distance > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #0B2863'
                      }}
                    >
                      <Typography variant="h5" sx={{ color: '#0B2863', fontWeight: 'bold' }}>
                        Distance: {distance.toLocaleString()} miles
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#0B2863', opacity: 0.8 }}>
                        Automatically calculated from odometer readings
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Fuel Section */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold', mb: 3 }}>
                  <LocalGasStation sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Fuel Information
                </Typography>
                
                {/* Responsive flex container for fuel fields */}
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
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocalGasStation sx={{ color: '#0B2863' }} />
                        </InputAdornment>
                      ),
                      endAdornment: <InputAdornment position="end">gal</InputAdornment>,
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
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney sx={{ color: '#0B2863' }} />
                        </InputAdornment>
                      ),
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
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney sx={{ color: '#0B2863' }} />
                        </InputAdornment>
                      ),
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
                  Fuel Receipt Image
                </Typography>
                
                {imagePreview ? (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                      border: '2px solid #0B2863',
                      textAlign: 'center'
                    }}
                  >
                    <img 
                      src={imagePreview} 
                      alt="Fuel receipt preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 300, 
                        borderRadius: 8,
                        marginBottom: 16,
                        objectFit: 'contain'
                      }} 
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                      <Check size={18} color="#0B2863" />
                      <Typography variant="body2" sx={{ color: '#0B2863', fontWeight: 'bold' }}>
                        Image selected
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleRemoveImage}
                      startIcon={<X size={16} />}
                      sx={{ textTransform: 'none' }}
                    >
                      Remove Image
                    </Button>
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      p: 4,
                      border: '2px dashed #0B2863',
                      borderRadius: 2,
                      bgcolor: '#f0f9ff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: '#e0f2fe',
                        borderColor: '#1e3a8a',
                        transform: 'translateY(-2px)'
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2
                    }}
                    component="label"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <Upload size={48} color="#0B2863" strokeWidth={1.5} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ color: '#0B2863', fontWeight: 'bold', fontSize: '1rem' }}>
                        Click to upload or drag and drop
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
                        PNG, JPG, GIF up to 10MB
                      </Typography>
                    </Box>
                  </Box>
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
          {loading ? 'Adding...' : 'Add Fuel Cost'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddFuelCostDialog;