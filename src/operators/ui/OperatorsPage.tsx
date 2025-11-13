/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import LoaderSpinner from "../../components/Login_Register/LoadingSpinner";
import { useSnackbar } from 'notistack';
import { fetchOperators, fetchInactiveOperators, activateOperator, updateOperator, deleteOperator, addChildToOperator, createOperator } from '../data/RepositoryOperators';
import { fetchFreelanceOperators, FreelanceOperator } from '../data/RepositoryFreelancer';
import { Operator } from '../domain/OperatorsModels';
import { InactiveOperator } from '../domain/OperatorsModels';
import OperatorsHeader from './components/OperatorsHeader';
import OperatorsTable from './components/OperatorsTable';
import EditOperatorModal from './components/EditOperatorModal';
import ManageChildrenModal from './components/ManageChildrenModal';
import OperatorDetailsModal from './components/OperatorDetailsModal';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';
import RegisterOperatorModal from './components/RegisterOperatorModal';
import CreateFreelancer from './components/CreateFreelancer';

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
};

const OperatorsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // States
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
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);

  // NEW: View mode state
  const [viewMode, setViewMode] = useState<'operators' | 'freelancers'>('operators');

  // Freelancers states
  const [freelancers, setFreelancers] = useState<FreelanceOperator[]>([]);
  const [freelancersLoading, setFreelancersLoading] = useState<boolean>(false);
  const [freelancersPage, setFreelancersPage] = useState<number>(1);
  const [freelancersPageSize] = useState<number>(10);
  const [freelancersTotal, setFreelancersTotal] = useState<number>(0);
  const [isCreateFreelancerOpen, setIsCreateFreelancerOpen] = useState<boolean>(false);

  // Handler para refrescar lista después de crear
  const handleFreelancerCreated = useCallback(async (created?: FreelanceOperator) => {
    try {
      // puedes optar por re-fetch para tener conteo exacto
      const resp = await fetchFreelanceOperators(freelancersPage, freelancersPageSize);
      setFreelancers(resp.results);
      setFreelancersTotal(resp.count);
      enqueueSnackbar('Freelancer creado y lista actualizada', { variant: 'success' });
    } catch (err) {
      console.error('Error refreshing freelancers after create:', err);
      enqueueSnackbar('Freelancer creado, pero error al actualizar la lista', { variant: 'warning' });
      // como fallback, si backend devuelve el creado, lo puedes agregar localmente:
      if (created) {
        setFreelancers(prev => [created, ...prev]);
        setFreelancersTotal(prev => prev + 1);
      }
    } finally {
      setIsCreateFreelancerOpen(false);
    }
  }, [enqueueSnackbar, freelancersPage, freelancersPageSize]);
  // Load operators
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
    
    if (viewMode === 'operators') {
      loadOperators();
    }
  }, [enqueueSnackbar, viewMode]);

  // Load inactive operators
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
    
    if (viewMode === 'operators') {
      loadInactiveOperators();
    }
  }, [viewMode]);

  // NEW: Load freelancers
  useEffect(() => {
    const loadFreelancers = async () => {
      try {
        setFreelancersLoading(true);
        const response = await fetchFreelanceOperators(freelancersPage, freelancersPageSize);
        setFreelancers(response.results);
        setFreelancersTotal(response.count);
      } catch (err) {
        console.error('Error loading freelancers:', err);
        enqueueSnackbar(err instanceof Error ? err.message : 'Error loading freelancers', { variant: 'error' });
      } finally {
        setFreelancersLoading(false);
      }
    };

    if (viewMode === 'freelancers') {
      loadFreelancers();
    }
  }, [viewMode, freelancersPage, freelancersPageSize, enqueueSnackbar]);

  // Helper function para crear FormData según la estructura del backend
  const createOperatorFormData = useCallback((operatorData: any): FormData => {
    const formData = new FormData();

    // Campos del operador
    if (operatorData.code) formData.append('code', operatorData.code);
    if (operatorData.number_licence) formData.append('number_licence', operatorData.number_licence);
    if (operatorData.n_children !== undefined) formData.append('n_children', operatorData.n_children.toString());
    if (operatorData.size_t_shift) formData.append('size_t_shift', operatorData.size_t_shift);
    if (operatorData.name_t_shift) formData.append('name_t_shift', operatorData.name_t_shift);
    if (operatorData.salary) formData.append('salary', operatorData.salary);
    if (operatorData.status) formData.append('status', operatorData.status);

    // Datos de la persona (formato person.campo)
    if (operatorData.person) {
      const person = operatorData.person;
      if (person.first_name) formData.append('person.first_name', person.first_name);
      if (person.last_name) formData.append('person.last_name', person.last_name);
      if (person.birth_date) formData.append('person.birth_date', person.birth_date);
      if (person.phone) formData.append('person.phone', person.phone);
      if (person.address) formData.append('person.address', person.address);
      if (person.id_number) formData.append('person.id_number', person.id_number);
      if (person.type_id) formData.append('person.type_id', person.type_id);
      if (person.email) formData.append('person.email', person.email);
      if (person.status) formData.append('person.status', person.status);
    } else {
      // Si los datos vienen en formato plano (compatibilidad)
      if (operatorData.first_name) formData.append('person.first_name', operatorData.first_name);
      if (operatorData.last_name) formData.append('person.last_name', operatorData.last_name);
      if (operatorData.birth_date) formData.append('person.birth_date', operatorData.birth_date);
      if (operatorData.phone) formData.append('person.phone', operatorData.phone);
      if (operatorData.address) formData.append('person.address', operatorData.address);
      if (operatorData.id_number) formData.append('person.id_number', operatorData.id_number);
      if (operatorData.type_id) formData.append('person.type_id', operatorData.type_id);
      if (operatorData.email) formData.append('person.email', operatorData.email);
    }

    // Archivos (solo si se van a actualizar)
    if (operatorData.photo && operatorData.photo instanceof File) {
      formData.append('photo', operatorData.photo);
    }
    if (operatorData.license_front && operatorData.license_front instanceof File) {
      formData.append('license_front', operatorData.license_front);
    }
    if (operatorData.license_back && operatorData.license_back instanceof File) {
      formData.append('license_back', operatorData.license_back);
    }

    return formData;
  }, []);

  // Event Handlers
  const handleActivateOperator = useCallback(async (id_operator: number) => {
    try {
      await activateOperator(id_operator);
      setInactiveOperators(prev => prev.filter(op => op.id_operator !== id_operator));
      const response = await fetchOperators();
      setOperators(response.results);
      enqueueSnackbar('Operator activated successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error activating operator', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleRegisterOperator = useCallback(() => {
    setIsRegisterModalOpen(true);
  }, []);
  
  const handleSaveNewOperator = useCallback(async (formData: FormData) => {
    try {
      await createOperator(formData); 
      const response = await fetchOperators();
      setOperators(response.results);
      enqueueSnackbar('Operator registered successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error registering operator', { variant: 'error' });
    }
  }, [enqueueSnackbar]);
  
  const handleEditOperator = useCallback((operator: Operator) => {
    setOperatorToEdit(operator);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async (operatorData: Partial<Operator> | FormData) => {
    if (!operatorToEdit) return;
    
    try {
      let dataToSend: FormData;
      
      if (operatorData instanceof FormData) {
        dataToSend = operatorData;
      } else {
        dataToSend = createOperatorFormData(operatorData);
      }

      await updateOperator(operatorToEdit.id_operator, dataToSend);
      
      const response = await fetchOperators();
      setOperators(response.results);
      setIsEditDialogOpen(false);
      setOperatorToEdit(null);
      enqueueSnackbar('Operator updated successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error updating operator', { variant: 'error' });
    }
  }, [operatorToEdit, createOperatorFormData, enqueueSnackbar]);

  const handleDeleteOperator = useCallback((operator: Operator) => {
    setOperatorToDelete(operator); 
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!operatorToDelete) return;
    
    try {
      await deleteOperator(operatorToDelete.id_operator);
      const [operatorsResponse, inactiveResponse] = await Promise.all([
        fetchOperators(),
        fetchInactiveOperators()
      ]);
      setOperators(operatorsResponse.results);
      setInactiveOperators(inactiveResponse.results);
      setIsDeleteDialogOpen(false);
      setOperatorToDelete(null);
      enqueueSnackbar('Operator deactivated successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error deactivating operator', { variant: 'error' });
    }
  }, [operatorToDelete, enqueueSnackbar]);

  const handleViewDetails = useCallback((operator: Operator) => {
    setSelectedOperator(operator);
    setIsDialogOpen(true);
  }, []);

  const handleManageChildren = useCallback((operator: Operator) => {
    setOperatorForChildren(operator);
    setIsChildrenModalOpen(true);
  }, []);

  const handleAddChild = useCallback(async (childData: { name: string; birth_date: string; gender: string }) => {
    if (!operatorForChildren) return;
    
    try {
      const childPayload = {
        operator: operatorForChildren.id_operator,
        name: childData.name,
        birth_date: childData.birth_date,
        gender: childData.gender
      };

      await addChildToOperator(childPayload);
      
      const response = await fetchOperators();
      setOperators(response.results);
      
      if (selectedOperator && selectedOperator.id_operator === operatorForChildren.id_operator) {
        const updatedOperator = response.results.find(op => op.id_operator === operatorForChildren.id_operator);
        if (updatedOperator) {
          setSelectedOperator(updatedOperator);
          setOperatorForChildren(updatedOperator);
        }
      } else {
        const updatedOperator = response.results.find(op => op.id_operator === operatorForChildren.id_operator);
        if (updatedOperator) {
          setOperatorForChildren(updatedOperator);
        }
      }
      
      enqueueSnackbar('Child added successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error adding child', { variant: 'error' });
    }
  }, [operatorForChildren, selectedOperator, enqueueSnackbar]);

  // NEW: Function to map FreelanceOperator to Operator for component compatibility
  const mapFreelanceToOperator = useCallback((freelancer: FreelanceOperator): Operator => {
    return {
      id_operator: freelancer.id_operator,
      code: freelancer.code || '',
      first_name: freelancer.first_name || '',
      last_name: freelancer.last_name || '',
      email: freelancer.email || '',
      phone: freelancer.phone || '',
      number_licence: freelancer.number_licence || '',
      salary: freelancer.salary || '',
      status: freelancer.status || 'freelance',
      n_children: freelancer.n_children || 0,
      // Add other required Operator fields with default values
      size_t_shift: freelancer.size_t_shift || '',
      name_t_shift: freelancer.name_t_shift || '',
      photo: freelancer.photo || null,
      license_front: freelancer.license_front || null,
      license_back: freelancer.license_back || null,
      birth_date: freelancer.birth_date || null,
      type_id: freelancer.type_id || '',
      id_number: freelancer.id_number || '',
      address: freelancer.address || '',
      id_company: freelancer.id_company || null,
      sons: freelancer.sons || []
    } as Operator;
  }, []);

  // Filtrar operadores basado en el término de búsqueda
  const filteredOperators = useMemo(() => {
    if (!searchTerm.trim()) {
      return operators;
    }

    const term = searchTerm.toLowerCase();
    return operators.filter(operator => {
      const safeString = (value: string | null | undefined): string => {
        return value ? value.toLowerCase() : '';
      };

      return (
        safeString(operator.first_name).includes(term) ||
        safeString(operator.last_name).includes(term) ||
        safeString(operator.code).includes(term) ||
        safeString(operator.email).includes(term) ||
        safeString(operator.phone).includes(term) ||
        safeString(operator.number_licence).includes(term)
      );
    });
  }, [operators, searchTerm]);

  const filteredInactiveOperators = useMemo(() => {
    if (!searchTerm.trim()) {
      return inactiveOperators;
    }

    const term = searchTerm.toLowerCase();
    return inactiveOperators.filter(operator => {
      const safeString = (value: string | null | undefined): string => {
        return value ? value.toLowerCase() : '';
      };

      return (
        safeString(operator.first_name).includes(term) ||
        safeString(operator.last_name).includes(term) ||
        safeString(operator.email).includes(term)
      );
    });
  }, [inactiveOperators, searchTerm]);

  // NEW: Filter freelancers
  const filteredFreelancers = useMemo(() => {
    if (!searchTerm.trim()) {
      return freelancers;
    }

    const term = searchTerm.toLowerCase();
    return freelancers.filter(freelancer => {
      const safeString = (value: string | null | undefined): string => {
        return value ? value.toLowerCase() : '';
      };

      return (
        safeString(freelancer.first_name).includes(term) ||
        safeString(freelancer.last_name).includes(term) ||
        safeString(freelancer.code).includes(term) ||
        safeString(freelancer.phone).includes(term) ||
        safeString(freelancer.id_number).includes(term)
      );
    });
  }, [freelancers, searchTerm]);

  // Convert filtered freelancers to Operator format for table compatibility
  const mappedFreelancers = useMemo(() => {
    return filteredFreelancers.map(mapFreelanceToOperator);
  }, [filteredFreelancers, mapFreelanceToOperator]);

  if (loading && viewMode === 'operators') {
    return <LoaderSpinner />;
  }

  if (freelancersLoading && viewMode === 'freelancers') {
    return <LoaderSpinner />;
  }

  if (error && viewMode === 'operators') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div 
          className="text-center p-8 rounded-2xl border-2 shadow-lg max-w-md"
          style={{ 
            borderColor: COLORS.error,
            backgroundColor: 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.error }}
          >
            <span className="text-white text-3xl font-bold">!</span>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.error }}>
            Error Loading Data
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* NEW: View Mode Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'operators'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => {
              setViewMode('operators');
              setSearchTerm('');
            }}
          >
            <i className="fas fa-users mr-2"></i>
            Operators
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'freelancers'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => {
              setViewMode('freelancers');
              setSearchTerm('');
              setFreelancersPage(1);
            }}
          >
            <i className="fas fa-user-tie mr-2"></i>
            Freelancers ({freelancersTotal})
          </button>
        </div>
      </div>

      {viewMode === 'operators' && (
        <>
          {/* Header Component for Operators */}
          <OperatorsHeader
            operators={operators}
            inactiveOperators={inactiveOperators}
            activeTab={activeTab}
            searchTerm={searchTerm}
            filteredOperators={filteredOperators}
            filteredInactiveOperators={filteredInactiveOperators}
            onTabChange={setActiveTab}
            onSearchChange={setSearchTerm}
            onRegisterOperator={handleRegisterOperator}
          />

          {/* Table Component for Operators */}
          <OperatorsTable
            activeTab={activeTab}
            operators={filteredOperators}
            inactiveOperators={filteredInactiveOperators}
            inactiveLoading={inactiveLoading}
            searchTerm={searchTerm}
            onViewDetails={handleViewDetails}
            onEditOperator={handleEditOperator}
            onDeleteOperator={handleDeleteOperator}
            onManageChildren={handleManageChildren}
            onActivateOperator={handleActivateOperator}
          />
        </>
      )}

      {viewMode === 'freelancers' && (
        <>
          {/* Modified Header for Freelancers */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  <i className="fas fa-user-tie mr-3 text-orange-600"></i>
                  Freelancers Directory
                </h2>
                <p className="text-gray-600">Manage and view freelancer information</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Freelancers</div>
                <div className="text-2xl font-bold text-orange-600">{freelancersTotal}</div>
              </div>
              {/* Create freelancer button */}
              <div>
                <button
                  onClick={() => setIsCreateFreelancerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg shadow-sm hover:bg-orange-700 transition"
                >
                  <i className="fas fa-user-plus"></i>
                  <span>Create Freelancer</span>
                </button>
              </div>
            </div>

            {/* Search Bar for Freelancers */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search freelancers by name, code, phone, or ID number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Stats for Freelancers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Total Freelancers</p>
                    <p className="text-2xl font-bold text-orange-800">{freelancersTotal}</p>
                  </div>
                  <i className="fas fa-user-tie text-2xl text-orange-500"></i>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Status</p>
                    <p className="text-2xl font-bold text-green-800">{freelancers.length}</p>
                  </div>
                  <i className="fas fa-check-circle text-2xl text-green-500"></i>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Search Results</p>
                    <p className="text-2xl font-bold text-blue-800">{mappedFreelancers.length}</p>
                  </div>
                  <i className="fas fa-filter text-2xl text-blue-500"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Freelancers Table using existing OperatorsTable component */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                <i className="fas fa-user-tie mr-2 text-orange-600"></i>
                Freelancers {searchTerm && `(${mappedFreelancers.length} results)`}
              </h3>
            </div>
            
            <OperatorsTable
              activeTab="active"
              operators={mappedFreelancers}
              inactiveOperators={[]}
              inactiveLoading={false}
              searchTerm={searchTerm}
              onViewDetails={handleViewDetails}
              onEditOperator={() => {}} // Disable edit for freelancers
              onDeleteOperator={() => {}} // Disable delete for freelancers
              onManageChildren={() => {}} // Disable children management for freelancers
              onActivateOperator={() => {}} // Not applicable for freelancers
            />
          </div>

          {/* Pagination for Freelancers */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((freelancersPage - 1) * freelancersPageSize) + 1} - {Math.min(freelancersPage * freelancersPageSize, freelancersTotal)} of {freelancersTotal} freelancers
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFreelancersPage(prev => Math.max(1, prev - 1))}
                  disabled={freelancersPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md">
                  Page {freelancersPage}
                </span>
                <button
                  onClick={() => setFreelancersPage(prev => prev + 1)}
                  disabled={freelancersPage * freelancersPageSize >= freelancersTotal}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals - Only show for operators */}
      {viewMode === 'operators' && (
        <>
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

          {isRegisterModalOpen && (
            <RegisterOperatorModal
              isOpen={isRegisterModalOpen}
              onClose={() => setIsRegisterModalOpen(false)}
              onSave={handleSaveNewOperator}
            />
          )}
        </>
      )}

      {/* Shared View Details Modal */}
      {isDialogOpen && selectedOperator && (
        <OperatorDetailsModal
          operator={selectedOperator}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedOperator(null);
          }}
        />
      )}
      {/* Create Freelancer modal (freelancers view) */}
      <CreateFreelancer
        isOpen={isCreateFreelancerOpen}
        onClose={() => setIsCreateFreelancerOpen(false)}
        onCreated={handleFreelancerCreated}
      />
    </div>
  );
};

export default OperatorsPage;