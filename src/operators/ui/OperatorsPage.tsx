/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import LoaderSpinner from "../../components/Login_Register/LoadingSpinner";
import { useSnackbar } from 'notistack';
import { Users, UserPlus, Search, Filter, CheckCircle, AlertCircle } from 'lucide-react';
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
  gray: '#6b7280',
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
  const [viewMode, setViewMode] = useState<'operators' | 'freelancers'>('operators');

  // Freelancers states
  const [freelancers, setFreelancers] = useState<FreelanceOperator[]>([]);
  const [freelancersLoading, setFreelancersLoading] = useState<boolean>(false);
  const [freelancersPage, setFreelancersPage] = useState<number>(1);
  const [freelancersPageSize] = useState<number>(10);
  const [freelancersTotal, setFreelancersTotal] = useState<number>(0);
  const [isCreateFreelancerOpen, setIsCreateFreelancerOpen] = useState<boolean>(false);

  const handleFreelancerCreated = useCallback(async (created?: FreelanceOperator) => {
    try {
      const resp = await fetchFreelanceOperators(freelancersPage, freelancersPageSize);
      setFreelancers(resp.results);
      setFreelancersTotal(resp.count);
      enqueueSnackbar('Freelancer created successfully', { variant: 'success' });
    } catch (err) {
      console.error('Error refreshing freelancers after create:', err);
      enqueueSnackbar('Freelancer created, but error updating list', { variant: 'warning' });
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

  const createOperatorFormData = useCallback((operatorData: any): FormData => {
    const formData = new FormData();

    if (operatorData.code) formData.append('code', operatorData.code);
    if (operatorData.number_licence) formData.append('number_licence', operatorData.number_licence);
    if (operatorData.n_children !== undefined) formData.append('n_children', operatorData.n_children.toString());
    if (operatorData.size_t_shift) formData.append('size_t_shift', operatorData.size_t_shift);
    if (operatorData.name_t_shift) formData.append('name_t_shift', operatorData.name_t_shift);
    if (operatorData.salary) formData.append('salary', operatorData.salary);
    if (operatorData.status) formData.append('status', operatorData.status);

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
      if (operatorData.first_name) formData.append('person.first_name', operatorData.first_name);
      if (operatorData.last_name) formData.append('person.last_name', operatorData.last_name);
      if (operatorData.birth_date) formData.append('person.birth_date', operatorData.birth_date);
      if (operatorData.phone) formData.append('person.phone', operatorData.phone);
      if (operatorData.address) formData.append('person.address', operatorData.address);
      if (operatorData.id_number) formData.append('person.id_number', operatorData.id_number);
      if (operatorData.type_id) formData.append('person.type_id', operatorData.type_id);
      if (operatorData.email) formData.append('person.email', operatorData.email);
    }

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

  const filteredOperators = useMemo(() => {
    if (!searchTerm.trim()) return operators;
    const term = searchTerm.toLowerCase();
    return operators.filter(operator => {
      const safeString = (value: string | null | undefined): string => value ? value.toLowerCase() : '';
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
    if (!searchTerm.trim()) return inactiveOperators;
    const term = searchTerm.toLowerCase();
    return inactiveOperators.filter(operator => {
      const safeString = (value: string | null | undefined): string => value ? value.toLowerCase() : '';
      return (
        safeString(operator.first_name).includes(term) ||
        safeString(operator.last_name).includes(term) ||
        safeString(operator.email).includes(term)
      );
    });
  }, [inactiveOperators, searchTerm]);

  const filteredFreelancers = useMemo(() => {
    if (!searchTerm.trim()) return freelancers;
    const term = searchTerm.toLowerCase();
    return freelancers.filter(freelancer => {
      const safeString = (value: string | null | undefined): string => value ? value.toLowerCase() : '';
      return (
        safeString(freelancer.first_name).includes(term) ||
        safeString(freelancer.last_name).includes(term) ||
        safeString(freelancer.code).includes(term) ||
        safeString(freelancer.phone).includes(term) ||
        safeString(freelancer.id_number).includes(term)
      );
    });
  }, [freelancers, searchTerm]);

  const mappedFreelancers = useMemo(() => {
    return filteredFreelancers.map(mapFreelanceToOperator);
  }, [filteredFreelancers, mapFreelanceToOperator]);

  if (loading && viewMode === 'operators') return <LoaderSpinner />;
  if (freelancersLoading && viewMode === 'freelancers') return <LoaderSpinner />;

  if (error && viewMode === 'operators') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div 
          className="text-center p-8 rounded-xl border-2 shadow-lg max-w-md"
          style={{ borderColor: COLORS.error, backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
        >
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.error }}
          >
            <AlertCircle size={32} className="text-white" />
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
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-3" style={{ borderColor: COLORS.primary }}>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'operators'
                ? 'text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: viewMode === 'operators' ? COLORS.primary : 'transparent' }}
            onClick={() => {
              setViewMode('operators');
              setSearchTerm('');
            }}
          >
            <Users size={16} />
            Operators
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'freelancers'
                ? 'text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: viewMode === 'freelancers' ? COLORS.secondary : 'transparent' }}
            onClick={() => {
              setViewMode('freelancers');
              setSearchTerm('');
              setFreelancersPage(1);
            }}
          >
            <UserPlus size={16} />
            Freelancers ({freelancersTotal})
          </button>
        </div>
      </div>

      {viewMode === 'operators' && (
        <>
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
          {/* Freelancers Header */}
          <div className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: COLORS.primary }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
                  <UserPlus size={20} style={{ color: COLORS.secondary }} />
                  Freelancers Directory
                </h2>
                <p className="text-sm text-gray-600">Manage and view freelancer information</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Total Freelancers</div>
                <div className="text-xl font-bold" style={{ color: COLORS.secondary }}>{freelancersTotal}</div>
              </div>
              <button
                onClick={() => setIsCreateFreelancerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: COLORS.secondary }}
              >
                <UserPlus size={16} />
                Create Freelancer
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search 
                  size={14} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: COLORS.gray }}
                />
                <input
                  type="text"
                  placeholder="Search freelancers by name, code, phone, or ID number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ borderColor: COLORS.primary }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg p-3 border-2 shadow-sm" style={{ borderColor: COLORS.secondary }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: COLORS.secondary }}>Total Freelancers</p>
                    <p className="text-xl font-bold" style={{ color: COLORS.secondary }}>{freelancersTotal}</p>
                  </div>
                  <UserPlus size={24} style={{ color: COLORS.secondary }} />
                </div>
              </div>
              
              <div className="rounded-lg p-3 border-2 shadow-sm" style={{ borderColor: COLORS.success }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: COLORS.success }}>Active Status</p>
                    <p className="text-xl font-bold" style={{ color: COLORS.success }}>{freelancers.length}</p>
                  </div>
                  <CheckCircle size={24} style={{ color: COLORS.success }} />
                </div>
              </div>

              <div className="rounded-lg p-3 border-2 shadow-sm" style={{ borderColor: COLORS.primary }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: COLORS.primary }}>Search Results</p>
                    <p className="text-xl font-bold" style={{ color: COLORS.primary }}>{mappedFreelancers.length}</p>
                  </div>
                  <Filter size={24} style={{ color: COLORS.primary }} />
                </div>
              </div>
            </div>
          </div>

          {/* Freelancers Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: COLORS.primary }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.primary }}>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
                <UserPlus size={16} style={{ color: COLORS.secondary }} />
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
              onEditOperator={() => {}}
              onDeleteOperator={() => {}}
              onManageChildren={() => {}}
              onActivateOperator={() => {}}
            />
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-xl shadow-sm border p-3" style={{ borderColor: COLORS.primary }}>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-700">
                Showing {((freelancersPage - 1) * freelancersPageSize) + 1} - {Math.min(freelancersPage * freelancersPageSize, freelancersTotal)} of {freelancersTotal} freelancers
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFreelancersPage(prev => Math.max(1, prev - 1))}
                  disabled={freelancersPage === 1}
                  className="px-3 py-1 text-xs font-semibold border rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-xs font-semibold rounded-lg" style={{ backgroundColor: COLORS.primary, color: 'white' }}>
                  Page {freelancersPage}
                </span>
                <button
                  onClick={() => setFreelancersPage(prev => prev + 1)}
                  disabled={freelancersPage * freelancersPageSize >= freelancersTotal}
                  className="px-3 py-1 text-xs font-semibold border rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
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

      <CreateFreelancer
        isOpen={isCreateFreelancerOpen}
        onClose={() => setIsCreateFreelancerOpen(false)}
        onCreated={handleFreelancerCreated}
      />
    </div>
  );
};

export default OperatorsPage;