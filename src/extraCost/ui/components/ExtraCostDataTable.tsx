/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo } from 'react';
import { Check, CheckCircle, ChevronDown, ChevronUp, Inbox, FileX, ArrowUpDown, ArrowUp, ArrowDown, Copy, MoreVertical } from 'lucide-react';
import { ExtraCost, ExtraCostResponse } from '../../domain/ExtraCostModel';

interface Column {
  id: keyof ExtraCost | keyof ExtraCost['order'] | 'actions' | 'expand' | 'extraCostName' | 'extraCostType' | 'extraCostCost';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  copyable?: boolean;
  format?: (value: string | number | null | undefined | unknown, row?: ExtraCost) => string | React.ReactNode;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc' | null;
}

const columns: Column[] = [
  { id: 'expand', label: '', minWidth: 40, align: 'center', sortable: false },
  { id: 'actions', label: 'Actions', minWidth: 100, align: 'center', sortable: false },
  { 
    id: 'extraCostName', 
    label: 'Extra Cost Name', 
    minWidth: 120, 
    sortable: true,
    format: (value) => (
      <span className="font-semibold text-xs" style={{ color: '#0B2863' }}>
        {String(value || 'N/A')}
      </span>
    )
  },
  { 
    id: 'extraCostType', 
    label: 'Type', 
    minWidth: 100, 
    sortable: true,
    format: (value) => (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-blue-600">
        {String(value || 'N/A')}
      </span>
    )
  },
  { 
    id: 'extraCostCost', 
    label: 'Cost Amount', 
    minWidth: 120, 
    sortable: true,
    format: (value) => {
      const num = Number(value);
      return (
        <span className="font-bold text-sm" style={{ color: '#22c55e' }}>
          ${num ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
        </span>
      );
    }
  },
  { id: 'key_ref', label: 'Order Reference', minWidth: 120, sortable: true, copyable: true },
  { 
    id: 'date', 
    label: 'Date', 
    minWidth: 110, 
    sortable: true,
    format: (value) => {
      const date = new Date(String(value || ''));
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    }
  },
  { 
    id: 'status', 
    label: 'Order Status', 
    minWidth: 100,
    sortable: true,
    format: (value) => {
      const status = String(value || '').toLowerCase();
      const styles = {
        finished: { backgroundColor: '#22c55e', color: 'white' },
        pending: { backgroundColor: '#F09F52', color: 'white' },
        inactive: { backgroundColor: '#ef4444', color: 'white' },
        default: { backgroundColor: '#6b7280', color: 'white' }
      };
      const style = styles[status as keyof typeof styles] || styles.default;
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={style}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    }
  },
  { id: 'state_usa', label: 'Location', minWidth: 90, sortable: true },
];

interface ExtraCostDataTableProps {
  data: ExtraCostResponse | null;
  loading: boolean;
  onFinishOrder?: (orderId: string) => void;
  onContextMenu?: (event: React.MouseEvent, row: ExtraCost) => void;
  onActionsMenuClick?: (event: React.MouseEvent, row: ExtraCost) => void;
}

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#0B2863' }}></div>
);

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const sortData = (data: ExtraCost[], sortConfig: SortConfig): ExtraCost[] => {
  if (!sortConfig.key || !sortConfig.direction) return data;

  return [...data].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    // Handle special cases for extra cost properties
    switch (sortConfig.key) {
      case 'extraCostName':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'extraCostType':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'extraCostCost':
        aValue = parseFloat(a.cost);
        bValue = parseFloat(b.cost);
        break;
      case 'key_ref':
        aValue = a.order.key_ref;
        bValue = b.order.key_ref;
        break;
      case 'date':
        aValue = new Date(a.order.date);
        bValue = new Date(b.order.date);
        break;
      case 'status':
        aValue = a.order.status;
        bValue = b.order.status;
        break;
      case 'first_name':
        aValue = a.order.person.first_name;
        bValue = b.order.person.first_name;
        break;
      case 'state_usa':
        aValue = a.order.state_usa;
        bValue = b.order.state_usa;
        break;
      case 'weight':
        aValue = a.order.weight;
        bValue = b.order.weight;
        break;
      case 'job':
        aValue = a.order.job;
        bValue = b.order.job;
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

  if (isActive) {
    return sortConfig.direction === 'asc' ? 
      <ArrowUp size={12} style={{ color: iconColor }} /> : 
      <ArrowDown size={12} style={{ color: iconColor }} />;
  }

  return <ArrowUpDown size={12} style={{ color: iconColor }} />;
};

export const ExtraCostDataTable: React.FC<ExtraCostDataTableProps> = ({
  data,
  loading,
  onFinishOrder,
  onContextMenu,
  onActionsMenuClick
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const extraCosts = data?.results || [];
  const sortedData = useMemo(() => sortData(extraCosts, sortConfig), [extraCosts, sortConfig]);

  const handleExpandClick = useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  const handleSort = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    setSortConfig(prevConfig => {
      if (prevConfig.key === columnId) {
        if (prevConfig.direction === 'asc') {
          return { key: columnId, direction: 'desc' };
        } else if (prevConfig.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
      return { key: columnId, direction: 'asc' };
    });
  }, []);

  const handleCopyToClipboard = useCallback(async (e: React.MouseEvent, value: string, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(value);
      setCopiedRef(rowId);
      setTimeout(() => setCopiedRef(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  const handleRowSelect = useCallback((rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedRows(new Set(sortedData.map(row => String(row.id_workCost))));
    } else {
      setSelectedRows(new Set());
    }
  }, [sortedData]);

  const isSelected = useCallback((rowId: string) => selectedRows.has(rowId), [selectedRows]);
  const isAllSelected = sortedData.length > 0 && selectedRows.size === sortedData.length;

  const getColumnValue = (row: ExtraCost, columnId: string): unknown => {
    switch (columnId) {
      case 'extraCostName':
        return row.name;
      case 'extraCostType':
        return row.type;
      case 'extraCostCost':
        return parseFloat(row.cost);
      case 'key_ref':
        return row.order.key_ref;
      case 'date':
        return row.order.date;
      case 'status':
        return row.order.status;
      case 'first_name':
        return row.order.person.first_name;
      case 'state_usa':
        return row.order.state_usa;
      case 'weight':
        return row.order.weight;
      case 'job':
        return row.order.job;
      default:
        return getNestedValue(row, columnId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden" style={{ borderColor: '#0B2863' }}>
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
                  key={`header-${String(column.id)}-${index}`}
                  className={`px-3 py-2 text-${column.align || 'left'} font-bold text-xs whitespace-nowrap ${
                    column.sortable ? 'cursor-pointer hover:bg-blue-800 transition-colors duration-200' : ''
                  }`}
                  style={{ minWidth: column.minWidth }}
                  onClick={() => column.sortable && handleSort(String(column.id))}
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
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-10">
                  <div className="flex flex-col items-center space-y-3">
                    <LoadingSpinner />
                    <span className="text-gray-500 text-sm">Loading extra costs...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="mb-2">
                      <Inbox 
                        size={64}
                        style={{ color: '#0B2863', opacity: 0.6 }}
                      />
                    </div>
                    <div className="text-center">
                      <h3 
                        className="text-lg font-bold mb-1"
                        style={{ color: '#0B2863' }}
                      >
                        No Extra Costs Found
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 max-w-md">
                        There are no extra costs available for the selected filters. 
                        Try adjusting your search criteria.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <FileX size={14} />
                        <span>Tip: Check your week and filter settings above</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {sortedData.map((row, rowIndex) => {
                  const rowId = String(row.id_workCost);
                  const isRowSelected = isSelected(rowId);
                  const isExpanded = expandedRows.has(rowId);
                  
                  return (
                    <React.Fragment key={rowId}>
                      <tr 
                        className={`transition-all duration-200 hover:shadow-sm cursor-pointer ${
                          rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } ${isRowSelected ? 'ring-1 ring-blue-200' : ''}`}
                        style={{ 
                          backgroundColor: isRowSelected ? 'rgba(11, 40, 99, 0.08)' : undefined 
                        }}
                        onContextMenu={(e) => onContextMenu?.(e, row)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="rounded border-2 w-3.5 h-3.5"
                            style={{ borderColor: '#0B2863' }}
                            checked={isRowSelected}
                            onChange={() => handleRowSelect(rowId)}
                          />
                        </td>
                        
                        <td className="px-3 py-2 text-center">
                          <button
                            className="p-1 rounded-lg transition-all duration-200 hover:shadow-sm"
                            style={{ 
                              backgroundColor: '#0B2863',
                              color: 'white'
                            }}
                            onClick={() => handleExpandClick(rowId)}
                            title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                        
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              className={`p-1.5 rounded-lg transition-all duration-200 hover:shadow-sm ${
                                row.order.status === 'finished' ? 'cursor-not-allowed' : 'cursor-pointer'
                              }`}
                              style={{
                                backgroundColor: row.order.status === 'finished' ? '#22c55e' : '#0B2863',
                                color: 'white'
                              }}
                              disabled={row.order.status === 'finished'}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (row.order.status !== 'finished') onFinishOrder?.(row.id_order);
                              }}
                              title={row.order.status === 'finished' ? "Order finished" : "Finish Order"}
                            >
                              {row.order.status === 'finished' ? (
                                <CheckCircle size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                            </button>
                            
                            <button
                              className="p-1.5 rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gray-100"
                              style={{ color: '#0B2863' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onActionsMenuClick?.(e, row);
                              }}
                              title="More actions"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                        
                        {columns.slice(2).map((column, columnIndex) => {
                          const value = getColumnValue(row, String(column.id));
                          let displayValue: React.ReactNode;
                          
                          if (column.format) {
                            displayValue = column.format(value, row);
                          } else {
                            displayValue = String(value || 'N/A');
                          }

                          const isCopyableColumn = column.copyable && column.id === 'key_ref';
                          const cellValue = String(value || '');
                          const isCopied = copiedRef === `${rowId}-${column.id}`;
                          
                          return (
                            <td 
                              key={`${rowId}-${String(column.id)}-${columnIndex}`} 
                              className={`px-3 py-2 text-${column.align || 'left'} text-xs whitespace-nowrap ${
                                isCopyableColumn ? 'group relative' : ''
                              }`}
                              onContextMenu={isCopyableColumn ? (e) => handleCopyToClipboard(e, cellValue, `${rowId}-${column.id}`) : undefined}
                            >
                              <div className="flex items-center gap-1.5">
                                {displayValue}
                                {isCopyableColumn && (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded hover:bg-gray-200"
                                    onClick={(e) => handleCopyToClipboard(e, cellValue, `${rowId}-${column.id}`)}
                                    title="Copy to clipboard"
                                  >
                                    <Copy size={12} style={{ color: isCopied ? '#22c55e' : '#0B2863' }} />
                                  </button>
                                )}
                              </div>
                              {isCopied && (
                                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                                  Copied!
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-0 py-0">
                            <div className="px-4 py-3 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-white p-3 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Order Details</h4>
                                  <p className="text-xs"><strong>Order ID:</strong> {row.order.key}</p>
                                  <p className="text-xs"><strong>Email:</strong> {row.order.person.email}</p>
                                  <p className="text-xs"><strong>Distance:</strong> {row.order.distance || 'N/A'} mi</p>
                                  <p className="text-xs"><strong>Expense:</strong> ${row.order.expense || 0}</p>
                                  <p className="text-xs"><strong>Income:</strong> ${row.order.income || 0}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Extra Cost Details</h4>
                                  <p className="text-xs"><strong>ID:</strong> {row.id_workCost}</p>
                                  <p className="text-xs"><strong>Name:</strong> {row.name}</p>
                                  <p className="text-xs"><strong>Type:</strong> {row.type}</p>
                                  <p className="text-xs"><strong>Cost:</strong> ${row.cost}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>Additional Info</h4>
                                  <p className="text-xs"><strong>Pay Status:</strong> {row.order.payStatus || 'N/A'}</p>
                                  <p className="text-xs"><strong>Dispatch Ticket:</strong> {row.order.dispatch_ticket || 'N/A'}</p>
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
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-700">
            Total: {data?.count || 0} extra costs | Selected: {selectedRows.size}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-700">
            Showing {sortedData.length} results
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExtraCostDataTable;