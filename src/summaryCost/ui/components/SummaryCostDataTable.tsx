/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
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

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#0B2863' }}></div>
);

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Parses a YYYY-MM-DD string as local time to avoid UTC offset shifting the date
const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Portal-based tooltip — mounts at document.body to escape overflow:hidden/auto ancestors */
const CostBreakdownTooltip: React.FC<{
  children: React.ReactNode;
  content: React.ReactNode;
}> = ({ children, content }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  return (
    <span
      className="cursor-default"
      onMouseEnter={(e) => { setVisible(true); setCoords({ x: e.clientX, y: e.clientY }); }}
      onMouseMove={(e) => setCoords({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <div
          className="fixed pointer-events-none"
          style={{ top: coords.y + 14, left: coords.x + 10, zIndex: 9999 }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border text-xs min-w-[220px] max-w-xs overflow-hidden"
            style={{ borderColor: '#0B2863' }}
          >
            {content}
          </div>
        </div>,
        document.body
      )}
    </span>
  );
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
        aValue = parseLocalDate(a.date).getTime(); bValue = parseLocalDate(b.date).getTime(); break;
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
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  console.log('Page:', page, 'RowsPerPage:', rowsPerPage, 'onPageChange:', onPageChange, 'onRowsPerPageChange:', onRowsPerPageChange);

  // Columns defined inside component to access `t`
  const columns: Column[] = useMemo(() => [
    { id: 'expand', label: '', minWidth: 40, align: 'center', sortable: false },
    { id: 'actions', label: t('summaryCostTable.columns.actions'), minWidth: 90, align: 'center', sortable: false },
    { id: 'key_ref', label: t('summaryCostTable.columns.reference'), minWidth: 140, sortable: true, copyable: true },
    { id: 'date', label: t('summaryCostTable.columns.date'), minWidth: 110, sortable: true },
    { id: 'state', label: t('summaryCostTable.columns.location'), minWidth: 220, sortable: true },
    { id: 'status', label: t('summaryCostTable.columns.status'), minWidth: 100, sortable: true },
    { id: 'client', label: t('summaryCostTable.columns.customer'), minWidth: 160, sortable: true },
    {
      id: 'income', label: t('summaryCostTable.columns.income'), minWidth: 120, sortable: true,
      format: (_v, row) => {
        const num = row?.summary?.rentingCost ?? row?.income ?? 0;
        return <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      }
    },
    {
      id: 'expense', label: t('summaryCostTable.columns.expense'), minWidth: 120, sortable: true,
      format: (_v, row) => {
        const num = row?.summary?.expense ?? 0;
        return <span className="text-sm" style={{ color: '#ef4444' }}>${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      }
    },
    {
      id: 'totalCost', label: t('summaryCostTable.columns.totalCost'), minWidth: 140, sortable: true,
      format: (_v, row) => {
        const num = row?.summary?.totalCost ?? 0;
        const lines: { label: string; value: number; sub?: number }[] = [
          { label: t('summaryCostTable.details.fuelCost'),       value: row?.summary?.fuelCost ?? 0,       sub: row?.summary?.fuel_costs?.length ?? 0 },
          { label: t('summaryCostTable.details.workCost'),       value: row?.summary?.workCost ?? 0,       sub: row?.summary?.work_costs?.length ?? 0 },
          { label: t('summaryCostTable.details.driverSalaries'), value: row?.summary?.driverSalaries ?? 0 },
          { label: t('summaryCostTable.details.otherSalaries'),  value: row?.summary?.otherSalaries ?? 0 },
          { label: t('summaryCostTable.details.bonus'),          value: row?.summary?.bonus ?? 0 },
        ];
        const breakdown = (
          <div>
            <div className="px-3 py-2 border-b font-semibold text-xs" style={{ borderColor: '#e5e7eb', color: '#0B2863' }}>
              {t('summaryCostTable.details.summaryBreakdown')}
            </div>
            <div className="px-3 py-2 space-y-1.5">
              {lines.map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <span className="text-gray-600">
                    {item.label}
                    {(item.sub ?? 0) > 0 && <span className="ml-1 text-gray-400 text-[10px]">({item.sub})</span>}
                  </span>
                  <span className="font-medium tabular-nums" style={{ color: '#374151' }}>{fmtCurrency(item.value)}</span>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 border-t flex items-center justify-between gap-4 bg-gray-50" style={{ borderColor: '#e5e7eb' }}>
              <span className="font-bold" style={{ color: '#0B2863' }}>{t('summaryCostTable.details.totalCost')}</span>
              <span className="font-bold tabular-nums" style={{ color: '#0B2863' }}>{fmtCurrency(num)}</span>
            </div>
          </div>
        );
        return (
          <CostBreakdownTooltip content={breakdown}>
            <span className="font-bold text-sm inline-flex items-center gap-1" style={{ color: '#0B2863' }}>
              {fmtCurrency(num)}
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-white text-[9px] font-bold"
                style={{ backgroundColor: '#0B2863' }}
              >i</span>
            </span>
          </CostBreakdownTooltip>
        );
      }
    },
  ], [t]);

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
  }, [columns]);

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
              <tr><td colSpan={columns.length + 1} className="text-center py-10"><div className="flex flex-col items-center space-y-3"><LoadingSpinner /><span className="text-gray-500 text-sm">{t('summaryCostTable.loading')}</span></div></td></tr>
            ) : sortedData.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-12"><div className="flex flex-col items-center justify-center space-y-3"><div className="mb-2"><Inbox size={64} style={{ color: '#0B2863', opacity: 0.6 }} /></div><div className="text-center"><h3 className="text-lg font-bold mb-1" style={{ color: '#0B2863' }}>{t('summaryCostTable.empty.title')}</h3><p className="text-gray-600 text-sm mb-3 max-w-md">{t('summaryCostTable.empty.desc')}</p><div className="flex items-center justify-center gap-2 text-xs text-gray-500"><FileX size={14} /><span>{t('summaryCostTable.empty.tip')}</span></div></div></div></td></tr>
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
                          <button className="p-1 rounded-lg transition-all duration-200 hover:shadow-sm" style={{ backgroundColor: '#0B2863', color: 'white' }} onClick={() => handleExpandClick(rowId)} title={isExpanded ? t('summaryCostTable.expand.collapse') : t('summaryCostTable.expand.expand')}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>

                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button className="p-1.5 rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gray-100" style={{ color: '#0B2863' }} onClick={(e) => { e.stopPropagation(); onActionsMenuClick?.(e, row); }} title={t('summaryCostTable.moreActions')}>
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
                                {isCopyable && <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded hover:bg-gray-200" onClick={(e) => handleCopyToClipboard(e, cellValue, `${rowId}-${column.id}`)} title={t('summaryCostTable.copyToClipboard')}><Copy size={12} style={{ color: isCopied ? '#22c55e' : '#0B2863' }} /></button>}
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
                                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#0B2863' }}>{t('summaryCostTable.details.order')}</h4>
                                  <p className="text-xs"><strong>{t('summaryCostTable.details.reference')}:</strong> {row.key_ref}</p>
                                  <p className="text-xs"><strong>{t('summaryCostTable.details.date')}:</strong> {parseLocalDate(row.date).toLocaleDateString()}</p>
                                  <p className="text-xs"><strong>{t('summaryCostTable.details.location')}:</strong> {row.state}</p>
                                  <p className="text-xs"><strong>{t('summaryCostTable.details.status')}:</strong> {row.status}</p>
                                  <p className="text-xs"><strong>{t('summaryCostTable.details.customer')}:</strong> {row.client}</p>
                                  <p className="text-xs"><strong>{t('summaryCostTable.details.income')}:</strong> ${((row.summary?.rentingCost ?? row.income) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className="text-xs"><strong>{t('summaryCostTable.details.expense')}:</strong> ${((row.summary?.expense) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-3" style={{ color: '#0B2863' }}>{t('summaryCostTable.details.summaryBreakdown')}</h4>

                                  {/* Fuel Cost */}
                                  <div className="mb-3">
                                    <p className="text-xs flex items-center justify-between">
                                      <strong>{t('summaryCostTable.details.fuelCost')}</strong>
                                      <span className="tabular-nums" style={{ color: '#0B2863' }}>{fmtCurrency(row.summary?.fuelCost ?? 0)}</span>
                                    </p>
                                    {(row.summary?.fuel_costs?.length ?? 0) > 0 && (
                                      <div className="mt-1.5 ml-2 rounded border border-gray-100 overflow-hidden">
                                        <table className="w-full text-[10px]">
                                          <thead className="bg-gray-50">
                                            <tr className="text-gray-500">
                                              <th className="px-2 py-1 text-left font-medium">Truck</th>
                                              <th className="px-2 py-1 text-left font-medium">Date</th>
                                              <th className="px-2 py-1 text-right font-medium">Distributed</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {row.summary.fuel_costs!.map(fc => (
                                              <tr key={fc.id_order_cost_fuel} className="border-t border-gray-100">
                                                <td className="px-2 py-1 text-gray-700">{fc.truck}</td>
                                                <td className="px-2 py-1 text-gray-500">{parseLocalDate(fc.date).toLocaleDateString()}</td>
                                                <td className="px-2 py-1 text-right font-semibold tabular-nums" style={{ color: '#0B2863' }}>
                                                  {fmtCurrency(fc.cost_fuel_distributed)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>

                                  {/* Work / Extra Costs */}
                                  <div className="mb-3">
                                    <p className="text-xs flex items-center justify-between">
                                      <strong>{t('summaryCostTable.details.workCost')}</strong>
                                      <span className="tabular-nums" style={{ color: '#0B2863' }}>{fmtCurrency(row.summary?.workCost ?? 0)}</span>
                                    </p>
                                    {(row.summary?.work_costs?.length ?? 0) > 0 && (
                                      <div className="mt-1.5 ml-2 rounded border border-gray-100 overflow-hidden">
                                        <table className="w-full text-[10px]">
                                          <thead className="bg-gray-50">
                                            <tr className="text-gray-500">
                                              <th className="px-2 py-1 text-left font-medium">Name</th>
                                              <th className="px-2 py-1 text-left font-medium">Type</th>
                                              <th className="px-2 py-1 text-right font-medium">Cost</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {row.summary.work_costs!.map(wc => (
                                              <tr key={wc.id_workCost} className="border-t border-gray-100">
                                                <td className="px-2 py-1 text-gray-700">{wc.name}</td>
                                                <td className="px-2 py-1 text-gray-500">{wc.type}</td>
                                                <td className="px-2 py-1 text-right font-semibold tabular-nums" style={{ color: '#0B2863' }}>
                                                  {fmtCurrency(wc.cost)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>

                                  <p className="text-xs flex items-center justify-between">
                                    <strong>{t('summaryCostTable.details.driverSalaries')}</strong>
                                    <span className="tabular-nums">{fmtCurrency(row.summary?.driverSalaries ?? 0)}</span>
                                  </p>
                                  <p className="text-xs flex items-center justify-between mt-1">
                                    <strong>{t('summaryCostTable.details.otherSalaries')}</strong>
                                    <span className="tabular-nums">{fmtCurrency(row.summary?.otherSalaries ?? 0)}</span>
                                  </p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-3" style={{ color: '#0B2863' }}>{t('summaryCostTable.details.additional')}</h4>
                                  <p className="text-xs flex items-center justify-between">
                                    <strong>{t('summaryCostTable.details.customerFactory')}</strong>
                                    <span>{row.customer_name ?? 'N/A'}</span>
                                  </p>
                                  <p className="text-xs flex items-center justify-between mt-1">
                                    <strong>{t('summaryCostTable.details.bonus')}</strong>
                                    <span className="tabular-nums">{fmtCurrency(row.summary?.bonus ?? 0)}</span>
                                  </p>
                                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                                    <p className="text-xs flex items-center justify-between font-bold" style={{ color: '#0B2863' }}>
                                      <strong>{t('summaryCostTable.details.totalCost')}</strong>
                                      <span className="tabular-nums">{fmtCurrency(row.summary?.totalCost ?? 0)}</span>
                                    </p>
                                    {row.summary?.net_profit !== undefined && (
                                      <p className="text-xs flex items-center justify-between font-semibold">
                                        <strong>{t('summaryCostTable.details.netProfit')}</strong>
                                        <span
                                          className="tabular-nums"
                                          style={{ color: (row.summary.net_profit ?? 0) >= 0 ? '#16a34a' : '#dc2626' }}
                                        >
                                          {fmtCurrency(row.summary.net_profit ?? 0)}
                                        </span>
                                      </p>
                                    )}
                                  </div>
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
            {t('summaryCostTable.footer.total', { count: data?.count ?? 0, selected: selectedRows.size })}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-700">
            {t('summaryCostTable.footer.showing', { count: sortedData.length })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCostDataTable;