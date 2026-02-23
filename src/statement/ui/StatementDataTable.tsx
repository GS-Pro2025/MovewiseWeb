/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Inbox, FileX } from 'lucide-react';
import { Select, MenuItem } from '@mui/material';
import { StatementRecord } from '../domain/StatementModels';
import { updateStatementState } from '../data/StatementRepository';
import { useSnackbar } from 'notistack';
import  LoadingSpinner from '../../components/Login_Register/LoadingSpinner';

interface StatementDataTableProps {
  data: StatementRecord[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalRows: number;
  selectedRows: StatementRecord[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRowSelect: (row: StatementRecord) => void;
  onSelectAll: (selectAll: boolean) => void;
  onStateUpdated?: (updated: StatementRecord) => void;
}

export const StatementDataTable: React.FC<StatementDataTableProps> = ({
  data, loading, page, rowsPerPage, totalRows, selectedRows,
  onPageChange, onRowsPerPageChange, onRowSelect, onSelectAll, onStateUpdated,
}) => {
  const { t } = useTranslation();
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [updatingIds, setUpdatingIds] = React.useState<Set<number>>(new Set());

  const isSelected = useCallback((row: StatementRecord) =>
    selectedRows.some(selected => selected.id === row.id), [selectedRows]);

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;

  const formatCurrency = (value: string | undefined): string => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
      .format(parseFloat(value));
  };

  const getStateColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case 'processed':  return { backgroundColor: '#22c55e', color: 'white' };
      case 'exists':     return { backgroundColor: '#F09F52', color: 'white' };
      case 'not_exists': return { backgroundColor: '#ef4444', color: 'white' };
      default:           return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

  const handleCopyToClipboard = useCallback(async (e: React.MouseEvent, value: string, rowId: string) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopiedRef(rowId);
      setTimeout(() => setCopiedRef(null), 2000);
    } catch (err) { console.error('Failed to copy:', err); }
  }, []);

  const setRowUpdating = (id: number, v: boolean) => {
    setUpdatingIds(prev => { const s = new Set(prev); if (v) s.add(id); else s.delete(id); return s; });
  };

  const handleStateChange = async (row: StatementRecord, newState: 'Exists' | 'Not_exists' | 'Processed') => {
    if (!row || row.state === newState) return;
    setRowUpdating(row.id, true);
    try {
      const updated = await updateStatementState(row.id, newState);
      onStateUpdated?.(updated);
    } catch (err: any) {
      enqueueSnackbar(err?.message || t('statementTable.failedUpdateState'), { variant: 'error' });
    } finally {
      setRowUpdating(row.id, false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: 400 }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden" style={{ borderColor: '#0B2863' }}>
      <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
        <table className="w-full">
          <thead className="sticky top-0 z-10 text-white" style={{ backgroundColor: '#0B2863' }}>
            <tr>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" className="rounded border-2 border-white"
                  checked={isAllSelected} onChange={(e) => onSelectAll(e.target.checked)} disabled={data.length === 0} />
              </th>
              <th className="px-4 py-3 text-left font-bold text-sm whitespace-nowrap" style={{ minWidth: 120 }}>
                {t('statementTable.keyRef')}
              </th>
              <th className="px-4 py-3 text-center font-bold text-sm whitespace-nowrap" style={{ minWidth: 100 }}>
                {t('statementTable.week')}
              </th>
              <th className="px-4 py-3 text-left font-bold text-sm whitespace-nowrap" style={{ minWidth: 150 }}>
                {t('statementTable.shipper')}
              </th>
              <th className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap" style={{ minWidth: 120 }}>
                {t('statementTable.income')}
              </th>
              <th className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap" style={{ minWidth: 120 }}>
                {t('statementTable.expense')}
              </th>
              <th className="px-4 py-3 text-center font-bold text-sm whitespace-nowrap" style={{ minWidth: 120 }}>
                {t('statementTable.state')}
              </th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="mb-4">
                      <Inbox size={80} style={{ color: '#0B2863', opacity: 0.6 }} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2" style={{ color: '#0B2863' }}>
                        {t('statementTable.noRecordsTitle')}
                      </h3>
                      <p className="text-gray-600 mb-4 max-w-md">{t('statementTable.noRecordsDesc')}</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <FileX size={16} />
                        <span>{t('statementTable.noRecordsTip')}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const isRowSelected = isSelected(row);
                const isCopied = copiedRef === `${row.id}-keyref`;
                return (
                  <tr key={row.id}
                    className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } ${isRowSelected ? 'ring-2 ring-blue-200' : ''}`}
                    style={{ backgroundColor: isRowSelected ? 'rgba(11, 40, 99, 0.08)' : undefined }}
                    onClick={() => onRowSelect(row)}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-2" style={{ borderColor: '#0B2863' }}
                        checked={isRowSelected} onChange={() => onRowSelect(row)}
                        onClick={(e) => e.stopPropagation()} />
                    </td>

                    <td className="px-4 py-3 group relative">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold cursor-pointer hover:underline" style={{ color: '#0B2863' }}>
                          {row.keyref}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-200"
                          onClick={(e) => handleCopyToClipboard(e, row.keyref, `${row.id}-keyref`)}
                          title={t('statementTable.copyToClipboard')}>
                          <Copy size={14} style={{ color: isCopied ? '#22c55e' : '#0B2863' }} />
                        </button>
                      </div>
                      {isCopied && (
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {t('statementTable.copied')}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#0B2863' }}>
                        W{row.week}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-700">{row.shipper_name || 'N/A'}</td>

                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold" style={{ color: '#22c55e' }}>{formatCurrency(row.income)}</span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold" style={{ color: '#ef4444' }}>{formatCurrency(row.expense)}</span>
                    </td>

                    <td className="px-4 py-3 text-center">
                    {updatingIds.has(row.id) ? (
  <div className="flex items-center justify-center"><LoadingSpinner /></div>
): (
                        <Select
                          value={row.state || ''}
                          onChange={(e) => handleStateChange(row, e.target.value as 'Exists' | 'Not_exists' | 'Processed')}
                          size="small"
                          aria-label={t('statementTable.stateLabel', { keyref: row.keyref })}
                          renderValue={(val) => {
                            const v = String(val || 'Unknown');
                            const style = getStateColor(v);
                            return (
                              <span style={{ ...style, padding: '4px 10px', borderRadius: 999, fontSize: 12, display: 'inline-block', minWidth: 80, textAlign: 'center' }}>
                                {v}
                              </span>
                            );
                          }}
                          sx={{ minWidth: 140, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
                        >
                          {(['Exists', 'Not_exists', 'Processed'] as const).map((s) => (
                            <MenuItem key={s} value={s}>
                              <span style={{ ...getStateColor(s), padding: '4px 8px', borderRadius: 8, fontSize: 13 }}>{s}</span>
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t-2 px-6 py-4 flex items-center justify-between" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">{t('statementTable.rowsPerPage')}</span>
          <select value={rowsPerPage} onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            className="border-2 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#0B2863' }}>
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalRows)} {t('statementTable.of')} {totalRows}
          </span>
          <div className="flex space-x-2">
            {[
              { label: t('statementTable.previous'), disabled: page === 0, onClick: () => onPageChange(page - 1) },
              { label: t('statementTable.next'), disabled: (page + 1) * rowsPerPage >= totalRows, onClick: () => onPageChange(page + 1) },
            ].map(({ label, disabled, onClick }) => (
              <button key={label} className="px-3 py-1 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: '#0B2863', color: '#0B2863' }}
                disabled={disabled} onClick={onClick}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};