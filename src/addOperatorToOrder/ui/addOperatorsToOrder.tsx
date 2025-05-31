/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { OperatorAvailable, OperatorAssigned, Vehicle } from '../domain/OperatorModels';
import { fetchOperatorsAssignedToOrder, fetchAvailableOperators } from '../data/repositoryOperators';
import { IconButton, MenuItem, Select, Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { assignOperatorToOrder, patchRoleAssignment, patchTruckAssignment, unassignOperatorFromOrder } from '../data/repositoryAssign';
import { CreateAssignmentData } from '../domain/AssignModels';
import AssignTruckDialog from './AssignTruckDialog';
import OperatorAssignmentDetailDialog from './OperatorAssignamentDetailDialog';

const AddOperatorsToOrder: React.FC = () => {
  const ROLES = ["team leader", "operator", "driver"];

  const { orderKey } = useParams<{ orderKey: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [assignedOperators, setAssignedOperators] = useState<OperatorAssigned[]>([]);
  const [availableOperators, setAvailableOperators] = useState<OperatorAvailable[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<OperatorAssigned | null>(null);


  const [truckModalOpen, setTruckModalOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);

  function getOperatorId(op: OperatorAssigned | OperatorAvailable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (op as any).id_operator ?? (op as any).id;
  }

  const handleOpenTruckModal = (operator: OperatorAssigned) => {
    setSelectedOperator(operator);
    setTruckModalOpen(true);
  };

  const handleCloseTruckModal = () => {
    setTruckModalOpen(false);
    setSelectedOperator(null);
  };

  const handleAssignTruck = async (truckId: number) => {
    if (selectedOperator) {
      await patchTruckAssignment(selectedOperator.id_assign, truckId);
      enqueueSnackbar('Camión asignado correctamente', { variant: 'success' });
      setTruckModalOpen(false);
      setSelectedOperator(null);
    }
  };

  useEffect(() => {
    const loadOperators = async () => {
      try {
        if (!orderKey) return;
        const assigned = await fetchOperatorsAssignedToOrder(orderKey);
        const available = await fetchAvailableOperators();
        const assignedIds = new Set(assigned.map(op => getOperatorId(op)));
        const filteredAvailable = available.filter(op => !assignedIds.has(getOperatorId(op)));
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


const handleAssign = async (operator: OperatorAvailable) => {
  if (!orderKey) return;
  console.log('Asignando operador:', operator);
  try {
    const now = new Date().toISOString();
    const data: CreateAssignmentData = {
      operator: operator.id_operator,
      order: orderKey,
      assigned_at: now,
      rol: "operator",
      additional_costs: "",
    };
    await assignOperatorToOrder(data);
    enqueueSnackbar('Operador asignado correctamente', { variant: 'success' });
    // Refresca las listas
    const assigned = await fetchOperatorsAssignedToOrder(orderKey);
    const available = await fetchAvailableOperators();
    const assignedIds = new Set(assigned.map(op => op.id));
    const filteredAvailable = available.filter(op => !assignedIds.has(op.id_operator));
    setAssignedOperators(assigned);
    setAvailableOperators(filteredAvailable);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    enqueueSnackbar('Error al asignar operador', { variant: 'error' });
  }
};

const handleChangeRole = async (operator: OperatorAssigned, newRole: string) => {
  try {
    // Aquí deberías tener un endpoint para actualizar el rol del operador asignado.
    // Por ahora solo actualizamos el estado local:
    setAssignedOperators((prev) =>
      prev.map((op) =>
        getOperatorId(op) === getOperatorId(operator) ? { ...op, rol: newRole } : op
      )
    );
    await patchRoleAssignment(operator.id_assign, newRole);
    enqueueSnackbar('Rol actualizado', { variant: 'success' });
    // Si tienes un endpoint, llama aquí y refresca la lista después.
  } catch (error) {
    enqueueSnackbar('Error al actualizar el rol', { variant: 'error' });
  }
};

const handleUnassign = async (operator: OperatorAssigned) => {
  try {
    await unassignOperatorFromOrder(operator.id_assign);
    enqueueSnackbar('Operador desasignado correctamente', { variant: 'success' });
    // Refresca las listas
    if (!orderKey) return;
    const assigned = await fetchOperatorsAssignedToOrder(orderKey);
    const available = await fetchAvailableOperators();
    const assignedIds = new Set(assigned.map(op => op.id));
    const filteredAvailable = available.filter(op => !assignedIds.has(op.id_operator));
    setAssignedOperators(assigned);
    setAvailableOperators(filteredAvailable);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    enqueueSnackbar('Error al desasignar operador', { variant: 'error' });
  }
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
    <>
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ display: 'flex', gap: 4, mt: 4, justifyContent: 'center' }}>
        {/* Operadores asignados */}
        <Paper sx={{ width: 600, minHeight: 600, p: 2 }}>
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
                  <Draggable key={getOperatorId(op)} draggableId={`assigned-${getOperatorId(op)}`} index={idx}>
                    {(provided) => (
                      <ListItem
                        onDoubleClick={() => {
                          setSelectedOperator(op);
                          setDetailOpen(true);
                        }}
                        key={getOperatorId(op)}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          backgroundColor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        secondaryAction={
                          <>
                            <Select
                              size="small"
                              value={op.rol}
                              onChange={(e) => handleChangeRole(op, e.target.value)}
                              sx={{ minWidth: 120, mr: 1 }}
                            >
                              {ROLES.map((role) => (
                                <MenuItem key={role} value={role}>
                                  {role}
                                </MenuItem>
                              ))}
                            </Select>
                            {(op.rol === "team leader" || op.rol === "driver") && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenTruckModal(op)}
                                sx={{ ml: 1 }}
                              >
                                <DirectionsCarIcon />
                              </IconButton>
                            )}
                          </>
                        }
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
        <Paper sx={{ width: 500, minHeight: 600, p: 2 }}>
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
                  <Draggable key={getOperatorId(op)} draggableId={`available-${getOperatorId(op)}`} index={idx}>
                    {(provided) => (
                      <ListItem
                        key={getOperatorId(op)}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          backgroundColor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={`${op.first_name} ${op.last_name}`}
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
    <AssignTruckDialog
      open={truckModalOpen}
      onClose={handleCloseTruckModal}
      onAssign={handleAssignTruck}
    />
    <OperatorAssignmentDetailDialog
      open={detailOpen}
      onClose={() => setDetailOpen(false)}
      operator={selectedOperator}
      truckPlate={selectedOperator?.code}
    />
    </>
  );
};

export default AddOperatorsToOrder;
