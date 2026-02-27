import React, { useState } from 'react';
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
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isLoansDialogOpen, setIsLoansDialogOpen] = useState(false);
  const [isCreateLoanDialogOpen, setIsCreateLoanDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOperator, setMenuOperator] = useState<Operator | null>(null);
  
  // Context menu state
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const getFullName = (operator: Operator): string => {
    return `${operator.first_name} ${operator.last_name}`;
  };

  const renderInactiveAvatar = (operator: InactiveOperator) => {
    return (
      <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
        <span className="text-sm font-medium text-white">
          {operator.first_name.charAt(0)}{operator.last_name.charAt(0)}
        </span>
      </div>
    );
  };

  // Menu handlers
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
      case 'view':
        onViewDetails(menuOperator);
        break;
      case 'edit':
        onEditOperator(menuOperator);
        break;
      case 'children':
        onManageChildren(menuOperator);
        break;
      case 'delete':
        onDeleteOperator(menuOperator);
        break;
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

  const handleCloseEmailDialog = () => {
    setIsEmailDialogOpen(false);
    setSelectedOperator(null);
  };

  const handleCloseLoansDialog = () => {
    setIsLoansDialogOpen(false);
    setSelectedOperator(null);
  };

  const handleCloseCreateLoanDialog = () => {
    setIsCreateLoanDialogOpen(false);
    setSelectedOperator(null);
  };

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
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
            }
          }
        }}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon>
            <Eye size={18} color="#3b82f6" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon>
            <Edit size={18} color="#22c55e" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('children')}>
          <ListItemIcon>
            <Baby size={18} color="#a855f7" />
          </ListItemIcon>
          <ListItemText>Manage Children</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleAction('loans')}>
          <ListItemIcon>
            <DollarSign size={18} color="#f59e0b" />
          </ListItemIcon>
          <ListItemText>View Loans</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('createLoan')}>
          <ListItemIcon>
            <PlusCircle size={18} color="#10b981" />
          </ListItemIcon>
          <ListItemText>Create Loan</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleAction('email')}
          disabled={!menuOperator?.email}
        >
          <ListItemIcon>
            <Mail size={18} color="#6366f1" />
          </ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>
        
        <Divider />

        <MenuItem onClick={() => handleAction('changePassword')}>
          <ListItemIcon>
            <KeyRound size={18} color="#0B2863" />
          </ListItemIcon>
          <ListItemText>Change Password</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('delete')}>
          <ListItemIcon>
            <Trash2 size={18} color="#ef4444" />
          </ListItemIcon>
          <ListItemText sx={{ color: '#ef4444' }}>Deactivate</ListItemText>
        </MenuItem>
      </Menu>
    );
  };

  return (
    <>
      {/* Active Operators List */}
      {activeTab === 'active' && (
        <div className="bg-[#0B2863] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white">
              Active Operators {searchTerm && `(${operators.length} results)`}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0B2863]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Salary Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Family
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operators.map((operator) => (
                  <tr 
                    key={operator.id_operator} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onContextMenu={(e) => handleContextMenu(e, operator)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <OperatorAvatar operator={operator} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getFullName(operator)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Code: {operator.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{operator.email}</div>
                      <div className="text-sm text-gray-500">{operator.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{operator.number_licence}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {operator.salary_type === 'hour' ? (
                          <>
                            <div className="font-medium">${operator.hourly_salary}/hr</div>
                            <div className="text-xs text-gray-500">per hour</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">${operator.salary}/day</div>
                            <div className="text-xs text-gray-500">per day</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{operator.n_children} children</span>
                        {operator.n_children > 0 && (
                          <i className="fas fa-baby text-purple-500"></i>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {operator.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, operator)}
                          size="small"
                          sx={{
                            '&:hover': {
                              backgroundColor: '#e5e7eb',
                            },
                          }}
                          title="Actions"
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

          {operators.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No operators found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      )}

      {/* Inactive Operators List */}
      {activeTab === 'inactive' && (
        <div className="bg-[#0B2863] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white">
              Inactive Operators {searchTerm && `(${inactiveOperators.length} results)`}
            </h3>
          </div>
          
          {inactiveLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <i className="fas fa-spinner animate-spin text-red-600 text-xl"></i>
                <span className="text-gray-600">Loading inactive operators...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B2863]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Operator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Salary Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inactiveOperators.map((operator) => (
                    <tr key={operator.id_operator} className="hover:bg-gray-50 transition-colors">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{operator.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {operator.salary_type === 'hour' ? (
                            <>
                              <div className="font-medium">${operator.hourly_salary}/hr</div>
                              <div className="text-xs text-gray-500">por hora</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">${operator.salary}/day</div>
                              <div className="text-xs text-gray-500">por día</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {operator.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onActivateOperator(operator.id_operator)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          Activate
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

      {/* Send Email Dialog */}
      {selectedOperator && (
        <SendEmailDialog
          open={isEmailDialogOpen}
          onClose={handleCloseEmailDialog}
          operatorEmail={selectedOperator.email}
          operatorName={`${selectedOperator.first_name} ${selectedOperator.last_name}`}
        />
      )}

      {/* Loans Dialog */}
      {selectedOperator && (
        <OperatorLoansDialog
          open={isLoansDialogOpen}
          onClose={handleCloseLoansDialog}
          operatorId={selectedOperator.id_operator}
          operatorName={`${selectedOperator.first_name} ${selectedOperator.last_name}`}
        />
      )}

      {/* Create Loan Dialog */}
      {selectedOperator && (
        <CreateLoanDialog
          open={isCreateLoanDialogOpen}
          onClose={handleCloseCreateLoanDialog}
          operatorId={selectedOperator.id_operator}
          operatorName={`${selectedOperator.first_name} ${selectedOperator.last_name}`}
        />
      )}

      {/* Change Password Dialog */}
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