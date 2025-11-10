/* eslint-disable @typescript-eslint/no-explicit-any */
// Componente para crear truck
import React, { useState } from 'react';
import { Truck } from '../../domain/TruckModels';
import { enqueueSnackbar } from 'notistack';
import { createTruck } from '../../data/repositoryTruck';

export const CreateTruckDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onTruckCreated: (truck: Truck) => void;
}> = ({ isOpen, onClose, onTruckCreated }) => {
  const [formData, setFormData] = useState({
    number_truck: '',
    type: '',
    name: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string[]}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const newTruck = await createTruck(formData);
      onTruckCreated(newTruck);
      onClose();
      enqueueSnackbar(`Truck ${newTruck.number_truck} created successfully!`, { variant: 'success' });
      setFormData({
        number_truck: '',
        type: '',
        name: '',
        category: ''
      });
    } catch (error: any) {
      if (error.validation) {
        setErrors(error.validation);
      } else {
        enqueueSnackbar(error.message || 'Error creating truck', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const truckTypes = [
    'Carga Ligera',
    'Carga Pesada',
    'Refrigerado',
    'Tanque',
    'Plataforma'
  ];

  const truckCategories = [
    'Standard',
    'Freezer',
    'Hazmat',
    'Oversized'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Add New Truck</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Truck Number *
            </label>
            <input
              type="text"
              value={formData.number_truck}
              onChange={(e) => handleChange('number_truck', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.number_truck ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g. DEF112, ABC-001"
              required
            />
            {errors.number_truck && (
              <p className="text-red-500 text-sm mt-1">{errors.number_truck[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Truck Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g. Truck 3, Blue Express"
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select type</option>
              {truckTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select category</option>
              {truckCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category[0]}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};