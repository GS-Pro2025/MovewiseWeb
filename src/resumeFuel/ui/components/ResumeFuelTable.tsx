/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Download, Inbox, Eye, X, Image as ImageIcon, Truck as TruckIcon, Fuel, MapPin } from 'lucide-react';
import { Order, PaginatedOrderResult } from '../../domain/OrderModel';
import { generateCsv, download, mkConfig } from 'export-to-csv';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  copyable?: boolean;
  format?: (value: any, row?: Order) => React.ReactNode;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc' | null;
}

// Modal para preview de imágenes
const ImagePreviewModal: React.FC<{ 
  imageUrl: string; 
  onClose: () => void;
  fuelData?: { cost_gl: number; fuel_qty: number; cost_fuel: number };
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
  { id: 'expand', label: '', minWidth: 40, align: 'center', sortable: false },
  { id: 'actions', label: 'Actions', minWidth: 90, align: 'center', sortable: false },
  { id: 'key_ref', label: 'Reference', minWidth: 140, sortable: true, copyable: true },
  { id: 'date', label: 'Date', minWidth: 110, sortable: true },
  { id: 'state_usa', label: 'Location', minWidth: 180, sortable: true },
  { id: 'status', label: 'Status', minWidth: 100, sortable: true },
  { id: 'person', label: 'Driver', minWidth: 160, sortable: true,
    format: (_v, row) => {
      return <span className="text-sm">{row?.person?.first_name} {row?.person?.last_name}</span>;
    }
  },
  { id: 'distance', label: 'Distance (mi)', minWidth: 120, sortable: true, align: 'right',
    format: (value) => {
      return <span className="text-sm">{value?.toLocaleString('en-US') || 0}</span>;
    }
  },
  { id: 'weight', label: 'Weight (lb)', minWidth: 120, sortable: true, align: 'right',
    format: (value) => {
      const weightValue = typeof value === 'string' ? parseFloat(value) : value;
      return <span className="text-sm">{(weightValue || 0).toLocaleString('en-US')}</span>;
    }
  },
  { id: 'fuelCost', label: 'Cost/Gallon', minWidth: 120, sortable: true, align: 'right',
    format: (_v, row) => {
      const fuelCost = row?.fuelCost?.[0];
      const cost = fuelCost?.cost_gl || 0;
      return <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    }
  },
  { id: 'fuel_qty', label: 'Fuel Qty (gl)', minWidth: 120, sortable: true, align: 'right',
    format: (_v, row) => {
      const fuelCost = row?.fuelCost?.[0];
      const qty = fuelCost?.fuel_qty || 0;
      return <span className="text-sm">{qty.toLocaleString('en-US')} gl</span>;
    }
  },
  { id: 'total_fuel_cost', label: 'Total Fuel Cost', minWidth: 140, sortable: true, align: 'right',
    format: (_v, row) => {
      const totalCost = row?.fuelCost?.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0) || 0;
      return <span className="font-bold text-sm" style={{ color: '#0B2863' }}>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    }
  },
];

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#0B2863' }}></div>
);

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const sortData = (data: Order[], sortConfig: SortConfig): Order[] => {
  if (!sortConfig.key || !sortConfig.direction) return data;

  return [...data].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'key_ref':
        aValue = a.key_ref; bValue = b.key_ref; break;
      case 'date':
        aValue = new Date(a.date).getTime(); bValue = new Date(b.date).getTime(); break;
      case 'state_usa':
        aValue = a.state_usa; bValue = b.state_usa; break;
      case 'status':
        aValue = a.status; bValue = b.status; break;
      case 'person':
        aValue = `${a.person?.first_name} ${a.person?.last_name}`;
        bValue = `${b.person?.first_name} ${b.person?.last_name}`;
        break;
      case 'distance':
        aValue = a.distance || 0; bValue = b.distance || 0; break;
      case 'weight':
        aValue = typeof a.weight === 'string' ? parseFloat(a.weight) || 0 : a.weight || 0;
        bValue = typeof b.weight === 'string' ? parseFloat(b.weight) || 0 : b.weight || 0;
        break;
      case 'fuelCost':
        aValue = a.fuelCost?.[0]?.cost_gl || 0; bValue = b.fuelCost?.[0]?.cost_gl || 0; break;
      case 'fuel_qty':
        aValue = a.fuelCost?.[0]?.fuel_qty || 0; bValue = b.fuelCost?.[0]?.fuel_qty || 0;
        break;
      case 'total_fuel_cost':
        aValue = a.fuelCost?.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0) || 0;
        bValue = b.fuelCost?.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0) || 0;
        break;
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
  data: PaginatedOrderResult | null;
  isLoading: boolean;
  onContextMenu?: (e: React.MouseEvent, row: Order) => void;
  onActionsMenuClick?: (e: React.MouseEvent, row: Order) => void;
}> = ({ data, isLoading, onContextMenu, onActionsMenuClick }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<{ url: string; fuelData?: any } | null>(null);

  const orders = useMemo(() => data?.results ?? [], [data?.results]);
  const sortedData = useMemo(() => sortData(orders, sortConfig), [orders, sortConfig]);

  const handleExpandClick = useCallback((rowId: string) => {
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

  const handleCopyToClipboard = useCallback(async (e: React.MouseEvent, value: string, rowId: string) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopiedRef(rowId);
      setTimeout(() => setCopiedRef(null), 1500);
    } catch { /* ignore */ }
  }, []);

  const handleRowSelect = useCallback((rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) newSet.delete(rowId); else newSet.add(rowId);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) setSelectedRows(new Set(sortedData.map(r => r.key)));
    else setSelectedRows(new Set());
  }, [sortedData]);

  const isSelected = useCallback((rowId: string) => selectedRows.has(rowId), [selectedRows]);
  const isAllSelected = sortedData.length > 0 && selectedRows.size === sortedData.length;

  const handleExportData = useCallback(() => {
    if (!data?.results || data.results.length === 0) return;
    const rowData = data.results.map(order => {
      const fuelCostData = order.fuelCost?.[0] || {};
      return {
        key: order.key,
        referencia: order.key_ref,
        fecha: order.date,
        ubicacion: order.state_usa,
        estado: order.status,
        conductor: `${order.person?.first_name || ''} ${order.person?.last_name || ''}`,
        distancia: order.distance || 0,
        peso: order.weight || 0,
        trabajo: order.job_name,
        costo_por_galon: fuelCostData.cost_gl || 0,
        cantidad_combustible: fuelCostData.fuel_qty || 0,
        distancia_recorrida: fuelCostData.distance || 0,
        numero_camion: fuelCostData.truck?.number_truck || '',
        tipo_camion: fuelCostData.truck?.type || '',
        categoria: fuelCostData.truck?.category || '',
        costo_combustible_total: order.fuelCost?.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0) || 0
      };
    });
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  }, [data]);

  const handleExportSelected = useCallback(() => {
    const selectedOrders = sortedData.filter(order => selectedRows.has(order.key));
    const rowData = selectedOrders.map(order => {
      const fuelCostData = order.fuelCost?.[0] || {};
      return {
        key: order.key,
        referencia: order.key_ref,
        fecha: order.date,
        ubicacion: order.state_usa,
        estado: order.status,
        conductor: `${order.person?.first_name} ${order.person?.last_name}`,
        distancia: order.distance,
        peso: order.weight,
        trabajo: order.job_name,
        costo_por_galon: fuelCostData.cost_gl,
        cantidad_combustible: fuelCostData.fuel_qty,
        distancia_recorrida: fuelCostData.distance,
        numero_camion: fuelCostData.truck?.number_truck,
        tipo_camion: fuelCostData.truck?.type,
        categoria: fuelCostData.truck?.category,
        costo_combustible_total: order.fuelCost?.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0) || 0
      };
    });
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  }, [sortedData, selectedRows]);

  const getColumnValue = (row: Order, columnId: string): any => {
    switch (columnId) {
      case 'person': return `${row.person?.first_name} ${row.person?.last_name}`;
      case 'fuelCost': return row.fuelCost?.[0]?.cost_gl || 0;
      case 'fuel_qty': return row.fuelCost?.[0]?.fuel_qty || 0;
      case 'total_fuel_cost': return row.fuelCost?.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0) || 0;
      default: return getNestedValue(row, columnId);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md border overflow-hidden" style={{ borderColor: '#0B2863' }}>
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3" style={{ borderColor: '#0B2863' }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold" style={{ color: '#0B2863' }}>Fuel Resume</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportData}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:shadow-sm"
                style={{ backgroundColor: '#0B2863', color: 'white' }}
                disabled={!data?.results || data.results.length === 0}
              >
                <Download size={14} className="inline mr-1" />
                Export All
              </button>
              <button
                onClick={handleExportSelected}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:shadow-sm border"
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
                  <input type="checkbox" className="rounded border-2 border-white w-3.5 h-3.5" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} disabled={sortedData.length === 0} />
                </th>
                {columns.map((column, index) => (
                  <th key={`hdr-${column.id}-${index}`} className={`px-3 py-2 text-${column.align || 'left'} font-bold text-xs whitespace-nowrap ${column.sortable ? 'cursor-pointer hover:bg-blue-800 transition-colors duration-200' : ''}`} style={{ minWidth: column.minWidth }} onClick={() => column.sortable && handleSort(column.id)}>
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
                <tr><td colSpan={columns.length + 1} className="text-center py-10"><div className="flex flex-col items-center space-y-3"><LoadingSpinner /><span className="text-gray-500 text-sm">Loading fuel data...</span></div></td></tr>
              ) : sortedData.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-12"><div className="flex flex-col items-center justify-center space-y-3"><div className="mb-2"><Inbox size={64} style={{ color: '#0B2863', opacity: 0.6 }} /></div><div className="text-center"><h3 className="text-lg font-bold mb-1" style={{ color: '#0B2863' }}>No Fuel Data Found</h3><p className="text-gray-500 text-sm">Try adjusting your filters</p></div></div></td></tr>
              ) : (
                <>
                  {sortedData.map((row, rowIndex) => {
                    const rowId = row.key;
                    const isRowSelected = isSelected(rowId);
                    const isExpanded = expandedRows.has(rowId);
                    return (
                      <React.Fragment key={rowId}>
                        <tr className={`transition-all duration-200 hover:shadow-sm cursor-pointer ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isRowSelected ? 'ring-1 ring-blue-200' : ''}`} style={{ backgroundColor: isRowSelected ? 'rgba(11, 40, 99, 0.08)' : undefined }} onContextMenu={(e) => onContextMenu?.(e, row)}>
                          <td className="px-3 py-2">
                            <input type="checkbox" className="rounded border-2 w-3.5 h-3.5" style={{ borderColor: '#0B2863' }} checked={isRowSelected} onChange={() => handleRowSelect(rowId)} onClick={(e) => e.stopPropagation()} />
                          </td>

                          {columns.map((column) => {
                            const value = getColumnValue(row, column.id);
                            if (column.id === 'expand') {
                              return (
                                <td key={`${rowId}-${column.id}`} className="px-3 py-2 text-center" style={{ minWidth: column.minWidth }}>
                                  <button onClick={() => handleExpandClick(rowId)} className="text-gray-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50">
                                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </td>
                              );
                            }
                            if (column.id === 'actions') {
                              return (
                                <td key={`${rowId}-${column.id}`} className="px-3 py-2 text-center" style={{ minWidth: column.minWidth }}>
                                  <button onClick={(e) => onActionsMenuClick?.(e, row)} className="text-gray-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>
                                </td>
                              );
                            }
                            if (column.id === 'key_ref' && column.copyable) {
                              return (
                                <td key={`${rowId}-${column.id}`} className="px-3 py-2" style={{ minWidth: column.minWidth }}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium" style={{ color: '#0B2863' }}>{value}</span>
                                    <button onClick={(e) => handleCopyToClipboard(e, value, rowId)} className={`text-gray-400 hover:text-blue-600 transition-colors p-1 rounded ${copiedRef === rowId ? 'text-green-600' : ''}`} title="Copy to clipboard">
                                      {copiedRef === rowId ? (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={`${rowId}-${column.id}`} className={`px-3 py-2 text-${column.align || 'left'}`} style={{ minWidth: column.minWidth }}>
                                {column.format ? column.format(value, row) : value}
                              </td>
                            );
                          })}
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={columns.length + 1} className="px-3 py-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                              <div className="p-4">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#0B2863' }}>
                                  <Fuel size={16} />
                                  Fuel Cost Details ({row.fuelCost?.length || 0} entries)
                                </h4>
                                
                                {row.fuelCost && row.fuelCost.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {row.fuelCost.map((fuel, index) => (
                                      <div 
                                        key={fuel.id_fuel} 
                                        className="bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all duration-200"
                                        style={{ borderColor: '#0B2863' }}
                                      >
                                        
                                        {/* Card Body */}
                                        <div className="p-3">
                                          {/* Badge de entrada */}
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                              FuelCost #{index + 1}
                                            </span>
                                            {fuel.image_url ? (
                                              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                                                <ImageIcon size={12} />
                                                Has Receipt
                                              </span>
                                            ) : (
                                              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                No Receipt
                                              </span>
                                            )}
                                          </div>

                                          {/* Truck info */}
                                          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                              <TruckIcon size={16} className="text-white" />
                                            </div>
                                            <div className="flex-1">
                                              <div className="font-bold text-sm" style={{ color: '#0B2863' }}>
                                                {fuel.truck?.number_truck || 'N/A'}
                                              </div>
                                              <div className="text-xs text-gray-600">
                                                {fuel.truck?.type} • {fuel.truck?.category}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Fuel details grid */}
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div className="bg-gray-50 p-2 rounded">
                                              <div className="text-xs text-gray-600 mb-1">Cost/Gallon</div>
                                              <div className="font-bold text-sm" style={{ color: '#0B2863' }}>
                                                ${fuel.cost_gl.toFixed(2)}
                                              </div>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                              <div className="text-xs text-gray-600 mb-1">Quantity</div>
                                              <div className="font-bold text-sm" style={{ color: '#0B2863' }}>
                                                {fuel.fuel_qty.toFixed(1)} gl
                                              </div>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-gray-50 p-2 rounded">
                                              <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                <MapPin size={10} />
                                                Distance
                                              </div>
                                              <div className="font-bold text-sm" style={{ color: '#0B2863' }}>
                                                {fuel.distance || 0} mi
                                              </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2 rounded border border-blue-200">
                                              <div className="text-xs text-blue-700 mb-1 font-semibold">Total Cost</div>
                                              <div className="font-bold text-lg text-blue-700">
                                                ${fuel.cost_fuel.toFixed(2)}
                                              </div>
                                            </div>
                                          </div>

                                          {/* View image button if exists */}
                                          {fuel.image_url && (
                                            <button
                                              onClick={() => setPreviewImage({ 
                                                url: fuel.image_url!, 
                                                fuelData: { cost_gl: fuel.cost_gl, fuel_qty: fuel.fuel_qty, cost_fuel: fuel.cost_fuel }
                                              })}
                                              className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                                            >
                                              <Eye size={14} />
                                              View Receipt
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-gray-500 text-sm">
                                    No fuel cost data available
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

        <div className="bg-white border-t px-4 py-3 flex items-center justify-between" style={{ borderColor: '#0B2863' }}>
          <div className="flex items-center space-x-3"><span className="text-xs text-gray-700">Total: {data?.count ?? 0} orders | Selected: {selectedRows.size}</span></div>
          <div className="flex items-center space-x-3"><span className="text-xs text-gray-700">Showing {sortedData.length} results</span></div>
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
