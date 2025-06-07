import { ExtraCostResponse } from '../../domain/ExtraCostModel';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from 'material-react-table';
import { Box, Button, Typography } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { useMemo } from 'react';

interface GroupedExtraCost {
  order: {
    key: string;
    key_ref: string;
    date: string;
    weight: string;
    status: string;
    state_usa: string;
    person: {
      email: string;
      first_name: string;
      last_name: string;
    };
    job: number;
  };
  extraCosts: {
    id_workCost: number;
    name: string;
    cost: string;
    type: string;
    id_order: string;
  }[];
  totalCost: number;
}

type ExtraCostTableProps = {
  data: ExtraCostResponse | null;
  isLoading: boolean;
}

const columnHelper = createMRTColumnHelper<GroupedExtraCost>();

const columns = [
  columnHelper.accessor('order.key_ref', {
    header: 'Referencia',
    size: 100,
  }),
  columnHelper.accessor('order.date', {
    header: 'Fecha',
    size: 120,
  }),
  columnHelper.accessor('order.status', {
    header: 'Estado',
    size: 100,
  }),
  columnHelper.accessor('order.weight', {
    header: 'Peso',
    size: 100,
    Cell: ({ cell }) => `${cell.getValue<string>()} lb`,
  }),
  columnHelper.accessor('order.person.first_name', {
    header: 'Conductor',
    size: 150,
    Cell: ({ row }) => `${row.original.order.person.first_name} ${row.original.order.person.last_name}`,
  }),
  columnHelper.accessor('order.state_usa', {
    header: 'Estado USA',
    size: 100,
  }),
  columnHelper.accessor('totalCost', {
    header: 'Costo Total',
    size: 100,
    Cell: ({ cell }) => `$${cell.getValue<number>().toFixed(2)}`,
  }),
];

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

const ExtraCostTable = ({ data, isLoading }: ExtraCostTableProps) => {
  // CORREGIDO: Solo crear tableData, eliminar groupedData no usado
  const tableData = useMemo(() => {
    const grouped = data?.results.results.reduce((acc, cost) => {
      const orderKey = cost.order.key;
      if (!acc[orderKey]) {
        acc[orderKey] = {
          order: cost.order,
          extraCosts: [],
          totalCost: 0
        };
      }
      acc[orderKey].extraCosts.push(cost);
      acc[orderKey].totalCost += parseFloat(cost.cost);
      return acc;
    }, {} as Record<string, GroupedExtraCost>) ?? {};

    return Object.values(grouped);
  }, [data]);

  // Memoize export handler
  const handleExportRows = useMemo(() => (rows: MRT_Row<GroupedExtraCost>[]) => {
    const rowData = rows.flatMap((row) => {
      const order = row.original.order; // Get the order once
      return row.original.extraCosts.map(cost => ({
        id_orden: order.key,
        referencia: order.key_ref,
        fecha: order.date,
        nombre: cost.name,
        tipo: cost.type,
        costo: cost.cost,
        conductor: `${order.person.first_name} ${order.person.last_name}`,
        estado: order.state_usa
      }));
    });
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  }, []);

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enableRowSelection: true,
    enableExpanding: true,
    muiTableBodyRowProps: { hover: false }, // Disable hover effect
    renderDetailPanel: ({ row }) => (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Información de la Orden</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
          <Typography><strong>ID Orden:</strong> {row.original.order.key}</Typography>
          <Typography><strong>Email Conductor:</strong> {row.original.order.person.email}</Typography>
          <Typography><strong>Job ID:</strong> {row.original.order.job}</Typography>
        </Box>
        
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Costos Extra</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {row.original.extraCosts.map((cost) => (
            <Box 
              key={cost.id_workCost}
              sx={{ 
                p: 2, 
                border: '1px solid #eee', 
                borderRadius: 1,
                backgroundColor: '#fafafa'
              }}
            >
              <Typography><strong>ID:</strong> {cost.id_workCost}</Typography>
              <Typography><strong>Nombre:</strong> {cost.name}</Typography>
              <Typography><strong>Tipo:</strong> {cost.type}</Typography>
              <Typography><strong>Costo:</strong> ${cost.cost}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    ),
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    state: { isLoading },
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: '16px', padding: '8px', flexWrap: 'wrap' }}>
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          onClick={() => handleExportRows(table.getPrePaginationRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Exportar Todas las Filas
        </Button>
        <Button
          disabled={table.getRowModel().rows.length === 0}
          onClick={() => handleExportRows(table.getRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Exportar Filas de la Página
        </Button>
        <Button
          disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
          onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Exportar Filas Seleccionadas
        </Button>
      </Box>
    ),
  });

  return <MaterialReactTable table={table} />;
};

export default ExtraCostTable;