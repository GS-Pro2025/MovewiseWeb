import React, { useState } from 'react';
import { Operator, InactiveOperator } from '../../domain/OperatorsModels';
import OperatorAvatar from './OperatorAvatar';
import IconButton from '@mui/material/IconButton';
import EmailIcon from '@mui/icons-material/Email';
import SendEmailDialog from './SendEmailDialog';

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

  const handleOpenEmailDialog = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setIsEmailDialogOpen(false);
    setSelectedOperator(null);
  };

  return (
    <>
      {/* Active Operators List */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Active Operators {searchTerm && `(${operators.length} results)`}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Family
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operators.map((operator) => (
                  <tr key={operator.id_operator} className="hover:bg-gray-50 transition-colors">
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
                      <div className="flex space-x-2 items-center">
                        <button
                          onClick={() => onViewDetails(operator)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => onEditOperator(operator)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => onManageChildren(operator)}
                          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
                          title="Manage Children"
                        >
                          <i className="fas fa-baby"></i>
                        </button>
                        <button
                          onClick={() => onDeleteOperator(operator)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                          title="Deactivate"
                        >
                          <i className="fas fa-trash"></i>
                        </button>

                        {/* Send email button */}
                        <IconButton
                          onClick={() => handleOpenEmailDialog(operator)}
                          title={operator.email ? `Send email to ${operator.email}` : 'No email available'}
                          size="small"
                          disabled={!operator.email}
                          className="bg-gray-100 hover:bg-gray-200"
                        >
                          <EmailIcon fontSize="small" />
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
    </>
  );
};

export default OperatorsTable;