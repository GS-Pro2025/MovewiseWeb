import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Operator, InactiveOperator } from '../../domain/OperatorsModels';
import OperatorAvatar from './OperatorAvatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { MoreVertical, Eye, Edit, Baby, Trash2, Mail, DollarSign, PlusCircle, KeyRound } from 'lucide-react';
import SendEmailDialog from './SendEmailDialog';
import OperatorLoansDialog from './OperatorLoansDialog';
import CreateLoanDialog from './CreateLoanDialog';
import ChangePasswordDialog from './ChangePasswordDialog';

interface OperatorsTableProps {
  activeTab: 'active' | 'inactive';
  operators: Operator[];
  inactiveOperators: InactiveOperator[];
  inactiveLoading: boolean;
  searchTerm: string;
  onViewDetails: (operator: Operator) => void;
  onEditOperator: (operator: Operator) => void;
  onDeleteOperator: (operator: Operator) => void;
  onManageChildren: (operator: Operator) => void;
  onActivateOperator: (id: number) => void;
}

const OperatorsTable: React.FC<OperatorsTableProps> = ({
  activeTab,
  operators,
  inactiveOperators,
  inactiveLoading,
  searchTerm,
  onViewDetails,
  onEditOperator,
  onDeleteOperator,
  onManageChildren,
  onActivateOperator
}) => {
  const { t } = useTranslation();

  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isLoansDialogOpen, setIsLoansDialogOpen] = useState(false);
  const [isCreateLoanDialogOpen, setIsCreateLoanDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOperator, setMenuOperator] = useState<Operator | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const getFullName = (operator: Operator): string =>
    `${operator.first_name} ${operator.last_name}`;

  const renderInactiveAvatar = (operator: InactiveOperator) => (
    <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
      <span className="text-sm font-medium text-white">
        {operator.first_name.charAt(0)}{operator.last_name.charAt(0)}
      </span>
    </div>
  );

  // ── Menu handlers ──────────────────────────────────────────────────────────

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, operator: Operator) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuOperator(operator);
    setContextMenuPosition(null);
  };

  const handleContextMenu = (event: React.MouseEvent, operator: Operator) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuPosition({ top: event.clientY, left: event.clientX });
    setMenuOperator(operator);
    setMenuAnchorEl(null);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setContextMenuPosition(null);
    setMenuOperator(null);
  };

  const handleAction = (action: string) => {
    if (!menuOperator) return;

    switch (action) {
      case 'view':       onViewDetails(menuOperator);   break;
      case 'edit':       onEditOperator(menuOperator);  break;
      case 'children':   onManageChildren(menuOperator); break;
      case 'delete':     onDeleteOperator(menuOperator); break;
      case 'email':
        setSelectedOperator(menuOperator);
        setIsEmailDialogOpen(true);
        break;
      case 'loans':
        setSelectedOperator(menuOperator);
        setIsLoansDialogOpen(true);
        break;
      case 'createLoan':
        setSelectedOperator(menuOperator);
        setIsCreateLoanDialogOpen(true);
        break;
      case 'changePassword':
        setSelectedOperator(menuOperator);
        setIsChangePasswordDialogOpen(true);
        break;
    }
    handleMenuClose();
  };

  const handleCloseEmailDialog      = () => { setIsEmailDialogOpen(false);      setSelectedOperator(null); };
  const handleCloseLoansDialog      = () => { setIsLoansDialogOpen(false);      setSelectedOperator(null); };
  const handleCloseCreateLoanDialog = () => { setIsCreateLoanDialogOpen(false); setSelectedOperator(null); };

  // ── Shared context/dot menu ────────────────────────────────────────────────
  const handleCloseChangePasswordDialog = () => {
    setIsChangePasswordDialogOpen(false);
    setSelectedOperator(null);
  };
  // Render the actions menu (shared between 3-dot and context menu)
  const renderActionsMenu = () => {
    const isOpen = Boolean(menuAnchorEl) || Boolean(contextMenuPosition);

    return (
      <Menu
        open={isOpen}
        onClose={handleMenuClose}
        anchorEl={menuAnchorEl}
        anchorReference={contextMenuPosition ? 'anchorPosition' : 'anchorEl'}
        anchorPosition={contextMenuPosition || undefined}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
            }
          }
        }}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon><Eye size={18} color="#3b82f6" /></ListItemIcon>
          <ListItemText>{t('operators.table.menu.viewDetails')}</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon><Edit size={18} color="#22c55e" /></ListItemIcon>
          <ListItemText>{t('operators.table.menu.edit')}</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction('children')}>
          <ListItemIcon><Baby size={18} color="#a855f7" /></ListItemIcon>
          <ListItemText>{t('operators.table.menu.manageChildren')}</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleAction('loans')}>
          <ListItemIcon><DollarSign size={18} color="#f59e0b" /></ListItemIcon>
          <ListItemText>{t('operators.table.menu.viewLoans')}</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction('createLoan')}>
          <ListItemIcon><PlusCircle size={18} color="#10b981" /></ListItemIcon>
          <ListItemText>{t('operators.table.menu.createLoan')}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => handleAction('email')}
          disabled={!menuOperator?.email}
        >
          <ListItemIcon><Mail size={18} color="#6366f1" /></ListItemIcon>
          <ListItemText>{t('operators.table.menu.sendEmail')}</ListItemText>
        </MenuItem>

        <Divider />
        <MenuItem onClick={() => handleAction('changePassword')}>
          <ListItemIcon>
            <KeyRound size={18} color="#0B2863" />
          </ListItemIcon>
          <ListItemText>Change Password</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('delete')}>
          <ListItemIcon><Trash2 size={18} color="#ef4444" /></ListItemIcon>
          <ListItemText sx={{ color: '#ef4444' }}>{t('operators.table.menu.deactivate')}</ListItemText>
        </MenuItem>
      </Menu>
    );
  };

  // ── Shared column header helper ────────────────────────────────────────────

  const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
      {children}
    </th>
  );

  return (
    <>
      {/* ── Active Operators ── */}
      {activeTab === 'active' && (
        <div className="bg-[#0B2863] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white">
              {t('operators.table.activeTitle')}
              {searchTerm && ` (${operators.length} ${t('operators.table.resultsSuffix')})`}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0B2863]">
                <tr>
                  <Th>{t('operators.table.columns.operator')}</Th>
                  <Th>{t('operators.table.columns.contact')}</Th>
                  <Th>{t('operators.table.columns.license')}</Th>
                  <Th>{t('operators.table.columns.salaryInfo')}</Th>
                  <Th>{t('operators.table.columns.family')}</Th>
                  <Th>{t('operators.table.columns.status')}</Th>
                  <Th>{t('operators.table.columns.actions')}</Th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operators.map((operator) => (
                  <tr
                    key={operator.id_operator}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onContextMenu={(e) => handleContextMenu(e, operator)}
                  >
                    {/* Operator */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <OperatorAvatar operator={operator} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{getFullName(operator)}</div>
                          <div className="text-sm text-gray-500">
                            {t('operators.table.code')}: {operator.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{operator.email}</div>
                      <div className="text-sm text-gray-500">{operator.phone}</div>
                    </td>

                    {/* License */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{operator.number_licence}</div>
                    </td>

                    {/* Salary */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {operator.salary_type === 'hour' ? (
                          <>
                            <div className="font-medium">${operator.hourly_salary}/hr</div>
                            <div className="text-xs text-gray-500">{t('operators.table.salary.perHour')}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">${operator.salary}/day</div>
                            <div className="text-xs text-gray-500">{t('operators.table.salary.perDay')}</div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Family */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">
                          {operator.n_children} {t('operators.table.children')}
                        </span>
                        {operator.n_children > 0 && (
                          <i className="fas fa-baby text-purple-500" />
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {operator.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, operator)}
                          size="small"
                          title={t('operators.table.columns.actions')}
                          sx={{ '&:hover': { backgroundColor: '#e5e7eb' } }}
                        >
                          <MoreVertical size={18} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {operators.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {t('operators.table.noResults.title')}
              </h3>
              <p className="text-gray-500">{t('operators.table.noResults.subtitle')}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Inactive Operators ── */}
      {activeTab === 'inactive' && (
        <div className="bg-[#0B2863] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white">
              {t('operators.table.inactiveTitle')}
              {searchTerm && ` (${inactiveOperators.length} ${t('operators.table.resultsSuffix')})`}
            </h3>
          </div>

          {inactiveLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <i className="fas fa-spinner animate-spin text-red-600 text-xl" />
                <span className="text-gray-600">{t('operators.table.loading')}</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B2863]">
                  <tr>
                    <Th>{t('operators.table.columns.operator')}</Th>
                    <Th>{t('operators.table.columns.contact')}</Th>
                    <Th>{t('operators.table.columns.salaryInfo')}</Th>
                    <Th>{t('operators.table.columns.status')}</Th>
                    <Th>{t('operators.table.columns.actions')}</Th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inactiveOperators.map((operator) => (
                    <tr key={operator.id_operator} className="hover:bg-gray-50 transition-colors">
                      {/* Operator */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {renderInactiveAvatar(operator)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {operator.first_name} {operator.last_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{operator.email}</div>
                      </td>

                      {/* Salary */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {operator.salary_type === 'hour' ? (
                            <>
                              <div className="font-medium">${operator.hourly_salary}/hr</div>
                              <div className="text-xs text-gray-500">{t('operators.table.salary.perHour')}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">${operator.salary}/day</div>
                              <div className="text-xs text-gray-500">{t('operators.table.salary.perDay')}</div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {operator.status}
                        </span>
                      </td>

                      {/* Activate */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onActivateOperator(operator.id_operator)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          {t('operators.table.activateButton')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs ── */}
      {selectedOperator && (
        <>
          <SendEmailDialog
            open={isEmailDialogOpen}
            onClose={handleCloseEmailDialog}
            operatorEmail={selectedOperator.email}
            operatorName={getFullName(selectedOperator)}
          />
          <OperatorLoansDialog
            open={isLoansDialogOpen}
            onClose={handleCloseLoansDialog}
            operatorId={selectedOperator.id_operator}
            operatorName={getFullName(selectedOperator)}
          />
          <CreateLoanDialog
            open={isCreateLoanDialogOpen}
            onClose={handleCloseCreateLoanDialog}
            operatorId={selectedOperator.id_operator}
            operatorName={getFullName(selectedOperator)}
          />
        </>
      )}
      {selectedOperator && (
        <ChangePasswordDialog
          open={isChangePasswordDialogOpen}
          onClose={handleCloseChangePasswordDialog}
          operatorCode={selectedOperator.code}
          operatorName={`${selectedOperator.first_name} ${selectedOperator.last_name}`}
        />
      )}
      {/* Actions Menu (3-dot and context menu) */}
      {renderActionsMenu()}
    </>
  );
};

export default OperatorsTable;