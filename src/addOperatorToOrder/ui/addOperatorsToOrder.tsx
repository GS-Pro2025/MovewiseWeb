import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { OperatorAvailable, OperatorAssigned } from '../domain/OperatorModels';
import { fetchOperatorsAssignedToOrder, fetchAvailableOperators } from '../data/repositoryOperators';
import { 
  IconButton, MenuItem, Select, Box, Typography, Paper, CircularProgress, 
  List, ListItem, ListItemText, Button, TextField, Alert, AlertTitle,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButton, ToggleButtonGroup, InputAdornment, ListItemIcon
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Fuel } from 'lucide-react';
import AssignOrderToCostFuelDialog from '../../addFuelCostToOrder/ui/AssignOrderToCostFuelDialog';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { assignOperatorToOrder, patchRoleAssignment, patchSalaryAssignment, patchTruckAssignment, unassignOperatorFromOrder } from '../data/repositoryAssign';
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
import { fetchFreelancesOperators } from '../data/repositoryOperators';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const AddOperatorsToOrder: React.FC = () => {
  const ROLES = ["leader", "operator", "driver"];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'driver':   return <DirectionsCarIcon fontSize="small" />;
      case 'operator': return <PersonIcon fontSize="small" />;
      case 'leader':   return <StarIcon fontSize="small" />;
      default:         return <PersonIcon fontSize="small" />;
    }
  };

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
  const [fuelCostDialogOpen, setFuelCostDialogOpen] = useState(false);

  // Estados para diálogo de asignación (salary_type / hourly_salary)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [pendingAssignOperator, setPendingAssignOperator] = useState<OperatorAvailable | null>(null);
  // When editing an existing assignment, stores its id_assign; null = create mode
  const [editAssignId, setEditAssignId] = useState<number | null>(null);
  const [assignSalaryType, setAssignSalaryType] = useState<'hour' | 'day'>('day');
  const [assignHourlySalary, setAssignHourlySalary] = useState<string>('');

  const [detailOpen, setDetailOpen] = useState(false);

  // Estados para sugerencias
  const [showOperatorSuggestion, setShowOperatorSuggestion] = useState(false);

  // Función para refrescar operadores asignados
  const refreshAssignedOperators = async () => {
    if (!orderKey) return;
    try {
      const assigned = await fetchOperatorsAssignedToOrder(orderKey);
      setAssignedOperators(assigned);
    } catch (error) {
      console.error('Error refreshing assigned operators:', error);
    }
  };

  // Efecto para verificar cantidad de operadores disponibles
  useEffect(() => {
    if (!loading) {
      setShowOperatorSuggestion(availableOperators.length < 2);
    }
  }, [availableOperators, loading]);

  // Filtrado de operadores asignados
  const filteredAssignedOperators = assignedOperators.filter(
    (op) =>
      (`${op.first_name} ${op.last_name}`.toLowerCase().includes(searchAssigned.toLowerCase()) ||
      (op.identification && op.identification.toString().toLowerCase().includes(searchAssigned.toLowerCase())) ||
      (op.code && op.code.toString().toLowerCase().includes(searchAssigned.toLowerCase())))
  );
  
  // Filtrado de operadores disponibles
  const filteredAvailableOperators = availableOperators.filter(
    (op) =>
      (`${op.first_name} ${op.last_name}`.toLowerCase().includes(searchAvailable.toLowerCase()) ||
      (op.id_number && op.id_number.toString().toLowerCase().includes(searchAvailable.toLowerCase())) ||
      (op.code && op.code.toString().toLowerCase().includes(searchAvailable.toLowerCase())) ||
      (op.is_freelance && 'freelance'.startsWith(searchAvailable.toLowerCase())))
  );

  function getOperatorId(op: OperatorAssigned | OperatorAvailable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (op as any).id_operator ?? (op as any).id;
  }

  const handleOk = () => {
    enqueueSnackbar('Operación exitosa', { variant: 'success' });
    navigate(-1);
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
    const pageSize = 200; 
    const data = await fetchAvailableOperators(page, pageSize);
    return data;
  };

  useEffect(() => {
    const loadOperators = async () => {
      try {
        if (!orderKey) return;
        const assigned = await fetchOperatorsAssignedToOrder(orderKey);
        const available = await fetchAvailable(1);
        const freelances = await fetchFreelancesOperators();
        const assignedIds = new Set(assigned.map(op => getOperatorId(op)));
        
        // Marca todos los disponibles como is_freelance: false
        const filteredAvailable = available
          .filter(op => !assignedIds.has(getOperatorId(op)))
          .map(op => ({ ...op, is_freelance: false }));
        
        // Marca todos los freelance como is_freelance: true
        const filteredFreelances = freelances
          .filter(op => !assignedIds.has(getOperatorId(op)))
          .map(op => ({ ...op, is_freelance: true }));
        
        setAssignedOperators(assigned);
        setAvailableOperators([...filteredAvailable, ...filteredFreelances]);
        setLoading(false);
      } catch (error) {
        enqueueSnackbar('Error al cargar operadores', { variant: 'error' });
        console.error('Error loading operators:', error);
        setLoading(false);
      }
    };

    loadOperators();
  }, [enqueueSnackbar, orderKey]);

  const handleAssign = async (operator: OperatorAvailable, salaryType: 'hour' | 'day', hourlySalary?: string) => {
    if (!orderKey) return;
    try {
      const now = new Date();
      const assignedAt = now.toISOString().split('T')[0];

      const data: CreateAssignmentData = {
        operator: operator.id_operator,
        order: orderKey,
        assigned_at: assignedAt,
        rol: "operator",
        additional_costs: "",
        salary_type: salaryType,
        ...(salaryType === 'hour' && hourlySalary ? { hourly_salary: hourlySalary } : {}),
      };
      await assignOperatorToOrder(data);
      enqueueSnackbar('Operador asignado correctamente', { variant: 'success' });

      // Refresca las listas incluyendo freelancers
      const assigned = await fetchOperatorsAssignedToOrder(orderKey);
      const available = await fetchAvailable(1);
      const freelances = await fetchFreelancesOperators();
      const assignedIds = new Set(assigned.map(op => getOperatorId(op)));
      const filteredAvailable = available
        .filter(op => !assignedIds.has(getOperatorId(op)))
        .map(op => ({ ...op, is_freelance: false }));
      const filteredFreelances = freelances
        .filter(op => !assignedIds.has(getOperatorId(op)))
        .map(op => ({ ...op, is_freelance: true }));
      setAssignedOperators(assigned);
      setAvailableOperators([...filteredAvailable, ...filteredFreelances]);
    } catch (error) {
      console.error('Error assigning operator:', error);
      enqueueSnackbar('Error al asignar operador', { variant: 'error' });
    }
  };

  // Abre el diálogo de configuración antes de asignar (modo creación)
  const handleRequestAssign = (operator: OperatorAvailable) => {
    setPendingAssignOperator(operator);
    setEditAssignId(null);
    setAssignSalaryType('day');
    setAssignHourlySalary(operator.hourly_salary?.toString() ?? '');
    setAssignDialogOpen(true);
  };

  // Abre el diálogo para editar salary de una asignación existente (modo edición)
  const handleEditSalary = (op: OperatorAssigned) => {
    // Construct a minimal OperatorAvailable-like object just for the dialog header
    setPendingAssignOperator({
      id_operator: op.id,
      first_name: op.first_name,
      last_name: op.last_name,
      is_freelance: false,
      hourly_salary: op.hourly_salary ?? null,
      salary_type: op.salary_type ?? null,
    } as OperatorAvailable);
    setEditAssignId(op.id_assign);
    setAssignSalaryType((op.salary_type === 'hour' ? 'hour' : 'day'));
    setAssignHourlySalary(op.hourly_salary?.toString() ?? '');
    setAssignDialogOpen(true);
  };

  const handleChangeRole = async (operator: OperatorAssigned, newRole: string) => {
    try {
      setAssignedOperators((prev) =>
        prev.map((op) =>
          getOperatorId(op) === getOperatorId(operator) ? { ...op, rol: newRole } : op
        )
      );
      await patchRoleAssignment(operator.id_assign, newRole);
      enqueueSnackbar('Rol actualizado', { variant: 'success' });
    } catch (error) {
      console.error('Error updating role:', error);
      enqueueSnackbar('Error al actualizar el rol', { variant: 'error' });
    }
  };

  const handleUnassign = async (operator: OperatorAssigned) => {
    try {
      await unassignOperatorFromOrder(operator.id_assign);
      enqueueSnackbar('Operador desasignado correctamente', { variant: 'success' });

      // Refresca las listas incluyendo freelancers
      if (!orderKey) return;
      const assigned = await fetchOperatorsAssignedToOrder(orderKey);
      const available = await fetchAvailable(1);
      const freelances = await fetchFreelancesOperators();
      const assignedIds = new Set(assigned.map(op => getOperatorId(op)));
      const filteredAvailable = available
        .filter(op => !assignedIds.has(getOperatorId(op)))
        .map(op => ({ ...op, is_freelance: false }));
      const filteredFreelances = freelances
        .filter(op => !assignedIds.has(getOperatorId(op)))
        .map(op => ({ ...op, is_freelance: true }));
      setAssignedOperators(assigned);
      setAvailableOperators([...filteredAvailable, ...filteredFreelances]);
    } catch (error) {
      console.error('Error unassigning operator:', error);
      enqueueSnackbar('Error al desasignar operador', { variant: 'error' });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === 'available' && destination.droppableId === 'assigned') {
      const operator = filteredAvailableOperators[source.index];
      handleRequestAssign(operator);
    }

    if (source.droppableId === 'assigned' && destination.droppableId === 'available') {
      const operator = filteredAssignedOperators[source.index];
      handleUnassign(operator);
    }
  };

  // Componente de sugerencia para operadores
  const OperatorSuggestionAlert = () => (
    <Alert 
      severity="info"
      action={
        <Button 
          color="inherit" 
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/app/operators')}
          sx={{
            borderColor: 'info.main',
            '&:hover': {
              borderColor: 'info.dark',
              backgroundColor: 'rgba(2, 136, 209, 0.04)'
            }
          }}
          variant="outlined"
        >
          Crear Operador
        </Button>
      }
      sx={{ mb: 2 }}
    >
      <AlertTitle>¿No encuentras operadores?</AlertTitle>
      Hay muy pocos operadores disponibles. Puedes crear nuevos operadores para asignarlos a esta orden.
    </Alert>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Botón de volver y acciones */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="primary" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ ml: 1, fontWeight: 'bold' }}>
            Asignar operadores a la orden
          </Typography>
        </Box>
        
        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="info"
            startIcon={<Fuel size={20} style={{ marginRight: 8 }} />}
            onClick={() => setFuelCostDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Add Fuel Cost
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={handleOk}
          >
            OK
          </Button>
        </Box>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 4, mt: 4, justifyContent: 'center' }}>
          {/* Operadores asignados */}
          <Paper sx={{ width: 600, minHeight: 600, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Operadores asignados a la orden
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                (doble clic para editar tiempos)
              </Typography>
            </Box>
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
                <List
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    minHeight: 400,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 2,
                    border: '1px dashed #ccc',
                    p: 1,
                  }}
                >
                  {assignedOperators.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No hay operadores asignados" />
                    </ListItem>
                  )}
                  {filteredAssignedOperators.map((op, idx) => (
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
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              boxShadow: 2,
                              transform: 'translateY(-2px)',
                            },
                          }}
                          secondaryAction={
                            <>
                              <Tooltip
                                title={`Rol actual: ${op.rol} — haz clic para cambiar`}
                                arrow
                                placement="top"
                              >
                                <Select
                                  size="small"
                                  value={op.rol}
                                  onChange={(e) => handleChangeRole(op, e.target.value)}
                                  renderValue={(value) => getRoleIcon(value)}
                                  sx={{
                                    minWidth: 48,
                                    mr: 1,
                                    '.MuiSelect-select': {
                                      display: 'flex',
                                      alignItems: 'center',
                                      p: '6px 28px 6px 8px',
                                    },
                                  }}
                                >
                                  {ROLES.map((role) => (
                                    <MenuItem key={role} value={role}>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        {getRoleIcon(role)}
                                      </ListItemIcon>
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </Tooltip>
                              <Tooltip title="Editar tipo de salario para esta asignación" arrow placement="top">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => handleEditSalary(op)}
                                  sx={{ ml: 0.5 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {(op.rol === "leader" || op.rol === "driver") && (
                                <Tooltip title="Asignar camión a este operador" arrow placement="top">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleOpenTruckModal(op)}
                                    sx={{ ml: 0.5 }}
                                  >
                                    <DirectionsCarIcon />
                                  </IconButton>
                                </Tooltip>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography
                                  sx={{
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    fontWeight: 'bold',
                                  }}
                                  variant="body1"
                                >
                                  {`${op.first_name} ${op.last_name}`}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    px: 1,
                                    py: 0.3,
                                    borderRadius: 1,
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {op.rol}
                                </Typography>
                                {op.salary_type && (
                                  <Tooltip
                                    title={
                                      op.salary_type === 'hour'
                                        ? `Pago por hora${op.hourly_salary ? ` — $${op.hourly_salary}/h` : ''}`
                                        : 'Pago por día (salario del operador)'
                                    }
                                    arrow
                                    placement="top"
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        backgroundColor: op.salary_type === 'hour' ? 'warning.main' : 'success.main',
                                        color: 'white',
                                        px: 1,
                                        py: 0.3,
                                        borderRadius: 1,
                                        fontWeight: 'bold',
                                        cursor: 'default',
                                      }}
                                    >
                                      {op.salary_type === 'hour' ? `$${op.salary ?? '?'}/h` : 'día'}
                                    </Typography>
                                  </Tooltip>
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" display="block">
                                  ID: {op.identification} - Código: {op.code}
                                </Typography>
                                {(op.start_time || op.end_time) && (
                                  <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                    {op.start_time && (
                                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                        🕐 Inicio: {new Date(op.start_time).toLocaleString('es-ES', {
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </Typography>
                                    )}
                                    {op.end_time && (
                                      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                        🕑 Fin: {new Date(op.end_time).toLocaleString('es-ES', {
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            }
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
          <CompareArrowsIcon sx={{ fontSize: 48, color: '#888', alignSelf: 'center' }} />
          
          {/* Operadores disponibles */}
          <Paper sx={{ width: 500, minHeight: 600, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Operadores disponibles
            </Typography>
            
            {/* Sugerencia de operadores */}
            {showOperatorSuggestion && <OperatorSuggestionAlert />}
            
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
                <List
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    minHeight: 400,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 2,
                    border: '1px dashed #ccc',
                    p: 1,
                  }}
                >
                  {availableOperators.length === 0 && !showOperatorSuggestion && (
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
                          secondaryAction={
                            <Tooltip title="Asignar a la orden" arrow>
                              <IconButton
                                edge="end"
                                size="small"
                                color="primary"
                                onClick={() => handleRequestAssign(op)}
                              >
                                <PersonAddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar src={op.photo || undefined}>
                              {(!op.photo && op.first_name) ? op.first_name[0] : ''}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {`${op.first_name} ${op.last_name}`}
                                {op.is_freelance && (
                                  <Typography variant="caption" sx={{ color: 'blue', fontWeight: 'bold' }}>
                                    freelance
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={`ID: ${op.id_number} - Código: ${op.code}`}
                          />
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {/* Mensaje cuando no hay resultados de búsqueda */}
                  {searchAvailable && filteredAvailableOperators.length === 0 && (
                    <ListItem>
                      <ListItemText 
                        primary="No se encontraron operadores"
                        secondary="Intenta con otros términos de búsqueda"
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </Droppable>
            
            {/* Botón para crear operador (acceso directo) */}
            {showOperatorSuggestion && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/app/operators')}
                sx={{ mt: 2 }}
                color="primary"
              >
                Crear Nuevo Operador
              </Button>
            )}
          </Paper>
        </Box>
      </DragDropContext>

      {/* Diálogos */}
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
        onUpdate={refreshAssignedOperators}
      />
      
      <AssignOrderToCostFuelDialog
        open={fuelCostDialogOpen}
        onClose={() => setFuelCostDialogOpen(false)}
        orderKey={orderKey || ''}
        orderRef={orderKey || ''}
        onSuccess={() => {
          enqueueSnackbar('Order assigned to fuel cost successfully! ⛽', { variant: 'success' });
          setFuelCostDialogOpen(false);
        }}
      />

      {/* Diálogo de configuración de asignación */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editAssignId ? 'Editar salario de asignación' : 'Configurar asignación'}
          {pendingAssignOperator && (
            <Typography variant="body2" color="text.secondary">
              {`${pendingAssignOperator.first_name} ${pendingAssignOperator.last_name}`}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tipo de salario para esta orden
            </Typography>
            <Tooltip
              title="'Por día' usa automáticamente el salario diario configurado del operador. 'Por hora' te permite especificar un valor por hora sólo para esta asignación."
              arrow
              placement="top"
            >
              <ToggleButtonGroup
                value={assignSalaryType}
                exclusive
                onChange={(_, val) => { if (val) setAssignSalaryType(val); }}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value="day">
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                  Por día
                </ToggleButton>
                <ToggleButton value="hour">
                  <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                  Por hora
                </ToggleButton>
              </ToggleButtonGroup>
            </Tooltip>

            {assignSalaryType === 'day' && (
              <Alert severity="info">
                El sistema usará automáticamente el salario diario configurado para este operador.
                No es necesario ingresar ningún valor adicional.
              </Alert>
            )}

            {assignSalaryType === 'hour' && (
              <Tooltip
                title="Valor por hora que se usará para calcular el pago de esta asignación. Por defecto se muestra el salario por hora del operador; puedes ajustarlo sólo para esta orden."
                arrow
                placement="top"
              >
                <TextField
                  label="Salario por hora"
                  size="small"
                  fullWidth
                  type="number"
                  value={assignHourlySalary}
                  onChange={(e) => setAssignHourlySalary(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Valor por hora para esta orden. Deja el valor por defecto para usar el salario del operador."
                  sx={{ mt: 1 }}
                />
              </Tooltip>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAssignDialogOpen(false); setPendingAssignOperator(null); setEditAssignId(null); }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (editAssignId !== null) {
                // Modo edición: PATCH sobre asignación existente
                try {
                  await patchSalaryAssignment(
                    editAssignId,
                    assignSalaryType,
                    assignSalaryType === 'hour' ? assignHourlySalary : undefined,
                  );
                  // Actualización optimista: no depender del endpoint de lista
                  setAssignedOperators(prev => prev.map(op =>
                    op.id_assign === editAssignId
                      ? {
                          ...op,
                          salary_type: assignSalaryType,
                          hourly_salary: assignSalaryType === 'hour' ? assignHourlySalary : null,
                        }
                      : op
                  ));
                  enqueueSnackbar('Salario actualizado correctamente', { variant: 'success' });
                } catch {
                  enqueueSnackbar('Error al actualizar el salario', { variant: 'error' });
                }
              } else if (pendingAssignOperator) {
                // Modo creación: POST nueva asignación
                await handleAssign(
                  pendingAssignOperator,
                  assignSalaryType,
                  assignSalaryType === 'hour' ? assignHourlySalary : undefined,
                );
              }
              setAssignDialogOpen(false);
              setPendingAssignOperator(null);
              setEditAssignId(null);
            }}
          >
            {editAssignId ? 'Guardar' : 'Asignar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddOperatorsToOrder;