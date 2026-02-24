/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel,
  IconButton, Collapse, Typography, Divider, Card, CardContent,
  useMediaQuery, useTheme, Chip, Menu, MenuItem
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  Inbox, Lightbulb, TrendingUp, TrendingDown,
  Users, UserCheck, User, Eye, Edit, Fuel, Wrench, ClipboardList
} from 'lucide-react';
import { SuperOrder } from '../domain/ModelsOCR';
import OrdersByKeyRefTable from './OrdersByKeyRefTable';
import { useTranslation } from 'react-i18next';

interface FinancialTableProps {
  data: SuperOrder[];
  sortBy: keyof SuperOrder;
  sortOrder: 'asc' | 'desc';
  expandedRows: Set<string>;
  onSort: (column: keyof SuperOrder) => void;
  onToggleExpand: (keyRef: string) => void;
  onAddIncome: (superOrder: SuperOrder) => void;
  onAddExpense: (superOrder: SuperOrder) => void;
  onViewDetails: (superOrder: SuperOrder) => void;
  onOrderPaid: () => void;
  onViewOperators: (orderId: string) => void;
}

const FinancialTable: React.FC<FinancialTableProps> = ({
  data, sortBy, sortOrder, expandedRows,
  onSort, onToggleExpand, onAddIncome, onAddExpense,
  onViewDetails, onOrderPaid, onViewOperators
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number; mouseY: number; row: SuperOrder | null;
  } | null>(null);

  // Columns defined inside component so labels can be translated
  const columns = [
    { key: null,                                  label: '',                                              sortable: false },
    { key: 'key_ref' as keyof SuperOrder,         label: t('financialTable.columns.reference'),          sortable: true },
    { key: 'client' as keyof SuperOrder,          label: t('financialTable.columns.client'),             sortable: true },
    { key: 'expense' as keyof SuperOrder,         label: t('financialTable.columns.expense'),            sortable: true },
    { key: 'fuelCost' as keyof SuperOrder,        label: t('financialTable.columns.fuelCost'),           sortable: true },
    { key: 'bonus' as keyof SuperOrder,           label: t('financialTable.columns.bonus'),              sortable: true },
    { key: 'otherSalaries' as keyof SuperOrder,   label: t('financialTable.columns.operatorSalaries'),   sortable: true },
    { key: 'workCost' as keyof SuperOrder,        label: t('financialTable.columns.workCost'),           sortable: true },
    { key: 'driverSalaries' as keyof SuperOrder,  label: t('financialTable.columns.driverSalaries'),     sortable: true },
    { key: null,                                  label: t('financialTable.columns.totalDiscount'),      sortable: false },
    { key: 'totalIncome' as keyof SuperOrder,     label: t('financialTable.columns.totalIncome'),        sortable: true },
    { key: 'totalProfit' as keyof SuperOrder,     label: t('financialTable.columns.profit'),             sortable: true },
    { key: null,                                  label: t('financialTable.columns.status'),             sortable: false },
    { key: null,                                  label: t('financialTable.columns.actions'),            sortable: false },
  ];

  const handleContextMenu = (event: React.MouseEvent, row: SuperOrder) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4, row });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const ProfitChip = ({ profit }: { profit: number }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white min-w-[80px] justify-center shadow-md ${profit >= 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} transition-colors duration-200`}>
      ${profit.toLocaleString()}
    </span>
  );

  const PayStatusChip = ({ paid }: { paid: boolean }) => (
    <Chip
      label={paid ? t('financialTable.paid') : t('financialTable.unpaid')}
      size={isMobile ? 'small' : 'medium'}
      sx={{
        backgroundColor: paid ? '#22c55e' : '#FFE67B',
        color: paid ? '#ffffff' : '#0B2863',
        fontWeight: 600,
        '&:hover': { backgroundColor: paid ? '#16a34a' : '#fbbf24' }
      }}
    />
  );

  const EditButton = ({ onClick, children, size = 'medium' }: { onClick: (e: React.MouseEvent) => void; children: React.ReactNode; size?: 'small' | 'medium' }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${size === 'small' ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-xl font-semibold transition-all duration-200 justify-center bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
      style={{ minWidth: size === 'small' ? '60px' : '80px' }}
    >
      {children}
    </button>
  );

  const ViewButton = ({ onClick, size = 'medium' }: { onClick: (e: React.MouseEvent) => void; size?: 'small' | 'medium' }) => (
    <button
      onClick={onClick}
      className={`${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} font-semibold border-2 rounded-lg transition-all duration-200 hover:shadow-md`}
      style={{ color: '#0B2863', borderColor: '#0B2863', backgroundColor: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0B2863'; e.currentTarget.style.color = '#ffffff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#0B2863'; }}
    >
      {size === 'small' ? <Eye size={14} /> : t('financialTable.view')}
    </button>
  );

  const IncomeButton = ({ onClick, size = 'medium' }: { onClick: (e: React.MouseEvent) => void; size?: 'small' | 'medium' }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} rounded-xl font-semibold transition-all duration-200 justify-center bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
      style={{ minWidth: size === 'small' ? '50px' : '70px' }}
    >
      <TrendingUp size={size === 'small' ? 12 : 14} />
      {size !== 'small' && t('financialTable.income')}
    </button>
  );

  const ExpenseButton = ({ onClick, size = 'medium' }: { onClick: (e: React.MouseEvent) => void; size?: 'small' | 'medium' }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} rounded-xl font-semibold transition-all duration-200 justify-center bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
      style={{ minWidth: size === 'small' ? '50px' : '70px' }}
    >
      <TrendingDown size={size === 'small' ? 12 : 14} />
      {size !== 'small' && t('financialTable.expense')}
    </button>
  );

  const MobileOrderCard = ({ superOrder, index }: { superOrder: SuperOrder; index: number }) => (
    <Card
      className="mb-4"
      sx={{
        borderRadius: 4, border: '2px solid', borderColor: '#0B2863',
        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.15)', transform: 'translateY(-2px)' },
        transition: 'all 0.2s'
      }}
    >
      <CardContent sx={{ padding: '16px' }}>
        <div className="flex items-start mb-3 gap-3">
          <div className="flex flex-col items-center">
            <IconButton onClick={(e) => { e.stopPropagation(); onToggleExpand(superOrder.key_ref); }} size="small" style={{ color: '#0B2863' }}>
              {expandedRows.has(superOrder.key_ref) ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </div>
          <div className="flex-1">
            <Typography variant="h6" className="!font-bold !text-lg" style={{ color: '#0B2863' }}>{superOrder.key_ref}</Typography>
            <Typography variant="body2" className="!text-gray-600 !mt-1">
              <User size={14} className="inline mr-1" />{superOrder.client}
            </Typography>
          </div>
          <div className="flex flex-col items-end">
            <PayStatusChip paid={superOrder.payStatus === 1} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: t('financialTable.columns.expense'), value: superOrder.expense, bg: '#fef2f2', border: '#000000', color: '#000000' },
            { label: t('financialTable.columns.fuelCost'), value: superOrder.fuelCost, bg: '#fef2f2', border: '#000000', color: '#000000' },
            { label: t('financialTable.columns.bonus'), value: superOrder.bonus, bg: '#fef2f2', border: '#000000', color: '#000000' },
            { label: t('financialTable.columns.driverSalaries'), value: superOrder.driverSalaries, bg: '#f0fdf4', border: '#22c55e', color: '#22c55e' },
            { label: t('financialTable.columns.workCost'), value: superOrder.workCost, bg: '#eff6ff', border: '#0B2863', color: '#0B2863' },
            { label: t('financialTable.columns.totalDiscount'), value: superOrder.totalCost, bg: '#fefce8', border: '#f59e0b', color: '#f59e0b' },
          ].map(({ label, value, bg, border, color }) => (
            <div key={label} className="text-center p-2 rounded-lg border-2" style={{ backgroundColor: bg, borderColor: border }}>
              <Typography variant="caption" className="!block !text-gray-600 !font-semibold">{label}</Typography>
              <Typography variant="body2" className="!font-bold" style={{ color }}>${value.toLocaleString()}</Typography>
            </div>
          ))}
        </div>

        <div className="text-center mb-4">
          <Typography variant="caption" className="!block !text-gray-600 !font-semibold !mb-2">{t('financialTable.netProfit')}</Typography>
          <ProfitChip profit={superOrder.totalProfit} />
        </div>

        <div className="flex gap-2">
          <EditButton onClick={(e) => { e.stopPropagation(); onAddExpense(superOrder); }} size="small">
            <Edit size={14} />{t('financialTable.edit')}
          </EditButton>
          <ViewButton onClick={(e) => { e.stopPropagation(); onViewDetails(superOrder); }} size="small" />
        </div>

        <Collapse in={expandedRows.has(superOrder.key_ref)} timeout={300} unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <div className="space-y-3">
            <Typography variant="subtitle2" className="!font-semibold" style={{ color: '#0B2863' }}>
              {t('financialTable.costBreakdown')}
            </Typography>
            <div className="grid grid-cols-2 gap-2">
              {[
                { Icon: Fuel,      label: t('financialTable.fuel'),      value: superOrder.fuelCost,      bg: '#fff7ed', color: '#0B2863' },
                { Icon: Wrench,    label: t('financialTable.work'),      value: superOrder.workCost,      bg: '#eff6ff', color: '#0B2863' },
                { Icon: UserCheck, label: t('financialTable.drivers'),   value: superOrder.driverSalaries, bg: '#f0fdf4', color: '#22c55e' },
                { Icon: Users,     label: t('financialTable.operators'), value: superOrder.otherSalaries, bg: '#fefce8', color: '#0B2863' },
                { Icon: Users,     label: t('financialTable.columns.bonus'), value: superOrder.bonus,    bg: '#f5f3ff', color: '#8b5cf6' },
              ].map(({ Icon, label, value, bg, color }) => (
                <div key={label} className="text-center p-2 rounded border" style={{ backgroundColor: bg }}>
                  <Icon size={16} className="mx-auto mb-1" style={{ color }} />
                  <Typography variant="caption" className="!block !font-semibold">{label}</Typography>
                  <Typography variant="caption" className="!block">${value.toLocaleString()}</Typography>
                </div>
              ))}
            </div>
            <div className="max-h-[300px] overflow-auto rounded border" style={{ borderColor: '#0B2863' }}>
              <OrdersByKeyRefTable orders={superOrder.orders} keyRef={superOrder.key_ref} onOrderPaid={onOrderPaid} onViewOperators={onViewOperators} />
            </div>
          </div>
        </Collapse>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full overflow-hidden">
      {data.length > 0 ? (
        <>
          {isMobile ? (
            <div className="space-y-4 px-2">
              {data.map((superOrder, index) => (
                <MobileOrderCard key={superOrder.key_ref} superOrder={superOrder} index={index} />
              ))}
            </div>
          ) : (
            <div
              ref={tableContainerRef}
              className="rounded-2xl shadow-lg border border-gray-100 bg-white overflow-auto"
              style={{ maxHeight: '70vh', minHeight: '400px', scrollbarWidth: 'thin', scrollbarColor: '#0B2863 #f1f5f9' }}
            >
              <Table sx={{ minWidth: isTablet ? 600 : 800 }} stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column, index) => {
                      if (isTablet && (column.label === t('financialTable.columns.totalIncome') || column.label === t('financialTable.columns.workCost'))) return null;
                      return (
                        <TableCell
                          key={index}
                          className="!border-none !py-5 !px-4 !sticky !top-0 !z-10"
                          style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#0B2863', color: '#ffffff', fontWeight: 700, fontSize: isTablet ? '0.85rem' : '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: 'none', padding: isTablet ? '16px 8px' : '20px 16px' }}
                        >
                          {column.sortable && column.key ? (
                            <TableSortLabel
                              active={sortBy === column.key}
                              direction={sortBy === column.key ? sortOrder : 'asc'}
                              onClick={() => column.key && onSort(column.key)}
                              sx={{ color: '#ffffff !important', '&:hover': { color: '#FFE67B !important' }, '& .MuiTableSortLabel-icon': { color: '#ffffff !important', '&:hover': { color: '#FFE67B !important' } } }}
                            >
                              <span className="text-white font-bold hover:text-yellow-300 transition-colors">{column.label}</span>
                            </TableSortLabel>
                          ) : (
                            <span className="text-white font-bold">{column.label}</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {data.map((superOrder, index) => (
                    <React.Fragment key={superOrder.key_ref}>
                      <TableRow
                        className="transition-colors duration-200"
                        style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                        onContextMenu={(e) => handleContextMenu(e, superOrder)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0f2fe'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'; }}
                      >
                        <TableCell className="!py-4 !px-2 !border-b !border-gray-200" style={{ width: '50px' }}>
                          <IconButton onClick={(e) => { e.stopPropagation(); onToggleExpand(superOrder.key_ref); }} size="small" className="!transition-all !duration-200 hover:!scale-110" style={{ color: '#0B2863' }}>
                            {expandedRows.has(superOrder.key_ref) ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="font-semibold truncate" style={{ color: '#0B2863', maxWidth: isTablet ? '100px' : '120px' }} title={superOrder.key_ref}>{superOrder.key_ref}</Typography>
                        </TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <Typography variant="body2" className="truncate" style={{ color: '#0B2863', maxWidth: isTablet ? '120px' : '180px' }} title={superOrder.client}>{superOrder.client}</Typography>
                        </TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>${superOrder.expense.toLocaleString()}</Typography></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>${superOrder.fuelCost.toLocaleString()}</Typography></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>${superOrder.bonus.toLocaleString()}</Typography></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>${superOrder.otherSalaries.toLocaleString()}</Typography></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>${superOrder.workCost.toLocaleString()}</Typography></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><Typography variant="body2" className="font-semibold" style={{ color: '#000000' }}>${superOrder.driverSalaries.toLocaleString()}</Typography></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><Typography variant="body2" className="font-bold" style={{ color: '#000000' }}>${superOrder.totalCost.toLocaleString()}</Typography></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><Typography variant="body2" className="font-semibold" style={{ color: '#22c55e' }}>${superOrder.totalIncome.toLocaleString()}</Typography></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><ProfitChip profit={superOrder.totalProfit} /></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200"><PayStatusChip paid={superOrder.payStatus === 1} /></TableCell>
                        <TableCell className="!py-4 !px-4 !border-b !border-gray-200">
                          <div className="flex items-center gap-1">
                            <IncomeButton onClick={(e) => { e.stopPropagation(); onAddIncome(superOrder); }} size={isTablet ? 'small' : 'medium'} />
                            <ExpenseButton onClick={(e) => { e.stopPropagation(); onAddExpense(superOrder); }} size={isTablet ? 'small' : 'medium'} />
                            <ViewButton onClick={(e) => { e.stopPropagation(); onViewDetails(superOrder); }} size={isTablet ? 'small' : 'medium'} />
                          </div>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={isTablet ? 8 : 14} className="!p-0 !border-none" style={{ backgroundColor: '#f8fafc' }}>
                          <Collapse in={expandedRows.has(superOrder.key_ref)} timeout={300} unmountOnExit>
                            <div className="px-6 py-3 border-b border-gray-200">
                              {/* Compact cost summary row */}
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-3 text-xs text-gray-600">
                                {[
                                  { label: t('financialTable.columns.expense'),          value: superOrder.expense,        color: '#374151' },
                                  { label: t('financialTable.columns.fuelCost'),         value: superOrder.fuelCost,       color: '#374151' },
                                  { label: t('financialTable.columns.workCost'),         value: superOrder.workCost,       color: '#374151' },
                                  { label: t('financialTable.columns.driverSalaries'),   value: superOrder.driverSalaries, color: '#22c55e' },
                                  { label: t('financialTable.columns.operatorSalaries'), value: superOrder.otherSalaries,  color: '#374151' },
                                  { label: t('financialTable.columns.bonus'),            value: superOrder.bonus,          color: '#8b5cf6' },
                                ].map(({ label, value, color }) => (
                                  <span key={label} className="whitespace-nowrap">
                                    <span className="text-gray-400">{label}: </span>
                                    <span className="font-semibold" style={{ color }}>${value.toLocaleString()}</span>
                                  </span>
                                ))}
                              </div>
                              {/* Orders table */}
                              <div className="overflow-auto max-h-[350px] rounded border" style={{ borderColor: '#cbd5e1', scrollbarWidth: 'thin', scrollbarColor: '#0B2863 #f1f5f9' }}>
                                <OrdersByKeyRefTable orders={superOrder.orders} keyRef={superOrder.key_ref} onOrderPaid={onOrderPaid} onViewOperators={onViewOperators} />
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
                    <TableCell className="!py-4 !px-2 !border-b-0" style={{ width: '50px' }} />
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold !text-lg" style={{ color: '#0B2863' }}>{t('financialTable.totals')}</Typography>
                    </TableCell>
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body2" className="!font-semibold !text-center" style={{ color: '#6b7280' }}>
                        {t('financialTable.ordersCount', { count: data.length })}
                      </Typography>
                    </TableCell>
                    {[
                      data.reduce((s, o) => s + o.expense, 0),
                      data.reduce((s, o) => s + o.fuelCost, 0),
                      data.reduce((s, o) => s + o.bonus, 0),
                      data.reduce((s, o) => s + o.otherSalaries, 0),
                      data.reduce((s, o) => s + o.workCost, 0),
                      data.reduce((s, o) => s + o.driverSalaries, 0),
                      data.reduce((s, o) => s + o.totalCost, 0),
                    ].map((total, i) => (
                      <TableCell key={i} className="!py-4 !px-4 !border-b-0">
                        <Typography variant="body1" className="!font-bold" style={{ color: '#000000' }}>${total.toLocaleString()}</Typography>
                      </TableCell>
                    ))}
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <Typography variant="body1" className="!font-bold" style={{ color: '#22c55e' }}>${data.reduce((s, o) => s + o.totalIncome, 0).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      {(() => {
                        const totalProfit = data.reduce((s, o) => s + o.totalProfit, 0);
                        return (
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold text-white min-w-[100px] justify-center shadow-md ${totalProfit >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                            ${totalProfit.toLocaleString()}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="!py-4 !px-4 !border-b-0">
                      <div className="flex flex-col gap-1">
                        <Typography variant="caption" className="!font-semibold" style={{ color: '#22c55e' }}>
                          {t('financialTable.paidCount', { count: data.filter(o => o.payStatus === 1).length })}
                        </Typography>
                        <Typography variant="caption" className="!font-semibold" style={{ color: '#f59e0b' }}>
                          {t('financialTable.unpaidCount', { count: data.filter(o => o.payStatus === 0).length })}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell className="!py-4 !px-4 !border-b-0" />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="mb-6">
            <Inbox size={isMobile ? 60 : 80} style={{ color: '#0B2863', opacity: 0.6 }} />
          </div>
          <Typography variant={isMobile ? 'h6' : 'h5'} className="!font-bold !mb-3" style={{ color: '#0B2863' }}>
            {t('financialTable.empty.title')}
          </Typography>
          <Typography variant="body1" className={`!text-gray-600 !mb-4 ${isMobile ? '!text-sm' : ''} !max-w-md`}>
            {t('financialTable.empty.desc')}
          </Typography>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lightbulb size={16} />
            <span>{t('financialTable.empty.tip')}</span>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <Menu
        open={!!contextMenu}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        onContextMenu={(e) => e.preventDefault()}
      >
        <MenuItem onClick={() => { if (contextMenu?.row) onAddIncome(contextMenu.row); handleCloseContextMenu(); }} sx={{ display: 'flex', alignItems: 'center', gap: 1, '&:hover': { backgroundColor: 'rgba(11,40,99,0.1)' } }}>
          <TrendingUp size={18} style={{ color: '#0B2863' }} />
          <span>{t('financialTable.addIncome')}</span>
        </MenuItem>
        <MenuItem onClick={() => { if (contextMenu?.row) onAddExpense(contextMenu.row); handleCloseContextMenu(); }} sx={{ display: 'flex', alignItems: 'center', gap: 1, '&:hover': { backgroundColor: 'rgba(11,40,99,0.1)' } }}>
          <TrendingDown size={18} style={{ color: '#0B2863' }} />
          <span>{t('financialTable.addExpense')}</span>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { if (contextMenu?.row) onViewDetails(contextMenu.row); handleCloseContextMenu(); }} sx={{ display: 'flex', alignItems: 'center', gap: 1, '&:hover': { backgroundColor: 'rgba(11,40,99,0.1)' } }}>
          <Eye size={18} style={{ color: '#0B2863' }} />
          <span>{t('financialTable.viewDetails')}</span>
        </MenuItem>
      </Menu>

      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} mt-4 px-4 text-sm`} style={{ color: '#0B2863' }}>
        <span className="font-medium">{t('financialTable.showing', { count: data.length })}</span>
        {data.length > 0 && !isMobile && (
          <span className="flex items-center gap-1">
            <Lightbulb size={16} />
            <span>{t('financialTable.scrollHint')}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default FinancialTable;