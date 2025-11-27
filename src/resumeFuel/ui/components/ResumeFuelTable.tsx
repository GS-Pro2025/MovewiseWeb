/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Inbox, FileX, ArrowUpDown, ArrowUp, ArrowDown, Copy, MoreVertical, Download } from 'lucide-react';
import { Order, PaginatedOrderResult } from '../../domain/OrderModel';
import { mkConfig, generateCsv, download } from 'export-to-csv';

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
      // Manejar tanto string como number para weight
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
        // Asegurar que weight se convierte a número
        aValue = typeof a.weight === 'string' ? parseFloat(a.weight) || 0 : a.weight || 0;
        bValue = typeof b.weight === 'string' ? parseFloat(b.weight) || 0 : b.weight || 0;
        break;
      case 'fuelCost':
        aValue = a.fuelCost?.[0]?.cost_gl || 0; bValue = b.fuelCost?.[0]?.cost_gl || 0; break;
      case 'fuel_qty':
        aValue = a.fuelCost?.[0]?.fuel_qty || 0; bValue = b.fuelCost?.[0]?.fuel_qty || 0; break;
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
              <tr><td colSpan={columns.length + 1} className="text-center py-12"><div className="flex flex-col items-center justify-center space-y-3"><div className="mb-2"><Inbox size={64} style={{ color: '#0B2863', opacity: 0.6 }} /></div><div className="text-center"><h3 className="text-lg font-bold mb-1" style={{ color: '#0B2863' }}>No Fuel Data Found</h3><p className="text-gray-600 text-sm mb-3 max-w-md">There are no fuel records available. Try adjusting your search criteria.</p><div className="flex items-center justify-center gap-2 text-xs text-gray-500"><FileX size={14} /><span>Tip: Check your filters above</span></div></div></div></td></tr>
            ) : (
              <>
                {sortedData.map((row, rowIndex) => {
                  const rowId = row.key;
                  const isRowSelected = isSelected(rowId);
                  const isExpanded = expandedRows.has(rowId);
                  return (
                    <React.Fragment key={rowId}>
                      <tr className={`transition-all duration-200 hover:shadow-sm cursor-pointer ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isRowSelected ? 'ring-1 ring-blue-200' : ''}`} style={{ backgroundColor: isRowSelected ? 'rgba(11, 40, 99, 0.08)' : undefined }} onContextMenu={(e) => onContextMenu?.(e, row)}>
                        <td className="px-3 py-2"><input type="checkbox" className="rounded border-2 w-3.5 h-3.5" style={{ borderColor: '#0B2863' }} checked={isRowSelected} onChange={() => handleRowSelect(rowId)} /></td>

                        <td className="px-3 py-2 text-center">
                          <button className="p-1 rounded-lg transition-all duration-200 hover:shadow-sm" style={{ backgroundColor: '#0B2863', color: 'white' }} onClick={() => handleExpandClick(rowId)} title={isExpanded ? 'Collapse Details' : 'Expand Details'}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>

                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button className="p-1.5 rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gray-100" style={{ color: '#0B2863' }} onClick={(e) => { e.stopPropagation(); onActionsMenuClick?.(e, row); }} title="More actions">
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>

                        {columns.slice(2).map((column, colIndex) => {
                          const raw = getColumnValue(row, column.id);
                          const display = column.format ? column.format(raw, row) : String(getColumnValue(row, column.id) ?? 'N/A');
                          const isCopyable = column.copyable && column.id === 'key_ref';
                          const cellValue = String(getColumnValue(row, column.id) ?? '');
                          const isCopied = copiedRef === `${rowId}-${column.id}`;

                          return (
                            <td key={`${rowId}-${column.id}-${colIndex}`} className={`px-3 py-2 text-${column.align || 'left'} text-xs whitespace-nowrap ${isCopyable ? 'group relative' : ''}`} onContextMenu={isCopyable ? (e) => handleCopyToClipboard(e, cellValue, `${rowId}-${column.id}`) : undefined}>
                              <div className="flex items-center gap-1.5">
                                {display}
                                {isCopyable && <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded hover:bg-gray-200" onClick={(e) => handleCopyToClipboard(e, cellValue, `${rowId}-${column.id}`)} title="Copy to clipboard"><Copy size={12} style={{ color: isCopied ? '#22c55e' : '#0B2863' }} /></button>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-0 py-0">
                            <div className="px-4 py-3 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Order Details</h4>
                                  <p className="text-xs"><strong>Reference:</strong> {row.key_ref}</p>
                                  <p className="text-xs"><strong>Date:</strong> {new Date(row.date).toLocaleDateString()}</p>
                                  <p className="text-xs"><strong>Location:</strong> {row.state_usa}</p>
                                  <p className="text-xs"><strong>Status:</strong> {row.status}</p>
                                  <p className="text-xs"><strong>Job:</strong> {row.job_name}</p>
                                  <p className="text-xs"><strong>Driver:</strong> {row.person?.first_name} {row.person?.last_name}</p>
                                  <p className="text-xs"><strong>Distance:</strong> {row.distance != null ? new Intl.NumberFormat('en-US').format(row.distance) : '0'} mi</p>
                                  <p className="text-xs"><strong>Weight:</strong> {row.weight != null ? new Intl.NumberFormat('en-US').format(Number(row.weight)) : '0'} lb</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Fuel Details</h4>
                                  {row.fuelCost && row.fuelCost.length > 0 ? (
                                    <>
                                      <p className="text-xs"><strong>Cost per Gallon:</strong> ${row.fuelCost[0]?.cost_gl?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</p>
                                      <p className="text-xs"><strong>Fuel Quantity:</strong> {row.fuelCost[0]?.fuel_qty?.toLocaleString('en-US') || 0} gl</p>
                                      <p className="text-xs"><strong>Driven Distance:</strong> {row.fuelCost[0]?.distance?.toLocaleString('en-US') || 0} mi</p>
                                      <p className="text-xs"><strong>Total Fuel Cost:</strong> ${row.fuelCost.reduce((acc, cost) => acc + (cost.cost_fuel || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </>
                                  ) : (
                                    <p className="text-xs text-gray-500">No fuel data available</p>
                                  )}
                                </div>

                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Truck Information</h4>
                                  {row.fuelCost && row.fuelCost.length > 0 && row.fuelCost[0]?.truck ? (
                                    <>
                                      <p className="text-xs"><strong>Truck Number:</strong> {row.fuelCost[0].truck.number_truck || 'N/A'}</p>
                                      <p className="text-xs"><strong>Type:</strong> {row.fuelCost[0].truck.type || 'N/A'}</p>
                                      <p className="text-xs"><strong>Category:</strong> {row.fuelCost[0].truck.category || 'N/A'}</p>
                                    </>
                                  ) : (
                                    <p className="text-xs text-gray-500">No truck data available</p>
                                  )}
                                </div>
                              </div>
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
  );
};

export default ResumeFuelTable;
