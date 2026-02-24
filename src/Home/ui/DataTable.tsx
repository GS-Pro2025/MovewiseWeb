import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle, ChevronDown, ChevronUp, Inbox, FileX, ArrowUpDown, ArrowUp, ArrowDown, Copy, MoreVertical } from 'lucide-react';
import OperatorsTable from './operatorsTable';
import CostFuelsTable from './CostFuelsTable';
import { AssignOrderToCostFuelRepository } from '../../addFuelCostToOrder/repository/AssignOrderToCostFuelRepository';
import type { CostFuelByOrderData } from '../../addFuelCostToOrder/domain/AssignOrderToCostFuelModels';
import type { TableData } from '../domain/TableData';

interface Column {
  id: keyof TableData | 'actions' | 'expand';
  labelKey: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  copyable?: boolean;
  format?: (value: string | number | null | undefined | unknown, t: (key: string) => string) => string | React.ReactNode;
}

interface SortConfig {
  key: keyof TableData | null;
  direction: 'asc' | 'desc' | null;
}

const columns: Column[] = [
  { id: 'expand',      labelKey: '',                    minWidth: 40,  align: 'center', sortable: false },
  { id: 'actions',     labelKey: 'table.actions',       minWidth: 70, align: 'center', sortable: false },
  {
    id: 'status',
    labelKey: 'table.status',
    minWidth: 60,
    sortable: true,
    format: (value) => {
      const status = String(value || '');
      const styles = {
        finished: { backgroundColor: '#22c55e', color: 'white' },
        pending:  { backgroundColor: '#F09F52', color: 'white' },
        inactive: { backgroundColor: '#ef4444', color: 'white' },
        default:  { backgroundColor: '#6b7280', color: 'white' }
      };
      const style = styles[status as keyof typeof styles] || styles.default;
      return (
        <span className="px-2 py-0.5 rounded-sm text-xs font-bold" style={style}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    }
  },
  { id: 'key_ref',     labelKey: 'table.reference',  minWidth: 70,  sortable: true, copyable: true },
  { id: 'firstName',   labelKey: 'table.firstName',  minWidth: 60,  sortable: true },
  { id: 'lastName',    labelKey: 'table.lastName',   minWidth: 60,  sortable: true },
  { id: 'company',     labelKey: 'table.company',    minWidth: 60, sortable: true },
  { id: 'job',         labelKey: 'table.job',        minWidth: 60, sortable: true },
  {
    id: 'weight',
    labelKey: 'table.weight',
    minWidth: 40,
    sortable: true,
    format: (value) => String(value || 'N/A')
  },
  { id: 'dateReference', labelKey: 'table.date',     minWidth: 60, sortable: true },
  { id: 'state',         labelKey: 'table.location', minWidth: 60,  sortable: true },
  { id: 'weekday',       labelKey: 'table.weekday',  minWidth: 50,  sortable: true },
  { id: 'city',          labelKey: 'table.address',  minWidth: 60,  sortable: true },
  { id: 'email',         labelKey: 'table.email',    minWidth: 70, sortable: true },
  {
    id: 'phone',
    labelKey: 'table.phone',
    minWidth: 60,
    sortable: true,
    format: (value) => {
      const phone = String(value || '');
      return phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'N/A';
    }
  },
  {
    id: 'payStatus',
    labelKey: 'table.payStatus',
    minWidth: 60,
    sortable: true,
    format: (value, t) => {
      const status = Number(value || 0);
      return (
        <span className="px-2 py-0.5 rounded-sm text-xs font-bold text-white"
          style={{ backgroundColor: status === 0 ? '#ef4444' : '#22c55e' }}>
          {status === 0 ? t('table.unpaid') : t('table.paid')}
        </span>
      );
    }
  },
  { id: 'truckType', labelKey: 'table.truckType', minWidth: 60, sortable: true, format: (value) => String(value || 'N/A') },
  {
    id: 'distance',
    labelKey: 'table.distance',
    minWidth: 60,
    sortable: true,
    format: (value) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')} mi` : 'N/A';
    }
  },
  {
    id: 'expense',
    labelKey: 'table.expense',
    minWidth: 60,
    sortable: true,
    format: (value) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')}` : 'N/A';
    }
  },
  {
    id: 'income',
    labelKey: 'table.income',
    minWidth: 60,
    sortable: true,
    format: (value) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')}` : 'N/A';
    }
  },
  {
    id: 'totalCost',
    labelKey: 'table.totalCost',
    minWidth: 60,
    sortable: true,
    format: (value) => {
      const num = Number(value || 0);
      return `${num.toLocaleString('en-US')}`;
    }
  },
  {
    id: 'created_by',
    labelKey: 'table.createdBy',
    minWidth: 60,
    sortable: true,
    format: (value) => (
      <span className="font-semibold text-xs" style={{ color: '#0B2863' }}>
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
  onActionsMenuClick?: (event: React.MouseEvent, row: TableData) => void;
  onAddFuelCost?: (row: TableData) => void;
  refreshCostFuelsTrigger?: string | null;
  onRefreshData?: () => void | Promise<void>;
}

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-lg h-5 w-5 border-b-2" style={{ borderColor: '#0B2863' }}></div>
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
    if (!isNaN(aNum) && !isNaN(bNum)) return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
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
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={12} style={{ color: iconColor }} />
      : <ArrowDown size={12} style={{ color: iconColor }} />;
  }
  return <ArrowUpDown size={12} style={{ color: iconColor }} />;
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
  onActionsMenuClick,
  onAddFuelCost,
  refreshCostFuelsTrigger,
  onRefreshData,
}) => {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [costFuelsByOrder, setCostFuelsByOrder] = useState<Record<string, CostFuelByOrderData[]>>({});

  const sortedData = useMemo(() => sortData(data, sortConfig), [data, sortConfig]);

  const fetchCostFuelsForOrder = useCallback(async (orderKey: string) => {
    try {
      const response = await AssignOrderToCostFuelRepository.getCostFuelsByOrder(orderKey);
      if (response.status === 'success' && response.data) {
        setCostFuelsByOrder(prev => ({ ...prev, [orderKey]: response.data }));
      }
    } catch {
      setCostFuelsByOrder(prev => ({ ...prev, [orderKey]: [] }));
    }
  }, []);

  useEffect(() => {
    if (refreshCostFuelsTrigger) fetchCostFuelsForOrder(refreshCostFuelsTrigger);
  }, [refreshCostFuelsTrigger, fetchCostFuelsForOrder]);

  const handleExpandClick = useCallback(async (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) { newSet.delete(rowId); }
      else { newSet.add(rowId); fetchCostFuelsForOrder(rowId); }
      return newSet;
    });
  }, [fetchCostFuelsForOrder]);

  const handleSort = useCallback((columnId: keyof TableData) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;
    setSortConfig(prevConfig => {
      if (prevConfig.key === columnId) {
        if (prevConfig.direction === 'asc') return { key: columnId, direction: 'desc' };
        if (prevConfig.direction === 'desc') return { key: null, direction: null };
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
    selectedRows.some(selected => selected.id === row.id), [selectedRows]);

  const isAllSelected = sortedData.length > 0 && selectedRows.length === sortedData.length;
  const getColumnValue = (row: TableData, columnId: keyof TableData): unknown => row[columnId];

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
                  onChange={(e) => onSelectAll(e.target.checked)}
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
                  onClick={() => column.sortable && handleSort(column.id as keyof TableData)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{column.labelKey ? t(column.labelKey) : ''}</span>
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
                    <span className="text-gray-500 text-sm">{t('table.loading')}</span>
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
                      <h3 className="text-lg font-bold mb-1" style={{ color: '#0B2863' }}>
                        {t('table.noOrdersTitle')}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 max-w-md">
                        {t('table.noOrdersDesc')}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <FileX size={14} />
                        <span>{t('table.noOrdersTip')}</span>
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
                        className={`transition-all duration-200 hover:shadow-sm cursor-pointer ${
                          rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } ${isRowSelected ? 'ring-1 ring-blue-200' : ''}`}
                        style={{ backgroundColor: isRowSelected ? 'rgba(11, 40, 99, 0.08)' : undefined }}
                        onContextMenu={(e) => onContextMenu(e, row)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="rounded border-2 w-3.5 h-3.5"
                            style={{ borderColor: '#0B2863' }}
                            checked={isRowSelected}
                            onChange={() => onRowSelect(row)}
                          />
                        </td>

                        {/* Expand button */}
                        <td className="px-3 py-2 text-center">
                          <button
                            className="p-1 rounded-lg transition-all duration-200 hover:shadow-sm"
                            style={{ backgroundColor: '#0B2863', color: 'white' }}
                            onClick={() => handleExpandClick(row.id)}
                            title={
                              row.operators?.length > 0
                                ? (isExpanded ? t('table.collapseOperators') : t('table.expandOperators'))
                                : t('table.noOperators')
                            }
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              className={`p-1.5 rounded-lg transition-all duration-200 hover:shadow-sm ${
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
                              title={row.status === 'finished' ? t('table.orderFinished') : t('table.finishOrder')}
                            >
                              {row.status === 'finished' ? <CheckCircle size={14} /> : <Check size={14} />}
                            </button>

                            <button
                              className="p-1.5 rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gray-100"
                              style={{ color: '#0B2863' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onActionsMenuClick) onActionsMenuClick(e, row);
                              }}
                              title={t('table.moreActions')}
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>

                        {columns.slice(2).map((column, columnIndex) => {
                          const value = getColumnValue(row, column.id as keyof TableData);
                          let displayValue: React.ReactNode;

                          if (column.format) {
                            displayValue = column.format(value, t);
                          } else {
                            if (Array.isArray(value)) displayValue = `${value.length} items`;
                            else if (value === null || value === undefined) displayValue = 'N/A';
                            else if (typeof value === 'object') displayValue = 'Object';
                            else displayValue = String(value);
                          }

                          const isCopyableColumn = column.copyable && column.id === 'key_ref';
                          const cellValue = String(value || '');
                          const isCopied = copiedRef === `${row.id}-${column.id}`;

                          return (
                            <td
                              key={`${row.id}-${String(column.id)}-${columnIndex}`}
                              className={`px-3 py-2 text-${column.align || 'left'} text-xs whitespace-nowrap ${
                                isCopyableColumn ? 'group relative' : ''
                              }`}
                              onContextMenu={isCopyableColumn
                                ? (e) => handleCopyToClipboard(e, cellValue, `${row.id}-${column.id}`)
                                : undefined}
                            >
                              <div className="flex items-center gap-1.5">
                                {displayValue}
                                {isCopyableColumn && (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded hover:bg-gray-200"
                                    onClick={(e) => handleCopyToClipboard(e, cellValue, `${row.id}-${column.id}`)}
                                    title={t('table.copyToClipboard')}
                                  >
                                    <Copy size={12} style={{ color: isCopied ? '#22c55e' : '#0B2863' }} />
                                  </button>
                                )}
                              </div>
                              {isCopied && (
                                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                                  {t('table.copied')}
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
                              <div className="flex gap-4 flex-wrap">
                                <OperatorsTable
                                  operators={row.operators || []}
                                  orderKey={row.id}
                                  onOperatorUpdate={onRefreshData}
                                />
                                <CostFuelsTable
                                  costFuels={costFuelsByOrder[row.id] || []}
                                  onAddFuelCost={onAddFuelCost ? () => { onAddFuelCost(row); } : undefined}
                                />
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

      {/* Pagination */}
      <div className="bg-white border-t px-4 py-3 flex items-center justify-between" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-700">{t('table.rowsPerPage')}</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2"
            style={{ borderColor: '#0B2863' }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-700">
            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalRows)} {t('table.of')} {totalRows}
          </span>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 rounded-lg border text-xs font-semibold transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: '#0B2863', color: '#0B2863' }}
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              {t('table.previous')}
            </button>
            <button
              className="px-3 py-1 rounded-lg border text-xs font-semibold transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: '#0B2863', color: '#0B2863' }}
              disabled={(page + 1) * rowsPerPage >= totalRows}
              onClick={() => onPageChange(page + 1)}
            >
              {t('table.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};