/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { createCostApi } from '../../data/CostRepository';
import { createCost } from '../../domain/ModelsCost';
import { enqueueSnackbar } from 'notistack';

interface CreateCostDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCostDialog: React.FC<CreateCostDialogProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<createCost>({
    description: '',
    cost: 0,
    type: 'FIXED'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        description: '',
        cost: 0,
        type: 'FIXED'
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.cost <= 0) {
      newErrors.cost = 'Cost must be greater than 0';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await createCostApi(formData);
      enqueueSnackbar('Cost created successfully', { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Error creating cost', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof createCost, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: "rgba(30, 41, 59, 0.55)", // azul oscuro translúcido
        backdropFilter: "blur(6px)",           // desenfoque
        WebkitBackdropFilter: "blur(6px)",     // soporte Safari
        transition: "background 0.3s"
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
        {/* Header */}
        <div 
          className="px-6 py-4 border-b border-gray-200 rounded-t-2xl"
          style={{ backgroundColor: '#0B2863' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-plus-circle"></i>
              Create New Cost
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-white hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description Field */}
          <div>
            <label 
              htmlFor="description" 
              className="block text-sm font-semibold mb-2"
              style={{ color: '#0B2863' }}
            >
              Description *
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 transition-all ${
                errors.description 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              placeholder="Enter cost description"
              disabled={loading}
              autoFocus
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Cost Field */}
          <div>
            <label 
              htmlFor="cost" 
              className="block text-sm font-semibold mb-2"
              style={{ color: '#0B2863' }}
            >
              Cost Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500 font-medium">$</span>
              <input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', Number(e.target.value))}
                className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.cost 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            {errors.cost && (
              <p className="text-red-600 text-sm mt-1">{errors.cost}</p>
            )}
          </div>

          {/* Type Field */}
          <div>
            <label 
              htmlFor="type" 
              className="block text-sm font-semibold mb-2"
              style={{ color: '#0B2863' }}
            >
              Cost Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('type', 'FIXED')}
                disabled={loading}
                className={`px-4 py-3 border-2 rounded-lg font-semibold transition-all duration-200 ${
                  formData.type === 'FIXED'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                }`}
              >
                <i className="fas fa-anchor mr-2"></i>
                FIXED
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('type', 'VARIABLE')}
                disabled={loading}
                className={`px-4 py-3 border-2 rounded-lg font-semibold transition-all duration-200 ${
                  formData.type === 'VARIABLE'
                    ? 'border-orange-500 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-orange-400'
                }`}
                style={{
                  backgroundColor: formData.type === 'VARIABLE' ? '#F09F52' : 'white'
                }}
              >
                <i className="fas fa-chart-line mr-2"></i>
                VARIABLE
              </button>
            </div>
            {errors.type && (
              <p className="text-red-600 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Create Cost
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCostDialog;