/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { CreateExtraIncomeRequest, ExtraIncome } from '../../domain/ExtraIncomeModels';
import { createExtraIncome } from '../../data/ExtraIncomeRepository';
import { enqueueSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

interface CreateExtraIncomeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newIncome: ExtraIncome) => void;
}

const CreateExtraIncomeDialog: React.FC<CreateExtraIncomeDialogProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Omit<CreateExtraIncomeRequest, 'type'> & { type?: 'CREATED' }>({
    value: 0,
    description: '',
    type: 'CREATED',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setFormData({ value: 0, description: '', type: 'CREATED', date: new Date().toISOString().split('T')[0] });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.description.trim()) newErrors.description = t('createExtraIncome.errors.descriptionRequired');
    if (formData.value <= 0)          newErrors.value       = t('createExtraIncome.errors.valueRequired');
    if (!formData.date)               newErrors.date        = t('createExtraIncome.errors.dateRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: field === 'value' ? Number(value) : value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const requestData: CreateExtraIncomeRequest = {
        value: formData.value,
        description: formData.description,
        type: 'CREATED',
        date: formData.date,
      };
      const response = await createExtraIncome(requestData);
      enqueueSnackbar(t('createExtraIncome.snackbar.success'), { variant: 'success' });
      onSuccess(response.data);
      handleClose();
    } catch (err: any) {
      enqueueSnackbar(err.message || t('createExtraIncome.snackbar.error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ value: 0, description: '', type: 'CREATED', date: new Date().toISOString().split('T')[0] });
    setErrors({});
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(30, 41, 59, 0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 rounded-t-2xl" style={{ backgroundColor: '#22c55e' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-plus-circle" />
              {t('createExtraIncome.title')}
            </h2>
            <button onClick={handleClose} disabled={loading} className="text-white hover:text-gray-200 transition-colors disabled:opacity-50">
              <i className="fas fa-times text-xl" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
              {t('createExtraIncome.fields.description')} *
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 transition-all ${
                errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
              }`}
              placeholder={t('createExtraIncome.fields.descriptionPlaceholder')}
              disabled={loading}
              autoFocus
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="value" className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
              {t('createExtraIncome.fields.amount')} *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500 font-medium">$</span>
              <input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleInputChange('value', Number(e.target.value))}
                className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.value ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
                }`}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            {errors.value && <p className="text-red-600 text-sm mt-1">{errors.value}</p>}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
              {t('createExtraIncome.fields.date')} *
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 transition-all ${
                errors.date ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
              }`}
              disabled={loading}
            />
            {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
          </div>

          {/* Preview */}
          {formData.value > 0 && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">{t('createExtraIncome.preview.label')}</div>
              <div className="text-lg font-bold" style={{ color: '#22c55e' }}>
                ${formData.value.toFixed(2)} — {formData.description || t('createExtraIncome.preview.untitled')}
              </div>
              <div className="text-xs text-gray-400 mt-1">{formData.date}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {t('createExtraIncome.actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.description.trim() || formData.value <= 0}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {t('createExtraIncome.actions.creating')}
                </>
              ) : (
                <>
                  <i className="fas fa-save" />
                  {t('createExtraIncome.actions.create')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExtraIncomeDialog;