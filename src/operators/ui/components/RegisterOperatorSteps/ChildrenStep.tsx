import React, { useState } from 'react';
import { Son } from '../../../domain/RegistryOperatorModel';

interface ChildrenStepProps {
  sons: Son[];
  onChange: (sons: Son[]) => void;
}

const ChildrenStep: React.FC<ChildrenStepProps> = ({ sons, onChange }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChild, setNewChild] = useState<Son>({
    name: '',
    birth_date: '',
    gender: 'M'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateChild = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!newChild.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!newChild.birth_date) {
      newErrors.birth_date = 'Birth date is required';
    } else {
      // Validar que la fecha no sea futura
      const selectedDate = new Date(newChild.birth_date);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.birth_date = 'Birth date cannot be in the future';
      }
    }
    if (!newChild.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddChild = () => {
    if (validateChild()) {
      onChange([...sons, { ...newChild }]);
      setNewChild({ name: '', birth_date: '', gender: 'M' });
      setShowAddForm(false);
      setErrors({});
    }
  };

  const handleRemoveChild = (index: number) => {
    const updatedSons = sons.filter((_, i) => i !== index);
    onChange(updatedSons);
  };

  const handleEditChild = (index: number) => {
    const childToEdit = sons[index];
    setNewChild(childToEdit);
    handleRemoveChild(index);
    setShowAddForm(true);
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'M':
        return 'fa-mars text-blue-600';
      case 'F':
        return 'fa-venus text-pink-600';
      default:
        return 'fa-genderless text-purple-600';
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'M':
        return 'Male';
      case 'F':
        return 'Female';
      default:
        return 'Other';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-3">
          <i className="fas fa-baby text-3xl text-pink-600"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Children Information</h3>
        <p className="text-gray-600 mt-1">Add operator's children (Optional)</p>
      </div>

      {/* Summary Card */}
      {sons.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-pink-200 rounded-full p-3">
                <i className="fas fa-users text-pink-700"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Children</p>
                <p className="text-2xl font-bold text-gray-800">{sons.length}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Another
            </button>
          </div>
        </div>
      )}

      {/* Lista de hijos agregados */}
      {sons.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <i className="fas fa-list"></i>
            Registered Children
          </h4>
          {sons.map((child, index) => (
            <div
              key={index}
              className="bg-white border-2 border-pink-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-pink-100 rounded-full w-12 h-12 flex items-center justify-center">
                    <i className={`fas ${getGenderIcon(child.gender)} text-xl`}></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">{child.name}</p>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-birthday-cake"></i>
                        {new Date(child.birth_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-child"></i>
                        {calculateAge(child.birth_date)} years old
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-venus-mars"></i>
                        {getGenderLabel(child.gender)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditChild(index)}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full p-2 transition-colors"
                    title="Edit child"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleRemoveChild(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-2 transition-colors"
                    title="Remove child"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón para mostrar formulario (solo si no hay hijos) */}
      {sons.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <i className="fas fa-baby text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 mb-2">No children added yet</p>
          <p className="text-sm text-gray-400 mb-4">This step is optional</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 border-2 border-dashed border-pink-300 rounded-lg text-pink-600 hover:bg-pink-50 transition-colors inline-flex items-center gap-2 font-medium"
          >
            <i className="fas fa-plus-circle"></i>
            Add Child
          </button>
        </div>
      )}

      {/* Formulario para agregar hijo */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-300 rounded-xl p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <i className="fas fa-user-plus text-pink-600"></i>
              Add New Child
            </h4>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewChild({ name: '', birth_date: '', gender: 'M' });
                setErrors({});
              }}
              className="text-gray-500 hover:text-gray-700 hover:bg-white rounded-full p-2 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Child's Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={newChild.name}
                  onChange={(e) => {
                    setNewChild({ ...newChild, name: e.target.value });
                    if (errors.name) {
                      const newErrors = { ...errors };
                      delete newErrors.name;
                      setErrors(newErrors);
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter child's full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birth Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-calendar text-gray-400"></i>
                </div>
                <input
                  type="date"
                  value={newChild.birth_date}
                  onChange={(e) => {
                    setNewChild({ ...newChild, birth_date: e.target.value });
                    if (errors.birth_date) {
                      const newErrors = { ...errors };
                      delete newErrors.birth_date;
                      setErrors(newErrors);
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    errors.birth_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.birth_date && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.birth_date}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={newChild.gender}
                onChange={(e) => setNewChild({ ...newChild, gender: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.gender}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-pink-200">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewChild({ name: '', birth_date: '', gender: 'M' });
                setErrors({});
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </button>
            <button
              onClick={handleAddChild}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-md hover:shadow-lg"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Child
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
        <div className="flex items-start">
          <i className="fas fa-info-circle text-pink-600 mt-1 mr-3"></i>
          <div>
            <p className="text-sm text-pink-800 font-medium">Optional Information</p>
            <p className="text-sm text-pink-700 mt-1">
              Adding children information is optional. This data may be used for benefits, emergency contacts, or company family programs. You can skip this step and continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildrenStep;