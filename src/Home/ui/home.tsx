/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from 'material-react-table';
import { Box, Button, IconButton, TextField, Typography, Select, MenuItem } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { fetchOrdersReport } from '../data/repositoryOrdersReport';
import { finishOrderRepo, updateOrder, deleteOrder } from '../data/repositoryOrders';
import { useSnackbar } from 'notistack';

import EditIcon from '@mui/icons-material/Edit';
import EditOrderDialog from './editOrderModal';
import { UpdateOrderData } from '../domain/ModelOrderUpdate';
import { TableData, TableDataExport } from '../domain/TableData';
import OperatorsTable from './operatorsTable';

import BlockIcon from '@mui/icons-material/Block'; // Para inactivar
import { deleteOrderAbsolute } from '../data/repositoryOrders'; // Eliminar absoluto

import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FinishOrderDialog from './FinishOrderDialog';
import PaymentDialog from './PaymentDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOrderDialog from './deleteOrderDialog';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarDialog from './calendarDialog';
import { getRegisteredLocations } from '../data/repositoryOrders';

import Autocomplete from '@mui/material/Autocomplete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate } from 'react-router-dom'; 
import { Menu, ListItemIcon, ListItemText } from '@mui/material';

const mapTableDataToUpdateOrderData = (item: TableData): UpdateOrderData => ({
  key: item.id,
  key_ref: item.key_ref,
  date: item.dateReference,
  distance: item.distance, 
  expense: item.expense || 0, 
  income: item.income || 0,  
  weight: item.weight,
  status: item.status,
  payStatus: item.payStatus,
  state_usa: item.state,
  customer_factory: typeof item.customer_factory === 'number' ? item.customer_factory : 0,
  person: {
    email: item.email, 
    first_name: item.firstName,
    last_name: item.lastName,
    phone: item.phone,
    address: item.city,
  },
  job: item.job_id 
});

// Reemplaza tu función getWeekOfYear con esta versión ISO
const getWeekOfYear = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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
      phone,
      email,
      company,
      customer_factory,
      city,
      state,
      weekday,
      expense,
      income,
      dateReference,
      job,
      job_id,
      weight,
      truckType,
      totalCost,
      payStatus,
      distance,
      week,
    }) => ({
      id,
      key_ref,
      status,
      firstName,
      lastName,
      phone,
      email,
      company,
      customer_factory,
      city,
      state,
      weekday,
      expense, 
      income,  
      dateReference,
      job,
      job_id,
      weight,
      truckType,
      totalCost,
      payStatus,
      distance,
      week,
    })
  );
  

