/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { updateTruck } from '../../data/repositoryTruck';
import { Truck } from '../../domain/TruckModels';

import { enqueueSnackbar } from 'notistack';

// Componente para editar truck - CORREGIDO
export const EditTruckDialog: React.FC<{
  truck: { truckId: number; truckName: string; truckNumber: string; truckType: string };
  onClose: () => void;
  onTruckUpdated: (truck: Truck) => void;
}> = ({ truck, onClose, onTruckUpdated }) => {
  console.log('EditTruckDialog rendered with truck:', truck);
  
  const [formData, setFormData] = useState({
    type: truck.truckType,
    name: truck.truckName,
    category: 'own'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string[] | undefined}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    console.log('Updating truck with data:', formData);

    try {
      const updatedTruck = await updateTruck(truck.truckId, formData);
      console.log('Truck updated successfully:', updatedTruck);
      onTruckUpdated(updatedTruck);
      onClose();
      enqueueSnackbar(`Truck ${truck.truckNumber} updated successfully!`, { variant: 'success' });
    } catch (error: any) {
      console.error('Update truck error:', error);
      if (error.validation) {
        setErrors(error.validation);
      } else {
        enqueueSnackbar(error.message || 'Error updating truck', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const truckTypes = ['car', 'rented', 'truck', 'vans'];
  const truckCategories = ['vans', 'own', 'truck_26'];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Edit Truck - {truck.truckNumber}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              {loading ? 'Updating...' : 'Update Truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
