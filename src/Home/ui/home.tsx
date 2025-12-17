/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

// Components
import { TableFilters } from './TableFilters';
import { TableToolbar } from './TableToolbar';
import { DataTable } from './DataTable';
import { ContextMenu } from './ContextMenu';
import EditOrderDialog from './editOrderModal';
import FinishOrderDialog from './FinishOrderDialog';
import PaymentDialog from './PaymentDialog';
import DeleteOrderDialog from './deleteOrderDialog';
import CalendarDialog from './calendarDialog';
import AssignOrderToCostFuelDialog from '../../addFuelCostToOrder/ui/AssignOrderToCostFuelDialog';

// Services
import { fetchOrdersReport } from '../data/repositoryOrdersReport';
import { finishOrderRepo, updateOrder, deleteOrder, deleteOrderAbsolute } from '../data/repositoryOrders';
import {
  fetchCountries,
  fetchStates,
  fetchCities,
} from "../../createOrder/repository/repositoryLocation";
// Utils
import { exportToExcel, exportToPDF } from './exportUtils';

// Types
import { UpdateOrderData } from '../domain/ModelOrderUpdate';
import { TableData } from '../domain/TableData';

// Icons
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';

// Utility functions
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

// Helper function to normalize status to expected union type
const normalizeStatus = (status: string): "finished" | "pending" | "inactive" => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'finished':
    case 'completed':
    case 'done':
      return 'finished';
    case 'inactive':
    case 'cancelled':
    case 'canceled':
      return 'inactive';
    case 'pending':
    case 'active':
    case 'in-progress':
    case 'in progress':
    default:
      return 'pending';
  }
};

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

// Type for the normalized TableData with proper status type
type NormalizedTableData = Omit<TableData, 'status'> & {
  status: "finished" | "pending" | "inactive";
  country?: string;
  state?: string; 
  city?: string;
};

