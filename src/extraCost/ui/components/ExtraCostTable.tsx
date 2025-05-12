import { ExtraCostResponse, ExtraCost } from '../../domain/ExtraCostModel';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from 'material-react-table';
import { Box, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { mkConfig, generateCsv, download } from 'export-to-csv';

type ExtraCostTableProps = {
  data: ExtraCostResponse | null;
  isLoading: boolean;
}

const columnHelper = createMRTColumnHelper<ExtraCost>();

const columns = [
  columnHelper.accessor('order.key', {
    header: 'ID Orden',
    size: 100,
  }),
  columnHelper.accessor('order.key_ref', {
    header: 'Referencia',
    size: 100,
  }),
  columnHelper.accessor('order.date', {
    header: 'Fecha',
    size: 120,
  }),
  columnHelper.accessor('name', {
    header: 'Nombre',
    size: 100,
  }),
  columnHelper.accessor('type', {
    header: 'Tipo',
    size: 100,
  }),
  columnHelper.accessor('cost', {
    header: 'Costo',
    size: 100,
    Cell: ({ cell }) => `$${cell.getValue<string>()}`,
  }),
  columnHelper.accessor('order.person.first_name', {
    header: 'Nombre Conductor',
    size: 120,
  }),
  columnHelper.accessor('order.state_usa', {
    header: 'Estado USA',
    size: 100,
  }),
];

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

const ExtraCostTable = ({ data, isLoading }: ExtraCostTableProps) => {
  const handleExportRows = (rows: MRT_Row<ExtraCost>[]) => {
    const rowData = rows.map((row) => {
      const cost = row.original;
      return {
        id_orden: cost.order.key,
        referencia: cost.order.key_ref,
        fecha: cost.order.date,
        nombre: cost.name,
        tipo: cost.type,
        costo: cost.cost,
        conductor: `${cost.order.person.first_name} ${cost.order.person.last_name}`,
        estado: cost.order.state_usa
      };
    });
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    if (!data) return;
    const rowData = data.results.results.map(cost => ({
      referencia: cost.order.key_ref,
      fecha: cost.order.date,
      nombre: cost.name,
      tipo: cost.type,
      costo: cost.cost,
      conductor: `${cost.order.person.first_name} ${cost.order.person.last_name}`,
      estado: cost.order.state_usa
    }));
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const table = useMaterialReactTable({
    columns,
    data: data?.results.results ?? [],
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

export default ExtraCostTable;