// trucks/ui/TrucksPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip,
  CircularProgress, Alert, Tooltip, TablePagination, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  LocalShipping as TruckIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { 
  fetchTrucks, 
  createTruck, 
  updateTruck, 
  deleteTruck,
  Truck, 
  TruckFormData,
  TruckResponse 
} from '../data/repositoryTrucks';

const COLORS = {
  primary: '#092961',
  secondary: '#FE9844',
  background: '#f5f5f5'
};

// Opciones para el select de tipo
const TRUCK_TYPES = [
  { value: 'owned', label: 'Propio' },
  { value: 'rented', label: 'Rentado' }
];

// Opciones para categorías basadas en los datos que vimos
const TRUCK_CATEGORIES = [
  { value: 'truck_26', label: 'Camión 26' },
  { value: 'truck_49', label: 'Camión 49' },
  { value: 'truck_001', label: 'Camión 001' },
  { value: 'vans', label: 'Vans' },
  { value: 'trailer', label: 'Trailer' }
];

const initialFormData: TruckFormData = {
  number_truck: '',
  type: 'owned',
  name: '',
  category: 'truck_26'
};

const TrucksPage: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [formData, setFormData] = useState<TruckFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  const { enqueueSnackbar } = useSnackbar();

  const loadTrucks = async () => {
    try {
      setLoading(true);
      const response: TruckResponse = await fetchTrucks(page + 1, rowsPerPage);
      
      // ✅ IMPORTANTE: Accedemos a response.results.data que es donde están los camiones
      if (response?.results?.data && Array.isArray(response.results.data)) {
        setTrucks(response.results.data);
        setTotalCount(response.count || response.results.data.length);
      } else {
        console.error('Estructura de respuesta inesperada:', response);
        setTrucks([]);
        setTotalCount(0);
      }
    } catch (error) {
      enqueueSnackbar('Error al cargar los vehículos', { variant: 'error' });
      console.error('Error loading trucks:', error);
      setTrucks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrucks();
  }, [page, rowsPerPage]);

  const handleOpenModal = (truck?: Truck) => {
    if (truck) {
      setSelectedTruck(truck);
      setFormData({
        number_truck: truck.number_truck,
        type: truck.type.toLowerCase(), // Asegurar minúsculas
        name: truck.name,
        category: truck.category
      });
    } else {
      setSelectedTruck(null);
      setFormData(initialFormData);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTruck(null);
    setFormData(initialFormData);
  };

  const handleOpenDeleteDialog = (truck: Truck) => {
    setSelectedTruck(truck);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedTruck(null);
  };

  const handleSubmit = async () => {
    // Validación básica
    if (!formData.number_truck || !formData.name || !formData.type || !formData.category) {
      enqueueSnackbar('Todos los campos son requeridos', { variant: 'warning' });
      return;
    }

    try {
      if (selectedTruck) {
        await updateTruck(selectedTruck.id_truck, formData);
        enqueueSnackbar('Vehículo actualizado correctamente', { variant: 'success' });
      } else {
        await createTruck(formData);
        enqueueSnackbar('Vehículo creado correctamente', { variant: 'success' });
      }
      handleCloseModal();
      loadTrucks();
    } catch (error) {
      enqueueSnackbar('Error al guardar el vehículo', { variant: 'error' });
      console.error('Error saving truck:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTruck) return;
    try {
      await deleteTruck(selectedTruck.id_truck);
      enqueueSnackbar('Vehículo eliminado correctamente', { variant: 'success' });
      handleCloseDeleteDialog();
      loadTrucks();
    } catch (error) {
      enqueueSnackbar('Error al eliminar el vehículo', { variant: 'error' });
      console.error('Error deleting truck:', error);
    }
  };

  // Función para obtener el label del tipo
  const getTypeLabel = (type: string) => {
    const typeLower = type.toLowerCase();
    const found = TRUCK_TYPES.find(t => t.value === typeLower);
    return found ? found.label : type;
  };

  // Función para obtener el label de la categoría
  const getCategoryLabel = (category: string) => {
    const found = TRUCK_CATEGORIES.find(c => c.value === category);
    return found ? found.label : category;
  };

  // Filtrado con búsqueda
  const filteredTrucks = trucks.filter(truck => 
    truck.number_truck.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              backgroundColor: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TruckIcon sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
              Administración de Vehículos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona todos los vehículos de la flota
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{
            backgroundColor: COLORS.primary,
            '&:hover': { backgroundColor: '#051f47' },
            textTransform: 'none',
            px: 3,
            py: 1
          }}
        >
          Nuevo Vehículo
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por placa, nombre, tipo o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: COLORS.primary }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': { borderColor: COLORS.primary },
              '&.Mui-focused fieldset': { borderColor: COLORS.primary }
            }
          }}
        />
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ backgroundColor: COLORS.primary }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Placa</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoría</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress sx={{ color: COLORS.primary }} />
                </TableCell>
              </TableRow>
            ) : filteredTrucks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Alert severity="info">No se encontraron vehículos</Alert>
                </TableCell>
              </TableRow>
            ) : (
              filteredTrucks.map((truck) => (
                <TableRow key={truck.id_truck} hover>
                  <TableCell>
                    <Chip
                      label={truck.number_truck}
                      size="small"
                      sx={{
                        backgroundColor: COLORS.secondary,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>{truck.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeLabel(truck.type)}
                      size="small"
                      sx={{
                        backgroundColor: truck.type.toLowerCase() === 'owned' ? '#22c55e' : '#f97316',
                        color: 'white',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell>{getCategoryLabel(truck.category)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton
                        onClick={() => handleOpenModal(truck)}
                        sx={{ color: COLORS.primary, mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        onClick={() => handleOpenDeleteDialog(truck)}
                        sx={{ color: '#ef4444' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Box>

      {/* Create/Edit Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: COLORS.primary, 
          color: 'white',
          py: 2
        }}>
          {selectedTruck ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Placa */}
            <TextField
              label="Placa"
              fullWidth
              value={formData.number_truck}
              onChange={(e) => setFormData({ ...formData, number_truck: e.target.value.toUpperCase() })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': { borderColor: COLORS.primary }
                },
                '& .MuiInputLabel-root.Mui-focused': { color: COLORS.primary }
              }}
            />

            {/* Nombre */}
            <TextField
              label="Nombre"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': { borderColor: COLORS.primary }
                },
                '& .MuiInputLabel-root.Mui-focused': { color: COLORS.primary }
              }}
            />

            {/* Tipo (Select) */}
            <FormControl fullWidth required>
              <InputLabel id="truck-type-label">Tipo</InputLabel>
              <Select
                labelId="truck-type-label"
                value={formData.type}
                label="Tipo"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                sx={{
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: COLORS.primary
                  }
                }}
              >
                {TRUCK_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Selecciona si el vehículo es propio o rentado</FormHelperText>
            </FormControl>

            {/* Categoría (Select) */}
            <FormControl fullWidth required>
              <InputLabel id="truck-category-label">Categoría</InputLabel>
              <Select
                labelId="truck-category-label"
                value={formData.category}
                label="Categoría"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                sx={{
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: COLORS.primary
                  }
                }}
              >
                {TRUCK_CATEGORIES.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Selecciona la categoría del vehículo</FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseModal}
            variant="outlined"
            sx={{
              borderColor: COLORS.primary,
              color: COLORS.primary,
              '&:hover': {
                borderColor: COLORS.primary,
                backgroundColor: 'rgba(9, 41, 97, 0.04)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.number_truck || !formData.name || !formData.type || !formData.category}
            sx={{
              backgroundColor: COLORS.primary,
              '&:hover': { backgroundColor: '#051f47' },
              '&.Mui-disabled': { backgroundColor: '#ccc' }
            }}
          >
            {selectedTruck ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el vehículo{' '}
            <strong>{selectedTruck?.number_truck} - {selectedTruck?.name}</strong>?
          </Typography>
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            sx={{
              borderColor: COLORS.primary,
              color: COLORS.primary
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrucksPage;