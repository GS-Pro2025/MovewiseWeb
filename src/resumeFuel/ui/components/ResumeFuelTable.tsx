/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Download, Inbox, Eye, X, Image as ImageIcon, Truck as TruckIcon, MapPin, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { WeeklyFuelDataResponse, CostFuelWithOrders } from '../../domain/CostFuelWithOrders';
import { generateCsv, download, mkConfig } from 'export-to-csv';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  format?: (value: any, row?: CostFuelWithOrders) => React.ReactNode;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc' | null;
}

// Modal para preview de imágenes
const ImagePreviewModal: React.FC<{ 
  imageUrl: string; 
  onClose: () => void;
  fuelData?: { cost_gl: number; fuel_qty: number; cost_fuel: number; date: string };
}> = ({ imageUrl, onClose, fuelData }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-lg"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <ImageIcon size={24} />
            <div>
              <h3 className="font-bold text-lg">Fuel Receipt</h3>
              {fuelData && (
                <p className="text-sm text-blue-100">
                  ${fuelData.cost_gl.toFixed(2)}/gl • {fuelData.fuel_qty.toFixed(1)}gl • Total: ${fuelData.cost_fuel.toFixed(2)}
                  {fuelData.date && ` • ${new Date(fuelData.date).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Image */}
        <div className="p-6 bg-gray-50 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt="Fuel receipt" 
            className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="16">Image not available</text></svg>';
            }}
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-3 text-center">
          <p className="text-xs text-gray-600">Click outside to close</p>
        </div>
      </div>
    </div>
  );
};

const columns: Column[] = [
  { id: 'expand', label: '', minWidth: 50, align: 'center', sortable: false },
  { id: 'id_fuel', label: 'Fuel ID', minWidth: 80, sortable: true, align: 'center' },
  { id: 'date', label: 'Date', minWidth: 110, sortable: true },
  { id: 'truck', label: 'Truck', minWidth: 160, sortable: true,
    format: (_v, row) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
          <TruckIcon size={14} className="text-white" />
        </div>
        <div>
          <div className="font-semibold text-xs" style={{ color: '#0B2863' }}>
            {row?.truck?.number_truck || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">{row?.truck?.type}</div>
        </div>
      </div>
    )
  },
  { id: 'cost_gl', label: 'Cost/Gallon', minWidth: 110, sortable: true, align: 'right',
    format: (value) => (
      <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>
        ${(value || 0).toFixed(2)}
      </span>
    )
  },
  { id: 'fuel_qty', label: 'Fuel Qty', minWidth: 100, sortable: true, align: 'right',
    format: (value) => (
      <span className="text-sm">{(value || 0).toFixed(1)} gl</span>
    )
  },
  { id: 'distance', label: 'Distance', minWidth: 100, sortable: true, align: 'right',
    format: (value) => (
      <span className="text-sm flex items-center justify-end gap-1">
        <MapPin size={12} className="text-gray-500" />
        {(value || 0).toLocaleString()} mi
      </span>
    )
  },
  { id: 'cost_fuel', label: 'Total Cost', minWidth: 120, sortable: true, align: 'right',
    format: (value) => (
      <span className="font-bold text-sm" style={{ color: '#0B2863' }}>
        ${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    )
  },
  { id: 'orders_count', label: 'Orders', minWidth: 80, sortable: true, align: 'center',
    format: (value) => (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100" style={{ color: '#0B2863' }}>
        {value || 0}
      </span>
    )
  },
  { id: 'image_url', label: 'Receipt', minWidth: 80, align: 'center', sortable: false,
    format: (value) => (
      value ? (
        <span className="inline-flex items-center text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
          <ImageIcon size={12} className="mr-1" />
          Yes
        </span>
      ) : (
        <span className="text-xs text-gray-400">No</span>
      )
    )
  },
];

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#0B2863' }}></div>
);

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const sortData = (data: CostFuelWithOrders[], sortConfig: SortConfig): CostFuelWithOrders[] => {
  if (!sortConfig.key || !sortConfig.direction) return data;

  return [...data].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'id_fuel':
        aValue = a.id_fuel; bValue = b.id_fuel; break;
      case 'date':
        aValue = new Date(a.date).getTime(); bValue = new Date(b.date).getTime(); break;
      case 'truck':
        aValue = a.truck?.number_truck || ''; bValue = b.truck?.number_truck || ''; break;
      case 'cost_gl':
        aValue = a.cost_gl; bValue = b.cost_gl; break;
      case 'fuel_qty':
        aValue = a.fuel_qty; bValue = b.fuel_qty; break;
      case 'distance':
        aValue = a.distance; bValue = b.distance; break;
      case 'cost_fuel':
        aValue = a.cost_fuel; bValue = b.cost_fuel; break;
      case 'orders_count':
        aValue = a.orders_count; bValue = b.orders_count; break;
      default:
        aValue = getNestedValue(a, sortConfig.key || '');
        bValue = getNestedValue(b, sortConfig.key || '');
    }

    if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

    const aNum = Number(aValue);
    const bNum = Number(bValue);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
};

const SortIcon: React.FC<{ column: Column; sortConfig: SortConfig }> = ({ column, sortConfig }) => {
  if (!column.sortable) return null;
  const isActive = sortConfig.key === column.id;
  const iconColor = isActive ? '#0B2863' : '#9CA3AF';
  if (isActive) return sortConfig.direction === 'asc' ? <ArrowUp size={12} style={{ color: iconColor }} /> : <ArrowDown size={12} style={{ color: iconColor }} />;
  return <ArrowUpDown size={12} style={{ color: iconColor }} />;
};

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

export const ResumeFuelTable: React.FC<{
  data: WeeklyFuelDataResponse | null;
  isLoading: boolean;
}> = ({ data, isLoading }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [previewImage, setPreviewImage] = useState<{ url: string; fuelData?: any } | null>(null);

  // Extraer todos los cost_fuels de todas las semanas
  const allCostFuels = useMemo(() => {
    if (!data?.data) return [];
    return data.data.flatMap(weekData => weekData.cost_fuels);
  }, [data]);

  const sortedData = useMemo(() => sortData(allCostFuels, sortConfig), [allCostFuels, sortConfig]);

  const handleExpandClick = useCallback((rowId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) newSet.delete(rowId); else newSet.add(rowId);
      return newSet;
    });
  }, []);

  const handleSort = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column || !column.sortable) return;
    setSortConfig(prev => {
      if (prev.key === columnId) {
        if (prev.direction === 'asc') return { key: columnId, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key: columnId, direction: 'asc' };
    });
  }, []);

  const handleRowSelect = useCallback((rowId: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) newSet.delete(rowId); else newSet.add(rowId);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) setSelectedRows(new Set(sortedData.map(r => r.id_fuel)));
    else setSelectedRows(new Set());
  }, [sortedData]);

  const isSelected = useCallback((rowId: number) => selectedRows.has(rowId), [selectedRows]);
  const isAllSelected = sortedData.length > 0 && selectedRows.size === sortedData.length;

  const handleExportData = useCallback(() => {
    if (!sortedData || sortedData.length === 0) return;
    const rowData = sortedData.flatMap(costFuel => {
      if (costFuel.order_cost_fuels.length === 0) {
        return [{
          fuel_id: costFuel.id_fuel,
          fecha: costFuel.date,
          camion: costFuel.truck?.number_truck || '',
          tipo_camion: costFuel.truck?.type || '',
          categoria: costFuel.truck?.category || '',
          costo_galon: costFuel.cost_gl,
          cantidad_combustible: costFuel.fuel_qty,
          distancia: costFuel.distance,
          costo_total: costFuel.cost_fuel,
          tiene_recibo: costFuel.image_url ? 'Sí' : 'No',
          orden_ref: '',
          cliente: '',
          ubicacion_orden: '',
          fecha_orden: '',
        }];
      }
      return costFuel.order_cost_fuels.map(order => ({
        fuel_id: costFuel.id_fuel,
        fecha: costFuel.date,
        camion: costFuel.truck?.number_truck || '',
        tipo_camion: costFuel.truck?.type || '',
        categoria: costFuel.truck?.category || '',
        costo_galon: costFuel.cost_gl,
        cantidad_combustible: costFuel.fuel_qty,
        distancia: costFuel.distance,
        costo_total: costFuel.cost_fuel,
        tiene_recibo: costFuel.image_url ? 'Sí' : 'No',
        orden_ref: order.order_key_ref,
        cliente: order.client_name,
        ubicacion_orden: order.order_location || '',
        fecha_orden: order.order_date,
        costo_distribuido: order.cost_fuel_distributed,
        combustible_distribuido: order.fuel_qty_distributed,
        distancia_distribuida: order.distance_distributed,
      }));
    });
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  }, [sortedData]);

  const handleExportSelected = useCallback(() => {
    const selectedCostFuels = sortedData.filter(cf => selectedRows.has(cf.id_fuel));
    const rowData = selectedCostFuels.flatMap(costFuel => {
      if (costFuel.order_cost_fuels.length === 0) {
        return [{
          fuel_id: costFuel.id_fuel,
          fecha: costFuel.date,
          camion: costFuel.truck?.number_truck || '',
          tipo_camion: costFuel.truck?.type || '',
          categoria: costFuel.truck?.category || '',
          costo_galon: costFuel.cost_gl,
          cantidad_combustible: costFuel.fuel_qty,
          distancia: costFuel.distance,
          costo_total: costFuel.cost_fuel,
          tiene_recibo: costFuel.image_url ? 'Sí' : 'No',
          orden_ref: '',
          cliente: '',
          ubicacion_orden: '',
          fecha_orden: '',
        }];
      }
      return costFuel.order_cost_fuels.map(order => ({
        fuel_id: costFuel.id_fuel,
        fecha: costFuel.date,
        camion: costFuel.truck?.number_truck || '',
        tipo_camion: costFuel.truck?.type || '',
        categoria: costFuel.truck?.category || '',
        costo_galon: costFuel.cost_gl,
        cantidad_combustible: costFuel.fuel_qty,
        distancia: costFuel.distance,
        costo_total: costFuel.cost_fuel,
        tiene_recibo: costFuel.image_url ? 'Sí' : 'No',
        orden_ref: order.order_key_ref,
        cliente: order.client_name,
        ubicacion_orden: order.order_location || '',
        fecha_orden: order.order_date,
        costo_distribuido: order.cost_fuel_distributed,
        combustible_distribuido: order.fuel_qty_distributed,
        distancia_distribuida: order.distance_distributed,
      }));
    });
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  }, [sortedData, selectedRows]);

  const getColumnValue = (row: CostFuelWithOrders, columnId: string): any => {
    switch (columnId) {
      case 'truck': return row.truck?.number_truck || '';
      default: return getNestedValue(row, columnId);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md border overflow-hidden" style={{ borderColor: '#0B2863' }}>
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3" style={{ borderColor: '#0B2863' }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold" style={{ color: '#0B2863' }}>Fuel Cost Records</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportData}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#0B2863', color: 'white' }}
                disabled={!sortedData || sortedData.length === 0}
              >
                <Download size={14} className="inline mr-1" />
                Export All
              </button>
              <button
                onClick={handleExportSelected}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:shadow-sm border disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: '#0B2863', color: '#0B2863' }}
                disabled={selectedRows.size === 0}
              >
                <Download size={14} className="inline mr-1" />
                Export Selected ({selectedRows.size})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
          <table className="w-full">
            <thead className="sticky top-0 z-10 text-white" style={{ backgroundColor: '#0B2863' }}>
              <tr>
                <th className="px-3 py-2 text-left">
                  <input 
                    type="checkbox" 
                    className="rounded border-2 border-white w-3.5 h-3.5" 
                    checked={isAllSelected} 
                    onChange={(e) => handleSelectAll(e.target.checked)} 
                    disabled={sortedData.length === 0} 
                  />
                </th>
                {columns.map((column, index) => (
                  <th 
                    key={`hdr-${column.id}-${index}`} 
                    className={`px-3 py-2 text-${column.align || 'left'} font-bold text-xs whitespace-nowrap ${column.sortable ? 'cursor-pointer hover:bg-blue-800 transition-colors duration-200' : ''}`} 
                    style={{ minWidth: column.minWidth }} 
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{column.label}</span>
                      <SortIcon column={column} sortConfig={sortConfig} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-10">
                    <div className="flex flex-col items-center space-y-3">
                      <LoadingSpinner />
                      <span className="text-gray-500 text-sm">Loading fuel data...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="mb-2">
                        <Inbox size={64} style={{ color: '#0B2863', opacity: 0.6 }} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold mb-1" style={{ color: '#0B2863' }}>No Fuel Data Found</h3>
                        <p className="text-gray-500 text-sm">Try selecting a different week or year</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {sortedData.map((row, rowIndex) => {
                    const rowId = row.id_fuel;
                    const isRowSelected = isSelected(rowId);
                    const isExpanded = expandedRows.has(rowId);
                    return (
                      <React.Fragment key={rowId}>
                        <tr 
                          className={`transition-all duration-200 hover:shadow-sm cursor-pointer ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isRowSelected ? 'ring-1 ring-blue-200' : ''}`} 
                          style={{ backgroundColor: isRowSelected ? 'rgba(11, 40, 99, 0.08)' : undefined }}
                        >
                          <td className="px-3 py-2">
                            <input 
                              type="checkbox" 
                              className="rounded border-2 w-3.5 h-3.5" 
                              style={{ borderColor: '#0B2863' }} 
                              checked={isRowSelected} 
                              onChange={() => handleRowSelect(rowId)} 
                              onClick={(e) => e.stopPropagation()} 
                            />
                          </td>

                          {columns.map((column) => {
                            const value = getColumnValue(row, column.id);
                            if (column.id === 'expand') {
                              return (
                                <td key={`${rowId}-${column.id}`} className="px-3 py-2 text-center" style={{ minWidth: column.minWidth }}>
                                  <button 
                                    onClick={() => handleExpandClick(rowId)} 
                                    className="text-gray-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
                                    title={`${isExpanded ? 'Hide' : 'Show'} ${row.orders_count} order(s)`}
                                  >
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                  </button>
                                </td>
                              );
                            }
                            return (
                              <td 
                                key={`${rowId}-${column.id}`} 
                                className={`px-3 py-2 text-${column.align || 'left'}`} 
                                style={{ minWidth: column.minWidth }}
                              >
                                {column.format ? column.format(value, row) : value}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Expanded row showing related orders */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={columns.length + 1} className="px-0 py-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                              <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-bold text-base flex items-center gap-2" style={{ color: '#0B2863' }}>
                                    <Package size={18} />
                                    Related Orders ({row.orders_count})
                                  </h4>
                                  {row.image_url && (
                                    <button
                                      onClick={() => setPreviewImage({ 
                                        url: row.image_url!, 
                                        fuelData: { 
                                          cost_gl: row.cost_gl, 
                                          fuel_qty: row.fuel_qty, 
                                          cost_fuel: row.cost_fuel,
                                          date: row.date
                                        }
                                      })}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
                                    >
                                      <Eye size={16} />
                                      View Receipt
                                    </button>
                                  )}
                                </div>
                                
                                {row.order_cost_fuels && row.order_cost_fuels.length > 0 ? (
                                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <table className="w-full">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Order Ref</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Client</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Location</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Order Date</th>
                                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Cost Distributed</th>
                                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Fuel Distributed</th>
                                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Distance</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {row.order_cost_fuels.map((order, idx) => (
                                          <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-3">
                                              <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>
                                                {order.order_key_ref}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{order.client_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{order.order_location || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                              {new Date(order.order_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                              <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>
                                                ${order.cost_fuel_distributed.toFixed(2)}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                              {order.fuel_qty_distributed.toFixed(1)} gl
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                              {order.distance_distributed.toLocaleString()} mi
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                                    <Package size={48} className="mx-auto mb-2 text-gray-400" />
                                    <p className="text-gray-500 text-sm">No orders associated with this fuel cost</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-white border-t px-4 py-3 flex items-center justify-between" style={{ borderColor: '#0B2863' }}>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-700">
              Total: {sortedData.length} fuel records | Selected: {selectedRows.size}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-700">
              Showing {sortedData.length} results
            </span>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal 
          imageUrl={previewImage.url} 
          fuelData={previewImage.fuelData}
          onClose={() => setPreviewImage(null)} 
        />
      )}
    </>
  );
};

export default ResumeFuelTable;
