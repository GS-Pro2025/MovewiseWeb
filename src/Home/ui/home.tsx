import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from 'material-react-table';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Box, Button, TextField, Typography } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { fetchOrdersReport } from '../data/repositoryOrdersReport';
import type { Operator } from '../domain/ModelOrdersReport';
import { useSnackbar } from 'notistack';
// Definimos el tipo de datos que se mostrarán en la tabla
interface TableData {
  id: string;
  status: string;
  key_ref: string;
  firstName: string;
  lastName: string;
  company: string;
  city: string;
  state: string;
  weekday: string;
  dateReference: string;
  job: string;
  weight: string;
  truckType: string;
  totalCost: number;
  week: number; 
  operators: Operator[];
}
// Interfaz para exportar solo los campos planos
interface TableDataExport {
  [key: string]: string | number;
  id: string;
  status: string;
  key_ref: string;
  firstName: string;
  lastName: string;
  company: string;
  city: string;
  state: string;
  weekday: string;
  dateReference: string;
  job: string;
  weight: string;
  truckType: string;
  totalCost: number;
  week: number;
}
// Función para calcular la semana del año
const getWeekOfYear = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};


const getWeekRange = (year: number, week: number): { start: string; end: string } => {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
  const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
  const endDate = new Date(startDate.getTime() + 6 * 86400000);
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
};

const columnHelper = createMRTColumnHelper<TableData>();

// Función para limpiar los datos antes de exportar
const mapTableDataForExport = (data: TableData[]): TableDataExport[] =>
  data.map(
    ({
      id,
      status,
      key_ref,
      firstName,
      lastName,
      company,
      city,
      state,
      weekday,
      dateReference,
      job,
      weight,
      truckType,
      totalCost,
      week,
    }) => ({
      id,
      key_ref,
      status,
      firstName,
      lastName,
      company,
      city,
      state,
      weekday,
      dateReference,
      job,
      weight,
      truckType,
      totalCost,
      week,
    })
  );
  
const columns = [
  columnHelper.accessor('status', {
    header: 'Status',
    size: 100,
    Cell: ({ cell }) => {
      const value = cell.getValue<string>().toLowerCase();
      let color = '';
      if (value === 'finished') color = 'green';
      else if (value === 'pending') color = 'orange';
      else if (value === 'inactive') color = 'red';
      else color = 'inherit';
      return (
        <Typography sx={{ color, fontWeight: 600 }}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Typography>
      );
    },
  }),
  columnHelper.accessor('key_ref', {
    header: 'Reference',
    size: 100,
  }),
  columnHelper.accessor('firstName', {
    header: 'First Name',
    size: 100,
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
    size: 100,
  }),
  columnHelper.accessor('company', {
    header: 'Company',
    size: 120,
  }),
  columnHelper.accessor('state', {//USA state
    header: 'State',
    size: 120,
  }),
  columnHelper.accessor('weekday', {
    header: 'Weekday',
    size: 100,
  }),
  columnHelper.accessor('dateReference', {
    header: 'Date',
    size: 120,
  }),
  columnHelper.accessor('job', {
    header: 'Job',
    size: 120,
  }),
  columnHelper.accessor('weight', {
    header: 'Weight (kg)',
    size: 100,
  }),
  columnHelper.accessor('truckType', {
    header: 'Truck Type',
    size: 100,
  }),
  columnHelper.accessor('totalCost', {
    header: 'Costo Total',
    size: 120,
    Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
  }),
  columnHelper.accessor('week', {
    header: 'Week of Year',
    size: 100,
  }),
];

