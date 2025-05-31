import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { OperatorAssigned } from '../domain/OperatorModels';

interface OperatorAssignmentDetailDialogProps {
  open: boolean;
  onClose: () => void;
  operator: OperatorAssigned | null;
  truckPlate?: string | null; // Puedes pasar la placa del camión si la tienes
}

const OperatorAssignmentDetailDialog: React.FC<OperatorAssignmentDetailDialogProps> = ({
  open,
  onClose,
  operator,
  //truckPlate,
}) => {
  if (!operator) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Detalle de asignación</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Nombre del operador
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {operator.first_name} {operator.last_name}
          </Typography>
          <Divider />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Rol
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {operator.rol}
          </Typography>
          <Divider />
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OperatorAssignmentDetailDialog;

/**
 * Para analizar 
 *       <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Placa del camión
          </Typography>
          <Typography variant="body1">
            {truckPlate ?? operator.code ?? 'No asignado'}
          </Typography>
        </Box>
 */