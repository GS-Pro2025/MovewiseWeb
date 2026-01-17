import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  TextField,
  Chip,
  Alert,
} from '@mui/material';
import { OperatorAssigned } from '../domain/OperatorModels';
import { patchAssignmentTimes } from '../data/repositoryAssign';
import { useSnackbar } from 'notistack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';

interface OperatorAssignmentDetailDialogProps {
  open: boolean;
  onClose: () => void;
  operator: OperatorAssigned | null;
  truckPlate?: string | null;
  onUpdate?: () => void;
}

const OperatorAssignmentDetailDialog: React.FC<OperatorAssignmentDetailDialogProps> = ({
  open,
  onClose,
  operator,
  onUpdate,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (operator) {
      // Convertir los tiempos del servidor a formato datetime-local
      const start = operator.start_time ? formatDateTimeLocal(operator.start_time) : '';
      const end = operator.end_time ? formatDateTimeLocal(operator.end_time) : '';
      
      console.log('Operador actualizado:', {
        operator_name: `${operator.first_name} ${operator.last_name}`,
        raw_start_time: operator.start_time,
        raw_end_time: operator.end_time,
        formatted_start: start,
        formatted_end: end,
      });
      
      setStartTime(start);
      setEndTime(end);
    }
  }, [operator, open]);

  const formatDateTimeLocal = (isoString: string): string => {
    // Convierte de ISO 8601 a formato datetime-local (YYYY-MM-DDTHH:mm)
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatToISO = (dateTimeLocal: string): string => {
    // Convierte de datetime-local a ISO 8601
    if (!dateTimeLocal) return '';
    const date = new Date(dateTimeLocal);
    return date.toISOString();
  };

  const handleSaveTimes = async () => {
    if (!operator) return;

    setSaving(true);
    try {
      const start = startTime ? formatToISO(startTime) : null;
      const end = endTime ? formatToISO(endTime) : null;

      await patchAssignmentTimes(operator.id_assign, start, end);
      enqueueSnackbar('Tiempos actualizados correctamente', { variant: 'success' });
      
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating times:', error);
      enqueueSnackbar('Error al actualizar los tiempos', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!operator) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finished':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeIcon />
        Detalle de asignación
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {/* Nota de ayuda para el usuario */}
        <Alert icon={<InfoIcon />} severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> Haz doble clic en cualquier operador asignado para abrir este modal y editar sus tiempos de inicio y fin.
          </Typography>
        </Alert>

        {/* Información del operador */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Nombre del operador
          </Typography>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
            {operator.first_name} {operator.last_name}
          </Typography>
          <Divider />
        </Box>

        <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Rol
            </Typography>
            <Chip 
              label={operator.rol} 
              color="primary" 
              size="small" 
              sx={{ mt: 0.5, fontWeight: 'bold' }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Estado
            </Typography>
            <Chip 
              label={operator.status_order || 'N/A'} 
              color={getStatusColor(operator.status_order)} 
              size="small" 
              sx={{ mt: 0.5, fontWeight: 'bold' }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tiempos editables */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon color="primary" />
            Tiempos de asignación
          </Typography>
          
          {(!startTime && !endTime) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                No hay tiempos registrados. Añade la hora de inicio y finalización.
              </Typography>
            </Alert>
          )}
          
          {(startTime || endTime) && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Tiempos detectados. Puedes editarlos a continuación.
              </Typography>
            </Alert>
          )}
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <Box>
              <TextField
                fullWidth
                label="Hora de inicio"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                helperText={startTime ? `Registrado: ${startTime}` : "Hora cuando comenzó la asignación"}
                variant="outlined"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Hora de finalización"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                helperText={endTime ? `Registrado: ${endTime}` : "Hora cuando finalizó la asignación"}
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Ubicaciones */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon color="primary" />
            Ubicaciones
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Ubicación inicial
              </Typography>
              <Typography variant="body2" sx={{ 
                p: 1, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                minHeight: 40,
                display: 'flex',
                alignItems: 'center'
              }}>
                {operator.location_start || 'No registrada'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Ubicación final
              </Typography>
              <Typography variant="body2" sx={{ 
                p: 1, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                minHeight: 40,
                display: 'flex',
                alignItems: 'center'
              }}>
                {operator.location_end || 'No registrada'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={saving}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveTimes} 
          variant="contained" 
          color="primary"
          startIcon={<SaveIcon />}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar tiempos'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OperatorAssignmentDetailDialog;