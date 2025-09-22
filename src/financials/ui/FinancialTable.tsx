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
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Chip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PaymentIcon from '@mui/icons-material/AttachMoney';
import { 
  Inbox, 
  Lightbulb, 
  ClipboardList,
  TrendingUp,
  Fuel,
  Wrench,
  Users,
  UserCheck,
  User,
  Eye
} from 'lucide-react';
import { SuperOrder } from '../domain/ModelsOCR';
import OrdersByKeyRefTable from './OrdersByKeyRefTable';

// Column Configuration - ACTUALIZADA
const columns = [
  { key: 'key_ref' as keyof SuperOrder, label: 'Reference', sortable: true },
  { key: 'client' as keyof SuperOrder, label: 'Client', sortable: true },
  { key: 'expense' as keyof SuperOrder, label: 'Expense', sortable: true },
  { key: 'otherSalaries' as keyof SuperOrder, label: 'Operator Salaries', sortable: true },
  { key: 'workCost' as keyof SuperOrder, label: 'Work Cost', sortable: true },
  { key: 'driverSalaries' as keyof SuperOrder, label: 'Driver Salaries', sortable: true },
  { key: null, label: 'Total Discount', sortable: false }, // Campo calculado
  { key: 'totalIncome' as keyof SuperOrder, label: 'Total Income', sortable: true },
  { key: 'totalProfit' as keyof SuperOrder, label: 'Profit', sortable: true },
  { key: null, label: 'Status', sortable: false },
  { key: null, label: 'Actions', sortable: false },
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
    <Chip
      label={paid ? 'Paid' : 'Unpaid'}
      size={isMobile ? 'small' : 'medium'}
      sx={{
        backgroundColor: paid ? '#22c55e' : '#FFE67B',
        color: paid ? '#ffffff' : '#0B2863',
        fontWeight: 600,
        '&:hover': {
          backgroundColor: paid ? '#16a34a' : '#fbbf24'
        }
      }}
    />
  );

  const ActionButton = ({ 
    onClick, 
    disabled, 
    children,
    size = 'medium'
  }: { 
    onClick: (e: React.MouseEvent) => void, 
    disabled: boolean, 
    children: React.ReactNode,
    size?: 'small' | 'medium'
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 ${size === 'small' ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-xl font-semibold transition-all duration-200 justify-center ${
        disabled
          ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
          : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
      }`}
      style={{ minWidth: size === 'small' ? '60px' : '80px' }}
    >
      {children}
    </button>
  );

  const ViewButton = ({ 
    onClick,
    size = 'medium'
  }: { 
    onClick: (e: React.MouseEvent) => void,
    size?: 'small' | 'medium'
  }) => (
    <button
      onClick={onClick}
      className={`${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} font-semibold border-2 rounded-lg transition-all duration-200 hover:shadow-md`}
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
      {size === 'small' ? <Eye size={14} /> : 'View'}
    </button>
  );

  // Mobile Card Component
  const MobileOrderCard = ({ superOrder, index }: { superOrder: SuperOrder, index: number }) => {
    const totalDiscount = superOrder.expense + superOrder.driverSalaries + superOrder.otherSalaries + superOrder.fuelCost;
    
    return (
      <Card 
        key={superOrder.key_ref}
        className="mb-4"
        sx={{
          borderRadius: 4,
          border: '2px solid',
          borderColor: '#0B2863',
          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.2s'
        }}
      >
        <CardContent sx={{ padding: '16px' }}>
          {/* Header actualizado */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <Typography 
                variant="h6" 
                className="!font-bold !text-lg"
                style={{ color: '#0B2863' }}
              >
                {superOrder.key_ref}
              </Typography>
              <Typography 
                variant="body2" 
                className="!text-gray-600 !mt-1"
              >
                <User size={14} className="inline mr-1" />
                {superOrder.client}
              </Typography>
            </div>
            <div className="flex flex-col items-end gap-2">
              <PayStatusChip paid={superOrder.payStatus === 1} />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(superOrder.key_ref);
                }}
                size="small"
                style={{ color: '#0B2863' }}
              >
                {expandedRows.has(superOrder.key_ref) ? 
                  <KeyboardArrowUpIcon /> : 
                  <KeyboardArrowDownIcon />
                }
              </IconButton>
            </div>
          </div>

          {/* Grid actualizado con nuevos campos */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg border-2" style={{ backgroundColor: '#fef2f2', borderColor: '#ef4444' }}>
              <Typography variant="caption" className="!block !text-gray-600 !font-semibold">Expense</Typography>
              <Typography variant="body2" className="!font-bold" style={{ color: '#ef4444' }}>
                ${superOrder.expense.toLocaleString()}
              </Typography>
            </div>
            
            <div className="text-center p-2 rounded-lg border-2" style={{ backgroundColor: '#f0fdf4', borderColor: '#22c55e' }}>
              <Typography variant="caption" className="!block !text-gray-600 !font-semibold">Driver Salaries</Typography>
              <Typography variant="body2" className="!font-bold" style={{ color: '#22c55e' }}>
                ${superOrder.driverSalaries.toLocaleString()}
              </Typography>
            </div>
            
            <div className="text-center p-2 rounded-lg border-2" style={{ backgroundColor: '#eff6ff', borderColor: '#0B2863' }}>
              <Typography variant="caption" className="!block !text-gray-600 !font-semibold">Work Cost</Typography>
              <Typography variant="body2" className="!font-bold" style={{ color: '#0B2863' }}>
                ${superOrder.workCost.toLocaleString()}
              </Typography>
            </div>
            
            <div className="text-center p-2 rounded-lg border-2" style={{ backgroundColor: '#fefce8', borderColor: '#f59e0b' }}>
              <Typography variant="caption" className="!block !text-gray-600 !font-semibold">Total Discount</Typography>
              <Typography variant="body2" className="!font-bold" style={{ color: '#f59e0b' }}>
                ${totalDiscount.toLocaleString()}
              </Typography>
            </div>
          </div>

          {/* Profit */}
          <div className="text-center mb-4">
            <Typography variant="caption" className="!block !text-gray-600 !font-semibold !mb-2">Net Profit</Typography>
            <ProfitChip profit={superOrder.totalProfit} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <ActionButton
              onClick={(e) => {
                e.stopPropagation();
                onPayOrder(superOrder);
              }}
              disabled={superOrder.payStatus === 1}
              size="small"
            >
              <PaymentIcon sx={{ fontSize: 14 }} />
              Pay
            </ActionButton>
            
            <ViewButton
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(superOrder);
              }}
              size="small"
            />
          </div>

          {/* Expanded Content */}
          <Collapse 
            in={expandedRows.has(superOrder.key_ref)} 
            timeout={300}
            unmountOnExit
          >
            <Divider sx={{ my: 2 }} />
            <div className="space-y-3">
              {/* Cost Breakdown */}
              <Typography variant="subtitle2" className="!font-semibold" style={{ color: '#0B2863' }}>
                Cost Breakdown
              </Typography>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded border" style={{ backgroundColor: '#fff7ed' }}>
                  <Fuel size={16} className="mx-auto mb-1" style={{ color: '#0B2863' }} />
                  <Typography variant="caption" className="!block !font-semibold">Fuel</Typography>
                  <Typography variant="caption" className="!block">${superOrder.fuelCost.toLocaleString()}</Typography>
                </div>
                <div className="text-center p-2 rounded border" style={{ backgroundColor: '#eff6ff' }}>
                  <Wrench size={16} className="mx-auto mb-1" style={{ color: '#0B2863' }} />
                  <Typography variant="caption" className="!block !font-semibold">Work</Typography>
                  <Typography variant="caption" className="!block">${superOrder.workCost.toLocaleString()}</Typography>
                </div>
                <div className="text-center p-2 rounded border" style={{ backgroundColor: '#f0fdf4' }}>
                  <UserCheck size={16} className="mx-auto mb-1" style={{ color: '#22c55e' }} />
                  <Typography variant="caption" className="!block !font-semibold">Drivers</Typography>
                  <Typography variant="caption" className="!block">${superOrder.driverSalaries.toLocaleString()}</Typography>
                </div>
                <div className="text-center p-2 rounded border" style={{ backgroundColor: '#fefce8' }}>
                  <Users size={16} className="mx-auto mb-1" style={{ color: '#0B2863' }} />
                  <Typography variant="caption" className="!block !font-semibold">Operators</Typography>
                  <Typography variant="caption" className="!block">${superOrder.otherSalaries.toLocaleString()}</Typography>
                </div>
              </div>
              
              {/* Orders Table */}
              <div className="max-h-[300px] overflow-auto rounded border" style={{ borderColor: '#0B2863' }}>
                <OrdersByKeyRefTable
                  orders={superOrder.orders}
                  keyRef={superOrder.key_ref}
                  onOrderPaid={onOrderPaid}
                  onViewOperators={onViewOperators}
                />
              </div>
            </div>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      {data.length > 0 ? (
        <>
          {isMobile ? (
            /* Mobile Card Layout */
            <div className="space-y-4 px-2">
              {data.map((superOrder, index) => (
                <MobileOrderCard
                  key={superOrder.key_ref}
                  superOrder={superOrder}
                  index={index}
                />
              ))}
            </div>
          ) : (
            /* Desktop/Tablet Table Layout */
            <div
              ref={tableContainerRef}
              className="rounded-2xl shadow-lg border border-gray-100 bg-white overflow-auto"
              style={{
                maxHeight: '70vh',
                minHeight: '400px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#0B2863 #f1f5f9'
              }}
            >
              <Table sx={{ minWidth: isTablet ? 600 : 800 }} stickyHeader>
                {/* Header */}
                <TableHead>
                  <TableRow>
                    {columns.map((column, index) => {
                      // Hide some columns on tablet
                      if (isTablet && (column.label === 'Income' || column.label === 'Cost')) {
                        return null;
                      }
                      
                      return (
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
                            fontSize: isTablet ? '0.85rem' : '0.95rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: 'none',
                            padding: isTablet ? '16px 8px' : '20px 16px'
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
                      );
                    })}
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
                        {/* 1. Reference */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography 
                            variant="body2" 
                            className="font-semibold truncate"
                            style={{ 
                              color: '#0B2863',
                              maxWidth: isTablet ? '100px' : '120px'
                            }}
                            title={superOrder.key_ref}
                          >
                            {superOrder.key_ref}
                          </Typography>
                        </TableCell>

                        {/* 2. Client */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography 
                            variant="body2" 
                            className="truncate"
                            style={{ 
                              color: '#0B2863',
                              maxWidth: isTablet ? '120px' : '180px'
                            }}
                            title={superOrder.client}
                          >
                            {superOrder.client}
                          </Typography>
                        </TableCell>

                        {/* 3. Expense */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#ef4444' }}>
                            ${superOrder.expense.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 4. Operator Salaries */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#0B2863' }}>
                            ${superOrder.otherSalaries.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 5. Work Cost */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#0B2863' }}>
                            ${superOrder.workCost.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 6. Driver Salaries */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#22c55e' }}>
                            ${superOrder.driverSalaries.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 7. Total Discount (calculado) */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-bold" style={{ color: '#f59e0b' }}>
                            ${(superOrder.expense + superOrder.driverSalaries + superOrder.otherSalaries + superOrder.fuelCost).toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 8. Total Income */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#22c55e' }}>
                            ${superOrder.totalIncome.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 9. Profit */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <ProfitChip profit={superOrder.totalProfit} />
                        </TableCell>

                        {/* 10. Status */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <PayStatusChip paid={superOrder.payStatus === 1} />
                        </TableCell>

                        {/* 11. Actions */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <div className="flex items-center gap-2">
                            <ActionButton
                              onClick={(e) => {
                                e.stopPropagation();
                                onPayOrder(superOrder);
                              }}
                              disabled={superOrder.payStatus === 1}
                              size={isTablet ? 'small' : 'medium'}
                            >
                              <PaymentIcon sx={{ fontSize: isTablet ? 14 : 16 }} />
                              {!isTablet && 'Pay'}
                            </ActionButton>
                            
                            <ViewButton
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(superOrder);
                              }}
                              size={isTablet ? 'small' : 'medium'}
                            />
                            
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand(superOrder.key_ref);
                              }}
                              size="small"
                              className="!transition-all !duration-200 hover:!scale-110"
                              style={{ color: '#0B2863' }}
                            >
                              {expandedRows.has(superOrder.key_ref) ? 
                                <KeyboardArrowUpIcon /> : 
                                <KeyboardArrowDownIcon />
                              }
                            </IconButton>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row Details */}
                      <TableRow>
                        <TableCell 
                          colSpan={isTablet ? 6 : 8}
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
                                  <div className={`grid ${isTablet ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'} gap-4 mb-6`}>
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
                                      <Typography variant={isTablet ? "body2" : "h6"} className="!font-bold" style={{ color: '#ef4444' }}>
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
                                      <Typography variant={isTablet ? "body2" : "h6"} className="!font-bold" style={{ color: '#0B2863' }}>
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
                                      <Typography variant={isTablet ? "body2" : "h6"} className="!font-bold" style={{ color: '#0B2863' }}>
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
                                      <Typography variant={isTablet ? "body2" : "h6"} className="!font-bold" style={{ color: '#22c55e' }}>
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
                                      <Typography variant={isTablet ? "body2" : "h6"} className="!font-bold" style={{ color: '#0B2863' }}>
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
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="mb-6">
            <Inbox 
              size={isMobile ? 60 : 80}
              style={{ color: '#0B2863', opacity: 0.6 }}
            />
          </div>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            className="!font-bold !mb-3"
            style={{ color: '#0B2863' }}
          >
            No Financial Records Found
          </Typography>
          <Typography 
            variant="body1" 
            className={`!text-gray-600 !mb-4 ${isMobile ? '!text-sm' : ''} !max-w-md`}
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
      
      {/* Table Footer Info */}
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} mt-4 px-4 text-sm`} style={{ color: '#0B2863' }}>
        <span className="font-medium">
          Showing {data.length} order{data.length !== 1 ? 's' : ''}
        </span>
        {data.length > 0 && !isMobile && (
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