const OrdersTable: React.FC = () => {
  // State
  const [data, setData] = useState<NormalizedTableData[]>([]);
  const [filteredData, setFilteredData] = useState<NormalizedTableData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRows, setSelectedRows] = useState<NormalizedTableData[]>([]);
  
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    return getWeekOfYear(now);
  });
  
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
  const [totalRows, setTotalRows] = useState(0);
  
  const currentYear = new Date().getFullYear();
  const weekRange = useMemo(() => getWeekRange(currentYear, week), [currentYear, week]);
  
  // Filters
  const [weekdayFilter, setWeekdayFilter] = useState<string>('');
  // Estados para la nueva lógica de ubicación
  const [countries, setCountries] = useState<{ country: string }[]>([]);
  const [states, setStates] = useState<{ name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [locationStep, setLocationStep] = useState<"country" | "state" | "city">("country");

  // Crear el string de ubicación compuesto
  const locationString = useMemo(() => {
    if (!country) return "";
    let loc = country;
    if (state) loc += `, ${state}`;
    if (city) loc += `, ${city}`;
    return loc;
  }, [country, state, city]);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [finishImage, setFinishImage] = useState<File | null>(null);
  const [finishLoading, setFinishLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<NormalizedTableData | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<UpdateOrderData | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [inactivateDialogOpen, setInactivateDialogOpen] = useState(false);
  const [orderToInactivate, setOrderToInactivate] = useState<NormalizedTableData | null>(null);
  const [deleteAbsoluteDialogOpen, setDeleteAbsoluteDialogOpen] = useState(false);
  const [orderToDeleteAbsolute, setOrderToDeleteAbsolute] = useState<NormalizedTableData | null>(null);
  const [dispatchTicketDialogOpen, setDispatchTicketDialogOpen] = useState(false);
  const [dispatchTicketUrl, setDispatchTicketUrl] = useState<string | null>(null);
  const [assignOrderToCostFuelDialogOpen, setAssignOrderToCostFuelDialogOpen] = useState(false);
  const [selectedOrderForFuel, setSelectedOrderForFuel] = useState<NormalizedTableData | null>(null);

  // Context menu - agregar estado para diferenciar el origen
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    row: NormalizedTableData | null;
  } | null>(null);

  // Hooks
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Nuevos estados para búsqueda global
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isGlobalSearchActive, setIsGlobalSearchActive] = useState<boolean>(false);
  const [globalSearchLoading, setGlobalSearchLoading] = useState<boolean>(false);

  // Load data function
  const loadData = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);
      
      // Si hay searchTerm, es búsqueda global, si no, usar filtros normales
      const response = await fetchOrdersReport(
        pagination.pageIndex + 1,
        searchTerm ? 1 : week, // Si hay búsqueda, mandar week dummy
        searchTerm ? 2025 : currentYear, // Si hay búsqueda, mandar year dummy
        pagination.pageSize,
        searchTerm // Solo se usa si hay searchTerm
      );
      
      const mappedData: NormalizedTableData[] = response.results.map((item) => {
        const dateParts = item.date.split('-');
        const date = new Date(
          Number(dateParts[0]),
          Number(dateParts[1]) - 1,
          Number(dateParts[2])
        );
        
        const calculatedWeek = getWeekOfYear(date);
        
        return {
          id: item.key,
          status: normalizeStatus(item.status),
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
          week: calculatedWeek,
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
    } catch (error) {
      console.error('Error loading data:', error);
      enqueueSnackbar('Error loading data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pagination, week, currentYear, isGlobalSearchActive]); // Agregar isGlobalSearchActive como dependencia

  // Función separada para búsqueda global
  const handleGlobalSearch = useCallback(async () => {
    if (!globalSearch.trim()) {
      // Si no hay término de búsqueda, volver a datos normales
      setIsGlobalSearchActive(false);
      setGlobalSearchLoading(false);
      await loadData(); // Cargar datos normales sin búsqueda
      return;
    }

    try {
      setGlobalSearchLoading(true);
      setIsGlobalSearchActive(true);
      
      // Reset pagination cuando se hace búsqueda global
      setPagination({ pageIndex: 0, pageSize: 100 });
      
      await loadData(globalSearch.trim());
      enqueueSnackbar(`Search completed for "${globalSearch}"`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error performing search', { variant: 'error' });
      console.error('Error searching:', error);
    } finally {
      setGlobalSearchLoading(false);
    }
  }, [globalSearch, loadData]);

  // Función para limpiar búsqueda global
  const handleClearGlobalSearch = useCallback(async () => {
    setGlobalSearch('');
    setIsGlobalSearchActive(false);
    setGlobalSearchLoading(false);
    
    // Reset pagination cuando se limpia búsqueda
    setPagination({ pageIndex: 0, pageSize: 100 });
    
    await loadData(); // Recargar datos normales
  }, [loadData]);

  // Effects - Mejorar la lógica
  useEffect(() => {
    // Solo cargar datos automáticamente si NO hay búsqueda global activa
    if (!isGlobalSearchActive) {
      loadData();
    }
  }, [pagination, week, currentYear]); // Remover loadData de las dependencias para evitar loops

  useEffect(() => {
    if (!isGlobalSearchActive) {
      loadData();
    }
  }, [loadData, isGlobalSearchActive]);

  // Modificar el filtrado de datos para manejar búsqueda global
  useEffect(() => {
    if (isGlobalSearchActive) {
      setFilteredData(data);
    } else {
      let filtered = data.filter((item) => item.week === week);
      if (weekdayFilter) {
        filtered = filtered.filter((item) => item.weekday === weekdayFilter);
      }
      if (locationString) { // locationFilter -> locationString
        filtered = filtered.filter((item) => {
          const itemLocation = [item.country, item.state, item.city].filter(Boolean).join(", ");
          return itemLocation.toLowerCase().includes(locationString.toLowerCase());
        });
      }
      setFilteredData(filtered);
    }
  }, [data, week, weekdayFilter, locationString, isGlobalSearchActive]); // locationFilter -> locationString

  // Cargar países al iniciar
  useEffect(() => {
    fetchCountries().then((countries) => {
      setCountries(countries.map((c) => ({ country: c.name })));
    });
  }, []);

  // Cargar estados cuando se seleccione un país
  useEffect(() => {
    if (country) {
      fetchStates(country).then(setStates);
      setState("");
      setCities([]);
      setCity("");
      setLocationStep("state");
    }
  }, [country]);

  // Cargar ciudades cuando se seleccione un estado
  useEffect(() => {
    if (country && state) {
      fetchCities(country, state).then(setCities);
      setCity("");
      setLocationStep("city");
    }
  }, [state, country]);

  // Resetear todo si se borra el input
  useEffect(() => {
    if (!country) {
      setState("");
      setCity("");
      setStates([]);
      setCities([]);
      setLocationStep("country");
    } else if (!state) {
      setCity("");
      setCities([]);
      setLocationStep("state");
    } else if (!city) {
      setLocationStep("city");
    }
  }, [country, state, city]);

  // Event handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, pageIndex: newPage }));
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setPagination({ pageIndex: 0, pageSize: newRowsPerPage });
  };

  const handleRowSelect = (row: NormalizedTableData) => {
    setSelectedRows(prev => {
      const isSelected = prev.some(selected => selected.id === row.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== row.id);
      } else {
        return [...prev, row];
      }
    });
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedRows([...filteredData]);
    } else {
      setSelectedRows([]);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, row: NormalizedTableData) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      row,
    });
  };

  // Nueva función para manejar el botón de tres puntos
  const handleActionsMenuClick = (event: React.MouseEvent, row: NormalizedTableData) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Usar las coordenadas del botón para posicionar el menú
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      mouseX: rect.right,
      mouseY: rect.top,
      row,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleContinueOrder = (order: NormalizedTableData) => {
    const orderData = mapTableDataToCreateOrderModel(order);
    navigate('/app/create-daily', { state: { orderToContinue: orderData } });
  };

  const handleFinishOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setFinishModalOpen(true);
    setFinishImage(null);
  };

  const confirmFinishOrder = async () => {
    if (!selectedOrderId) return;
    setFinishLoading(true);
    try {
      await finishOrderRepo(selectedOrderId, finishImage || undefined);
      enqueueSnackbar('Order finished', { variant: 'success' });
      setFinishModalOpen(false);
      setFinishImage(null);
      setSelectedOrderId(null);
      loadData();
    } catch (error) {
      enqueueSnackbar('Sorry there was an error finishing the order', { variant: 'error' });
      console.error('Error finishing order:', error);
    }
    setFinishLoading(false);
  };

  const handleEditOrder = (order: NormalizedTableData) => {
    setOrderToEdit(mapTableDataToUpdateOrderData(order));
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (key: string, order: UpdateOrderData) => {
    const result = await updateOrder(key, order);
    if (result.success) {
      enqueueSnackbar('Order updated', { variant: 'success' });
      loadData();
    } else {
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

  const handleInactivateOrder = (order: NormalizedTableData) => {
    setOrderToInactivate(order);
    setInactivateDialogOpen(true);
  };

  const handleDeleteOrder = (order: NormalizedTableData) => {
    setOrderToDeleteAbsolute(order);
    setDeleteAbsoluteDialogOpen(true);
  };

  const handleViewDispatchTicket = (order: TableData) => {
    const url = (order as any).dispatch_ticket as string | undefined;
    if (url) {
      setDispatchTicketUrl(url);
      setDispatchTicketDialogOpen(true);
    } else {
      enqueueSnackbar('No dispatch ticket available for this order.', { variant: 'info' });
    }
  };

  const handleAddFuelCost = (order: NormalizedTableData) => {
    setSelectedOrderForFuel(order);
    setAssignOrderToCostFuelDialogOpen(true);
  };

  // Export handlers
  const handleExportExcel = (data: NormalizedTableData[], filename: string) => {
    // Convert to original TableData format for export
    const exportData = data.map(item => ({ ...item } as TableData));
    exportToExcel(exportData, filename);
  };

  const handleExportPDF = (data: NormalizedTableData[], filename: string) => {
    // Convert to original TableData format for export
    const exportData = data.map(item => ({ ...item } as TableData));
    exportToPDF(exportData, filename);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Filters with Statistics */}
      <TableFilters
        week={week}
        weekdayFilter={weekdayFilter}
        locationFilter={""} // MANTENER para compatibilidad pero no se usa
        locations={[]} // MANTENER para compatibilidad pero no se usa
        weekRange={weekRange}
        onWeekChange={setWeek}
        onWeekdayChange={setWeekdayFilter}
        onLocationChange={() => {}} // MANTENER para compatibilidad pero no se usa
        onCalendarOpen={() => setCalendarOpen(true)}
        data={data}
        filteredData={filteredData}
        globalSearch={globalSearch}
        onGlobalSearchChange={setGlobalSearch}
        onGlobalSearchSubmit={handleGlobalSearch}
        onGlobalSearchClear={handleClearGlobalSearch} 
        globalSearchLoading={globalSearchLoading}
        isGlobalSearchActive={isGlobalSearchActive}
        // AGREGAR estas nuevas props:
        locationString={locationString}
        country={country}
        setCountry={setCountry}
        state={state}
        setState={setState}
        city={city}
        setCity={setCity}
        locationStep={locationStep}
        setLocationStep={setLocationStep}
        countries={countries}
        states={states}
        cities={cities}
        setCities={setCities}
        setStates={setStates}
      />

      {/* Toolbar */}
      <TableToolbar
        data={filteredData}
        selectedRows={selectedRows}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
      />

      {/* Data Table */}
      <DataTable
        data={filteredData}
        loading={loading}
        page={pagination.pageIndex}
        rowsPerPage={pagination.pageSize}
        totalRows={totalRows}
        selectedRows={selectedRows}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        onFinishOrder={handleFinishOrder}
        onContextMenu={handleContextMenu}
        onActionsMenuClick={handleActionsMenuClick} // Nueva prop
      />

      {/* Context Menu */}
      <ContextMenu
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : null}
        row={contextMenu?.row || null}
        onClose={handleCloseContextMenu}
        onContinueOrder={handleContinueOrder}
        onFinishOrder={handleFinishOrder}
        onEditOrder={handleEditOrder}
        onInactivateOrder={handleInactivateOrder}
        onDeleteOrder={handleDeleteOrder}
        onViewDispatchTicket={handleViewDispatchTicket}
        onAddFuelCost={handleAddFuelCost}
      />

      {/* Modals */}
      {editModalOpen && (
        <EditOrderDialog
          open={editModalOpen}
          order={orderToEdit}
          onClose={() => setEditModalOpen(false)}
          onSave={(order) => handleSaveEdit(order.key, order)}
          onChange={handleChangeOrder}
        />
      )}

      <FinishOrderDialog
        open={finishModalOpen}
        loading={finishLoading}
        image={finishImage}
        onClose={() => setFinishModalOpen(false)}
        onOk={confirmFinishOrder}
        onImageChange={setFinishImage}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        expense={paymentOrder?.expense ?? 0}
        income={paymentOrder?.income ?? 0}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={async (expense: number, income: number) => {
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
          loadData();
          setPaymentDialogOpen(false);
          setPaymentOrder(null);
        }}
      />

      <CalendarDialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onDaySelect={(date: Date) => {
          setWeek(getWeekOfYear(date));
          setWeekdayFilter(date.toLocaleDateString('en-US', { weekday: 'long' }));
          setCalendarOpen(false);
        }}
      />

      {/* Delete Dialogs */}
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

      {/* Dispatch Ticket Modal */}
      <Dialog
        open={dispatchTicketDialogOpen}
        onClose={() => setDispatchTicketDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Dispatch Ticket</DialogTitle>
        <DialogContent>
          {dispatchTicketUrl ? (
            <img
              src={dispatchTicketUrl}
              alt="Dispatch Ticket"
              style={{ width: '100%', borderRadius: 12, marginTop: 8 }}
            />
          ) : (
            <div style={{ padding: 12 }}>No dispatch ticket available.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Order to Fuel Cost Dialog */}
      <AssignOrderToCostFuelDialog
        open={assignOrderToCostFuelDialogOpen}
        onClose={() => {
          setAssignOrderToCostFuelDialogOpen(false);
          setSelectedOrderForFuel(null);
        }}
        orderKey={selectedOrderForFuel?.id || ''}
        orderRef={selectedOrderForFuel?.key_ref || ''}
        onSuccess={() => {
          // Recargar datos después de asignar la orden
          loadData();
        }}
      />
    </Box>
  );
};

export default OrdersTable;