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
  Grid,
  InputAdornment,
} from '@mui/material';
import { LocalGasStation, Speed, AttachMoney } from '@mui/icons-material';
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
  identifier_1: string;
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
    identifier_1: '',
  });

  // Calculate distance when odometers change
  const distance = formData.final_odometer - formData.initial_odometer;

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
        identifier_1: formData.identifier_1 || `${orderRef}-${Date.now()}`,
        distance: distance,
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
        identifier_1: '',
      });

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
        identifier_1: '',
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LocalGasStation style={{ color: '#0B2863' }} />
          <Typography variant="h6" style={{ color: '#0B2863', fontWeight: 'bold' }}>
            Add Fuel Cost to Order {orderRef}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {loadingTrucks ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading trucks...</Typography>
            </Box>
          ) : trucks.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No trucks assigned to this order
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Truck Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Select Truck</InputLabel>
                  <Select
                    value={formData.truck}
                    onChange={(e) => handleInputChange('truck', e.target.value as number)}
                    label="Select Truck"
                  >
                    <MenuItem value={0}>
                      <em>Select a truck</em>
                    </MenuItem>
                    {trucks.map((truck) => (
                      <MenuItem key={truck.id_truck} value={truck.id_truck}>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {truck.name} - {truck.number_truck}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {truck.type} | {truck.category}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Odometer Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Odometer Reading
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label="Initial Odometer"
                  type="number"
                  value={formData.initial_odometer}
                  onChange={(e) => handleInputChange('initial_odometer', Number(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Speed />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">mi</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label="Final Odometer"
                  type="number"
                  value={formData.final_odometer}
                  onChange={(e) => handleInputChange('final_odometer', Number(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Speed />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">mi</InputAdornment>,
                  }}
                  error={formData.final_odometer > 0 && formData.final_odometer <= formData.initial_odometer}
                  helperText={
                    formData.final_odometer > 0 && formData.final_odometer <= formData.initial_odometer
                      ? 'Final odometer must be greater than initial'
                      : ''
                  }
                />
              </Grid>

              {/* Calculated Distance */}
              {distance > 0 && (
                <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#e3f2fd', 
                      borderRadius: 1,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h6" style={{ color: '#0B2863', fontWeight: 'bold' }}>
                      Calculated Distance: {distance.toLocaleString()} miles
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Fuel Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Fuel Information
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  required
                  label="Fuel Quantity"
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  value={formData.fuel_qty}
                  onChange={(e) => handleInputChange('fuel_qty', Number(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalGasStation />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">gal</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  required
                  label="Cost per Gallon"
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  value={formData.cost_gl}
                  onChange={(e) => handleInputChange('cost_gl', Number(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Total Cost"
                  type="number"
                  value={formData.cost_fuel.toFixed(2)}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: '#f5f5f5',
                      fontWeight: 'bold',
                    }
                  }}
                />
              </Grid>

              {/* Identifier */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Identifier (optional)"
                  value={formData.identifier_1}
                  onChange={(e) => handleInputChange('identifier_1', e.target.value)}
                  placeholder="Optional reference number"
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || trucks.length === 0 || formData.truck === 0}
          style={{ backgroundColor: '#0B2863' }}
          startIcon={loading ? <CircularProgress size={20} /> : <LocalGasStation />}
        >
          {loading ? 'Adding...' : 'Add Fuel Cost'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddFuelCostDialog;