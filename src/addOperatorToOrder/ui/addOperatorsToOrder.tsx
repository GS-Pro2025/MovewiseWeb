/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { OperatorAvailable, OperatorAssigned } from '../domain/OperatorModels';
import { fetchOperatorsAssignedToOrder, fetchAvailableOperators } from '../data/repositoryOperators';
import { IconButton, MenuItem, Select, Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, Button, TextField } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { assignOperatorToOrder, patchRoleAssignment, patchTruckAssignment, unassignOperatorFromOrder } from '../data/repositoryAssign';
import { CreateAssignmentData } from '../domain/AssignModels';
import AssignTruckDialog from './AssignTruckDialog';
import OperatorAssignmentDetailDialog from './OperatorAssignamentDetailDialog';
import { Truck } from '../domain/TruckModels';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';


const AddOperatorsToOrder: React.FC = () => {
  const ROLES = ["team leader", "operator", "driver"];

  const { orderKey } = useParams<{ orderKey: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [assignedOperators, setAssignedOperators] = useState<OperatorAssigned[]>([]);
  const [availableOperators, setAvailableOperators] = useState<OperatorAvailable[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<OperatorAssigned | null>(null);

  const [searchAssigned, setSearchAssigned] = useState('');
  const [searchAvailable, setSearchAvailable] = useState('');

  const navigate = useNavigate();

  const [truckModalOpen, setTruckModalOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  // Filtrado de operadores asignados
  const filteredAssignedOperators = assignedOperators.filter(
    (op) =>
      (`${op.first_name} ${op.last_name}`.toLowerCase().includes(searchAssigned.toLowerCase()) ||
      (op.identification && op.identification.toString().includes(searchAssigned)) ||
      (op.code && op.code.toString().includes(searchAssigned)))
  );

  // Filtrado de operadores disponibles
  const filteredAvailableOperators = availableOperators.filter(
    (op) =>
      (`${op.first_name} ${op.last_name}`.toLowerCase().includes(searchAvailable.toLowerCase()) ||
      (op.id_number && op.id_number.toString().includes(searchAvailable)) ||
      (op.code && op.code.toString().includes(searchAvailable)))
  );
  function getOperatorId(op: OperatorAssigned | OperatorAvailable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (op as any).id_operator ?? (op as any).id;
  }

  const handleOk = () => {
    enqueueSnackbar('Operación exitosa', { variant: 'success' });
    navigate('/');
  };

  const handleOpenTruckModal = (operator: OperatorAssigned) => {
    setSelectedOperator(operator);
    setTruckModalOpen(true);
  };

  const handleCloseTruckModal = () => {
    setTruckModalOpen(false);
    setSelectedOperator(null);
  };

  const handleAssignTruck = async (truck: Truck) => {
    if (selectedOperator) {
      await patchTruckAssignment(selectedOperator.id_assign, truck.id_truck);
      enqueueSnackbar(`Camión con placa ${truck.number_truck} asignado correctamente`, { variant: 'success' });
      setTruckModalOpen(false);
      setSelectedOperator(null);
    }
  };

  const fetchAvailable = async (page = 1) => {
    const pageSize = 50; 
    const data = await fetchAvailableOperators(page, pageSize);
    return data;
  };

  useEffect(() => {
    const loadOperators = async () => {
      try {
        if (!orderKey) return;
        const assigned = await fetchOperatorsAssignedToOrder(orderKey);
        const available = await fetchAvailable(1);
        const assignedIds = new Set(assigned.map(op => getOperatorId(op)));
        const filteredAvailable = available.filter(op => !assignedIds.has(getOperatorId(op)));
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


const handleAssign = async (operator: OperatorAvailable) => {
  if (!orderKey) return;
  console.log('Asignando operador:', operator);
  try {
    const now = new Date();
    const assignedAt = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const data: CreateAssignmentData = {
      operator: operator.id_operator,
      order: orderKey,
      assigned_at: assignedAt,
      rol: "operator",
      additional_costs: "",
    };
    console.log('Datos de asignación:', data);
    await assignOperatorToOrder(data);
    enqueueSnackbar('Operador asignado correctamente', { variant: 'success' });
    // Refresca las listas
    const assigned = await fetchOperatorsAssignedToOrder(orderKey);
    const available = await fetchAvailable(1);
    const assignedIds = new Set(assigned.map(op => op.id));
    const filteredAvailable = available.filter(op => !assignedIds.has(op.id_operator));
    setAssignedOperators(assigned);
    setAvailableOperators(filteredAvailable);
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
    const available = await fetchAvailable(1);
    const assignedIds = new Set(assigned.map(op => op.id));
    const filteredAvailable = available.filter(op => !assignedIds.has(op.id_operator));
    setAssignedOperators(assigned);
    setAvailableOperators(filteredAvailable);
  } catch (error) {
    enqueueSnackbar('Error al desasignar operador', { variant: 'error' });
  }
};
const onDragEnd = (result: DropResult) => {
  const { source, destination } = result;
  if (!destination) return;

  if (source.droppableId === 'available' && destination.droppableId === 'assigned') {
    // Usa la lista filtrada
    const operator = filteredAvailableOperators[source.index];
    handleAssign(operator);
  }

  if (source.droppableId === 'assigned' && destination.droppableId === 'available') {
    // Usa la lista filtrada
    const operator = filteredAssignedOperators[source.index];
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
      {/* Botón de volver */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton color="primary" onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ ml: 1, fontWeight: 'bold' }}>
          Asignar operadores a la orden
        </Typography>
      </Box>
        {/* Botón OK */}
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckIcon />}
          sx={{ ml: 'auto' }}
          onClick={handleOk}
        >
          OK
        </Button>
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ display: 'flex', gap: 4, mt: 4, justifyContent: 'center' }}>
        {/* Operadores asignados */}
        <Paper sx={{ width: 600, minHeight: 600, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Operadores asignados a la orden
          </Typography>
          <TextField
              label="Buscar por nombre o identificación"
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              value={searchAssigned}
              onChange={(e) => setSearchAssigned(e.target.value)}
            />
          <Droppable droppableId="assigned">
            {(provided) => (
              <List ref={provided.innerRef} {...provided.droppableProps}>
                {assignedOperators.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No hay operadores asignados" />
                  </ListItem>
                )}
                {filteredAssignedOperators.map((op, idx) =>  (
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
                        <ListItemAvatar>
                          <Avatar src={op.photo || undefined}>
                            {(!op.photo && op.first_name) ? op.first_name[0] : ''}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                        primary={
                          <Typography
                            sx={{
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              maxWidth: 200, // Ajusta el ancho máximo según tu diseño
                              display: 'inline-block',
                            }}
                            variant="body1"
                          >
                            {`${op.first_name} ${op.last_name} - Rol:${op.rol}`}
                          </Typography>
                        }
                        secondary={`ID: ${op.identification} - Código: ${op.code}`}
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
        {/* Icono de flecha para indicar la asignación */}
        <CompareArrowsIcon sx={{ fontSize: 48, color: '#888' }} />
        {/* Operadores disponibles */}
        <Paper sx={{ width: 500, minHeight: 600, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Operadores disponibles
          </Typography>
          <TextField
              label="Buscar por nombre o identificación"
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              value={searchAvailable}
              onChange={(e) => setSearchAvailable(e.target.value)}
            />
          <Droppable droppableId="available">
            {(provided) => (
              <List ref={provided.innerRef} {...provided.droppableProps}>
                {availableOperators.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No hay operadores disponibles" />
                  </ListItem>
                )}
                {filteredAvailableOperators.map((op, idx) => (
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
                        <ListItemAvatar>
                          <Avatar src={op.photo || undefined}>
                            {(!op.photo && op.first_name) ? op.first_name[0] : ''}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${op.first_name} ${op.last_name}`}
                          secondary={`ID: ${op.id_number} - Código: ${op.code}`}
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
      truckPlate={null}
    />
    </>
  );
};

export default AddOperatorsToOrder;