const Example = () => {
  const [data, setData] = useState<TableData[]>([]);
  const [filteredData, setFilteredData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now.getTime() - start.getTime()) / 604800000);
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
  const [totalRows, setTotalRows] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const weekRange = useMemo(() => {
    return getWeekRange(currentYear, week);
  }, [currentYear, week]);
  const { enqueueSnackbar } = useSnackbar();

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [finishImage, setFinishImage] = useState<File | null>(null);
  const [finishLoading, setFinishLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<TableData | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<UpdateOrderData | null>(null);

  const [weekdayFilter, setWeekdayFilter] = useState<string>('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [locationFilter, setLocationFilter] = useState<string>('');
  const [locations, setLocations] = useState<string[]>([]);

  const weekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const [inactivateDialogOpen, setInactivateDialogOpen] = useState(false);
  const [orderToInactivate, setOrderToInactivate] = useState<TableData | null>(null);

  const [deleteAbsoluteDialogOpen, setDeleteAbsoluteDialogOpen] = useState(false);
  const [orderToDeleteAbsolute, setOrderToDeleteAbsolute] = useState<TableData | null>(null);
  const navigate = useNavigate();

  // NUEVO: Estado para menú contextual
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    row: TableData | null;
  } | null>(null);

  const columns = [
    {
      header: 'Actions',
      id: 'actions',
      size: 80, // REDUCIDO de 200 a 80
      headerProps: { style: { textAlign: 'center' } },
      Cell: ({ row }: { row: MRT_Row<TableData> }) => {
        const isFinished = row.original.status === 'finished';
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {/* Solo mostrar el botón más importante */}
            <IconButton
              color={isFinished ? 'default' : 'success'}
              size="small"
              disabled={isFinished}
              onClick={(e) => {
                e.stopPropagation();
                if (!isFinished) handleOpenFinishModal(row.original.id);
              }}
              title={isFinished ? "Order finished" : "Finish Order"}
              sx={{
                backgroundColor: isFinished ? '#e8f5e8' : 'transparent',
                '&:hover': {
                  backgroundColor: isFinished ? '#e8f5e8' : 'rgba(76, 175, 80, 0.08)'
                }
              }}
            >
              {isFinished ? (
                <CheckCircleIcon sx={{ color: '#4caf50' }} />
              ) : (
                <CheckIcon />
              )}
            </IconButton>
          </Box>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
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
    columnHelper.accessor('email', {
      header: 'Email',
      size: 120,
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      size: 120,
      Cell: ({ cell }) => {
        const value = cell.getValue<string>();
        return value ? value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'N/A';
      },
    }),
    columnHelper.accessor('company', {
      header: 'Company',
      size: 120,
    }),
    columnHelper.accessor('state', {//USA state
      header: 'Location',
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
      header: 'Weight (lb)',
      size: 100,
    }),
    columnHelper.accessor('distance', {
      header: 'Distance (mi)',
      size: 120,
      Cell: ({ cell }) => {
        const value = cell.getValue<number>();
        return value ? `${value.toLocaleString('en-US')} mi` : 'N/A';
      },
    }),
    columnHelper.accessor('expense', {
      header: 'Expense',
      size: 120,
      Cell: ({ cell }) => {
        const value = cell.getValue<string>();
        return value ? `$${Number(value).toLocaleString('en-US')}` : 'N/A';
      },
    }),
    columnHelper.accessor('income', {
      header: 'Income',
      size: 120,
      Cell: ({ cell }) => {
        const value = cell.getValue<string>();
        return value ? `$${Number(value).toLocaleString('en-US')}` : 'N/A';
      },
    }),
    columnHelper.accessor('totalCost', {
      header: 'Total Cost',
      size: 120,
      Cell: ({ cell }) => `$${cell.getValue<number>().toLocaleString('en-US')}`,
    }),
    columnHelper.accessor('week', {
      header: 'Week of Year',
      size: 100,
    }),
    columnHelper.accessor('payStatus', {
      header: 'Pay Status',
      size: 120,
      Cell: ({ cell }) => {
        const value = cell.getValue<number>();
        const color = value === 0 ? 'red' : 'green';
        return (
          <Typography sx={{ color, fontWeight: 600 }}>
            {value === 0 ? 'Unpaid' : 'Paid'}
          </Typography>
        );
      },
    }),
    columnHelper.accessor('created_by', {
      header: 'Created By',
      size: 120,
      Cell: ({ cell }) => {
        const value = cell.getValue<string>();
        return (
          <Typography sx={{ color: '#1976d2', fontWeight: 500 }}>
            {value || 'N/A'}
          </Typography>
        );
      },
    }),
  ];
  const finishOrder = async (orderId: string, image?: File) => {
    try{
      await finishOrderRepo(orderId, image);
      enqueueSnackbar('Order finished', { variant: 'success' });
      setFinishModalOpen(false);
      setFinishImage(null);
    } catch (error) {
      enqueueSnackbar('Sorry there was an error finishing the order', { variant: 'error' });
      console.error('Error finishing order:', error);
      throw error;
    }
  };

  // Mapea TableData a CreateOrderModel para continuar orden
  const mapTableDataToCreateOrderModel = (order: TableData): unknown => ({
    date: (() => {
      const originalDate = new Date(order.dateReference);
      const nextDay = new Date(originalDate);
      nextDay.setDate(originalDate.getDate() + 1);
      return nextDay.toISOString().split('T')[0];
    })(),
    key_ref: order.key_ref,
    address: order.city || '',
    state_usa: order.state || '',
    status: 'Pending',
    paystatus: 0,
    person: {
      first_name: order.firstName || '',
      last_name: order.lastName || '',
      address: order.city || '',
      email: order.email || '',
      phone: order.phone || '',
    },
    weight: order.weight || 0,
    job: order.job || 0,
    customer_factory: typeof order.customer_factory === 'number' ? order.customer_factory : 0,
  });

  const handleConfirmPayment = async (expense: number, income: number) => {
    if (!expense) return;
    if (!paymentOrder) return;
    paymentOrder.expense = expense;
    paymentOrder.income = income;
    await updateOrder(paymentOrder.id, {
      ...mapTableDataToUpdateOrderData(paymentOrder),
      expense,
      income,
      payStatus: 1, 
    });
    enqueueSnackbar('Payment registered', { variant: 'success' });
    loadData(); // refresca la tabla
    setPaymentDialogOpen(false);
    setPaymentOrder(null);
  };

  const handleOpenFinishModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setFinishModalOpen(true);
    setFinishImage(null);
  };

  const handleFinishOrder = async () => {
    if (!selectedOrderId) return;
    setFinishLoading(true);
    try {
      await finishOrder(selectedOrderId, finishImage || undefined);
      enqueueSnackbar('Order finished', { variant: 'success' });
      setFinishModalOpen(false);
      setFinishImage(null);
      setSelectedOrderId(null);
      loadData(); // refresca la tabla
    } catch (error) {
      enqueueSnackbar('Sorry there was an error finishing the order', { variant: 'error' });
      console.error('Error finishing order:', error);
    }
    setFinishLoading(false);
  };

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
        const dateParts = item.date.split('-');
        const date = new Date(
          Number(dateParts[0]),
          Number(dateParts[1]) - 1,
          Number(dateParts[2])
        );
        
        // Usar la función ISO para calcular la semana
        const calculatedWeek = getWeekOfYear(date);
        
        console.log(`Fecha: ${item.date}, Día: ${date.toLocaleDateString('en-US', { weekday: 'long' })}, Semana calculada: ${calculatedWeek}`);
        
        return {
          id: item.key,
          status: item.status.toLowerCase(),
          key_ref: item.key_ref,
          firstName: item.person.first_name,
          lastName: item.person.last_name,
          phone: item.person.phone != null ? String(item.person.phone) : '',
          email: item.person.email ?? '',
          company: item.customer_factory_name,
          customer_factory: item.customer_factory,
          city: item.person.address,
          country: 'USA',
          weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
          dateReference: item.date,
          job: item.job_name,
          job_id: item.job,
          weight: item.weight,
          truckType: item.vehicles[0]?.type,
          totalCost: item.summaryCost?.totalCost,
          week: calculatedWeek, // Usar la función ISO
          state: item.state_usa,
          operators: item.operators,
          distance: item.distance ?? 0,
          expense: item.expense != null ? Number(item.expense) : 0,
          income: item.income != null ? Number(item.income) : 0,
          payStatus: Number(item.payStatus) || 0,
          dispatch_ticket: item.dispatch_ticket ?? '',
          created_by: item.created_by ?? 'N/A',
        };
      });
      
      setData(mappedData);
      setTotalRows(response.count);
      console.log('Datos mapeados:', mappedData);
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
    let filtered = data.filter((item) => item.week === week);
    if (weekdayFilter) {
      filtered = filtered.filter((item) => item.weekday === weekdayFilter);
    }
    if (locationFilter) {
      filtered = filtered.filter((item) => item.state === locationFilter);
    }
    setFilteredData(filtered);
  }, [data, week, weekdayFilter, locationFilter]);

  useEffect(() => {
      getRegisteredLocations().then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setLocations(res.data);
        }
      });
  }, []);
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
      enqueueSnackbar('There are not operators assigned to the order.', { variant: 'info' });
    }
    setExpandedRowId((prev) => (prev === row.original.id ? null : row.original.id));
  };

  const handleEditOrder = (order: TableData) => {
    setOrderToEdit(mapTableDataToUpdateOrderData(order));
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setOrderToEdit(null);
  };

  const handleSaveEdit = async (key: string, order: UpdateOrderData) => {
    console.log('Saving order:', order);
    // Mapea order a UpdateOrderData según tu modelo
    const orderData: UpdateOrderData = {
      key: key,
      key_ref: order.key_ref,
      date: order.date,
      distance: order.distance, 
      expense: order.expense,
      income: order.income,
      weight: order.weight,
      state_usa: order.state_usa,
      customer_factory: order.customer_factory,
      person: {
        email: order.person.email, 
        first_name: order.person.first_name,
        last_name: order.person.last_name,
        phone: order.person.phone,
        address: order.person.address
      },
      job: order.job, 
    };
    console.log('Order Data to Update:', orderData);
    const result = await updateOrder(key, orderData);
    if (result.success) {
      enqueueSnackbar('Order updated', { variant: 'success' });
      loadData(); // Recarga los datos después de la edición
    } else {
      // Muestra el error
      enqueueSnackbar(`Sorry there was an error updating the order: ${result.errorMessage}`, { variant: 'error' });
    }
    setEditModalOpen(false);
    setOrderToEdit(null);
  };

  const handleChangeOrder = (field: keyof UpdateOrderData | `person.${string}`, value: unknown) => {
    if (!orderToEdit) return;
    if (field.startsWith('person.')) {
      const personField = field.split('.')[1];
      setOrderToEdit({
        ...orderToEdit,
        person: {
          ...orderToEdit.person,
          [personField]: value,
        },
      });
    } else {
      setOrderToEdit({
        ...orderToEdit,
        [field]: value,
      });
    }
  };

  // Continuar la orden
  const handleContinueOrder = (order: TableData) => {
    const orderData = mapTableDataToCreateOrderModel(order);
    navigate('/create-daily', { state: { orderToContinue: orderData } });
  };

  const table = useMaterialReactTable({
    columns,
    data: filteredData,
    enableRowSelection: true,
    columnFilterDisplayMode: 'popover',
    manualPagination: true,
    rowCount: totalRows,
    state: { isLoading: loading, pagination },
    onPaginationChange: setPagination,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      onContextMenu: (event) => handleContextMenu(event, row.original),
      sx: { 
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#f5f5f5'
        }
      },
      style: { textAlign: 'center' },
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
        <Select
          value={weekdayFilter}
          onChange={(e) => setWeekdayFilter(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Days</MenuItem>
          {weekDays.map((day) => (
            <MenuItem key={day} value={day}>
              {day}
            </MenuItem>
          ))}
        </Select>
        <Autocomplete
          options={locations}
          value={locationFilter}
          onChange={(_, newValue) => setLocationFilter(newValue || '')}
          clearOnEscape
          size="small"
          sx={{ minWidth: 200 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Location"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Button
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={() => setCalendarOpen(true)}
        >
          Calendar View
        </Button>
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
          <OperatorsTable 
            operators={row.original.operators || []}
            orderKey={row.original.id} 
          />
        </Box>
      ) : null,
      });

  const handleContextMenu = (event: React.MouseEvent, row: TableData) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      row,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextAction = (action: string) => {
    if (!contextMenu?.row) return;
    
    const row = contextMenu.row;
    
    switch (action) {
      case 'continue':
        handleContinueOrder(row);
        break;
      case 'finish':
        if (row.status !== 'finished') {
          handleOpenFinishModal(row.id);
        }
        break;
      case 'edit':
        handleEditOrder(row);
        break;
      case 'inactivate':
        setOrderToInactivate(row);
        setInactivateDialogOpen(true);
        break;
      case 'deleteAbsolute':
        setOrderToDeleteAbsolute(row);
        setDeleteAbsoluteDialogOpen(true);
        break;
    }
    
    handleCloseContextMenu();
  };

  return (
    <>
      <MaterialReactTable table={table} />
      
      {/* NUEVO: Menú Contextual */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        slotProps={{
          paper: {
            sx: {
              minWidth: 180,
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid #e0e0e0',
            }
          }
        }}
      >
        <MenuItem 
          onClick={() => handleContextAction('continue')}
          disabled={!contextMenu?.row}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Continue Order</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleContextAction('finish')}
          disabled={contextMenu?.row?.status === 'finished'}
        >
          <ListItemIcon>
            <CheckIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>
            {contextMenu?.row?.status === 'finished' ? 'Already Finished' : 'Finish Order'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleContextAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit Order</ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => handleContextAction('inactivate')}
          sx={{ color: 'warning.main' }}
        >
          <ListItemIcon>
            <BlockIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Inactivate Order</ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => handleContextAction('deleteAbsolute')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Order (Absolute)</ListItemText>
        </MenuItem>
      </Menu>

      {editModalOpen && (
        <EditOrderDialog
          open={editModalOpen}
          order={orderToEdit}
          onClose={handleCloseEditModal}
          onSave={(order) => handleSaveEdit(order.key, order)}
          onChange={handleChangeOrder}
        />
      )}
      <FinishOrderDialog
        open={finishModalOpen}
        loading={finishLoading}
        image={finishImage}
        onClose={() => setFinishModalOpen(false)}
        onOk={handleFinishOrder}
        onImageChange={setFinishImage}
      />
      <PaymentDialog
        open={paymentDialogOpen}
        expense={paymentOrder?.expense ?? 0}
        income={paymentOrder?.income ?? 0}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={handleConfirmPayment}
      />
      <CalendarDialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onDaySelect={(date: Date) => {
          // Cambia la semana y el filtro de día
          setWeek(getWeekOfYear(date));
          setWeekdayFilter(date.toLocaleDateString('en-US', { weekday: 'long' }));
          setCalendarOpen(false);
        }}
      />

      {/* Diálogo para inactivar */}
      {inactivateDialogOpen && (
        <DeleteOrderDialog
          open={inactivateDialogOpen}
          onClose={() => {
            setInactivateDialogOpen(false);
            setOrderToInactivate(null);
          }}
          onConfirm={async () => {
            if (!orderToInactivate) return;
            const result = await deleteOrder(orderToInactivate.id);
            if (result.success) {
              enqueueSnackbar('Order inactivated', { variant: 'success' });
              loadData();
            } else {
              enqueueSnackbar(result.errorMessage || 'Error inactivating order', { variant: 'error' });
            }
            setInactivateDialogOpen(false);
            setOrderToInactivate(null);
          }}
          orderRef={orderToInactivate?.key_ref}
          orderDate={orderToInactivate?.dateReference}
          title="Inactivate Order"
          description="This will inactivate the order. You can restore it later if needed."
          confirmText="Inactivate"
          icon={<BlockIcon color="warning" />}
        />
      )}

      {/* Diálogo para eliminar absoluto */}
      {deleteAbsoluteDialogOpen && (
        <DeleteOrderDialog
          open={deleteAbsoluteDialogOpen}
          onClose={() => {
            setDeleteAbsoluteDialogOpen(false);
            setOrderToDeleteAbsolute(null);
          }}
          onConfirm={async () => {
            if (!orderToDeleteAbsolute) return;
            const result = await deleteOrderAbsolute(orderToDeleteAbsolute.id);
            if (result.success) {
              enqueueSnackbar('Order deleted permanently', { variant: 'success' });
              loadData();
            } else {
              enqueueSnackbar(result.errorMessage || 'Error deleting order', { variant: 'error' });
            }
            setDeleteAbsoluteDialogOpen(false);
            setOrderToDeleteAbsolute(null);
          }}
          orderRef={orderToDeleteAbsolute?.key_ref}
          orderDate={orderToDeleteAbsolute?.dateReference}
          title="Delete Order Permanently"
          description="This will permanently delete the order. This action cannot be undone."
          confirmText="Delete"
          icon={<DeleteIcon color="error" />}
        />
      )}
    </>
  );
};

export default Example;