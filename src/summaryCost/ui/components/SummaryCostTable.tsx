import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_Row,
    createMRTColumnHelper,
} from 'material-react-table';
import { Box, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { PaginatedOrderSummaryResult, OrderSummary } from '../../domain/OrderSummaryModel';

const columnHelper = createMRTColumnHelper<OrderSummary>();

const columns = [
    columnHelper.accessor('key', {
        header: 'Key',
        size: 40,
    }),
    columnHelper.accessor('key_ref', {
        header: 'Referencia',
        size: 100,
    }),
    columnHelper.accessor('client', {
        header: 'Cliente',
        size: 120,
    }),
    columnHelper.accessor('date', {
        header: 'Fecha',
        size: 100,
    }),
    columnHelper.accessor('state', {
        header: 'Estado',
        size: 100,
    }),
    columnHelper.accessor('summary.expense', {
        header: 'Gastos',
        size: 120,
        Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
    columnHelper.accessor('summary.rentingCost', {
        header: 'Costo de Renta',
        size: 120,
        Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
    columnHelper.accessor('summary.fuelCost', {
        header: 'Costo de Combustible',
        size: 120,
        Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
    columnHelper.accessor('summary.workCost', {
        header: 'Costo de Trabajo',
        size: 120,
        Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
    columnHelper.accessor('summary.driverSalaries', {
        header: 'Salarios de Conductores',
        size: 120,
        Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
    columnHelper.accessor('summary.otherSalaries', {
        header: 'Otros Salarios',
        size: 120,
        Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
    columnHelper.accessor('summary.totalCost', {
        header: 'Costo Total',
        size: 120,
        Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
];

const csvConfig = mkConfig({
    fieldSeparator: ',',
    decimalSeparator: '.',
    useKeysAsHeaders: true,
});

const SummaryCostTable = ({ data, isLoading }: { data: PaginatedOrderSummaryResult | null; isLoading: boolean }) => {
    const handleExportRows = (rows: MRT_Row<OrderSummary>[]) => {
        const rowData = rows.map((row) => {
            const order = row.original;
            return {
                key: order.key,
                referencia: order.key_ref,
                cliente: order.client,
                fecha: order.date,
                estado: order.state,
                gastos: order.summary.expense,
                costo_renta: order.summary.rentingCost,
                costo_combustible: order.summary.fuelCost,
                costo_trabajo: order.summary.workCost,
                salarios_conductores: order.summary.driverSalaries,
                otros_salarios: order.summary.otherSalaries,
                costo_total: order.summary.totalCost
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
            cliente: order.client,
            fecha: order.date,
            estado: order.state,
            gastos: order.summary.expense,
            costo_renta: order.summary.rentingCost,
            costo_combustible: order.summary.fuelCost,
            costo_trabajo: order.summary.workCost,
            salarios_conductores: order.summary.driverSalaries,
            otros_salarios: order.summary.otherSalaries,
            costo_total: order.summary.totalCost
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

export default SummaryCostTable;