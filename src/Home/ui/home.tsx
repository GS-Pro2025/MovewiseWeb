import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from 'material-react-table';
import { Box, Button, TextField, Typography } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { fetchOrdersReport } from '../data/repositoryOrdersReport';
import type { Operator } from '../domain/ModelOrdersReport';
// Definimos el tipo de datos que se mostrarán en la tabla
interface TableData {
  id: string;
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

const columns = [
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
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [rowOperators, setRowOperators] = useState<any[]>([]);
  const currentYear = new Date().getFullYear();
  const weekRange = useMemo(() => {
    return getWeekRange(currentYear, week);
  }, [currentYear, week]);
  // Función para cargar los datos desde el servicio
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchOrdersReport(1);
      const mappedData = response.results.map((item) => {
        console.log('MAP OPERATORS:', item.operators);
        const date = new Date(item.date);
        return {
          id: item.key,
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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
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
    const rowData = rows.map((row) => row.original);
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    const csv = generateCsv(csvConfig)(filteredData);
    download(csvConfig)(csv);
  };

  const handleRowClick = (row: MRT_Row<TableData>) => {
    setExpandedRowId((prev) => (prev === row.original.id ? null : row.original.id));
  };

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    enableRowSelection: true,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    state: { isLoading: loading }, // Indicamos si la tabla está cargando
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
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: { cursor: 'pointer' },
    }),
    renderDetailPanel: ({ row }) =>
      expandedRowId === row.original.id ? (
        <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle1">Operadores asignados:</Typography>
          {row.original.operators && row.original.operators.length > 0 ? (
            <ul>
              {row.original.operators.map((op) => (
                <li key={op.id_assign}>
                  {op.first_name} {op.last_name} - {op.role}
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">Sin operadores asignados.</Typography>
          )}
        </Box>
      ) : null,
  });

  return <MaterialReactTable table={table} />;
};

export default Example;