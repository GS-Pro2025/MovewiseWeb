import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Autocomplete, CircularProgress } from '@mui/material';
import type { UpdateOrderData } from '../domain/ModelOrderUpdate';
import { fetchJobs, fetchOrderStates } from '../data/repositoryOrders';
import type { OrderState } from '../domain/OrderState';
import { JobModel } from '../domain/JobModel';

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

  useEffect(() => {
    if (open) {
      setLoadingStates(true);
      fetchOrderStates()
        .then(setStates)
        .finally(() => setLoadingStates(false));
      fetchJobs()
        .then(setJobs)
        .finally(() => setLoadingJobs(false));
    }
  }, [open]);


  if (!order) return null;
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
          <TextField
            label="Status"
            fullWidth
            margin="normal"
            value={order.status}
            onChange={e => onChange('status', e.target.value)}
          />
          <TextField
            label="Pay Status"
            fullWidth
            margin="normal"
            value={order.payStatus ?? ''}
            onChange={e => onChange('payStatus', e.target.value)}
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
            value={jobs.find(s => s.id === order.job) || null} // <-- aquí busca por id
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
          <TextField
            label="Customer Factory"
            fullWidth
            margin="normal"
            value={order.customer_factory ?? ''}
            onChange={e => onChange('customer_factory', e.target.value)}
          />
          <TextField
            label="Dispatch Ticket"
            fullWidth
            margin="normal"
            value={order.dispatch_ticket ?? ''}
            onChange={e => onChange('dispatch_ticket', e.target.value)}
          />
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