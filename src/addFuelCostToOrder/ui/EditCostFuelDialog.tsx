/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  InputAdornment,
  Chip,
  Alert,
  Pagination,
} from '@mui/material';
import { X, Fuel, DollarSign, Droplets, MapPin, Pencil, Image, CheckCircle2, Search, Truck as TruckIcon } from 'lucide-react';
import { LocalGasStation } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { CostFuelWithOrders } from '../../resumeFuel/domain/CostFuelWithOrders';
import { fetchOrdersReport } from '../../Home/data/repositoryOrdersReport';
import { updateCostFuel } from '../repository/UpdateCostFuelRepository';

interface EditCostFuelDialogProps {
  open: boolean;
  onClose: () => void;
  costFuel: CostFuelWithOrders | null;
  onSuccess?: () => void;
}

interface OrderOption {
  key: string;
  key_ref: string;
  date: string;
  client?: string;
}

const EditCostFuelDialog: React.FC<EditCostFuelDialogProps> = ({
  open,
  onClose,
  costFuel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  // String states for numeric fields so users can clear/type freely
  const [costFuelStr, setCostFuelStr] = useState('0');
  const [fuelQtyStr, setFuelQtyStr] = useState('0');
  const [distanceStr, setDistanceStr] = useState('0');
  const [costGlStr, setCostGlStr] = useState('0');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Order search state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderResults, setOrderResults] = useState<OrderOption[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const ORDER_PAGE_SIZE = 8;

  // Pre-fill form when costFuel changes
  useEffect(() => {
    if (costFuel && open) {
      setCostFuelStr(String(costFuel.cost_fuel));
      setFuelQtyStr(String(costFuel.fuel_qty));
      setDistanceStr(String(costFuel.distance));
      setCostGlStr(String(costFuel.cost_gl));
      setSelectedOrders(costFuel.order_cost_fuels.map(o => o.order_key));
      setOrderSearch('');
      setOrderResults([]);
      setOrderPage(1);
    }
  }, [costFuel, open]);

  // cost_fuel edited → derive cost_gl
  const handleCostFuelChange = (val: string) => {
    setCostFuelStr(val);
    const costFuelNum = parseFloat(val) || 0;
    const fuelQtyNum = parseFloat(fuelQtyStr) || 0;
    if (fuelQtyNum > 0) {
      setCostGlStr((costFuelNum / fuelQtyNum).toFixed(3));
    }
  };

  // cost_gl edited → derive cost_fuel
  const handleCostGlChange = (val: string) => {
    setCostGlStr(val);
    const costGlNum = parseFloat(val) || 0;
    const fuelQtyNum = parseFloat(fuelQtyStr) || 0;
    setCostFuelStr((costGlNum * fuelQtyNum).toFixed(2));
  };

  // fuel_qty edited → derive cost_fuel using current cost_gl
  const handleFuelQtyChange = (val: string) => {
    setFuelQtyStr(val);
    const fuelQtyNum = parseFloat(val) || 0;
    const costGlNum = parseFloat(costGlStr) || 0;
    setCostFuelStr((costGlNum * fuelQtyNum).toFixed(2));
  };

  const searchOrders = useCallback(async (search: string, page: number) => {
    if (!search.trim()) {
      setOrderResults([]);
      setOrderTotalPages(1);
      return;
    }
    setOrderLoading(true);
    try {
      const today = new Date();
      const weekNum = Math.ceil(
        ((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 +
          new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7
      );
      const response = await fetchOrdersReport(page, weekNum, today.getFullYear(), ORDER_PAGE_SIZE, search);
      const results: OrderOption[] = (response.results ?? []).map((o: any) => ({
        key: o.key,
        key_ref: o.key_ref,
        date: o.date,
        client: o.customer?.first_name
          ? `${o.customer.first_name} ${o.customer.last_name ?? ''}`.trim()
          : undefined,
      }));
      setOrderResults(results);
      setOrderTotalPages(Math.max(1, Math.ceil((response.count ?? 0) / ORDER_PAGE_SIZE)));
    } catch {
      enqueueSnackbar(t('editCostFuel.errorLoadingOrders'), { variant: 'error' });
    } finally {
      setOrderLoading(false);
    }
  }, [enqueueSnackbar, t]);

  useEffect(() => {
    const debounce = setTimeout(() => searchOrders(orderSearch, orderPage), 350);
    return () => clearTimeout(debounce);
  }, [orderSearch, orderPage, searchOrders]);

  const toggleOrder = (key: string) => {
    setSelectedOrders(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const removeOrder = (key: string) => {
    setSelectedOrders(prev => prev.filter(k => k !== key));
  };

  const handleSubmit = async () => {
    if (!costFuel) return;
    const costFuelNum = parseFloat(costFuelStr) || 0;
    const fuelQtyNum = parseFloat(fuelQtyStr) || 0;
    const distanceNum = parseFloat(distanceStr) || 0;
    const costGlNum = parseFloat(costGlStr) || 0;
    if (costFuelNum <= 0) {
      enqueueSnackbar(t('editCostFuel.validation.costRequired'), { variant: 'warning' });
      return;
    }
    if (fuelQtyNum <= 0) {
      enqueueSnackbar(t('editCostFuel.validation.fuelQtyRequired'), { variant: 'warning' });
      return;
    }
    if (distanceNum <= 0) {
      enqueueSnackbar(t('editCostFuel.validation.distanceRequired'), { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await updateCostFuel(costFuel.id_fuel, {
        cost_fuel: costFuelNum,
        fuel_qty: fuelQtyNum,
        distance: distanceNum,
        cost_gl: costGlNum,
        orders: selectedOrders,
      });
      enqueueSnackbar(t('editCostFuel.success'), { variant: 'success' });
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      enqueueSnackbar(t('editCostFuel.error', { message: err.message }), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOrderSearch('');
      setOrderResults([]);
      onClose();
    }
  };

  if (!costFuel) return null;

  // Labels of selected orders (from search results + existing)
  const selectedLabels = selectedOrders.map(key => {
    const fromResults = orderResults.find(o => o.key === key);
    if (fromResults) return { key, label: fromResults.key_ref };
    const fromExisting = costFuel.order_cost_fuels.find(o => o.order_key === key);
    if (fromExisting) return { key, label: fromExisting.order_key_ref };
    return { key, label: key.slice(0, 8) + '…' };
  });

  const distributed = selectedOrders.length > 0 ? (parseFloat(costFuelStr) || 0) / selectedOrders.length : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.15)' } }}
    >
      {/* Header */}
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0B2863 0%, #1e3a8a 100%)',
            p: 3,
            borderRadius: '16px 16px 0 0',
            color: 'white',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Pencil size={28} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {t('editCostFuel.title')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {t('editCostFuel.subtitle', {
                    truck: costFuel.truck?.number_truck ?? '—',
                    date: costFuel.date,
                  })}
                </Typography>
              </Box>
            </Box>
            <Button
              onClick={handleClose}
              disabled={loading}
              sx={{ color: 'white', minWidth: 'auto', p: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
            >
              <X size={24} />
            </Button>
          </Box>

          {/* Truck badge */}
          <Box
            mt={2}
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 2, py: 1.5, width: 'fit-content' }}
          >
            <TruckIcon size={18} />
            <Typography variant="body2" fontWeight="bold">
              {costFuel.truck?.number_truck} · {costFuel.truck?.name}
            </Typography>
            <Chip
              label={costFuel.truck?.type}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: 11 }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>

          {/* ── Fuel Metrics Section ───────────────────────────────── */}
          <Typography variant="h6" sx={{ color: '#0B2863', fontWeight: 700, mb: 2 }}>
            <LocalGasStation sx={{ verticalAlign: 'middle', mr: 1, fontSize: 22 }} />
            {t('editCostFuel.sections.metrics')}
          </Typography>

          <Paper elevation={0} sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 3, mb: 3 }}>
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(160px, 1fr))" gap={3}>

              {/* cost_fuel */}
              <TextField
                label={t('editCostFuel.fields.costFuel')}
                type="number"
                value={costFuelStr}
                onChange={(e) => handleCostFuelChange(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><DollarSign size={16} /></InputAdornment>,
                }}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ bgcolor: 'white' }}
                helperText={t('editCostFuel.fields.costFuelHelper', { original: costFuel.cost_fuel.toFixed(2) })}
              />

              {/* fuel_qty */}
              <TextField
                label={t('editCostFuel.fields.fuelQty')}
                type="number"
                value={fuelQtyStr}
                onChange={(e) => handleFuelQtyChange(e.target.value)}
                inputProps={{ min: 0, step: 0.1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end"><Droplets size={16} /> gl</InputAdornment>,
                }}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ bgcolor: 'white' }}
                helperText={t('editCostFuel.fields.fuelQtyHelper', { original: costFuel.fuel_qty.toFixed(1) })}
              />

              {/* distance */}
              <TextField
                label={t('editCostFuel.fields.distance')}
                type="number"
                value={distanceStr}
                onChange={(e) => setDistanceStr(e.target.value)}
                inputProps={{ min: 0, step: 1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end"><MapPin size={16} /> mi</InputAdornment>,
                }}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ bgcolor: 'white' }}
                helperText={t('editCostFuel.fields.distanceHelper', { original: costFuel.distance.toLocaleString() })}
              />

            </Box>

            {/* cost_gl: editable, auto-derived */}
            <Box mt={2}>
              <TextField
                label={t('editCostFuel.fields.costGl')}
                type="number"
                value={costGlStr}
                onChange={(e) => handleCostGlChange(e.target.value)}
                inputProps={{ min: 0, step: 0.001 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Fuel size={16} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end">/gl</InputAdornment>,
                }}
                variant="outlined"
                size="small"
                sx={{ bgcolor: 'white', width: 200 }}
                helperText={t('editCostFuel.fields.costGlHelper', { original: costFuel.cost_gl.toFixed(3) })}
              />
            </Box>
          </Paper>

          {/* ── Distribution preview ───────────────────────────────── */}
          {distributed !== null && (
            <Alert
              icon={<CheckCircle2 size={18} />}
              severity="info"
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {t('editCostFuel.distribution', {
                count: formData.orders.length,
                each: distributed.toFixed(2),
              })}
            </Alert>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* ── Orders Section ─────────────────────────────────────── */}
          <Typography variant="h6" sx={{ color: '#0B2863', fontWeight: 700, mb: 2 }}>
            <Image size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {t('editCostFuel.sections.orders')}
          </Typography>

          {/* Selected order chips */}
          {selectedLabels.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {selectedLabels.map(({ key, label }) => (
                <Chip
                  key={key}
                  label={label}
                  onDelete={() => removeOrder(key)}
                  deleteIcon={<X size={14} />}
                  sx={{
                    bgcolor: '#0B2863',
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Order search */}
          <TextField
            fullWidth
            size="small"
            placeholder={t('editCostFuel.orderSearch.placeholder')}
            value={orderSearch}
            onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#6b7280" />
                </InputAdornment>
              ),
              endAdornment: orderLoading
                ? <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
                : null,
            }}
            sx={{ mb: 1.5 }}
          />

          {/* Order results list */}
          {orderResults.length > 0 && (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 1 }}>
              {orderResults.map((order) => {
                const selected = selectedOrders.includes(order.key);
                return (
                  <Box
                    key={order.key}
                    onClick={() => toggleOrder(order.key)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.2,
                      cursor: 'pointer',
                      bgcolor: selected ? '#EEF2FF' : 'white',
                      borderLeft: selected ? '4px solid #0B2863' : '4px solid transparent',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: selected ? '#E0E7FF' : '#f8fafc' },
                      '&:not(:last-child)': { borderBottom: '1px solid #f1f5f9' },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0B2863' }}>
                        {order.key_ref}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.date}{order.client ? ` · ${order.client}` : ''}
                      </Typography>
                    </Box>
                    {selected && <CheckCircle2 size={18} color="#0B2863" />}
                  </Box>
                );
              })}
            </Paper>
          )}

          {orderSearch.trim() && !orderLoading && orderResults.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
              {t('editCostFuel.orderSearch.noResults')}
            </Typography>
          )}

          {orderTotalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={1}>
              <Pagination
                count={orderTotalPages}
                page={orderPage}
                size="small"
                onChange={(_, p) => setOrderPage(p)}
                sx={{ '& .MuiPaginationItem-root': { color: '#0B2863' } }}
              />
            </Box>
          )}

        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}
      >
        <Typography variant="caption" color="text.secondary">
          ID: {costFuel.id_fuel} · {t('editCostFuel.footer.ordersCount', { count: selectedOrders.length })}
        </Typography>
        <Box display="flex" gap={1.5}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{ borderColor: '#0B2863', color: '#0B2863', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {t('editCostFuel.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Pencil size={16} />}
            sx={{
              bgcolor: '#0B2863',
              '&:hover': { bgcolor: '#051f47' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
            }}
          >
            {loading ? t('editCostFuel.saving') : t('editCostFuel.save')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditCostFuelDialog;
