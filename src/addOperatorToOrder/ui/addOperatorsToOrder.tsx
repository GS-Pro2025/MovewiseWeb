import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Operator } from '../domain/OperatorModels';
import { fetchOperatorsAssignedToOrder, fetchAvailableOperators } from '../data/repositoryOperators';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText } from '@mui/material';

const AddOperatorsToOrder: React.FC = () => {
  const { orderKey } = useParams<{ orderKey: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [assignedOperators, setAssignedOperators] = useState<Operator[]>([]);
  const [availableOperators, setAvailableOperators] = useState<Operator[]>([]);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        if (!orderKey) return;
        const [assigned, available] = await Promise.all([
          fetchOperatorsAssignedToOrder(orderKey),
          fetchAvailableOperators(),
        ]);
        // Filtra los disponibles para que no estén en los asignados
        const assignedIds = new Set(assigned.map(op => op.id_operator));
        const filteredAvailable = available.filter(op => !assignedIds.has(op.id_operator));
        setAssignedOperators(assigned);
        setAvailableOperators(filteredAvailable);
        setLoading(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        enqueueSnackbar('Error al cargar operadores', { variant: 'error' });
        setLoading(false);
      }
    };

    loadOperators();
  }, [enqueueSnackbar, orderKey]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, mt: 4, justifyContent: 'center' }}>
      {/* Operadores asignados */}
      <Paper sx={{ width: 350, minHeight: 400, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Operadores asignados a la orden
        </Typography>
        <List>
          {assignedOperators.length === 0 && (
            <ListItem>
              <ListItemText primary="No hay operadores asignados" />
            </ListItem>
          )}
          {assignedOperators.map((op) => (
            <ListItem key={op.id_operator}>
              <ListItemText
                primary={`${op.first_name} ${op.last_name}`}
                secondary={op.role}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      {/* Operadores disponibles */}
      <Paper sx={{ width: 350, minHeight: 400, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Operadores disponibles
        </Typography>
        <List>
          {availableOperators.length === 0 && (
            <ListItem>
              <ListItemText primary="No hay operadores disponibles" />
            </ListItem>
          )}
          {availableOperators.map((op) => (
            <ListItem key={op.id_operator}>
              <ListItemText
                primary={`${op.first_name} ${op.last_name}`}
                secondary={op.role}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default AddOperatorsToOrder;