const Example = () => {
  const [data, setData] = useState<TableData[]>([]);
  const [filteredData, setFilteredData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now.getTime() - start.getTime()) / 604800000);
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const weekRange = useMemo(() => {
    return getWeekRange(currentYear, week);
  }, [currentYear, week]);
  const { enqueueSnackbar } = useSnackbar();
  // Función para cargar los datos desde el servicio
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchOrdersReport(
        pagination.pageIndex + 1,
        week,
        currentYear,
        pagination.pageSize
      );
      const mappedData = response.results.map((item) => {
        console.log('MAP OPERATORS:', item.operators);
        const date = new Date(item.date);
        return {
          id: item.key,
          status: item.status,
          key_ref: item.key_ref,
          firstName: item.person.first_name,
          lastName: item.person.last_name,
          company: item.customer_factory_name ?? 'N/A',
          city: item.person.address ?? 'N/A',
          country: 'USA',
          weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
          dateReference: item.date,
          job: item.job_name ?? item.job.toString(),
          weight: item.weight,
          truckType: item.vehicles[0]?.type || 'N/A',
          totalCost: item.summaryCost?.totalCost ?? 0,
          week: getWeekOfYear(date),
          state: item.state_usa ?? 'N/A',
          operators: item.operators, // <-- agrega los operadores aquí
        };
      });
      setData(mappedData);
      setTotalRows(response.count);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination, week, currentYear]);
  // Filtrar datos por semana seleccionada

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setFilteredData(data.filter((item) => item.week === week));
  }, [data, week]);

  const handleWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWeek = parseInt(event.target.value, 10);
    if (newWeek >= 1 && newWeek <= 53) {
      setWeek(newWeek);
    }
  };
  
  const csvConfig = mkConfig({
    fieldSeparator: ',',
    decimalSeparator: '.',
    useKeysAsHeaders: true,
  });

  const handleExportRows = (rows: MRT_Row<TableData>[]) => {
    if (!rows || rows.length === 0) return;
    const rowData = mapTableDataForExport(rows.map((row) => row.original));
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    if (!filteredData || filteredData.length === 0) return;
    const csv = generateCsv(csvConfig)(mapTableDataForExport(filteredData));
    download(csvConfig)(csv);
  };

  const handleRowClick = (row: MRT_Row<TableData>) => {
    if (!row.original.operators || row.original.operators.length === 0) {
      enqueueSnackbar('Sin operadores asignados a esta orden.', { variant: 'info' });
      return;
    }
    setExpandedRowId((prev) => (prev === row.original.id ? null : row.original.id));
  };

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    enableRowSelection: true,
    columnFilterDisplayMode: 'popover',
    manualPagination: true,        // <--- Indica que la paginación será manual
    rowCount: totalRows,           // <--- Total de filas (de tu API)
    state: { isLoading: loading, pagination }, // <--- Controla la paginación desde tu estado
    onPaginationChange: setPagination,         // <--- Cambia la página desde tu estado
    // Elimina muiExpandButtonProps para mostrar el ícono de expandir
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: { cursor: 'pointer' },
    }),
    renderTopToolbarCustomActions: ({ table }) => (
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          padding: '8px',
          flexWrap: 'wrap',
        }}
      >
        <TextField
          label="Week"
          type="number"
          value={week}
          onChange={handleWeekChange}
          inputProps={{ min: 1, max: 53 }}
          size="small"
        />
        <Typography variant="body1" sx={{ alignSelf: 'center' }}>
          Period: {weekRange.start} → {weekRange.end}
        </Typography>
        <Button onClick={handleExportData} startIcon={<FileDownloadIcon />}>
          Export All Data
        </Button>
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          onClick={() =>
            handleExportRows(table.getPrePaginationRowModel().rows)
          }
          startIcon={<FileDownloadIcon />}
        >
          Export All Rows
        </Button>
        <Button
          disabled={table.getRowModel().rows.length === 0}
          onClick={() => handleExportRows(table.getRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Export Page Rows
        </Button>
        <Button
          disabled={
            !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
          }
          onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Export Selected Rows
        </Button>
      </Box>
    ),
    renderDetailPanel: ({ row }) =>
  expandedRowId === row.original.id ? (
    <Box
      sx={{
        p: 3,
        bgcolor: '#ffffff',
        borderRadius: 2,
        boxShadow: 3,
        border: '1px solid #e0e0e0',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
        Operadores asignados
      </Typography>

      {row.original.operators && row.original.operators.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{
            borderRadius: 2,
            border: '1px solid #e0e0e0',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Apellido</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Salario</strong></TableCell>
                <TableCell><strong>Bono</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {row.original.operators.map((op, idx) => (
                <TableRow
                  key={op.id_assign}
                  sx={{
                    backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff',
                    '&:hover': {
                      backgroundColor: '#f1f1f1',
                    },
                  }}
                >
                  <TableCell>{op.first_name}</TableCell>
                  <TableCell>{op.last_name}</TableCell>
                  <TableCell>{op.role}</TableCell>
                  <TableCell>{op.code}</TableCell>
                  <TableCell>${op.salary.toLocaleString('en-US')}</TableCell>
                  <TableCell>
                    {op.bonus !== null ? `$${op.bonus.toLocaleString('en-US')}` : 'N/A'}
                  </TableCell>
                  <TableCell>{op.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Sin operadores asignados.
        </Typography>
      )}
        <Button
          onClick={() => setPagination(p => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
          disabled={pagination.pageIndex === 0}
        >
          Anterior
        </Button>
        <Typography sx={{ mx: 2 }}>
          Página {pagination.pageIndex + 1}
        </Typography>
        <Button
          onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
          disabled={(pagination.pageIndex + 1) * pagination.pageSize >= totalRows}
        >
          Siguiente
        </Button>
    </Box>

  ) : null,
  });

  return <MaterialReactTable table={table} />;
};

export default Example;