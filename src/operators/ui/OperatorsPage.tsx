/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { fetchOperators, fetchInactiveOperators, activateOperator, updateOperator, deleteOperator, addChildToOperator } from '../data/RepositoryOperators';
import { Operator } from '../domain/OperatorsModels';
import { InactiveOperator } from '../domain/OperatorsModels';
import OperatorsHeader from './components/OperatorsHeader';
import OperatorsTable from './components/OperatorsTable';
import EditOperatorModal from './components/EditOperatorModal';
import ManageChildrenModal from './components/ManageChildrenModal';
import OperatorDetailsModal from './components/OperatorDetailsModal';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';

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
    loadOperators();
  }, [enqueueSnackbar]);

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
    loadInactiveOperators();
  }, []);

  // Helper function para crear FormData según la estructura del backend
  const createOperatorFormData = (operatorData: any): FormData => {
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
  };

  // Event Handlers
  const handleActivateOperator = async (id_operator: number) => {
    try {
      await activateOperator(id_operator);
      setInactiveOperators(prev => prev.filter(op => op.id_operator !== id_operator));
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

  const handleSaveEdit = async (operatorData: Partial<Operator> | FormData) => {
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

  const handleViewDetails = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsDialogOpen(true);
  };

  const handleManageChildren = (operator: Operator) => {
    setOperatorForChildren(operator);
    setIsChildrenModalOpen(true);
  };

  const handleAddChild = async (childData: { name: string; birth_date: string; gender: string }) => {
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
    return operators.filter(operator => {
      // Función auxiliar para manejar valores nulos/undefined
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
      // Función auxiliar para manejar valores nulos/undefined
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
      {/* Header Component */}
      <OperatorsHeader
        operators={operators}
        inactiveOperators={inactiveOperators}
        activeTab={activeTab}
        searchTerm={searchTerm}
        filteredOperators={filteredOperators}
        filteredInactiveOperators={filteredInactiveOperators}
        onTabChange={setActiveTab}
        onSearchChange={setSearchTerm}
      />

      {/* Table Component */}
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

      {/* Modals */}
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
    </div>
  );
};

export default OperatorsPage;