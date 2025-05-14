import React, { useEffect, useState, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from 'material-react-table';
import { Box, Button, TextField, Typography } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { fetchOrdersWithCostFuel } from '../data/repositoryOrdersWIthCostFuel';

// Definimos el tipo de datos que se mostrarán en la tabla
interface TableData {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  city: string;
  country: string;
  weekday: string;
  dateReference: string;
  job: string;
  weight: string;
  truckType: string;
  totalCost: number;
  week: number; // Nueva propiedad para la semana del año
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
  columnHelper.accessor('id', {
    header: 'ID',
    size: 40,
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
  columnHelper.accessor('city', {
    header: 'City',
    size: 120,
  }),
  columnHelper.accessor('country', {
    header: 'Country',
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
  const [data, setData] = useState<TableData[]>([]); // Estado para almacenar los datos de la tabla
  const [filteredData, setFilteredData] = useState<TableData[]>([]); // Datos filtrados por semana
  const [loading, setLoading] = useState<boolean>(true); // Estado para manejar el estado de carga
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now.getTime() - start.getTime()) / 604800000); // Semana actual
  });

  const currentYear = new Date().getFullYear();
  const weekRange = useMemo(() => {
    return getWeekRange(currentYear, week);
  }, [currentYear, week]);
  // Función para cargar los datos desde el servicio
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetchOrdersWithCostFuel(1); // Llamamos al servicio
      const mappedData = response.data.results.map((item) => {
        const date = new Date(item.date);
        return {
          id: item.key,
          firstName: item.person.first_name,
          lastName: item.person.last_name,
          company: 'N/A', // Puedes ajustar este campo según tus datos
          city: 'N/A', // Puedes ajustar este campo según tus datos
          country: 'USA', // Puedes ajustar este campo según tus datos
          weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
          dateReference: item.date,
          job: item.job.toString(),
          weight: item.weight,
          truckType: item.fuelCost[0]?.truck.type || 'N/A',
          totalCost: item.fuelCost.reduce((sum, fuel) => sum + fuel.cost_fuel, 0),
          week: getWeekOfYear(date), // Calculamos la semana del año
        };
      });
      setData(mappedData); // Actualizamos el estado con los datos mapeados
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar datos por semana seleccionada
  useEffect(() => {
    setFilteredData(data.filter((item) => item.week === week));
  }, [data, week]);

  useEffect(() => {
    loadData(); // Cargamos los datos al montar el componente
  }, []);

  const handleWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWeek = parseInt(event.target.value, 10);
    if (newWeek >= 1 && newWeek <= 53) {
      setWeek(newWeek);
    }
  };

  const handleExportRows = (rows: MRT_Row<TableData>[]) => {
    const rowData = rows.map((row) => row.original);
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    const csv = generateCsv(csvConfig)(filteredData);
    download(csvConfig)(csv);
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
  });

  return <MaterialReactTable table={table} />;
};

export default Example;