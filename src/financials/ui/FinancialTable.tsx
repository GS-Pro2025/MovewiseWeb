// components/FinancialTable.tsx
import React, { useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Collapse,
  Typography,
  Divider,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PaymentIcon from '@mui/icons-material/AttachMoney';
// Reemplazar InboxIcon con Lucide
import { 
  Inbox, 
  Lightbulb, 
  ClipboardList,
  TrendingUp,
  Fuel,
  Wrench,
  Users,
  UserCheck
} from 'lucide-react';
import { SuperOrder } from '../domain/ModelsOCR';
import OrdersByKeyRefTable from './OrdersByKeyRefTable';

// Column Configuration
const columns = [
  { key: 'key_ref' as keyof SuperOrder, label: 'Reference', sortable: true },
  { key: 'totalProfit' as keyof SuperOrder, label: 'Profit', sortable: true },
  { key: 'payStatus' as keyof SuperOrder, label: 'Status', sortable: true },
  { key: null, label: 'Actions', sortable: false },
  { key: 'totalIncome' as keyof SuperOrder, label: 'Income', sortable: true },
  { key: 'totalCost' as keyof SuperOrder, label: 'Cost', sortable: true },
  { key: 'client' as keyof SuperOrder, label: 'Client', sortable: true },
  { key: null, label: 'Details', sortable: false },
];

interface FinancialTableProps {
  data: SuperOrder[];
  sortBy: keyof SuperOrder;
  sortOrder: 'asc' | 'desc';
  expandedRows: Set<string>;
  onSort: (column: keyof SuperOrder) => void;
  onToggleExpand: (keyRef: string) => void;
  onPayOrder: (superOrder: SuperOrder) => void;
  onViewDetails: (superOrder: SuperOrder) => void;
  onOrderPaid: () => void;
  onViewOperators: (orderId: string) => void;
}

const FinancialTable: React.FC<FinancialTableProps> = ({
  data,
  sortBy,
  sortOrder,
  expandedRows,
  onSort,
  onToggleExpand,
  onPayOrder,
  onViewDetails,
  onOrderPaid,
  onViewOperators
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Removed auto-scroll behavior - user controls scroll manually

  const ProfitChip = ({ profit }: { profit: number }) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white min-w-[80px] justify-center shadow-md ${
        profit >= 0 
          ? 'bg-green-500 hover:bg-green-600' 
          : 'bg-red-500 hover:bg-red-600'
      } transition-colors duration-200`}
    >
      ${profit.toLocaleString()}
    </span>
  );

  const PayStatusChip = ({ paid }: { paid: boolean }) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
        paid 
          ? 'bg-green-500 text-white' 
          : 'bg-yellow-400 text-gray-800'
      } transition-colors duration-200`}
      style={{
        backgroundColor: paid ? '#22c55e' : '#FFE67B',
        color: paid ? '#ffffff' : '#0B2863'
      }}
    >
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  );

  const ActionButton = ({ 
    onClick, 
    disabled, 
    children 
  }: { 
    onClick: (e: React.MouseEvent) => void, 
    disabled: boolean, 
    children: React.ReactNode 
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 min-w-[80px] justify-center ${
        disabled
          ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
          : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
      }`}
    >
      {children}
    </button>
  );

  const ViewButton = ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => (
    <button
      onClick={onClick}
      className="px-3 py-1 text-sm font-semibold border-2 rounded-lg transition-all duration-200 hover:shadow-md"
      style={{
        color: '#0B2863',
        borderColor: '#0B2863',
        backgroundColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#0B2863';
        e.currentTarget.style.color = '#ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#0B2863';
      }}
    >
      View
    </button>
  );

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={tableContainerRef}
        className="rounded-2xl shadow-lg border border-gray-100 bg-white overflow-auto max-h-[70vh] min-h-[400px]"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#0B2863 #f1f5f9'
        }}
      >
        <style>
          {`
            .financial-table-container::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            .financial-table-container::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 4px;
            }
            .financial-table-container::-webkit-scrollbar-thumb {
              background: #0B2863;
              border-radius: 4px;
            }
            .financial-table-container::-webkit-scrollbar-thumb:hover {
              background: #FFE67B;
            }
          `}
        </style>
        
        {data.length > 0 ? (
          <Table sx={{ minWidth: 800 }} stickyHeader>
            {/* Header */}
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell
                    key={index}
                    className="!border-none !py-5 !px-4 !sticky !top-0 !z-10"
                    style={{ 
                      position: 'sticky', 
                      top: 0, 
                      zIndex: 10,
                      backgroundColor: '#0B2863',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: 'none',
                      padding: '20px 16px'
                    }}
                  >
                    {column.sortable && column.key ? (
                      <TableSortLabel
                        active={sortBy === column.key}
                        direction={sortBy === column.key ? sortOrder : 'asc'}
                        onClick={() => column.key && onSort(column.key)}
                        sx={{ 
                          color: '#ffffff !important', 
                          '&:hover': { color: '#FFE67B !important' },
                          '& .MuiTableSortLabel-icon': { 
                            color: '#ffffff !important',
                            '&:hover': { color: '#FFE67B !important' }
                          }
                        }}
                      >
                        <span className="text-white font-bold hover:text-yellow-300 transition-colors">
                          {column.label}
                        </span>
                      </TableSortLabel>
                    ) : (
                      <span className="text-white font-bold">{column.label}</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* Body */}
            <TableBody>
              {data.map((superOrder, index) => (
                <React.Fragment key={superOrder.key_ref}>
                  {/* Main Row */}
                  <TableRow 
                    className="transition-colors duration-200"
                    style={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e0f2fe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                    }}
                  >
                    {/* Reference */}
                    <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                      <Typography 
                        variant="body2" 
                        className="font-semibold truncate max-w-[120px]"
                        style={{ color: '#0B2863' }}
                        title={superOrder.key_ref}
                      >
                        {superOrder.key_ref}
                      </Typography>
                    </TableCell>

                    {/* Profit */}
                    <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                      <ProfitChip profit={superOrder.totalProfit} />
                    </TableCell>

                    {/* Pay Status */}
                    <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                      <PayStatusChip paid={superOrder.payStatus === 1} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onPayOrder(superOrder);
                        }}
                        disabled={superOrder.payStatus === 1}
                      >
                        <PaymentIcon sx={{ fontSize: 16 }} />
                        Pay
                      </ActionButton>
                    </TableCell>

                    {/* Income */}
                    <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                      <Typography variant="body2" className="font-semibold" style={{ color: '#0B2863' }}>
                        ${superOrder.totalIncome.toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* Total Cost */}
                    <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                      <Typography variant="body2" className="font-semibold" style={{ color: '#0B2863' }}>
                        ${superOrder.totalCost.toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* Client */}
                    <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                      <Typography 
                        variant="body2" 
                        className="truncate max-w-[180px]"
                        style={{ color: '#0B2863' }}
                        title={superOrder.client}
                      >
                        {superOrder.client}
                      </Typography>
                    </TableCell>

                    {/* Details */}
                    <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                      <div className="flex items-center gap-2">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(superOrder.key_ref);
                          }}
                          size="small"
                          className="!transition-all !duration-200 hover:!scale-110"
                          style={{ color: '#0B2863' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFE67B';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {expandedRows.has(superOrder.key_ref) ? 
                            <KeyboardArrowUpIcon /> : 
                            <KeyboardArrowDownIcon />
                          }
                        </IconButton>
                        <ViewButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(superOrder);
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row Details */}
                  <TableRow>
                    <TableCell 
                      colSpan={8}
                      className="!p-0 !border-none"
                      style={{ backgroundColor: '#f8fafc' }}
                    >
                      <Collapse 
                        in={expandedRows.has(superOrder.key_ref)} 
                        timeout={300}
                        unmountOnExit
                      >
                        <div className="m-4">
                          <div className="bg-white rounded-xl shadow-lg overflow-visible border" 
                               style={{ borderColor: '#0B2863' }}>
                            <div className="p-6">
                              {/* Header */}
                              <div className="flex items-center gap-3 mb-6">
                                <ClipboardList 
                                  size={28} 
                                  style={{ color: '#0B2863' }}
                                />
                                <Typography 
                                  variant="h6" 
                                  className="!font-semibold"
                                  style={{ color: '#0B2863' }}
                                >
                                  Cost Breakdown - {superOrder.key_ref}
                                </Typography>
                              </div>
                              
                              {/* Cost Breakdown Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                                <div className="text-center p-4 rounded-xl border-2" 
                                     style={{ 
                                       backgroundColor: '#fef2f2', 
                                       borderColor: '#ef4444' 
                                     }}>
                                  <div className="flex items-center justify-center mb-2">
                                    <TrendingUp size={20} style={{ color: '#ef4444' }} />
                                  </div>
                                  <Typography variant="caption" className="!text-gray-600 !font-semibold !block !mb-1">
                                    Expense
                                  </Typography>
                                  <Typography variant="h6" className="!font-bold" style={{ color: '#ef4444' }}>
                                    ${superOrder.expense.toLocaleString()}
                                  </Typography>
                                </div>
                                
                                <div className="text-center p-4 rounded-xl border-2" 
                                     style={{ 
                                       backgroundColor: '#fff7ed', 
                                       borderColor: '#FFE67B' 
                                     }}>
                                  <div className="flex items-center justify-center mb-2">
                                    <Fuel size={20} style={{ color: '#0B2863' }} />
                                  </div>
                                  <Typography variant="caption" className="!font-semibold !block !mb-1"
                                             style={{ color: '#0B2863' }}>
                                    Fuel Cost
                                  </Typography>
                                  <Typography variant="h6" className="!font-bold" style={{ color: '#0B2863' }}>
                                    ${superOrder.fuelCost.toLocaleString()}
                                  </Typography>
                                </div>
                                
                                <div className="text-center p-4 rounded-xl border-2" 
                                     style={{ 
                                       backgroundColor: '#eff6ff', 
                                       borderColor: '#0B2863' 
                                     }}>
                                  <div className="flex items-center justify-center mb-2">
                                    <Wrench size={20} style={{ color: '#0B2863' }} />
                                  </div>
                                  <Typography variant="caption" className="!font-semibold !block !mb-1"
                                             style={{ color: '#0B2863' }}>
                                    Work Cost
                                  </Typography>
                                  <Typography variant="h6" className="!font-bold" style={{ color: '#0B2863' }}>
                                    ${superOrder.workCost.toLocaleString()}
                                  </Typography>
                                </div>
                                
                                <div className="text-center p-4 rounded-xl border-2" 
                                     style={{ 
                                       backgroundColor: '#f0fdf4', 
                                       borderColor: '#22c55e' 
                                     }}>
                                  <div className="flex items-center justify-center mb-2">
                                    <UserCheck size={20} style={{ color: '#22c55e' }} />
                                  </div>
                                  <Typography variant="caption" className="!text-gray-600 !font-semibold !block !mb-1">
                                    Driver Salaries
                                  </Typography>
                                  <Typography variant="h6" className="!font-bold" style={{ color: '#22c55e' }}>
                                    ${superOrder.driverSalaries.toLocaleString()}
                                  </Typography>
                                </div>
                                
                                <div className="text-center p-4 rounded-xl border-2" 
                                     style={{ 
                                       backgroundColor: '#fefce8', 
                                       borderColor: '#FFE67B' 
                                     }}>
                                  <div className="flex items-center justify-center mb-2">
                                    <Users size={20} style={{ color: '#0B2863' }} />
                                  </div>
                                  <Typography variant="caption" className="!font-semibold !block !mb-1"
                                             style={{ color: '#0B2863' }}>
                                    Operator Salaries
                                  </Typography>
                                  <Typography variant="h6" className="!font-bold" style={{ color: '#0B2863' }}>
                                    ${superOrder.otherSalaries.toLocaleString()}
                                  </Typography>
                                </div>
                              </div>
                              
                              <Divider className="!my-6" style={{ borderColor: '#0B2863' }} />
                              
                              {/* Orders Table with scroll */}
                              <div className="overflow-auto max-h-[400px] rounded-lg border"
                                   style={{ 
                                     borderColor: '#0B2863',
                                     scrollbarWidth: 'thin',
                                     scrollbarColor: '#0B2863 #f1f5f9'
                                   }}>
                                <OrdersByKeyRefTable
                                  orders={superOrder.orders}
                                  keyRef={superOrder.key_ref}
                                  onOrderPaid={onOrderPaid}
                                  onViewOperators={onViewOperators}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="mb-6">
              <Inbox 
                size={80}
                style={{ color: '#0B2863', opacity: 0.6 }}
              />
            </div>
            <Typography 
              variant="h5" 
              className="!font-bold !mb-3"
              style={{ color: '#0B2863' }}
            >
              No Financial Records Found
            </Typography>
            <Typography 
              variant="body1" 
              className="!text-gray-600 !mb-4 !max-w-md"
            >
              There are no financial records available for the selected filters. 
              Try adjusting your search criteria or check back later.
            </Typography>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lightbulb size={16} />
              <span>Tip: Use the filters above to refine your search</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Table Footer Info */}
      <div className="flex justify-between items-center mt-4 px-4 text-sm" style={{ color: '#0B2863' }}>
        <span className="font-medium">
          Showing {data.length} order{data.length !== 1 ? 's' : ''}
        </span>
        {data.length > 0 && (
          <span className="flex items-center gap-1">
            <Lightbulb size={16} />
            <span>Use horizontal scroll for more details</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default FinancialTable;