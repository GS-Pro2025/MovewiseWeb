/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  TextField,
  Pagination,
  Chip,
} from '@mui/material';
import { Fuel, Calendar, ChevronRight, X } from 'lucide-react';
import { LocalGasStation } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { fetchActiveTrucks, TruckByOrder } from '../repository/RepositoryTruck';
import AssignOrderToCostFuelRepository from '../repository/AssignOrderToCostFuelRepository';
import {
  RecentCostFuelData,
} from '../domain/AssignOrderToCostFuelModels';

interface AssignOrderToCostFuelDialogProps {
  open: boolean;
  onClose: () => void;
  orderKey: string;
  orderRef: string;
  onSuccess?: () => void;
}

type Step = 'trucks' | 'costfuels' | 'date';

const AssignOrderToCostFuelDialog: React.FC<AssignOrderToCostFuelDialogProps> = ({
  open,
  onClose,
  orderKey,
  orderRef,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  // States
  const [step, setStep] = useState<Step>('trucks');
  const [loading, setLoading] = useState(false);
  const [trucks, setTrucks] = useState<TruckByOrder[]>([]);
  const [loadingTrucks, setLoadingTrucks] = useState(false);

  const [selectedTruck, setSelectedTruck] = useState<TruckByOrder | null>(null);
  const [costFuels, setCostFuels] = useState<RecentCostFuelData[]>([]);
  const [loadingCostFuels, setLoadingCostFuels] = useState(false);
  const [selectedCostFuel, setSelectedCostFuel] = useState<RecentCostFuelData | null>(null);

  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [assignedDate, setAssignedDate] = useState<string>('');

  // Load active trucks when dialog opens
  useEffect(() => {
    if (open) {
      loadActiveTrucks();
    }
  }, [open]);

  const loadActiveTrucks = async () => {
    setLoadingTrucks(true);
    try {
      const trucks = await fetchActiveTrucks();
      if (trucks.length === 0) {
        enqueueSnackbar('No active trucks available', { variant: 'warning' });
      } else {
        setTrucks(trucks);
      }
    } catch (error) {
      console.error('Error loading trucks:', error);
      enqueueSnackbar('Error loading active trucks', { variant: 'error' });
    } finally {
      setLoadingTrucks(false);
    }
  };

  const handleTruckSelect = async (truck: TruckByOrder) => {
    setSelectedTruck(truck);
    enqueueSnackbar(`Loading fuel costs for ${truck.number_truck}...`, { variant: 'info' });
    await loadCostFuels(truck.id_truck, 1);
    setStep('costfuels');
  };

  const loadCostFuels = async (truckId: number, page: number) => {
    setLoadingCostFuels(true);
    try {
      const response = await AssignOrderToCostFuelRepository.getRecentCostFuelsByTruck(
        truckId,
        5,
        page
      );
      setCostFuels(response.data);
      setPagination({
        page: response.pagination.page,
        totalPages: response.pagination.total_pages,
      });

      if (response.data.length === 0) {
        enqueueSnackbar('No cost fuels available for this truck', { variant: 'info' });
      }
    } catch (error) {
      console.error('Error loading cost fuels:', error);
      enqueueSnackbar('Error loading cost fuels', { variant: 'error' });
    } finally {
      setLoadingCostFuels(false);
    }
  };

  const handleCostFuelSelect = (costFuel: RecentCostFuelData) => {
    setSelectedCostFuel(costFuel);
    enqueueSnackbar(`Fuel cost selected: $${costFuel.cost_fuel.toFixed(2)} - ${costFuel.fuel_qty.toFixed(1)} gallons`, { variant: 'info' });
    setStep('date');
  };

  const handleAssign = async () => {
    if (!selectedCostFuel) return;

    setLoading(true);
    enqueueSnackbar('Processing assignment...', { variant: 'info' });
    try {
      const response = await AssignOrderToCostFuelRepository.assignOrderToCostFuel(
        selectedCostFuel.id_fuel,
        {
          order_key: orderKey,
          assigned_date: assignedDate || undefined,
        }
      );

      enqueueSnackbar(response.messUser || 'Order assigned successfully! 🎉', {
        variant: 'success',
      });

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Error assigning order:', error);
      enqueueSnackbar(`Error: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'costfuels') {
      setStep('trucks');
      setSelectedTruck(null);
      setCostFuels([]);
    } else if (step === 'date') {
      setStep('costfuels');
      setSelectedCostFuel(null);
      setAssignedDate('');
    }
  };

  const handleClose = () => {
    if (!loading && !loadingTrucks && !loadingCostFuels) {
      setStep('trucks');
      setSelectedTruck(null);
      setSelectedCostFuel(null);
      setCostFuels([]);
      setAssignedDate('');
      setPagination({ page: 1, totalPages: 1 });
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
        },
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
            position: 'relative',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Fuel size={28} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Assign Order to Fuel Cost
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Order: {orderRef}
                </Typography>
              </Box>
            </Box>
            <Button
              onClick={handleClose}
              disabled={loading || loadingTrucks || loadingCostFuels}
              sx={{
                color: 'white',
                minWidth: 'auto',
                p: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <X size={24} />
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* STEP 1: Select Truck */}
          {step === 'trucks' && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold' }}>
                Step 1: Select a Truck
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose a truck to view its recent fuel costs
              </Typography>

              {loadingTrucks ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                  <CircularProgress sx={{ color: '#0B2863' }} />
                  <Typography sx={{ ml: 2 }}>Loading trucks...</Typography>
                </Box>
              ) : trucks.length === 0 ? (
                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', textAlign: 'center' }}>
                  <LocalGasStation sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                  <Typography color="text.secondary">No active trucks available</Typography>
                </Paper>
              ) : (
                <List sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}>
                  {trucks.map((truck, index) => (
                    <ListItem key={truck.id_truck} disablePadding>
                      <ListItemButton
                        onClick={() => handleTruckSelect(truck)}
                        sx={{
                          py: 2,
                          px: 2,
                          borderBottom: index < trucks.length - 1 ? '1px solid #e2e8f0' : 'none',
                          '&:hover': { bgcolor: '#e0e7ff' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: '#0B2863',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 2,
                              flexShrink: 0,
                            }}
                          >
                            <LocalGasStation sx={{ color: 'white', fontSize: 20 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0B2863' }}>
                              {truck.name} - {truck.number_truck}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {truck.type.toUpperCase()} | {truck.category}
                            </Typography>
                          </Box>
                          <ChevronRight size={20} style={{ color: '#0B2863' }} />
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* STEP 2: Select Cost Fuel */}
          {step === 'costfuels' && (
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold' }}>
                    Step 2: Select Fuel Cost
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent fuel costs for {selectedTruck?.number_truck}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={handleBack}
                  disabled={loading || loadingCostFuels}
                  sx={{ color: '#0B2863' }}
                >
                  ← Change Truck
                </Button>
              </Box>

              {loadingCostFuels ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                  <CircularProgress sx={{ color: '#0B2863' }} />
                  <Typography sx={{ ml: 2 }}>Loading fuel costs...</Typography>
                </Box>
              ) : costFuels.length === 0 ? (
                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', textAlign: 'center' }}>
                  <Fuel size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                  <Typography color="text.secondary">No fuel costs available for this truck</Typography>
                </Paper>
              ) : (
                <Box>
                  <List sx={{ bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}>
                    {costFuels.map((costFuel, index) => (
                      <ListItem key={costFuel.id_fuel} disablePadding>
                        <ListItemButton
                          onClick={() => handleCostFuelSelect(costFuel)}
                          sx={{
                            py: 2,
                            px: 2,
                            borderBottom: index < costFuels.length - 1 ? '1px solid #e2e8f0' : 'none',
                            '&:hover': { bgcolor: '#e0e7ff' },
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#0B2863' }}>
                                {new Date(costFuel.date).toLocaleDateString()}
                              </Typography>
                              <Chip
                                label={`${costFuel.orders_count} order(s)`}
                                size="small"
                                sx={{ bgcolor: '#dbeafe', color: '#0B2863' }}
                              />
                            </Box>
                            <Box display="flex" gap={2} sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ color: '#0B2863', fontWeight: 600 }}>
                                ${costFuel.cost_fuel.toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {costFuel.fuel_qty.toFixed(1)} gl @ ${costFuel.cost_gl.toFixed(2)}/gl
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {costFuel.distance.toLocaleString()} mi
                              </Typography>
                            </Box>
                            {costFuel.image_url && (
                              <Chip label="Receipt" size="small" sx={{ fontSize: '0.7rem' }} />
                            )}
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>

                  {pagination.totalPages > 1 && (
                    <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
                      <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={(event, page) => {
                          if (selectedTruck) {
                            loadCostFuels(selectedTruck.id_truck, page);
                          }
                        }}
                        color="primary"
                        sx={{
                          '& .MuiPaginationItem-root': {
                            color: '#0B2863',
                            '&.Mui-selected': {
                              bgcolor: '#0B2863',
                              color: 'white',
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* STEP 3: Optional Date */}
          {step === 'date' && (
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#0B2863', fontWeight: 'bold' }}>
                    Step 3: Confirm Assignment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Selected fuel cost: {new Date(selectedCostFuel?.date || '').toLocaleDateString()}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={handleBack}
                  disabled={loading}
                  sx={{ color: '#0B2863' }}
                >
                  ← Change Fuel
                </Button>
              </Box>

              <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, mb: 3 }}>
                <Box display="flex" gap={3}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      TOTAL COST
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#0B2863', fontWeight: 'bold' }}>
                      ${selectedCostFuel?.cost_fuel.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      FUEL QUANTITY
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#0B2863', fontWeight: 'bold' }}>
                      {selectedCostFuel?.fuel_qty.toFixed(1)} gl
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      ORDERS COUNT
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#0B2863', fontWeight: 'bold' }}>
                      {selectedCostFuel?.orders_count}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Typography variant="subtitle2" sx={{ color: '#0B2863', fontWeight: 'bold', mb: 1 }}>
                Assignment Date (Optional)
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: <Calendar size={20} style={{ marginRight: 8, color: '#0B2863' }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#0B2863',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0B2863',
                    },
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Leave empty to use today's date
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={handleClose} disabled={loading || loadingTrucks || loadingCostFuels}>
          Cancel
        </Button>
        {step === 'date' && (
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={loading || !selectedCostFuel}
            sx={{
              bgcolor: '#0B2863',
              '&:hover': { bgcolor: '#0a1f47' },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} /> : null}
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AssignOrderToCostFuelDialog;
