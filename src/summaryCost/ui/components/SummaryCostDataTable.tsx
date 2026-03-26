/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown, ChevronUp, Inbox, FileX,
  ArrowUpDown, ArrowUp, ArrowDown, Copy,
} from 'lucide-react';
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

// ── helpers ────────────────────────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#0B2863' }} />
);

const getNestedValue = (obj: any, path: string): any =>
  path.split('.').reduce((cur, k) => cur?.[k], obj);

const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Tooltip ────────────────────────────────────────────────────────────────────
const Tooltip: React.FC<{ children: React.ReactNode; content: React.ReactNode }> = ({ children, content }) => {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
    >
      {children}
      {on && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] pointer-events-none w-72">
          <span className="block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
            {content}
          </span>
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-l border-t border-gray-200 rotate-45" />
        </span>
      )}
    </span>
  );
};

// ── Weekly summary panel ───────────────────────────────────────────────────────
const WeeklySummaryPanel: React.FC<{ orders: OrderSummary[] }> = ({ orders }) => {
  const { t } = useTranslation();

  const totals = useMemo(() => ({
    fuel:      orders.reduce((s, r) => s + (r.summary?.fuelCost       ?? 0), 0),
    work:      orders.reduce((s, r) => s + (r.summary?.workCost       ?? 0), 0),
    driver:    orders.reduce((s, r) => s + (r.summary?.driverSalaries ?? 0), 0),
    other:     orders.reduce((s, r) => s + (r.summary?.otherSalaries  ?? 0), 0),
    bonus:     orders.reduce((s, r) => s + (r.summary?.bonus          ?? 0), 0),
    totalCost: orders.reduce((s, r) => s + (r.summary?.totalCost      ?? 0), 0),
    income:    orders.reduce((s, r) => s + (r.summary?.rentingCost ?? r.income ?? 0), 0),
    expense:   orders.reduce((s, r) => s + (r.summary?.expense        ?? 0), 0),
    netProfit: orders.reduce((s, r) => s + (r.summary?.net_profit     ?? 0), 0),
  }), [orders]);

  const costCards = [
    { label: t('summaryCostTable.details.fuelCost'),       v: totals.fuel,      bg: '#FAEEDA', fg: '#633806' },
    { label: t('summaryCostTable.details.workCost'),       v: totals.work,      bg: '#E6F1FB', fg: '#0C447C' },
    { label: t('summaryCostTable.details.driverSalaries'), v: totals.driver,    bg: '#EAF3DE', fg: '#27500A' },
    { label: t('summaryCostTable.details.otherSalaries'),  v: totals.other,     bg: '#EAF3DE', fg: '#27500A' },
    { label: t('summaryCostTable.details.bonus'),          v: totals.bonus,     bg: '#FBEAF0', fg: '#72243E' },
    { label: t('summaryCostTable.details.totalCost'),      v: totals.totalCost, bg: '#E6F1FB', fg: '#0B2863' },
  ];

  const allFuelRows = useMemo(() =>
    orders.flatMap(r => (r.summary?.fuel_costs ?? []).map(fc => ({ ref: r.key_ref, ...fc }))),
  [orders]);

  const allWorkRows = useMemo(() =>
    orders.flatMap(r => (r.summary?.work_costs ?? []).map(wc => ({ ref: r.key_ref, ...wc }))),
  [orders]);

  const hasDetails = allFuelRows.length > 0 || allWorkRows.length > 0;

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3 mb-3">
      {/* top bar */}
      <div className="flex items-center justify-between flex-wrap gap-1.5 mb-2">
        <p className="m-0 text-[11px] font-medium text-[#0B2863]">
          {t('summaryCostTable.weeklySummary.title')}
          <span className="ml-1.5 text-[10px] text-gray-500 font-normal">
            {orders.length} {t('summaryCostTable.weeklySummary.orders')}
          </span>
        </p>
        <div className="flex gap-4 flex-wrap">
          {[
            { lbl: t('summaryCostTable.details.income'),    val: totals.income,    color: '#16a34a' },
            { lbl: t('summaryCostTable.details.expense'),   val: totals.expense,   color: '#dc2626' },
            { lbl: t('summaryCostTable.details.netProfit'), val: totals.netProfit, color: totals.netProfit >= 0 ? '#16a34a' : '#dc2626' },
          ].map(item => (
            <span key={item.lbl} className="text-[10px] text-gray-500">
              {item.lbl}:&nbsp;<strong style={{ color: item.color }}>{fmt(item.val)}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* metric cards */}
      <div className={`grid grid-cols-6 gap-1.5 ${hasDetails ? 'mb-2.5' : ''}`}>
        {costCards.map(c => (
          <div key={c.label} className="rounded-md p-1.5" style={{ background: c.bg }}>
            <p className="m-0 mb-0.5 text-[9px] truncate" style={{ color: c.fg, opacity: 0.75 }}>
              {c.label}
            </p>
            <p className="m-0 text-[11px] font-medium" style={{ color: c.fg }}>{fmt(c.v)}</p>
          </div>
        ))}
      </div>

      {/* fuel detail */}
      {allFuelRows.length > 0 && (
        <div className={`${allWorkRows.length > 0 ? 'mb-2.5' : ''}`}>
          <p className="m-0 mb-1 text-[10px] font-medium text-[#633806]">
            {t('summaryCostTable.weeklySummary.fuelDetail')}
          </p>
          <div className="border border-[#FAC775] rounded-md overflow-hidden">
            <table className="w-full text-[9px] border-collapse">
              <thead className="bg-[#FAEEDA]">
                <tr>
                  {['Ref', t('summaryCostTable.weeklySummary.truck'), t('summaryCostTable.weeklySummary.date'), 'Qty', 'Total', t('summaryCostTable.weeklySummary.distributed')].map((h, i) => (
                    <th key={h} className={`p-1 px-2 ${i >= 3 ? 'text-right' : 'text-left'} font-medium text-[#633806] whitespace-nowrap text-[9px]`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFuelRows.map((fc, i) => (
                  <tr key={`${fc.ref}-${fc.id_order_cost_fuel}`} className={`${i > 0 ? 'border-t border-[#FAC775]' : ''} ${i % 2 === 0 ? 'bg-white' : 'bg-[#fffbf5]'}`}>
                    <td className="p-1 px-2 text-[#0B2863] font-medium text-[9px]">{fc.ref}</td>
                    <td className="p-1 px-2 text-gray-700 text-[9px]">{fc.truck}</td>
                    <td className="p-1 px-2 text-gray-500 text-[9px]">{parseLocalDate(fc.date).toLocaleDateString()}</td>
                    <td className="p-1 px-2 text-right text-gray-500 text-[9px]">{fc.fuel_qty_distributed.toFixed(2)}</td>
                    <td className="p-1 px-2 text-right text-gray-700 text-[9px]">{fmt(fc.cost_fuel_total)}</td>
                    <td className="p-1 px-2 text-right font-medium text-[#633806] text-[9px]">{fmt(fc.cost_fuel_distributed)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#EF9F27] bg-[#FAEEDA]">
                  <td colSpan={5} className="p-1 px-2 font-medium text-[#633806] text-[9px]">Total</td>
                  <td className="p-1 px-2 text-right font-medium text-[#633806] text-[9px]">{fmt(totals.fuel)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* work detail */}
      {allWorkRows.length > 0 && (
        <div>
          <p className="m-0 mb-1 text-[10px] font-medium text-[#0C447C]">
            {t('summaryCostTable.weeklySummary.workDetail')}
          </p>
          <div className="border border-[#85B7EB] rounded-md overflow-hidden">
            <table className="w-full text-[9px] border-collapse">
              <thead className="bg-[#E6F1FB]">
                <tr>
                  {['Ref', t('summaryCostTable.weeklySummary.name'), t('summaryCostTable.weeklySummary.type'), t('summaryCostTable.weeklySummary.cost')].map((h, i) => (
                    <th key={h} className={`p-1 px-2 ${i === 3 ? 'text-right' : 'text-left'} font-medium text-[#0C447C] whitespace-nowrap text-[9px]`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allWorkRows.map((wc, i) => (
                  <tr key={`${wc.ref}-${wc.id_workCost}`} className={`${i > 0 ? 'border-t border-[#85B7EB]' : ''} ${i % 2 === 0 ? 'bg-white' : 'bg-[#f3f8fd]'}`}>
                    <td className="p-1 px-2 text-[#0B2863] font-medium text-[9px]">{wc.ref}</td>
                    <td className="p-1 px-2 text-gray-700 text-[9px]">{wc.name}</td>
                    <td className="p-1 px-2">
                      <span className="bg-[#E6F1FB] text-[#0C447C] text-[8px] font-medium px-1.5 py-0.5 rounded-full">{wc.type}</span>
                    </td>
                    <td className="p-1 px-2 text-right font-medium text-[#0C447C] text-[9px]">{fmt(wc.cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#378ADD] bg-[#E6F1FB]">
                  <td colSpan={3} className="p-1 px-2 font-medium text-[#0C447C] text-[9px]">Total</td>
                  <td className="p-1 px-2 text-right font-medium text-[#0C447C] text-[9px]">{fmt(totals.work)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── sort ───────────────────────────────────────────────────────────────────────
const sortData = (data: OrderSummary[], cfg: SortConfig): OrderSummary[] => {
  if (!cfg.key || !cfg.direction) return data;
  return [...data].sort((a, b) => {
    let av: any, bv: any;
    switch (cfg.key) {
      case 'key_ref':   av = a.key_ref; bv = b.key_ref; break;
      case 'date':      av = parseLocalDate(a.date).getTime(); bv = parseLocalDate(b.date).getTime(); break;
      case 'state':     av = a.state; bv = b.state; break;
      case 'status':    av = a.status; bv = b.status; break;
      case 'client':    av = a.client; bv = b.client; break;
      case 'income':    av = a.summary?.rentingCost ?? a.income ?? 0; bv = b.summary?.rentingCost ?? b.income ?? 0; break;
      case 'expense':   av = a.summary?.expense ?? 0; bv = b.summary?.expense ?? 0; break;
      case 'totalCost': av = a.summary?.totalCost ?? 0; bv = b.summary?.totalCost ?? 0; break;
      default:          av = getNestedValue(a, cfg.key!); bv = getNestedValue(b, cfg.key!);
    }
    if (av == null) return cfg.direction === 'asc' ? 1 : -1;
    if (bv == null) return cfg.direction === 'asc' ? -1 : 1;
    const an = Number(av), bn = Number(bv);
    if (!isNaN(an) && !isNaN(bn)) return cfg.direction === 'asc' ? an - bn : bn - an;
    return cfg.direction === 'asc'
      ? String(av).toLowerCase().localeCompare(String(bv).toLowerCase())
      : String(bv).toLowerCase().localeCompare(String(av).toLowerCase());
  });
};

const SortIcon: React.FC<{ col: Column; cfg: SortConfig }> = ({ col, cfg }) => {
  if (!col.sortable) return null;
  const active = cfg.key === col.id;
  const c = active ? '#F09F52' : '#9CA3AF';
  if (active) return cfg.direction === 'asc' ? <ArrowUp size={10} style={{ color: c }} /> : <ArrowDown size={10} style={{ color: c }} />;
  return <ArrowUpDown size={10} style={{ color: c }} />;
};

// ── main ───────────────────────────────────────────────────────────────────────
export const SummaryCostDataTable: React.FC<{
  data: PaginatedOrderSummaryResult | null;
  loading: boolean;
  searchTerm?: string;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (p: number) => void;
  onRowsPerPageChange?: (r: number) => void;
  onContextMenu?: (e: React.MouseEvent, row: OrderSummary) => void;
}> = ({ data, loading, searchTerm = '', onContextMenu }) => {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig]     = useState<SortConfig>({ key: null, direction: null });
  const [copiedRef, setCopiedRef]       = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const columns: Column[] = useMemo(() => [
    { id: 'expand', label: '', minWidth: 32, align: 'center' },
    { id: 'key_ref', label: t('summaryCostTable.columns.reference'), minWidth: 110, sortable: true, copyable: true },
    {
      id: 'date', label: t('summaryCostTable.columns.date'), minWidth: 80, sortable: true,
      format: (_v, row) => row ? parseLocalDate(row.date).toLocaleDateString() : 'N/A',
    },
    { id: 'state', label: t('summaryCostTable.columns.location'), minWidth: 150, sortable: true },
    {
      id: 'status', label: t('summaryCostTable.columns.status'), minWidth: 75, sortable: true,
      format: (_v, row) => {
        const s = (row?.status ?? '').toLowerCase();
        return (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap">
            {s.charAt(0).toUpperCase() + s.slice(1) || 'N/A'}
          </span>
        );
      },
    },
    { id: 'client', label: t('summaryCostTable.columns.customer'), minWidth: 120, sortable: true },
    {
      id: 'income', label: t('summaryCostTable.columns.income'), minWidth: 90, sortable: true,
      format: (_v, row) => {
        const n = row?.summary?.rentingCost ?? row?.income ?? 0;
        return <span className="font-medium text-[10px] text-[#0B2863]">{fmt(n)}</span>;
      },
    },
    {
      id: 'expense', label: t('summaryCostTable.columns.expense'), minWidth: 90, sortable: true,
      format: (_v, row) => (
        <span className="text-[10px] text-red-600">{fmt(row?.summary?.expense ?? 0)}</span>
      ),
    },
    {
      id: 'totalCost', label: t('summaryCostTable.columns.totalCost'), minWidth: 110, sortable: true,
      format: (_v, row) => {
        const n = row?.summary?.totalCost ?? 0;
        const lines = [
          { lbl: t('summaryCostTable.details.fuelCost'),       val: row?.summary?.fuelCost       ?? 0, sub: row?.summary?.fuel_costs?.length },
          { lbl: t('summaryCostTable.details.workCost'),       val: row?.summary?.workCost       ?? 0, sub: row?.summary?.work_costs?.length },
          { lbl: t('summaryCostTable.details.driverSalaries'), val: row?.summary?.driverSalaries ?? 0 },
          { lbl: t('summaryCostTable.details.otherSalaries'),  val: row?.summary?.otherSalaries  ?? 0 },
          { lbl: t('summaryCostTable.details.bonus'),          val: row?.summary?.bonus          ?? 0 },
        ];
        const content = (
          <div>
            <div className="px-2.5 py-1.5 border-b border-gray-200 font-medium text-[#0B2863] text-[10px]">
              {t('summaryCostTable.details.summaryBreakdown')}
            </div>
            <div className="px-2.5 py-1.5 flex flex-col gap-1">
              {lines.map(item => (
                <div key={item.lbl} className="flex justify-between items-center gap-3">
                  <span className="text-[10px] text-gray-500">
                    {item.lbl}
                    {(item.sub ?? 0) > 0 && <span className="ml-1 text-[8px] text-gray-400">({item.sub})</span>}
                  </span>
                  <span className="text-[10px] font-medium text-gray-800 tabular-nums">{fmt(item.val)}</span>
                </div>
              ))}
            </div>
            <div className="px-2.5 py-1.5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-[10px] font-medium text-[#0B2863]">{t('summaryCostTable.details.totalCost')}</span>
              <span className="text-[11px] font-medium text-[#0B2863] tabular-nums">{fmt(n)}</span>
            </div>
          </div>
        );
        return (
          <Tooltip content={content}>
            <span className="font-bold text-[10px] text-[#0B2863] inline-flex items-center gap-1 cursor-default">
              {fmt(n)}
              <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#0B2863] text-white text-[8px] font-bold flex-shrink-0">
                i
              </span>
            </span>
          </Tooltip>
        );
      },
    },
  ], [t]);

  const orders = useMemo(() => data?.results ?? [], [data?.results]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const lw = searchTerm.toLowerCase();
    return orders.filter(o =>
      o.key_ref?.toLowerCase().includes(lw) ||
      o.client?.toLowerCase().includes(lw)  ||
      o.state?.toLowerCase().includes(lw)   ||
      o.status?.toLowerCase().includes(lw)
    );
  }, [orders, searchTerm]);

  const sortedData = useMemo(() => sortData(filteredData, sortConfig), [filteredData, sortConfig]);

  const handleExpandClick = useCallback((id: string) => {
    setExpandedRows(prev => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  }, []);

  const handleSort = useCallback((id: string) => {
    const col = columns.find(c => c.id === id);
    if (!col?.sortable) return;
    setSortConfig(prev => {
      if (prev.key === id) {
        if (prev.direction === 'asc')  return { key: id, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key: id, direction: 'asc' };
    });
  }, [columns]);

  const handleCopy = useCallback(async (e: React.MouseEvent, val: string, id: string) => {
    e.preventDefault(); e.stopPropagation();
    await navigator.clipboard.writeText(val).catch(() => {});
    setCopiedRef(id);
    setTimeout(() => setCopiedRef(null), 1500);
  }, []);

  const handleRowSelect = useCallback((id: string) => {
    setSelectedRows(prev => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  }, []);

  const handleSelectAll = useCallback((all: boolean) => {
    setSelectedRows(all ? new Set(sortedData.map(r => r.key)) : new Set());
  }, [sortedData]);

  const isSelected    = useCallback((id: string) => selectedRows.has(id), [selectedRows]);
  const isAllSelected = sortedData.length > 0 && selectedRows.size === sortedData.length;

  const getVal = (row: OrderSummary, id: string): any => {
    switch (id) {
      case 'income':    return row.summary?.rentingCost ?? row.income ?? 0;
      case 'expense':   return row.summary?.expense ?? 0;
      case 'totalCost': return row.summary?.totalCost ?? 0;
      default:          return getNestedValue(row, id);
    }
  };

  return (
    <div>
      {!loading && sortedData.length > 0 && <WeeklySummaryPanel orders={sortedData} />}

      <div className="bg-white rounded-xl shadow-md border overflow-hidden" style={{ borderColor: '#0B2863' }}>
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
          <table className="w-full border-collapse">
            {/* head */}
            <thead className="sticky top-0 z-20 text-white" style={{ backgroundColor: '#0B2863' }}>
              <tr>
                <th className="px-2 py-1.5 text-left" style={{ width: '28px' }}>
                  <input
                    type="checkbox"
                    className="rounded border-2 border-white w-3 h-3"
                    checked={isAllSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                    disabled={!sortedData.length}
                  />
                </th>
                {columns.map((col, i) => (
                  <th
                    key={`h-${col.id}-${i}`}
                    className={`px-2 py-1.5 font-bold text-[10px] whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-blue-800 transition-colors' : ''}`}
                    style={{ minWidth: col.minWidth, textAlign: col.align ?? 'left' }}
                    onClick={() => col.sortable && handleSort(col.id)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      <SortIcon col={col} cfg={sortConfig} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-6">
                    <div className="flex flex-col items-center gap-2">
                      <LoadingSpinner />
                      <span className="text-gray-500 text-[10px]">{t('summaryCostTable.loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox size={40} className="text-[#0B2863] opacity-45" />
                      <h3 className="font-bold text-xs text-[#0B2863]">{t('summaryCostTable.empty.title')}</h3>
                      <p className="text-gray-500 text-[10px]">{t('summaryCostTable.empty.desc')}</p>
                      <div className="flex items-center gap-2 text-[9px] text-gray-400">
                        <FileX size={11} /><span>{t('summaryCostTable.empty.tip')}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row, ri) => {
                  const rowId    = row.key;
                  const selected = isSelected(rowId);
                  const expanded = expandedRows.has(rowId);

                  return (
                    <React.Fragment key={rowId}>
                      <tr
                        className={`transition-all duration-150 cursor-pointer ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        style={{ backgroundColor: selected ? 'rgba(11,40,99,0.07)' : undefined }}
                        onContextMenu={e => onContextMenu?.(e, row)}
                      >
                        {/* checkbox */}
                        <td className="px-2 py-1.5">
                          <input
                            type="checkbox"
                            className="rounded border-2 w-3 h-3"
                            style={{ borderColor: '#0B2863' }}
                            checked={selected}
                            onChange={() => handleRowSelect(rowId)}
                          />
                        </td>

                        {/* expand */}
                        <td className="px-2 py-1.5 text-center">
                          <button
                            className="p-0.5 rounded transition-colors bg-[#0B2863] text-white"
                            onClick={() => handleExpandClick(rowId)}
                            title={expanded ? t('summaryCostTable.expand.collapse') : t('summaryCostTable.expand.expand')}
                          >
                            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </td>

                        {/* data cols */}
                        {columns.slice(1).map((col, ci) => {
                          const raw      = getVal(row, col.id);
                          const display  = col.format ? col.format(raw, row) : String(raw ?? 'N/A');
                          const copyable = col.copyable && col.id === 'key_ref';
                          const cellVal  = String(raw ?? '');
                          const copied   = copiedRef === `${rowId}-${col.id}`;

                          return (
                            <td
                              key={`${rowId}-${col.id}-${ci}`}
                              className={`px-2 py-1.5 text-[10px] whitespace-nowrap ${copyable ? 'group relative' : ''}`}
                              style={{
                                textAlign: col.align ?? 'left',
                                overflow: col.id === 'totalCost' ? 'visible' : undefined,
                                position: col.id === 'totalCost' ? 'relative' : undefined,
                              }}
                              onContextMenu={copyable ? e => handleCopy(e, cellVal, `${rowId}-${col.id}`) : undefined}
                            >
                              <div className="flex items-center gap-1">
                                {display}
                                {copyable && (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-200"
                                    onClick={e => handleCopy(e, cellVal, `${rowId}-${col.id}`)}
                                    title={t('summaryCostTable.copyToClipboard')}
                                  >
                                    <Copy size={9} style={{ color: copied ? '#22c55e' : '#0B2863' }} />
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* expanded row */}
                      {expanded && (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-0 py-0">
                            <div className="px-3 py-2 border-t bg-gray-50" style={{ borderColor: '#e2e8f0' }}>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {/* Order */}
                                <div className="rounded-lg overflow-hidden border border-gray-200">
                                  <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-100">
                                    <p className="m-0 text-[9px] font-medium text-gray-500 uppercase tracking-wide">
                                      {t('summaryCostTable.details.order')}
                                    </p>
                                  </div>
                                  <div className="bg-white">
                                    {[
                                      { lbl: t('summaryCostTable.details.reference'), val: <span className="text-[#0B2863] font-medium">{row.key_ref}</span> },
                                      { lbl: t('summaryCostTable.details.date'),      val: parseLocalDate(row.date).toLocaleDateString() },
                                      { lbl: t('summaryCostTable.details.customer'),  val: row.client },
                                      { lbl: t('summaryCostTable.details.location'),  val: row.state },
                                      { lbl: t('summaryCostTable.details.status'),    val: row.status ?? 'N/A' },
                                      { lbl: t('summaryCostTable.details.customerFactory'), val: row.customer_name ?? 'N/A' },
                                      { lbl: t('summaryCostTable.details.income'),    val: <span className="text-green-600 font-medium">{fmt(row.summary?.rentingCost ?? row.income ?? 0)}</span> },
                                      { lbl: t('summaryCostTable.details.expense'),   val: <span className="text-red-600 font-medium">{fmt(row.summary?.expense ?? 0)}</span> },
                                    ].map((item, i) => (
                                      <div key={i} className={`flex items-center justify-between gap-3 px-2 py-1.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">{item.lbl}</span>
                                        <span className="text-[10px] text-gray-800 text-right">{item.val}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Breakdown */}
                                <div className="rounded-lg overflow-hidden border border-gray-200">
                                  <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-100">
                                    <p className="m-0 text-[9px] font-medium text-gray-500 uppercase tracking-wide">
                                      {t('summaryCostTable.details.summaryBreakdown')}
                                    </p>
                                  </div>
                                  <div className="bg-white">
                                    {[
                                      { lbl: t('summaryCostTable.details.fuelCost'),       val: fmt(row.summary?.fuelCost ?? 0),       sub: row.summary?.fuel_costs?.length, color: '#633806' },
                                      { lbl: t('summaryCostTable.details.workCost'),       val: fmt(row.summary?.workCost ?? 0),       sub: row.summary?.work_costs?.length, color: '#0C447C' },
                                      { lbl: t('summaryCostTable.details.driverSalaries'), val: fmt(row.summary?.driverSalaries ?? 0), color: '#27500A' },
                                      { lbl: t('summaryCostTable.details.otherSalaries'),  val: fmt(row.summary?.otherSalaries ?? 0),  color: '#27500A' },
                                      { lbl: t('summaryCostTable.details.bonus'),          val: fmt(row.summary?.bonus ?? 0),          color: '#72243E' },
                                    ].map((item, i) => (
                                      <div key={i} className={`flex items-center justify-between gap-3 px-2 py-1.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                                          {item.lbl}
                                          {(item.sub ?? 0) > 0 && <span className="ml-1 text-[9px] text-gray-300">({item.sub})</span>}
                                        </span>
                                        <span className="text-[10px] font-medium" style={{ color: item.color }}>{item.val}</span>
                                      </div>
                                    ))}
                                    <div className="flex items-center justify-between gap-3 px-2 py-1.5 border-t border-gray-200 bg-gray-50">
                                      <span className="text-[10px] font-medium text-[#0B2863]">{t('summaryCostTable.details.totalCost')}</span>
                                      <span className="text-[11px] font-medium text-[#0B2863]">{fmt(row.summary?.totalCost ?? 0)}</span>
                                    </div>
                                    {row.summary?.net_profit !== undefined && (
                                      <div className="flex items-center justify-between gap-3 px-2 py-1.5 border-t border-gray-100">
                                        <span className="text-[10px] font-medium text-gray-500">{t('summaryCostTable.details.netProfit')}</span>
                                        <span className={`text-[11px] font-medium ${(row.summary.net_profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {fmt(row.summary.net_profit ?? 0)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Detail */}
                                <div className="rounded-lg overflow-hidden border border-gray-200">
                                  <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-100">
                                    <p className="m-0 text-[9px] font-medium text-gray-500 uppercase tracking-wide">
                                      {t('summaryCostTable.details.additional')}
                                    </p>
                                  </div>
                                  <div className="bg-white p-2 flex flex-col gap-2">
                                    {(row.summary?.fuel_costs?.length ?? 0) > 0 && (
                                      <div>
                                        <p className="m-0 mb-1 text-[10px] font-medium text-[#633806]">{t('summaryCostTable.details.fuelCost')}</p>
                                        <table className="w-full text-[9px] border-collapse">
                                          <thead className="bg-[#FAEEDA]">
                                            <tr>
                                              <th className="p-1 text-left font-medium text-[#633806]">Truck</th>
                                              <th className="p-1 text-right font-medium text-[#633806]">Dist.</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {row.summary!.fuel_costs!.map(fc => (
                                              <tr key={fc.id_order_cost_fuel} className="border-t border-[#FAC775]">
                                                <td className="p-1 text-gray-700">{fc.truck}</td>
                                                <td className="p-1 text-right font-medium text-[#633806]">{fmt(fc.cost_fuel_distributed)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                    {(row.summary?.work_costs?.length ?? 0) > 0 && (
                                      <div>
                                        <p className="m-0 mb-1 text-[10px] font-medium text-[#0C447C]">{t('summaryCostTable.details.workCost')}</p>
                                        <table className="w-full text-[9px] border-collapse">
                                          <thead className="bg-[#E6F1FB]">
                                            <tr>
                                              <th className="p-1 text-left font-medium text-[#0C447C]">Name</th>
                                              <th className="p-1 text-right font-medium text-[#0C447C]">Cost</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {row.summary!.work_costs!.map(wc => (
                                              <tr key={wc.id_workCost} className="border-t border-[#85B7EB]">
                                                <td className="p-1 text-gray-700">{wc.name}</td>
                                                <td className="p-1 text-right font-medium text-[#0C447C]">{fmt(wc.cost)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                    {(row.summary?.fuel_costs?.length ?? 0) === 0 && (row.summary?.work_costs?.length ?? 0) === 0 && (
                                      <p className="text-[10px] text-gray-400 m-0">{t('summaryCostTable.empty.tip')}</p>
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="bg-white border-t px-3 py-2 flex items-center justify-between" style={{ borderColor: '#0B2863' }}>
          <span className="text-[10px] text-gray-600">
            {t('summaryCostTable.footer.total', { count: data?.count ?? 0, selected: selectedRows.size })}
          </span>
          <span className="text-[10px] text-gray-600">
            {t('summaryCostTable.footer.showing', { count: sortedData.length })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCostDataTable;