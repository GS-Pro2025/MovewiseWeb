// components/FinancialTable.tsx
import React, { useRef, useState } from 'react';
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
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { 
  Inbox, 
  Lightbulb, 
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Fuel,
  Wrench,
  Users,
  UserCheck,
  User,
  Eye,
  Edit // Importar Edit de lucide-react para mobile
} from 'lucide-react';
import { SuperOrder } from '../domain/ModelsOCR';
import OrdersByKeyRefTable from './OrdersByKeyRefTable';

// Column Configuration - ACTUALIZADA con expand al inicio
const columns = [
  { key: null, label: '', sortable: false }, // Columna para expand
  { key: 'key_ref' as keyof SuperOrder, label: 'Reference', sortable: true },
  { key: 'client' as keyof SuperOrder, label: 'Client', sortable: true },
  { key: 'expense' as keyof SuperOrder, label: 'Expense', sortable: true },
  { key: 'fuelCost' as keyof SuperOrder, label: 'Fuel Cost', sortable: true },
  { key: 'bonus' as keyof SuperOrder, label: 'Bonus', sortable: true },
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
  onAddIncome: (superOrder: SuperOrder) => void; // NUEVO
  onAddExpense: (superOrder: SuperOrder) => void; // NUEVO
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
  onAddIncome, // NUEVO
  onAddExpense, // NUEVO
  onViewDetails,
  onOrderPaid,
  onViewOperators
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Estado para el menú contextual
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    row: SuperOrder | null;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent, row: SuperOrder) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      row,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

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

  // Cambiar ActionButton a EditButton con nuevo color y sin restricciones
  const EditButton = ({ 
    onClick, 
    children,
    size = 'medium'
  }: { 
    onClick: (e: React.MouseEvent) => void, 
    children: React.ReactNode,
    size?: 'small' | 'medium'
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${size === 'small' ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-xl font-semibold transition-all duration-200 justify-center bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
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

  // Crear botones para income y expense
  const IncomeButton = ({ 
    onClick, 
    size = 'medium'
  }: { 
    onClick: (e: React.MouseEvent) => void, 
    size?: 'small' | 'medium'
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} rounded-xl font-semibold transition-all duration-200 justify-center bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
      style={{ minWidth: size === 'small' ? '50px' : '70px' }}
    >
      <TrendingUp size={size === 'small' ? 12 : 14} />
      {size !== 'small' && 'Income'}
    </button>
  );

  const ExpenseButton = ({ 
    onClick, 
    size = 'medium'
  }: { 
    onClick: (e: React.MouseEvent) => void, 
    size?: 'small' | 'medium'
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} rounded-xl font-semibold transition-all duration-200 justify-center bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
      style={{ minWidth: size === 'small' ? '50px' : '70px' }}
    >
      <TrendingDown size={size === 'small' ? 12 : 14} />
      {size !== 'small' && 'Expense'}
    </button>
  );

  // Mobile Card Component
  const MobileOrderCard = ({ superOrder, index }: { superOrder: SuperOrder, index: number }) => {
    
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
          {/* Header actualizado con expand a la izquierda */}
          <div className="flex items-start mb-3 gap-3">
            {/* Expand Button - MOVIDO A LA IZQUIERDA */}
            <div className="flex flex-col items-center">
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
            
            {/* Content */}
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

            {/* Status */}
            <div className="flex flex-col items-end">
              <PayStatusChip paid={superOrder.payStatus === 1} />
            </div>
          </div>

          {/* Grid actualizado con nuevos campos */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg border-2" style={{ backgroundColor: '#fef2f2', borderColor: '#000000' }}>
              <Typography variant="caption" className="!block !text-gray-600 !font-semibold">Expense</Typography>
              <Typography variant="body2" className="!font-bold" style={{ color: '#000000' }}>
                ${superOrder.expense.toLocaleString()}
              </Typography>
            </div>
            
            <div className="text-center p-2 rounded-lg border-2" style={{ backgroundColor: '#fef2f2', borderColor: '#000000' }}>
              <Typography variant="caption" className="!block !text-gray-600 !font-semibold">Fuel Cost</Typography>
              <Typography variant="body2" className="!font-bold" style={{ color: '#000000' }}>
                ${superOrder.fuelCost.toLocaleString()}
              </Typography>
            </div>
            
            <div className="text-center p-2 rounded-lg border-2" style={{ backgroundColor: '#fef2f2', borderColor: '#000000' }}>
              <Typography variant="caption" className="!block !text-gray-600 !font-semibold">Bonus</Typography>
              <Typography variant="body2" className="!font-bold" style={{ color: '#000000' }}>
                ${superOrder.bonus.toLocaleString()}
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
                ${superOrder.totalCost.toLocaleString()}
              </Typography>
            </div>
          </div>

          {/* Profit */}
          <div className="text-center mb-4">
            <Typography variant="caption" className="!block !text-gray-600 !font-semibold !mb-2">Net Profit</Typography>
            <ProfitChip profit={superOrder.totalProfit} />
          </div>

          {/* Actions - Cambiar Pay por Edit */}
          <div className="flex gap-2">
            <EditButton
              onClick={(e) => {
                e.stopPropagation();
                onAddExpense(superOrder); // Mantener el mismo handler pero ahora es edit
              }}
              size="small"
            >
              <Edit size={14} />
              Edit
            </EditButton>
            
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
                <div className="text-center p-2 rounded border" style={{ backgroundColor: '#f5f3ff' }}>
                  <Users size={16} className="mx-auto mb-1" style={{ color: '#8b5cf6' }} />
                  <Typography variant="caption" className="!block !font-semibold">Bonus</Typography>
                  <Typography variant="caption" className="!block">${superOrder.bonus.toLocaleString()}</Typography>
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
                        onContextMenu={(e) => handleContextMenu(e, superOrder)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                        }}
                      >
                        {/* 0. Expand Button - NUEVO */}
                        <TableCell className="!py-4 !px-2 !border-b !border-gray-200" style={{ width: '50px' }}>
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
                        </TableCell>

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
                          <Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>
                            ${superOrder.expense.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 4. Fuel Cost */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>
                            ${superOrder.fuelCost.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 5. Bonus */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>
                            ${superOrder.bonus.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 6. Operator Salaries */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>
                            ${superOrder.otherSalaries.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 7. Work Cost */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>
                            ${superOrder.workCost.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 8. Driver Salaries */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>
                            ${superOrder.driverSalaries.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 9. Total Discount */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-bold" style={{ color: '#000000' }}>
                            ${superOrder.totalCost.toLocaleString()}
                          </Typography>
                        </TableCell>

                        {/* 10. Total Income */}
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

                        {/* 11. Actions - Cambiar a dos botones */}
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <div className="flex items-center gap-1">
                            <IncomeButton
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddIncome(superOrder);
                              }}
                              size={isTablet ? 'small' : 'medium'}
                            />
                            
                            <ExpenseButton
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddExpense(superOrder);
                              }}
                              size={isTablet ? 'small' : 'medium'}
                            />
                            
                            <ViewButton
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(superOrder);
                              }}
                              size={isTablet ? 'small' : 'medium'}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row Details */}
                      <TableRow>
                        <TableCell 
                          colSpan={isTablet ? 8 : 12}
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
                                           borderColor: '#000000' 
                                         }}>
                                      <div className="flex items-center justify-center mb-2">
                                        <TrendingUp size={20} style={{ color: '#000000' }} />
                                      </div>
                                      <Typography variant="caption" className="!text-gray-600 !font-semibold !block !mb-1">
                                        Expense
                                      </Typography>
                                      <Typography variant={isTablet ? "body2" : "h6"} className="!font-bold" style={{ color: '#000000' }}>
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
                {/* Totals Row */}
                <TableBody>
                  <TableRow style={{ backgroundColor: '#f1f5f9', borderTop: '3px solid #0B2863' }}>
                    {/* 0. Expand Button - Empty */}
                    <TableCell className="!py-4 !px-2 !border-b-0" style={{ width: '50px' }}>
                      {/* Empty cell for expand button */}
                    </TableCell>

                    {/* 1. Reference - TOTALS label */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography 
                        variant="body1" 
                        className="!font-bold !text-lg"
                        style={{ color: '#0B2863' }}
                      >
                        TOTALS
                      </Typography>
                    </TableCell>

                    {/* 2. Client - Empty */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography 
                        variant="body2" 
                        className="!font-semibold !text-center"
                        style={{ color: '#6b7280' }}
                      >
                        {data.length} orders
                      </Typography>
                    </TableCell>

                    {/* 3. Expense Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#000000' }}>
                        ${data.reduce((sum, order) => sum + order.expense, 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* 4. Fuel Cost Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#000000' }}>
                        ${data.reduce((sum, order) => sum + order.fuelCost, 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* 5. Bonus Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#000000' }}>
                        ${data.reduce((sum, order) => sum + order.bonus, 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* 6. Operator Salaries Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#000000' }}>
                        ${data.reduce((sum, order) => sum + order.otherSalaries, 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* 7. Work Cost Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#000000' }}>
                        ${data.reduce((sum, order) => sum + order.workCost, 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* 8. Driver Salaries Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#000000' }}>
                        ${data.reduce((sum, order) => sum + order.driverSalaries, 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* 9. Total Discount Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#000000' }}>
                        ${data.reduce((sum, order) => sum + order.totalCost, 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* 10. Total Income Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#22c55e' }}>
                        ${data.reduce((sum, order) => sum + order.totalIncome, 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    {/* 11. Profit Total */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      {(() => {
                        const totalProfit = data.reduce((sum, order) => sum + order.totalProfit, 0);
                        return (
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold text-white min-w-[100px] justify-center shadow-md ${
                              totalProfit >= 0 
                                ? 'bg-green-600' 
                                : 'bg-red-600'
                            }`}
                          >
                            ${totalProfit.toLocaleString()}
                          </span>
                        );
                      })()}
                    </TableCell>

                    {/* 11. Status - Summary */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <div className="flex flex-col gap-1">
                        <Typography variant="caption" className="!font-semibold" style={{ color: '#22c55e' }}>
                          Paid: {data.filter(order => order.payStatus === 1).length}
                        </Typography>
                        <Typography variant="caption" className="!font-semibold" style={{ color: '#f59e0b' }}>
                          Unpaid: {data.filter(order => order.payStatus === 0).length}
                        </Typography>
                      </div>
                    </TableCell>

                    {/* 12. Actions - Empty */}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      {/* Empty cell for actions */}
                    </TableCell>
                  </TableRow>
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
      
      {/* Context Menu */}
      <Menu
        open={!!contextMenu}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        onContextMenu={(e) => e.preventDefault()}
      >
        <MenuItem
          onClick={() => {
            if (contextMenu?.row && onAddIncome) {
              onAddIncome(contextMenu.row);
            }
            handleCloseContextMenu();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: 'rgba(11, 40, 99, 0.1)'
            }
          }}
        >
          <TrendingUp size={18} style={{ color: '#0B2863' }} />
          <span>Add Income</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu?.row && onAddExpense) {
              onAddExpense(contextMenu.row);
            }
            handleCloseContextMenu();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: 'rgba(11, 40, 99, 0.1)'
            }
          }}
        >
          <TrendingDown size={18} style={{ color: '#0B2863' }} />
          <span>Add Expense</span>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (contextMenu?.row && onViewDetails) {
              onViewDetails(contextMenu.row);
            }
            handleCloseContextMenu();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: 'rgba(11, 40, 99, 0.1)'
            }
          }}
        >
          <Eye size={18} style={{ color: '#0B2863' }} />
          <span>View Details</span>
        </MenuItem>
      </Menu>

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