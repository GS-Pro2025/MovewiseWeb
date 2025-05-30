import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { OperatorAvailable, OperatorAssigned } from '../domain/OperatorModels';
import { fetchOperatorsAssignedToOrder, fetchAvailableOperators } from '../data/repositoryOperators';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

const AddOperatorsToOrder: React.FC = () => {
  const { orderKey } = useParams<{ orderKey: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [assignedOperators, setAssignedOperators] = useState<OperatorAssigned[]>([]);
  const [availableOperators, setAvailableOperators] = useState<OperatorAvailable[]>([]);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        if (!orderKey) return;
        const assigned = await fetchOperatorsAssignedToOrder(orderKey);
        const available = await fetchAvailableOperators();
        const assignedIds = new Set(assigned.map(op => op.id));
        const filteredAvailable = available.filter(op => !assignedIds.has(op.id));
        setAssignedOperators(assigned);
        setAvailableOperators(filteredAvailable);
        setLoading(false);
      } catch (error) {
        enqueueSnackbar('Error al cargar operadores', { variant: 'error' });
        setLoading(false);
      }
    };

    loadOperators();
  }, [enqueueSnackbar, orderKey]);

  const handleAssign = (operator: OperatorAvailable) => {
    // Implementar lógica de asignación aquí
  };

  const handleUnassign = (operator: OperatorAssigned) => {
    // Implementar lógica de desasignación aquí
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === 'available' && destination.droppableId === 'assigned') {
      const operator = availableOperators[source.index];
      handleAssign(operator);
    }

    if (source.droppableId === 'assigned' && destination.droppableId === 'available') {
      const operator = assignedOperators[source.index];
      handleUnassign(operator);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ display: 'flex', gap: 4, mt: 4, justifyContent: 'center' }}>
        {/* Operadores asignados */}
        <Paper sx={{ width: 350, minHeight: 400, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Operadores asignados a la orden
          </Typography>
          <Droppable droppableId="assigned">
            {(provided) => (
              <List ref={provided.innerRef} {...provided.droppableProps}>
                {assignedOperators.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No hay operadores asignados" />
                  </ListItem>
                )}
                {assignedOperators.map((op, idx) => (
                  <Draggable key={op.id} draggableId={`assigned-${op.id}`} index={idx}>
                    {(provided) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <ListItemText
                          primary={`${op.first_name} ${op.last_name}`}
                          secondary={op.rol}
                        />
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </Paper>
        {/* Operadores disponibles */}
        <Paper sx={{ width: 350, minHeight: 400, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Operadores disponibles
          </Typography>
          <Droppable droppableId="available">
            {(provided) => (
              <List ref={provided.innerRef} {...provided.droppableProps}>
                {availableOperators.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No hay operadores disponibles" />
                  </ListItem>
                )}
                {availableOperators.map((op, idx) => (
                  <Draggable key={op.id} draggableId={`available-${op.id}`} index={idx}>
                    {(provided) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <ListItemText
                          primary={`${op.first_name} ${op.last_name}`}
                          secondary={op.rol}
                        />
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </Paper>
      </Box>
    </DragDropContext>
  );
};

export default AddOperatorsToOrder;
