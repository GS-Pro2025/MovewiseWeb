import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from 'material-react-table';
import { Box, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { PaginatedOrderResult, Order } from '../../domain/OrderModel';

const columnHelper = createMRTColumnHelper<Order>();

const columns = [
  columnHelper.accessor('key', {
    header: 'Key',
    size: 40,
  }),
  columnHelper.accessor('key_ref', {
    header: 'Referencia',
    size: 100,
  }),
  columnHelper.accessor('date', {
    header: 'Fecha',
    size: 120,
  }),
  columnHelper.accessor('distance', {
    header: 'Distancia',
    size: 100,
  }),
  columnHelper.accessor('weight', {
    header: 'Peso (kg)',
    size: 100,
  }),
  columnHelper.accessor('status', {
    header: 'Estado',
    size: 120,
  }),
  columnHelper.accessor('state_usa', {
    header: 'Estado USA',
    size: 120,
  }),
  columnHelper.accessor('person.first_name', {
    header: 'Nombre',
    size: 100,
  }),
  columnHelper.accessor('person.last_name', {
    header: 'Apellido',
    size: 100,
  }),
  columnHelper.accessor('job', {
    header: 'Trabajo',
    size: 100,
  }),
  columnHelper.accessor('fuelCost', {
    id: 'costoPorGalon',
    header: 'Costo por Galón',
    size: 120,
    Cell: ({ cell }) => {
      const fuelCost = cell.getValue<any[]>();
      if (!fuelCost || fuelCost.length === 0) return '$0';
      return `$${fuelCost[0]?.cost_gl?.toLocaleString('en-US') || 0}`;
    },
  }),
  columnHelper.accessor('fuelCost', {
    id: 'cantidadCombustible',
    header: 'Cantidad de Combustible',
    size: 120,
    Cell: ({ cell }) => {
      const fuelCost = cell.getValue<any[]>();
      if (!fuelCost || fuelCost.length === 0) return '0';
      return `${fuelCost[0]?.fuel_qty?.toLocaleString('en-US') || 0} gl`;
    },
  }),
  columnHelper.accessor('fuelCost', {
    id: 'distanciaRecorrida',
    header: 'Distancia Recorrida',
    size: 120,
    Cell: ({ cell }) => {
      const fuelCost = cell.getValue<any[]>();
      if (!fuelCost || fuelCost.length === 0) return '0';
      return `${fuelCost[0]?.distance?.toLocaleString('en-US') || 0} mi`;
    },
  }),
  columnHelper.accessor('fuelCost', {
    id: 'numeroCamion',
    header: 'Número de Camión',
    size: 120,
    Cell: ({ cell }) => {
      const fuelCost = cell.getValue<any[]>();
      if (!fuelCost || fuelCost.length === 0) return '-';
      return fuelCost[0]?.truck?.number_truck || '-';
    },
  }),
  columnHelper.accessor('fuelCost', {
    id: 'tipoCamion',
    header: 'Tipo de Camión',
    size: 120,
    Cell: ({ cell }) => {
      const fuelCost = cell.getValue<any[]>();
      if (!fuelCost || fuelCost.length === 0) return '-';
      return fuelCost[0]?.truck?.type || '-';
    },
  }),
  columnHelper.accessor('fuelCost', {
    id: 'categoria',
    header: 'Categoría',
    size: 120,
    Cell: ({ cell }) => {
      const fuelCost = cell.getValue<any[]>();
      if (!fuelCost || fuelCost.length === 0) return '-';
      return fuelCost[0]?.truck?.category || '-';
    },
  }),
];

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

const ResumeFuelTable = ({ data, isLoading }: { data: PaginatedOrderResult | null; isLoading: boolean }) => {
  const handleExportRows = (rows: MRT_Row<Order>[]) => {
    const rowData = rows.map((row) => {
      const order = row.original;
      const fuelCostData = order.fuelCost[0] || {};
      return {
        key: order.key,
        referencia: order.key_ref,
        fecha: order.date,
        distancia: order.distance,
        peso: order.weight,
        estado: order.status,
        estado_usa: order.state_usa,
        nombre: order.person.first_name,
        apellido: order.person.last_name,
        trabajo: order.job,
        costo_combustible: order.fuelCost.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0),
        costo_por_galon: fuelCostData.cost_gl,
        cantidad_combustible: fuelCostData.fuel_qty,
        distancia_recorrida: fuelCostData.distance,
        numero_camion: fuelCostData.truck?.number_truck,
        tipo_camion: fuelCostData.truck?.type,
        categoria: fuelCostData.truck?.category
      };
    });
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    if (!data) return;
    const rowData = data.results.map(order => ({
      key: order.key,
      referencia: order.key_ref,
      fecha: order.date,
      distancia: order.distance,
      peso: order.weight,
      estado: order.status,
      estado_usa: order.state_usa,
      nombre: order.person.first_name,
      apellido: order.person.last_name,
      trabajo: order.job,
      costo_combustible: order.fuelCost.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0)
    }));
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const table = useMaterialReactTable({
    columns,
    data: data?.results ?? [],
    enableRowSelection: true,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    state: {
      isLoading: isLoading,
    },
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: '16px', padding: '8px', flexWrap: 'wrap' }}>
        <Button onClick={handleExportData} startIcon={<FileDownloadIcon />}>
          Exportar Todos los Datos
        </Button>
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

export default ResumeFuelTable;
