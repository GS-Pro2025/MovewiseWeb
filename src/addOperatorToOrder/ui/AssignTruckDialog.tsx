import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Radio
} from '@mui/material';
import { Truck } from '../domain/TruckModels';
import { fetchTrucks } from '../data/repositoryTruck';

interface AssignTruckDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: (truck: Truck) => void;
  initialTruckId?: number | null;
}

const AssignTruckDialog: React.FC<AssignTruckDialogProps> = ({
  open,
  onClose,
  onAssign,
  initialTruckId = null,
}) => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchTrucks()
        .then((data) => setTrucks(data))
        .catch(() => setTrucks([]))
        .finally(() => setLoading(false));
    }
  }, [open]);

  useEffect(() => {
    if (initialTruckId && trucks.length > 0) {
      const found = trucks.find((t) => t.id_truck === initialTruckId) || null;
      setSelectedTruck(found);
    } else {
      setSelectedTruck(null);
    }
  }, [initialTruckId, trucks, open]);

  const filteredTrucks = trucks.filter(
    (truck) =>
      truck.name.toLowerCase().includes(search.toLowerCase()) ||
      truck.number_truck.toLowerCase().includes(search.toLowerCase()) ||
      truck.type.toLowerCase().includes(search.toLowerCase()) ||
      truck.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Asignar camión</DialogTitle>
      <DialogContent>
        <TextField
          label="Buscar camión"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
        />
        {loading ? (
          <CircularProgress />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Nombre</TableCell>
                <TableCell>Número</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTrucks.map((truck) => (
                <TableRow
                  key={truck.id_truck}
                  hover
                  selected={selectedTruck?.id_truck === truck.id_truck}
                  onClick={() => setSelectedTruck(truck)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Radio
                      checked={selectedTruck?.id_truck === truck.id_truck}
                      onChange={() => setSelectedTruck(truck)}
                      value={truck.id_truck}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>{truck.name}</TableCell>
                  <TableCell>{truck.number_truck}</TableCell>
                  <TableCell>{truck.type}</TableCell>
                  <TableCell>{truck.category}</TableCell>
                  <TableCell>{truck.status ? 'Activo' : 'Inactivo'}</TableCell>
                </TableRow>
              ))}
              {filteredTrucks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No se encontraron camiones.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => selectedTruck && onAssign(selectedTruck)}
          variant="contained"
          disabled={!selectedTruck}
        >
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignTruckDialog;