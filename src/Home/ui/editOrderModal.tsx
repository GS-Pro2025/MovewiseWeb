import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import type { UpdateOrderData } from '../domain/ModelOrderUpdate';

interface EditOrderDialogProps {
  open: boolean;
  order: UpdateOrderData | null;
  onClose: () => void;
  onSave: (order: UpdateOrderData) => void;
  onChange: (field: keyof UpdateOrderData | `person.${string}`, value: unknown) => void;
}

const EditOrderDialog: React.FC<EditOrderDialogProps> = ({ open, order, onClose, onSave, onChange }) => {
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
          <TextField
            label="State USA"
            fullWidth
            margin="normal"
            value={order.state_usa}
            onChange={e => onChange('state_usa', e.target.value)}
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
          <TextField
            label="Job"
            fullWidth
            margin="normal"
            value={order.job ?? ''}
            onChange={e => onChange('job', e.target.value)}
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