import React, { useState } from 'react';
import { Check, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import OperatorsTable from './operatorsTable';
import type { TableData } from '../domain/TableData';

interface Column {
  id: keyof TableData | 'actions' | 'expand';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: string | number | null | undefined | unknown) => string | React.ReactNode;
}

const columns: Column[] = [
  { id: 'expand', label: '', minWidth: 50, align: 'center' },
  { id: 'actions', label: 'Actions', minWidth: 80, align: 'center' },
  { 
    id: 'status', 
    label: 'Status', 
    minWidth: 100,
    format: (value: string | number | null | undefined | unknown) => {
      const status = String(value || '');
      const getStatusStyle = (status: string) => {
        switch (status) {
          case 'finished':
            return { backgroundColor: '#22c55e', color: 'white' };
          case 'pending':
            return { backgroundColor: '#F09F52', color: 'white' };
          case 'inactive':
            return { backgroundColor: '#ef4444', color: 'white' };
          default:
            return { backgroundColor: '#6b7280', color: 'white' };
        }
      };
      const style = getStatusStyle(status);
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={style}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    }
  },
  { id: 'key_ref', label: 'Reference', minWidth: 100 },
  { id: 'firstName', label: 'First Name', minWidth: 100 },
  { id: 'lastName', label: 'Last Name', minWidth: 100 },
  { id: 'email', label: 'Email', minWidth: 120 },
  { 
    id: 'phone', 
    label: 'Phone', 
    minWidth: 120,
    format: (value: string | number | null | undefined | unknown) => {
      const phone = String(value || '');
      return phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'N/A';
    }
  },
  { id: 'company', label: 'Company', minWidth: 120 },
  { id: 'city', label: 'City', minWidth: 100 },
  { id: 'state', label: 'State', minWidth: 100 },
  { id: 'weekday', label: 'Weekday', minWidth: 100 },
  { id: 'dateReference', label: 'Date', minWidth: 120 },
  { id: 'job', label: 'Job', minWidth: 120 },
  { 
    id: 'weight', 
    label: 'Weight', 
    minWidth: 100,
    format: (value: string | number | null | undefined | unknown) => String(value || 'N/A')
  },
  { 
    id: 'truckType', 
    label: 'Truck Type', 
    minWidth: 120,
    format: (value: string | number | null | undefined | unknown) => String(value || 'N/A')
  },
  { 
    id: 'distance', 
    label: 'Distance (mi)', 
    minWidth: 120,
    format: (value: string | number | null | undefined | unknown) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')} mi` : 'N/A';
    }
  },
  { 
    id: 'expense', 
    label: 'Expense', 
    minWidth: 120,
    format: (value: string | number | null | undefined | unknown) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')}` : 'N/A';
    }
  },
  { 
    id: 'income', 
    label: 'Income', 
    minWidth: 120,
    format: (value: string | number | null | undefined | unknown) => {
      const num = Number(value);
      return num ? `${num.toLocaleString('en-US')}` : 'N/A';
    }
  },
  { 
    id: 'totalCost', 
    label: 'Total Cost', 
    minWidth: 120,
    format: (value: string | number | null | undefined | unknown) => {
      const num = Number(value || 0);
      return `${num.toLocaleString('en-US')}`;
    }
  },
  { id: 'week', label: 'Week of Year', minWidth: 100 },
  { 
    id: 'payStatus', 
    label: 'Pay Status', 
    minWidth: 120,
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
}

const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#0B2863' }}></div>
);

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
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleExpandClick = (rowId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  const isSelected = (row: TableData) => selectedRows.some(selected => selected.id === row.id);
  const isAllSelected = data.length > 0 && selectedRows.length === data.length;

  // Helper function to safely get value from TableData
  const getColumnValue = (row: TableData, columnId: keyof TableData): unknown => {
    return row[columnId];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden" style={{ borderColor: '#0B2863' }}>
      {/* Table Container */}
      <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
        <table className="w-full">
          {/* Table Header */}
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
              {columns.map((column, index) => (
                <th
                  key={`header-${String(column.id)}-${index}`}
                  className={`px-4 py-3 text-${column.align || 'left'} font-bold text-sm whitespace-nowrap`}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
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
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-12">
                  <div className="text-gray-500">
                    <p className="text-lg font-semibold">No data available</p>
                    <p className="text-sm">Try adjusting your filters or create a new order</p>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {data.map((row, rowIndex) => {
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
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-2"
                            style={{ borderColor: '#0B2863' }}
                            checked={isRowSelected}
                            onChange={() => onRowSelect(row)}
                          />
                        </td>
                        
                        {/* Expand/Collapse */}
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
                        
                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
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
                        </td>
                        
                        {/* Data columns */}
                        {columns.slice(2).map((column, columnIndex) => {
                          const value = getColumnValue(row, column.id as keyof TableData);
                          let displayValue: React.ReactNode;
                          
                          if (column.format) {
                            displayValue = column.format(value);
                          } else {
                            // Handle different types safely
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
                          
                          return (
                            <td key={`${row.id}-${String(column.id)}-${columnIndex}`} className={`px-4 py-3 text-${column.align || 'left'} whitespace-nowrap`}>
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                      
                      {/* Expanded row for operators */}
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
      
      {/* Pagination */}
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
};