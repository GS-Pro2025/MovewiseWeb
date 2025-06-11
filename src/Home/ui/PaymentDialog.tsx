import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';

interface PaymentDialogProps {
  open: boolean;
  expense: number;
  income: number;
  onClose: () => void;
  onConfirm: (expense: number, income: number) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({ open, expense, income, onClose, onConfirm }) => {
  const [localExpense, setLocalExpense] = useState(expense);
  const [localIncome, setLocalIncome] = useState(income);

  useEffect(() => {
    setLocalExpense(expense);
    setLocalIncome(income);
  }, [expense, income, open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Registrar Pago</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Gastos"
            type="number"
            value={localExpense}
            onChange={e => setLocalExpense(Number(e.target.value))}
            fullWidth
          />
          <TextField
            label="Ingresos"
            type="number"
            value={localIncome}
            onChange={e => setLocalIncome(Number(e.target.value))}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="primary" onClick={() => onConfirm(localExpense, localIncome)}>
          Confirmar Pago
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;