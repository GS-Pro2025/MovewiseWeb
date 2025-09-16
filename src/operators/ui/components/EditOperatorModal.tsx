/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Operator } from '../../domain/OperatorsModels';

interface EditOperatorModalProps {
  operator: Operator;
  isOpen: boolean;
  onClose: () => void;
  onSave: (operatorData: FormData) => void;
}

const EditOperatorModal: React.FC<EditOperatorModalProps> = ({ 
  operator, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    // Campos del operador
    code: operator.code || '',
    number_licence: operator.number_licence || '',
    n_children: operator.n_children || 0,
    size_t_shift: operator.size_t_shift || '',
    name_t_shift: operator.name_t_shift || '',
    salary: operator.salary || '',
    status: operator.status || 'active',
    
    // Datos de la persona
    person: {
      first_name: operator.first_name || '',
      last_name: operator.last_name || '',
      birth_date: operator.birth_date || '',
      phone: operator.phone || '',
      address: operator.address || '',
      id_number: operator.id_number || '',
      type_id: operator.type_id || '',
      email: operator.email || '',
      status: 'active'
    }
  });

  const [files, setFiles] = useState<{
    photo?: File;
    license_front?: File;
    license_back?: File;
  }>({});

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (operator) {
      setFormData({
        // Campos del operador
        code: operator.code || '',
        number_licence: operator.number_licence || '',
        n_children: operator.n_children || 0,
        size_t_shift: operator.size_t_shift || '',
        name_t_shift: operator.name_t_shift || '',
        salary: operator.salary || '',
        status: operator.status || 'active',
        
        // Datos de la persona
        person: {
          first_name: operator.first_name || '',
          last_name: operator.last_name || '',
          birth_date: operator.birth_date || '',
          phone: operator.phone || '',
          address: operator.address || '',
          id_number: operator.id_number || '',
          type_id: operator.type_id || '',
          email: operator.email || '',
          status: 'active'
        }
      });
    }
  }, [operator]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('person.')) {
      const personField = field.replace('person.', '');
      setFormData(prev => ({
        ...prev,
        person: {
          ...prev.person,
          [personField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [field]: file || undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitFormData = new FormData();

      // Campos del operador
      submitFormData.append('code', formData.code);
      submitFormData.append('number_licence', formData.number_licence);
      submitFormData.append('n_children', formData.n_children.toString());
      submitFormData.append('size_t_shift', formData.size_t_shift);
      submitFormData.append('name_t_shift', formData.name_t_shift);
      submitFormData.append('salary', formData.salary);
      submitFormData.append('status', formData.status);

      // Datos de la persona (formato person.campo)
      submitFormData.append('person.first_name', formData.person.first_name);
      submitFormData.append('person.last_name', formData.person.last_name);
      submitFormData.append('person.birth_date', formData.person.birth_date);
      submitFormData.append('person.phone', formData.person.phone);
      submitFormData.append('person.address', formData.person.address);
      submitFormData.append('person.id_number', formData.person.id_number);
      submitFormData.append('person.type_id', formData.person.type_id);
      submitFormData.append('person.email', formData.person.email);
      submitFormData.append('person.status', formData.person.status);

      // Archivos (solo si se van a actualizar)
      if (files.photo) {
        submitFormData.append('photo', files.photo);
      }
      if (files.license_front) {
        submitFormData.append('license_front', files.license_front);
      }
      if (files.license_back) {
        submitFormData.append('license_back', files.license_back);
      }

      await onSave(submitFormData);
    } catch (error) {
      console.error('Error saving operator:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Edit Operator - {operator.first_name} {operator.last_name}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-user text-blue-500 mr-2"></i>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.person.first_name}
                  onChange={(e) => handleInputChange('person.first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.person.last_name}
                  onChange={(e) => handleInputChange('person.last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Date *
                </label>
                <input
                  type="date"
                  value={formData.person.birth_date}
                  onChange={(e) => handleInputChange('person.birth_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Type *
                </label>
                <select
                  value={formData.person.type_id}
                  onChange={(e) => handleInputChange('person.type_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="">Select ID Type</option>
                  <option value="passport">Passport</option>
                  <option value="license">Driver's License</option>
                  <option value="national_id">National ID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={formData.person.id_number}
                  onChange={(e) => handleInputChange('person.id_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.person.email}
                  onChange={(e) => handleInputChange('person.email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.person.phone}
                  onChange={(e) => handleInputChange('person.phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  value={formData.person.address}
                  onChange={(e) => handleInputChange('person.address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  required
                  disabled={loading}
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  value={formData.number_licence}
                  onChange={(e) => handleInputChange('number_licence', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Name
                </label>
                <input
                  type="text"
                  value={formData.name_t_shift}
                  onChange={(e) => handleInputChange('name_t_shift', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Size
                </label>
                <select
                  value={formData.size_t_shift}
                  onChange={(e) => handleInputChange('size_t_shift', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                >
                  <option value="">Select Size</option>
                  <option value="S">Small</option>
                  <option value="M">Medium</option>
                  <option value="L">Large</option>
                  <option value="XL">Extra Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Files */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-upload text-orange-500 mr-2"></i>
              Photos and Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
                {operator.photo && (
                  <div className="mt-2">
                    <img src={operator.photo} alt="Current photo" className="w-16 h-16 object-cover rounded" />
                    <p className="text-xs text-gray-500 mt-1">Current photo</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Front
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('license_front', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
                {operator.license_front && (
                  <div className="mt-2">
                    <img src={operator.license_front} alt="Current license front" className="w-16 h-16 object-cover rounded" />
                    <p className="text-xs text-gray-500 mt-1">Current front</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Back
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('license_back', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
                {operator.license_back && (
                  <div className="mt-2">
                    <img src={operator.license_back} alt="Current license back" className="w-16 h-16 object-cover rounded" />
                    <p className="text-xs text-gray-500 mt-1">Current back</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOperatorModal;