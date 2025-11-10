/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { Copy, Inbox, FileX } from 'lucide-react';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { StatementRecord } from '../domain/statementModels';

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
}

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#0B2863' }}></div>
);

export const StatementDataTable: React.FC<StatementDataTableProps> = ({
  data,
  loading,
  page,
  rowsPerPage,
  totalRows,
  selectedRows,
  onPageChange,
  onRowsPerPageChange,
  onRowSelect,
  onSelectAll
}) => {
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const isSelected = useCallback((row: StatementRecord) => 
    selectedRows.some(selected => selected.id === row.id), 
    [selectedRows]
  );

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;

  const formatCurrency = (value: string | undefined): string => {
    if (!value) return '$0.00';
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };



  const getStateColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case 'processed':
        return { backgroundColor: '#22c55e', color: 'white' };
      case 'exists':
        return { backgroundColor: '#F09F52', color: 'white' };
      case 'not_exists':
        return { backgroundColor: '#ef4444', color: 'white' };
      default:
        return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
                  disabled={data.length === 0}
                />
              </th>
              <th className="px-4 py-3 text-left font-bold text-sm whitespace-nowrap" style={{ minWidth: 120 }}>
                Key Ref
              </th>

              <th className="px-4 py-3 text-center font-bold text-sm whitespace-nowrap" style={{ minWidth: 100 }}>
                Week
              </th>
              <th className="px-4 py-3 text-left font-bold text-sm whitespace-nowrap" style={{ minWidth: 150 }}>
                Shipper
              </th>
              <th className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap" style={{ minWidth: 120 }}>
                Income
              </th>
              <th className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap" style={{ minWidth: 120 }}>
                Expense
              </th>
              <th className="px-4 py-3 text-center font-bold text-sm whitespace-nowrap" style={{ minWidth: 120 }}>
                State
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <LoadingSpinner />
                    <span className="text-gray-500">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16">
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
                        No Statement Records Found
                      </h3>
                      <p className="text-gray-600 mb-4 max-w-md">
                        There are no statement records available for the selected week. 
                        Try adjusting your week selection or filter criteria.
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
              data.map((row, rowIndex) => {
                const isRowSelected = isSelected(row);
                const isCopied = copiedRef === `${row.id}-keyref`;
                
                return (
                  <tr 
                    key={row.id}
                    className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } ${isRowSelected ? 'ring-2 ring-blue-200' : ''}`}
                    style={{ 
                      backgroundColor: isRowSelected ? 'rgba(11, 40, 99, 0.08)' : undefined 
                    }}
                    onClick={() => onRowSelect(row)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-2"
                        style={{ borderColor: '#0B2863' }}
                        checked={isRowSelected}
                        onChange={() => onRowSelect(row)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    
                    <td className="px-4 py-3 group relative">
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-semibold cursor-pointer hover:underline"
                          style={{ color: '#0B2863' }}
                        >
                          {row.keyref}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-200"
                          onClick={(e) => handleCopyToClipboard(e, row.keyref, `${row.id}-keyref`)}
                          title="Copy to clipboard"
                        >
                          <Copy size={14} style={{ color: isCopied ? '#22c55e' : '#0B2863' }} />
                        </button>
                      </div>
                      {isCopied && (
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          Copied!
                        </span>
                      )}
                    </td>
                    
                    
                    <td className="px-4 py-3 text-center">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: '#0B2863' }}
                      >
                        W{row.week}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-gray-700">
                      {row.shipper_name || 'N/A'}
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <span 
                        className="font-semibold"
                        style={{ color: '#22c55e' }}
                      >
                        {formatCurrency(row.income)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <span 
                        className="font-semibold"
                        style={{ color: '#ef4444' }}
                      >
                        {formatCurrency(row.expense)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-center">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={getStateColor(row.state)}
                      >
                        {row.state || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination - Exact same styling as DataTable */}
      <div className="bg-white border-t-2 px-6 py-4 flex items-center justify-between" style={{ borderColor: '#0B2863' }}>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">Rows per page:</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            className="border-2 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#0B2863' }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
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
};