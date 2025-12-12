/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Inbox, FileX, ArrowUpDown, ArrowUp, ArrowDown, Copy, MoreVertical } from 'lucide-react';
import { OrderSummary, PaginatedOrderSummaryResult } from '../../domain/OrderSummaryModel';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  copyable?: boolean;
  format?: (value: any, row?: OrderSummary) => React.ReactNode;
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
  { id: 'state', label: 'Location', minWidth: 220, sortable: true },
  { id: 'status', label: 'Status', minWidth: 100, sortable: true },
  { id: 'client', label: 'Customer', minWidth: 160, sortable: true },
  // RentingCost is shown as Income
  { id: 'income', label: 'Income', minWidth: 120, sortable: true, 
    format: (_v, row) => {
      const num = row?.summary?.rentingCost ?? row?.income ?? 0;
      return <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    }
  },
  { id: 'expense', label: 'Expense', minWidth: 120, sortable: true,
    format: (_v, row) => {
      const num = row?.summary?.expense ?? 0;
      return <span className="text-sm" style={{ color: '#ef4444' }}>${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    }
  },
  { id: 'totalCost', label: 'Total Cost', minWidth: 140, sortable: true,
    format: (_v, row) => {
      const num = row?.summary?.totalCost ?? 0;
      return <span className="font-bold text-sm" style={{ color: '#0B2863' }}>${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    }
  },
];

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#0B2863' }}></div>
);

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const sortData = (data: OrderSummary[], sortConfig: SortConfig): OrderSummary[] => {
  if (!sortConfig.key || !sortConfig.direction) return data;

  return [...data].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'key_ref':
        aValue = a.key_ref; bValue = b.key_ref; break;
      case 'date':
        aValue = new Date(a.date).getTime(); bValue = new Date(b.date).getTime(); break;
      case 'state':
        aValue = a.state; bValue = b.state; break;
      case 'status':
        aValue = a.status; bValue = b.status; break;
      case 'client':
        aValue = a.client; bValue = b.client; break;
      case 'income':
        aValue = a.summary?.rentingCost ?? a.income ?? 0; bValue = b.summary?.rentingCost ?? b.income ?? 0; break;
      case 'expense':
        aValue = a.summary?.expense ?? 0; bValue = b.summary?.expense ?? 0; break;
      case 'totalCost':
        aValue = a.summary?.totalCost ?? 0; bValue = b.summary?.totalCost ?? 0; break;
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

export const SummaryCostDataTable: React.FC<{
  data: PaginatedOrderSummaryResult | null;
  loading: boolean;
  searchTerm?: string;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  onContextMenu?: (e: React.MouseEvent, row: OrderSummary) => void;
  onActionsMenuClick?: (e: React.MouseEvent, row: OrderSummary) => void;
}> = ({ data, loading, searchTerm = '', page = 0, rowsPerPage = 25, onPageChange, onRowsPerPageChange, onContextMenu, onActionsMenuClick }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  console.log('Page:', page, 'RowsPerPage:', rowsPerPage, 'onPageChange:', onPageChange, 'onRowsPerPageChange:', onRowsPerPageChange);
  const orders = useMemo(() => data?.results ?? [], [data?.results]);
  
  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const lowerSearch = searchTerm.toLowerCase();
    return orders.filter(order => 
      (order.key_ref?.toLowerCase().includes(lowerSearch)) ||
      (order.client?.toLowerCase().includes(lowerSearch)) ||
      (order.state?.toLowerCase().includes(lowerSearch)) ||
      (order.status?.toLowerCase().includes(lowerSearch)) ||
      (String(order.summary?.expense ?? 0).includes(lowerSearch)) ||
      (String(order.summary?.totalCost ?? 0).includes(lowerSearch)) ||
      (String(order.summary?.rentingCost ?? order.income ?? 0).includes(lowerSearch))
    );
  }, [orders, searchTerm]);
  
  const sortedData = useMemo(() => sortData(filteredData, sortConfig), [filteredData, sortConfig]);

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

  const getColumnValue = (row: OrderSummary, columnId: string): any => {
    switch (columnId) {
      case 'income': return row.summary?.rentingCost ?? row.income ?? 0;
      case 'expense': return row.summary?.expense ?? 0;
      case 'totalCost': return row.summary?.totalCost ?? 0;
      default: return getNestedValue(row, columnId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden" style={{ borderColor: '#0B2863' }}>
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
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-10"><div className="flex flex-col items-center space-y-3"><LoadingSpinner /><span className="text-gray-500 text-sm">Loading summary costs...</span></div></td></tr>
            ) : sortedData.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-12"><div className="flex flex-col items-center justify-center space-y-3"><div className="mb-2"><Inbox size={64} style={{ color: '#0B2863', opacity: 0.6 }} /></div><div className="text-center"><h3 className="text-lg font-bold mb-1" style={{ color: '#0B2863' }}>No Summary Data Found</h3><p className="text-gray-600 text-sm mb-3 max-w-md">There are no summary costs available for the selected filters. Try adjusting your search criteria.</p><div className="flex items-center justify-center gap-2 text-xs text-gray-500"><FileX size={14} /><span>Tip: Check your week and filter settings above</span></div></div></div></td></tr>
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
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Order</h4>
                                  <p className="text-xs"><strong>Reference:</strong> {row.key_ref}</p>
                                  <p className="text-xs"><strong>Date:</strong> {new Date(row.date).toLocaleDateString()}</p>
                                  <p className="text-xs"><strong>Location:</strong> {row.state}</p>
                                  <p className="text-xs"><strong>Status:</strong> {row.status}</p>
                                  <p className="text-xs"><strong>Customer:</strong> {row.client}</p>
                                  <p className="text-xs"><strong>Income:</strong> ${((row.summary?.rentingCost ?? row.income) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className="text-xs"><strong>Expense:</strong> ${((row.summary?.expense) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Summary Breakdown</h4>
                                  <p className="text-xs"><strong>Fuel Cost:</strong> ${((row.summary?.fuelCost) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className="text-xs"><strong>Work Cost:</strong> ${((row.summary?.workCost) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className="text-xs"><strong>Driver Salaries:</strong> ${((row.summary?.driverSalaries) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className="text-xs"><strong>Other Salaries:</strong> ${((row.summary?.otherSalaries) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Additional</h4>
                                  <p className="text-xs"><strong>Customer Factory:</strong> {row.summary?.customer_factory ?? row.customer_factory_id ?? 'N/A'}</p>
                                  <p className="text-xs"><strong>Operators Discount:</strong> ${((row.summary?.operators_discount) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className="text-xs"><strong>Bonus:</strong> ${((row.summary?.bonus) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className="text-xs mt-2 font-bold" style={{ color: '#0B2863' }}><strong>Total Cost:</strong> ${((row.summary?.totalCost) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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

export default SummaryCostDataTable;