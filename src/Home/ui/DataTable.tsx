import React, { useState, useCallback, useMemo } from 'react';
import { Check, CheckCircle, ChevronDown, ChevronUp, Inbox, FileX, ArrowUpDown, ArrowUp, ArrowDown, Copy, MoreVertical } from 'lucide-react';
import OperatorsTable from './operatorsTable';
import type { TableData } from '../domain/TableData';

interface Column {
  id: keyof TableData | 'actions' | 'expand';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  copyable?: boolean;
  format?: (value: string | number | null | undefined | unknown) => string | React.ReactNode;
}

interface SortConfig {
  key: keyof TableData | null;
  direction: 'asc' | 'desc' | null;
}

const columns: Column[] = [
  { id: 'expand', label: '', minWidth: 50, align: 'center', sortable: false },
  { id: 'actions', label: 'Actions', minWidth: 120, align: 'center', sortable: false },
  { 
    id: 'status', 
    label: 'Status', 
    minWidth: 100,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => {
      const status = String(value || '');
      const styles = {
        finished: { backgroundColor: '#22c55e', color: 'white' },
        pending: { backgroundColor: '#F09F52', color: 'white' },
        inactive: { backgroundColor: '#ef4444', color: 'white' },
        default: { backgroundColor: '#6b7280', color: 'white' }
      };
      const style = styles[status as keyof typeof styles] || styles.default;
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={style}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    }
  },
  { id: 'key_ref', label: 'Reference', minWidth: 100, sortable: true, copyable: true },
  { id: 'firstName', label: 'First Name', minWidth: 100, sortable: true },
  { id: 'lastName', label: 'Last Name', minWidth: 100, sortable: true },
  { id: 'email', label: 'Email', minWidth: 120, sortable: true },
  { 
    id: 'phone', 
    label: 'Phone', 
    minWidth: 120,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => {
      const phone = String(value || '');
      return phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'N/A';
    }
  },
  { id: 'company', label: 'Company', minWidth: 120, sortable: true },
  { id: 'city', label: 'City', minWidth: 100, sortable: true },
  { id: 'state', label: 'Location', minWidth: 100, sortable: true },
  { id: 'weekday', label: 'Weekday', minWidth: 100, sortable: true },
  { id: 'dateReference', label: 'Date', minWidth: 120, sortable: true },
  { id: 'job', label: 'Job', minWidth: 120, sortable: true },
  { 
    id: 'weight', 
    label: 'Weight', 
    minWidth: 100,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => String(value || 'N/A')
  },
  { 
    id: 'truckType', 
    label: 'Truck Type', 
    minWidth: 120,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => String(value || 'N/A')
  },
  { 
    id: 'distance', 
    label: 'Distance (mi)', 
    minWidth: 120,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')} mi` : 'N/A';
    }
  },
  { 
    id: 'expense', 
    label: 'Expense', 
    minWidth: 120,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')}` : 'N/A';
    }
  },
  { 
    id: 'income', 
    label: 'Income', 
    minWidth: 120,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')}` : 'N/A';
    }
  },
  { 
    id: 'totalCost', 
    label: 'Total Cost', 
    minWidth: 120,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => {
      const num = Number(value || 0);
      return `${num.toLocaleString('en-US')}`;
    }
  },
  { id: 'week', label: 'Week of Year', minWidth: 100, sortable: true },
  { 
    id: 'payStatus', 
    label: 'Pay Status', 
    minWidth: 120,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => {
      const status = Number(value || 0);
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white`} style={{ 
          backgroundColor: status === 0 ? '#ef4444' : '#22c55e' 
        }}>
          {status === 0 ? 'Unpaid' : 'Paid'}
        </span>
      );
    }
  },
  { 
    id: 'created_by', 
    label: 'Created By', 
    minWidth: 120,
    sortable: true,
    format: (value: string | number | null | undefined | unknown) => (
      <span className="font-semibold" style={{ color: '#0B2863' }}>
        {String(value || 'N/A')}
      </span>
    )
  },
];

interface DataTableProps {
  data: TableData[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalRows: number;
  selectedRows: TableData[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRowSelect: (row: TableData) => void;
  onSelectAll: (selectAll: boolean) => void;
  onFinishOrder: (orderId: string) => void;
  onContextMenu: (event: React.MouseEvent, row: TableData) => void;
  onActionsMenuClick?: (event: React.MouseEvent, row: TableData) => void; // Nueva prop
}

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#0B2863' }}></div>
);

const sortData = (data: TableData[], sortConfig: SortConfig): TableData[] => {
  if (!sortConfig.key || !sortConfig.direction) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key!];
    const bValue = b[sortConfig.key!];

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
      <ArrowUp size={14} style={{ color: iconColor }} /> : 
      <ArrowDown size={14} style={{ color: iconColor }} />;
  }

  return <ArrowUpDown size={14} style={{ color: iconColor }} />;
};

export const DataTable: React.FC<DataTableProps> = ({
  data,
  loading,
  page,
  rowsPerPage,
  totalRows,
  selectedRows,
  onPageChange,
  onRowsPerPageChange,
  onRowSelect,
  onSelectAll,
  onFinishOrder,
  onContextMenu,
  onActionsMenuClick
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const sortedData = useMemo(() => sortData(data, sortConfig), [data, sortConfig]);

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

  const handleSort = useCallback((columnId: keyof TableData) => {
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

  const isSelected = useCallback((row: TableData) => 
    selectedRows.some(selected => selected.id === row.id), 
    [selectedRows]
  );

  const isAllSelected = sortedData.length > 0 && selectedRows.length === sortedData.length;

  const getColumnValue = (row: TableData, columnId: keyof TableData): unknown => row[columnId];

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden" style={{ borderColor: '#0B2863' }}>
      <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
        <table className="w-full">
          <thead className="sticky top-0 z-10 text-white" style={{ backgroundColor: '#0B2863' }}>
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-2 border-white"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  disabled={sortedData.length === 0}
                />
              </th>
              {columns.map((column, index) => (
                <th
                  key={`header-${String(column.id)}-${index}`}
                  className={`px-4 py-3 text-${column.align || 'left'} font-bold text-sm whitespace-nowrap ${
                    column.sortable ? 'cursor-pointer hover:bg-blue-800 transition-colors duration-200' : ''
                  }`}
                  style={{ minWidth: column.minWidth }}
                  onClick={() => column.sortable && handleSort(column.id as keyof TableData)}
                >
                  <div className="flex items-center gap-2">
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
                <td colSpan={columns.length + 1} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <LoadingSpinner />
                    <span className="text-gray-500">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="mb-4">
                      <Inbox 
                        size={80}
                        style={{ color: '#0B2863', opacity: 0.6 }}
                      />
                    </div>
                    <div className="text-center">
                      <h3 
                        className="text-xl font-bold mb-2"
                        style={{ color: '#0B2863' }}
                      >
                        No Orders Found
                      </h3>
                      <p className="text-gray-600 mb-4 max-w-md">
                        There are no orders available for the selected filters. 
                        Try adjusting your search criteria or create a new order.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <FileX size={16} />
                        <span>Tip: Check your week and filter settings above</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {sortedData.map((row, rowIndex) => {
                  const isRowSelected = isSelected(row);
                  const isExpanded = expandedRows.has(row.id);
                  
                  return (
                    <React.Fragment key={row.id}>
                      <tr 
                        className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                          rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } ${isRowSelected ? 'ring-2 ring-blue-200' : ''}`}
                        style={{ 
                          backgroundColor: isRowSelected ? 'rgba(11, 40, 99, 0.08)' : undefined 
                        }}
                        onContextMenu={(e) => onContextMenu(e, row)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-2"
                            style={{ borderColor: '#0B2863' }}
                            checked={isRowSelected}
                            onChange={() => onRowSelect(row)}
                          />
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <button
                            className="p-1 rounded-lg transition-all duration-200 hover:shadow-md"
                            style={{ 
                              backgroundColor: row.operators?.length > 0 ? '#0B2863' : '#e5e7eb',
                              color: row.operators?.length > 0 ? 'white' : '#9ca3af'
                            }}
                            onClick={() => handleExpandClick(row.id)}
                            disabled={!row.operators || row.operators.length === 0}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className={`p-2 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                                row.status === 'finished' ? 'cursor-not-allowed' : 'cursor-pointer'
                              }`}
                              style={{
                                backgroundColor: row.status === 'finished' ? '#22c55e' : '#0B2863',
                                color: 'white'
                              }}
                              disabled={row.status === 'finished'}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (row.status !== 'finished') onFinishOrder(row.id);
                              }}
                              title={row.status === 'finished' ? "Order finished" : "Finish Order"}
                            >
                              {row.status === 'finished' ? (
                                <CheckCircle size={16} />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>
                            
                            {/* Botón de tres puntos */}
                            <button
                              className="p-2 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:bg-gray-100"
                              style={{ color: '#0B2863' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onActionsMenuClick) {
                                  onActionsMenuClick(e, row);
                                }
                              }}
                              title="More actions"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                        
                        {columns.slice(2).map((column, columnIndex) => {
                          const value = getColumnValue(row, column.id as keyof TableData);
                          let displayValue: React.ReactNode;
                          
                          if (column.format) {
                            displayValue = column.format(value);
                          } else {
                            if (Array.isArray(value)) {
                              displayValue = `${value.length} items`;
                            } else if (value === null || value === undefined) {
                              displayValue = 'N/A';
                            } else if (typeof value === 'object') {
                              displayValue = 'Object';
                            } else {
                              displayValue = String(value);
                            }
                          }

                          const isCopyableColumn = column.copyable && column.id === 'key_ref';
                          const cellValue = String(value || '');
                          const isCopied = copiedRef === `${row.id}-${column.id}`;
                          
                          return (
                            <td 
                              key={`${row.id}-${String(column.id)}-${columnIndex}`} 
                              className={`px-4 py-3 text-${column.align || 'left'} whitespace-nowrap ${
                                isCopyableColumn ? 'group relative' : ''
                              }`}
                              onContextMenu={isCopyableColumn ? (e) => handleCopyToClipboard(e, cellValue, `${row.id}-${column.id}`) : undefined}
                            >
                              <div className="flex items-center gap-2">
                                {displayValue}
                                {isCopyableColumn && (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-200"
                                    onClick={(e) => handleCopyToClipboard(e, cellValue, `${row.id}-${column.id}`)}
                                    title="Copy to clipboard"
                                  >
                                    <Copy size={14} style={{ color: isCopied ? '#22c55e' : '#0B2863' }} />
                                  </button>
                                )}
                              </div>
                              {isCopied && (
                                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
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
                            <div className="px-6 py-4 bg-gray-50">
                              <OperatorsTable 
                                operators={row.operators || []}
                                orderKey={row.id} 
                              />
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
      
      <div className="bg-white border-t-2 px-6 py-4 flex items-center justify-between" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">Rows per page:</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            className="border-2 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#0B2863' }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalRows)} of {totalRows}
          </span>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: '#0B2863',
                color: '#0B2863'
              }}
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: '#0B2863',
                color: '#0B2863'
              }}
              disabled={(page + 1) * rowsPerPage >= totalRows}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}