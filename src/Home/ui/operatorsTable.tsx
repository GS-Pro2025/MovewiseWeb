import React from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  createMRTColumnHelper,
} from 'material-react-table';
import { Box, Button, Typography } from '@mui/material';
import { Operator } from '../domain/ModelOrdersReport';
import { useNavigate } from 'react-router-dom';

interface OperatorsTableProps {
  operators: Operator[];
  orderKey: string; // Optional, if you need to navigate to a specific order
}

const OperatorsTable: React.FC<OperatorsTableProps> = ({ operators, orderKey }) => {
  const columnHelper = createMRTColumnHelper<Operator>();
  const navigate = useNavigate();

  const handleAddOperator = () => {
    navigate(`/add-operators-to-order/${orderKey}`);
  };
  
  const columns = [
    columnHelper.accessor('first_name', {
      header: 'Nombre',
      size: 150,
    }),
    columnHelper.accessor('last_name', {
      header: 'Apellido',
      size: 150,
    }),
    columnHelper.accessor('role', {
      header: 'Rol',
      size: 120,
    }),
    columnHelper.accessor('code', {
      header: 'Código',
      size: 100,
    }),
    columnHelper.accessor('salary', {
      header: 'Salario',
      size: 120,
      Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
    columnHelper.accessor('bonus', {
      header: 'Bono',
      size: 120,
      Cell: ({ cell }) => {
        const value = cell.getValue<number | null>();
        return value !== null ? `$${value.toLocaleString('en-US')}` : 'N/A';
      },
    }),
    columnHelper.accessor('date', {
      // SOLUCION: Agregar T00:00:00 para forzar interpretación como hora local
      Cell: ({ cell }) => {
        const dateString = cell.getValue<string>();
        // Agregar T00:00:00 evita problemas de zona horaria
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      },
      header: 'Fecha',
      size: 120,
    }),
  ];

  const table = useMaterialReactTable({
    columns,
    data: operators,
    enableColumnResizing: true,
    enableColumnFilters: false,
    enableSorting: true,
    enablePagination: false,
    enableBottomToolbar: true,
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      density: 'compact',
    },
    muiTableContainerProps: {
      sx: {
        Height: '400px',
      },
    },
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
          Operadores asignados
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: 22, fontWeight: 'bold' }}
          onClick={handleAddOperator}
        >
          +
        </Button>
      </Box>
    ),
  });

  return (
    <Box>
      <MaterialReactTable table={table} />
    </Box>
  );
};

export default OperatorsTable;