import React, { useEffect, useState } from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Autocomplete, CircularProgress } from '@mui/material';
import type { UpdateOrderData } from '../domain/ModelOrderUpdate';
import { fetchCustomerFactories, fetchJobs, fetchOrderStates } from '../data/repositoryOrders';
import type { OrderState } from '../domain/OrderState';
import { JobModel } from '../domain/JobModel';
import { CustomerFactoryModel } from '../domain/CustomerFactoryModel';

interface EditOrderDialogProps {
  open: boolean;
  order: UpdateOrderData | null;
  onClose: () => void;
  onSave: (order: UpdateOrderData) => void;
  onChange: (field: keyof UpdateOrderData | `person.${string}`, value: unknown) => void;
}

const EditOrderDialog: React.FC<EditOrderDialogProps> = ({ open, order, onClose, onSave, onChange }) => {
  console.log('EditOrderDialog rendered with order:', order);
  const [states, setStates] = useState<OrderState[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [jobs, setJobs] = useState<JobModel[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [cf, setCf] = useState<CustomerFactoryModel[]>([]);
  const [loadingCf, setLoadingCf] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingStates(true);
      fetchOrderStates()
        .then(setStates)
        .finally(() => setLoadingStates(false));
      fetchJobs()
        .then(setJobs)
        .finally(() => setLoadingJobs(false));
      fetchCustomerFactories()
        .then(setCf)
        .finally(() => setLoadingCf(false));
    }
  }, [open]);


  if (!order) return null;
  console.log('cf', cf);
  console.log('order.customer_factory', order.customer_factory);
  console.log('order.status', order.status, typeof order.status);
  console.log('order.payStatus', order.payStatus, typeof order.payStatus);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Orden</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            label="Key Ref"
            fullWidth
            margin="normal"
            value={order.key_ref}
            onChange={e => onChange('key_ref', e.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="normal"
            value={order.date}
            onChange={e => onChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Distance"
            fullWidth
            margin="normal"
            value={order.distance ?? ''}
            onChange={e => onChange('distance', e.target.value)}
          />
          <TextField
            label="Expense"
            fullWidth
            margin="normal"
            value={order.expense ?? ''}
            onChange={e => onChange('expense', e.target.value)}
          />
          <TextField
            label="Income"
            fullWidth
            margin="normal"
            value={order.income ?? ''}
            onChange={e => onChange('income', e.target.value)}
          />
          <TextField
            label="Weight"
            fullWidth
            margin="normal"
            value={order.weight}
            onChange={e => onChange('weight', e.target.value)}
          />
          <Autocomplete
            options={states}
            loading={loadingStates}
            getOptionLabel={option => `${option.code} - ${option.name}`}
            value={states.find(s => s.code === order.state_usa) || null}
            onChange={(_, value) => onChange('state_usa', value ? value.code : '')}
            renderInput={params => (
              <TextField
                {...params}
                label="State USA"
                margin="normal"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingStates ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.code === value.code}
          />
          {/* Campos de la persona */}
          <TextField
            label="First Name"
            fullWidth
            margin="normal"
            value={order.person?.first_name ?? ''}
            onChange={e => onChange('person.first_name', e.target.value)}
          />
          <TextField
            label="Last Name"
            fullWidth
            margin="normal"
            value={order.person?.last_name ?? ''}
            onChange={e => onChange('person.last_name', e.target.value)}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={order.person?.email ?? ''}
            onChange={e => onChange('person.email', e.target.value)}
          />
          <TextField
            label="Phone"
            fullWidth
            margin="normal"
            value={order.person?.phone ?? ''}
            onChange={e => onChange('person.phone', e.target.value)}
          />
          <TextField
            label="Address"
            fullWidth
            margin="normal"
            value={order.person?.address ?? ''}
            onChange={e => onChange('person.address', e.target.value)}
          />
          <Autocomplete
            options={jobs}
            loading={loadingJobs}
            getOptionLabel={option => `${option.id} - ${option.name}`}
            value={jobs.find(s => s.id === order.job) || null}
            onChange={(_, value) => onChange('job', value ? value.id : '')}
            renderInput={params => (
              <TextField
                {...params}
                label="Job"
                margin="normal"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingJobs ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          <Autocomplete
            options={cf}
            loading={loadingCf}
            getOptionLabel={option => `${option.name}`}
              value={
                cf.length > 0
                  ? cf.find(s => Number(s.id_factory) === Number(order.customer_factory)) || null
                  : null
              }
            onChange={(_, value) => onChange('customer_factory', value ? value.id_factory : '')}
            renderInput={params => (
              <TextField
                {...params}
                label="Customer Factory"
                margin="normal"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingCf ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => Number(option.id_factory) === Number(value.id_factory)}
          />
        {/* dispatch ticket missing */}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="primary" onClick={() => onSave(order)}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default EditOrderDialog;