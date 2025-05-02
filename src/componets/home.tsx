import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_Row,
    createMRTColumnHelper,
  } from 'material-react-table';
  import { Box, Button } from '@mui/material';
  import FileDownloadIcon from '@mui/icons-material/FileDownload';
  import { mkConfig, generateCsv, download } from 'export-to-csv';
  import { data, type Person } from './makeData';
  
  const columnHelper = createMRTColumnHelper<Person>();
  
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
    columnHelper.accessor('idOperador', {
      header: 'ID Operador',
      size: 100,
    }),
    columnHelper.accessor('nameAnt', {
      header: 'Nombre Operador',
      size: 160,
    }),
    columnHelper.accessor('totalCost', {
      header: 'Costo Total',
      size: 120,
      Cell: ({ cell }) =>
        `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
  ];
  
  const csvConfig = mkConfig({
    fieldSeparator: ',',
    decimalSeparator: '.',
    useKeysAsHeaders: true,
  });
  
  const Example = () => {
    const handleExportRows = (rows: MRT_Row<Person>[]) => {
      const rowData = rows.map((row) => row.original);
      const csv = generateCsv(csvConfig)(rowData);
      download(csvConfig)(csv);
    };
  
    const handleExportData = () => {
      const csv = generateCsv(csvConfig)(data);
      download(csvConfig)(csv);
    };
  
    const table = useMaterialReactTable({
      columns,
      data,
      enableRowSelection: true,
      columnFilterDisplayMode: 'popover',
      paginationDisplayMode: 'pages',
      positionToolbarAlertBanner: 'bottom',
      
      renderTopToolbarCustomActions: ({ table }) => (
        <Box
          sx={{
            display: 'flex',
            gap: '16px',
            padding: '8px',
            flexWrap: 'wrap',
          }}
        >
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
  
    return (
        <MaterialReactTable table={table} />
        
     
    );
    
  };
  
  export default Example;
  