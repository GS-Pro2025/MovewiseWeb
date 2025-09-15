/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { fetchOperators, fetchInactiveOperators, activateOperator, updateOperator, deleteOperator } from '../data/RepositoryOperators';
import { Operator } from '../domain/OperatorsModels';
import { InactiveOperator } from '../domain/OperatorsModels';
import EditOperatorModal from './components/EditOperatorModal';
import ManageChildrenModal from './components/ManageChildrenModal';

const OperatorsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [inactiveOperators, setInactiveOperators] = useState<InactiveOperator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inactiveLoading, setInactiveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isChildrenModalOpen, setIsChildrenModalOpen] = useState<boolean>(false);
  const [operatorToEdit, setOperatorToEdit] = useState<Operator | null>(null);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);
  const [operatorForChildren, setOperatorForChildren] = useState<Operator | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const loadOperators = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchOperators();
        setOperators(response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading operators');
        enqueueSnackbar(err instanceof Error ? err.message : 'Error loading operators', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadOperators();
  }, [enqueueSnackbar]);

  useEffect(() => {
    const loadInactiveOperators = async () => {
      try {
        setInactiveLoading(true);
        const response = await fetchInactiveOperators();
        setInactiveOperators(response.results);
      } catch (err) {
        console.error('Error loading inactive operators:', err);
      } finally {
        setInactiveLoading(false);
      }
    };
    loadInactiveOperators();
  }, []);

  const handleActivateOperator = async (id_operator: number) => {
    try {
      await activateOperator(id_operator);
      // Remover de la lista de inactivos
      setInactiveOperators(prev => prev.filter(op => op.id_operator !== id_operator));
      // Recargar operadores activos
      const response = await fetchOperators();
      setOperators(response.results);
      enqueueSnackbar('Operator activated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Error activating operator', { variant: 'error' });
    }
  };

  const handleEditOperator = (operator: Operator) => {
    setOperatorToEdit(operator);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (operatorData: Partial<Operator>) => {
    if (!operatorToEdit) return;
    
    try {
      await updateOperator(operatorToEdit.id_operator, operatorData);
      // Recargar operadores
      const response = await fetchOperators();
      setOperators(response.results);
      setIsEditDialogOpen(false);
      setOperatorToEdit(null);
      enqueueSnackbar('Operator updated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Error updating operator', { variant: 'error' });
    }
  };

  const handleDeleteOperator = (operator: Operator) => {
    setOperatorToDelete(operator);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!operatorToDelete) return;
    
    try {
      await deleteOperator(operatorToDelete.id_operator);
      // Mover a inactivos y recargar listas
      const [operatorsResponse, inactiveResponse] = await Promise.all([
        fetchOperators(),
        fetchInactiveOperators()
      ]);
      setOperators(operatorsResponse.results);
      setInactiveOperators(inactiveResponse.results);
      setIsDeleteDialogOpen(false);
      setOperatorToDelete(null);
      enqueueSnackbar('Operator deactivated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Error deactivating operator', { variant: 'error' });
    }
  };

  const formatCurrency = (salary: string): string => {
    const amount = parseFloat(salary);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFullName = (operator: Operator): string => {
    return `${operator.first_name} ${operator.last_name}`;
  };

  const renderAvatar = (operator: Operator) => {
    if (operator.photo) {
      return (
        <img
          className="h-12 w-12 rounded-full object-cover"
          src={operator.photo}
          alt={getFullName(operator)}
        />
      );
    } else {
      return (
        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {operator.first_name.charAt(0)}{operator.last_name.charAt(0)}
          </span>
        </div>
      );
    }
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

  const openDialog = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedOperator(null);
  };

  const handleManageChildren = (operator: Operator) => {
    setOperatorForChildren(operator);
    setIsChildrenModalOpen(true);
  };

  const handleAddChild = async (childData: { name: string; birth_date: string; gender: string }) => {
    if (!operatorForChildren) return;
    
    try {
      await updateOperator(operatorForChildren.id_operator, childData);
      // Recargar operadores para actualizar la información
      const response = await fetchOperators();
      setOperators(response.results);
      
      // Actualizar el operador seleccionado si está abierto el modal de detalles
      if (selectedOperator && selectedOperator.id_operator === operatorForChildren.id_operator) {
        const updatedOperator = response.results.find(op => op.id_operator === operatorForChildren.id_operator);
        if (updatedOperator) {
          setSelectedOperator(updatedOperator);
          setOperatorForChildren(updatedOperator);
        }
      } else {
        // Actualizar el operador en el modal de hijos
        const updatedOperator = response.results.find(op => op.id_operator === operatorForChildren.id_operator);
        if (updatedOperator) {
          setOperatorForChildren(updatedOperator);
        }
      }
      
      enqueueSnackbar('Child added successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Error adding child', { variant: 'error' });
    }
  };

  // Filtrar operadores basado en el término de búsqueda
  const filteredOperators = useMemo(() => {
    if (!searchTerm.trim()) {
      return operators;
    }

    const term = searchTerm.toLowerCase();
    return operators.filter(operator =>
      operator.first_name.toLowerCase().includes(term) ||
      operator.last_name.toLowerCase().includes(term) ||
      operator.code.toLowerCase().includes(term) ||
      operator.email.toLowerCase().includes(term) ||
      operator.phone.toLowerCase().includes(term) ||
      operator.number_licence.toLowerCase().includes(term)
    );
  }, [operators, searchTerm]);

  const filteredInactiveOperators = useMemo(() => {
    if (!searchTerm.trim()) {
      return inactiveOperators;
    }

    const term = searchTerm.toLowerCase();
    return inactiveOperators.filter(operator =>
      operator.first_name.toLowerCase().includes(term) ||
      operator.last_name.toLowerCase().includes(term) ||
      operator.email.toLowerCase().includes(term)
    );
  }, [inactiveOperators, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <i className="fas fa-spinner animate-spin text-blue-600 text-xl"></i>
          <span className="text-gray-600">Loading operators...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Operators</h3>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Operators Directory</h2>
            <p className="text-gray-600">Manage and view operator information</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Operators</div>
            <div className="text-2xl font-bold text-blue-600">{operators.length + inactiveOperators.length}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search operators by name, code, email, phone, or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => setActiveTab('active')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Operators</p>
                <p className="text-2xl font-bold text-green-800">{operators.length}</p>
              </div>
              <i className="fas fa-user-check text-2xl text-green-500"></i>
            </div>
          </div>
          
          <div 
            className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => setActiveTab('inactive')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Inactive Operators</p>
                <p className="text-2xl font-bold text-red-800">{inactiveOperators.length}</p>
              </div>
              <i className="fas fa-user-times text-2xl text-red-500"></i>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">With Children</p>
                <p className="text-2xl font-bold text-purple-800">
                  {operators.filter(op => op.n_children > 0).length}
                </p>
              </div>
              <i className="fas fa-baby text-2xl text-purple-500"></i>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Search Results</p>
                <p className="text-2xl font-bold text-blue-800">
                  {activeTab === 'active' ? filteredOperators.length : filteredInactiveOperators.length}
                </p>
              </div>
              <i className="fas fa-filter text-2xl text-blue-500"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Active Operators
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'inactive'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('inactive')}
          >
            Inactive Operators
          </button>
        </div>
      </div>

      {/* Active Operators List */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Active Operators {searchTerm && `(${filteredOperators.length} results)`}
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
                {filteredOperators.map((operator) => (
                  <tr key={operator.id_operator} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {renderAvatar(operator)}
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDialog(operator)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleEditOperator(operator)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleManageChildren(operator)}
                          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
                          title="Manage Children"
                        >
                          <i className="fas fa-baby"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteOperator(operator)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                          title="Deactivate"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOperators.length === 0 && searchTerm && (
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
              Inactive Operators {searchTerm && `(${filteredInactiveOperators.length} results)`}
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
                  {filteredInactiveOperators.map((operator) => (
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
                          onClick={() => handleActivateOperator(operator.id_operator)}
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

      {/* Edit Dialog Modal */}
      {isEditDialogOpen && operatorToEdit && (
        <EditOperatorModal
          operator={operatorToEdit}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setOperatorToEdit(null);
          }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Manage Children Modal */}
      {isChildrenModalOpen && operatorForChildren && (
        <ManageChildrenModal
          operator={operatorForChildren}
          isOpen={isChildrenModalOpen}
          onClose={() => {
            setIsChildrenModalOpen(false);
            setOperatorForChildren(null);
          }}
          onSave={handleAddChild}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && operatorToDelete && (
        <ConfirmDeleteDialog
          operator={operatorToDelete}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setOperatorToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Dialog Modal */}
      {isDialogOpen && selectedOperator && (
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4"
          onClick={closeDialog}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Operator Details</h2>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-user text-blue-500 mr-2"></i>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-4">
                    {renderAvatar(selectedOperator)}
                    <div>
                      <div className="font-medium text-gray-900">{getFullName(selectedOperator)}</div>
                      <div className="text-gray-500">Code: {selectedOperator.code}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="font-medium">Birth Date:</span> {selectedOperator.birth_date}</div>
                    <div><span className="font-medium">ID Type:</span> {selectedOperator.type_id}</div>
                    <div><span className="font-medium">ID Number:</span> {selectedOperator.id_number}</div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-address-book text-green-500 mr-2"></i>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2"><span className="font-medium">Email:</span> {selectedOperator.email}</div>
                    <div className="mb-2"><span className="font-medium">Phone:</span> {selectedOperator.phone}</div>
                  </div>
                  <div>
                    <div className="mb-2"><span className="font-medium">Address:</span> {selectedOperator.address}</div>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-briefcase text-purple-500 mr-2"></i>
                  Work Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2"><span className="font-medium">License Number:</span> {selectedOperator.number_licence}</div>
                    <div className="mb-2"><span className="font-medium">Shift Name:</span> {selectedOperator.name_t_shift}</div>
                    <div className="mb-2"><span className="font-medium">Shift Size:</span> {selectedOperator.size_t_shift}</div>
                  </div>
                  <div>
                    <div className="mb-2"><span className="font-medium">Salary:</span> {formatCurrency(selectedOperator.salary)}</div>
                    <div className="mb-2">
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedOperator.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedOperator.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-users text-orange-500 mr-2"></i>
                  Family Information
                </h3>
                <div className="mb-4">
                  <span className="font-medium">Number of Children:</span> {selectedOperator.n_children}
                </div>
                {selectedOperator.sons && selectedOperator.sons.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Children Details:</h4>
                    <div className="space-y-2">
                      {selectedOperator.sons.map((son, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="grid grid-cols-3 gap-4">
                            <div><span className="font-medium">Name:</span> {son.name}</div>
                            <div><span className="font-medium">Birth Date:</span> {son.birth_date}</div>
                            <div><span className="font-medium">Gender:</span> {son.gender}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* License Images */}
              {(selectedOperator.license_front || selectedOperator.license_back) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-id-card text-red-500 mr-2"></i>
                    License Images
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOperator.license_front && (
                      <div>
                        <h4 className="font-medium mb-2">Front</h4>
                        <img
                          src={selectedOperator.license_front}
                          alt="License Front"
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                    )}
                    {selectedOperator.license_back && (
                      <div>
                        <h4 className="font-medium mb-2">Back</h4>
                        <img
                          src={selectedOperator.license_back}
                          alt="License Back"
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para confirmar eliminación
const ConfirmDeleteDialog: React.FC<{
  operator: Operator;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ operator, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
            <h3 className="text-lg font-semibold text-gray-800">Confirm Deactivation</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to deactivate operator <strong>{operator.first_name} {operator.last_name}</strong>? 
            This will move them to the inactive operators list.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorsPage;