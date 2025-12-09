/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { ExtraIncomeItem } from '../../domain/ModelsSummaryLight';
import { adjustExtraIncomeValue } from '../../data/ExtraIncomeRepository';
import { enqueueSnackbar } from 'notistack';

interface EditExtraIncomeDialogProps {
  open: boolean;
  income: ExtraIncomeItem | null;
  onClose: () => void;
  onSuccess?: (updatedIncome: ExtraIncomeItem) => void;
}

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const EditExtraIncomeDialog: React.FC<EditExtraIncomeDialogProps> = ({
  open,
  income,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [adjustment, setAdjustment] = useState<string>('0');
  const [preview, setPreview] = useState<{ 
    previous: number; 
    new: number;
  } | null>(null);

  if (!open || !income) return null;

  const handleAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAdjustment(value);

    // Calcular preview
    if (value && !isNaN(Number(value))) {
      const adjValue = Number(value);
      const previousValue = income.value;
      let newValue = previousValue;

      if (operation === 'add') {
        newValue = previousValue + adjValue;
      } else if (operation === 'subtract') {
        newValue = Math.max(0, previousValue - adjValue); // No permitir negativos
      }

      setPreview({
        previous: previousValue,
        new: Number(newValue.toFixed(2))
      });
    } else {
      setPreview(null);
    }
  };

  const handleOperationChange = (op: 'add' | 'subtract') => {
    setOperation(op);
    // Recalcular preview con la nueva operación
    if (adjustment && !isNaN(Number(adjustment))) {
      const adjValue = Number(adjustment);
      const previousValue = income.value;
      let newValue = previousValue;

      if (op === 'add') {
        newValue = previousValue + adjValue;
      } else if (op === 'subtract') {
        newValue = Math.max(0, previousValue - adjValue);
      }

      setPreview({
        previous: previousValue,
        new: Number(newValue.toFixed(2))
      });
    }
  };

  const handleApply = async () => {
    if (!adjustment || isNaN(Number(adjustment)) || Number(adjustment) <= 0) {
      enqueueSnackbar('Please enter a valid adjustment amount', { variant: 'warning' });
      return;
    }

    if (!income) return;

    // Validar que no resulte en valor negativo
    const adjValue = Number(adjustment);
    if (operation === 'subtract' && adjValue > income.value) {
      enqueueSnackbar('Subtraction would result in negative value', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await adjustExtraIncomeValue(income.id, operation, adjValue);
      
      // Crear el objeto actualizado basado en la respuesta
      const updatedIncome: ExtraIncomeItem = {
        ...income,
        value: response.data.value,
        updated_at: response.data.updated_at
      };

      enqueueSnackbar(
        `${operation === 'add' ? 'Added' : 'Subtracted'} ${formatCurrency(adjValue)} ${operation === 'add' ? 'to' : 'from'} income. New value: ${formatCurrency(response.data.value)}`,
        { variant: 'success' }
      );

      onSuccess?.(updatedIncome);
      setAdjustment('0');
      setPreview(null);
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err.message || `Error adjusting income value`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backdropFilter: open ? 'blur(5px)' : 'blur(0px)',
        backgroundColor: open ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)'
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 transform transition-all duration-300"
        style={{
          transform: open ? 'scale(1)' : 'scale(0.95)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: '#22c55e' }}>
            Adjust Income Value
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Income Info */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-1">Description</p>
            <p className="font-semibold text-gray-800">{income.description}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Value</p>
            <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
              {formatCurrency(income.value)}
            </p>
          </div>
        </div>

        {/* Operation Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3" style={{ color: '#0B2863' }}>
            Operation
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleOperationChange('add')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                operation === 'add'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-plus mr-2"></i>
              Add
            </button>
            <button
              onClick={() => handleOperationChange('subtract')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                operation === 'subtract'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-minus mr-2"></i>
              Subtract
            </button>
          </div>
        </div>

        {/* Adjustment Amount */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#0B2863' }}>
            Amount to {operation === 'add' ? 'Add' : 'Subtract'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={adjustment}
              onChange={handleAdjustmentChange}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              style={{
                borderColor: adjustment ? '#22c55e' : '#d1d5db'
              }}
              disabled={loading}
            />
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-gray-600 mb-2 font-semibold">Preview</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Previous Value:</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(preview.previous)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-blue-200">
                <span className="text-sm text-gray-700">
                  {operation === 'add' ? 'Add' : 'Subtract'}:
                </span>
                <span className={`font-semibold ${operation === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                  {operation === 'add' ? '+' : '-'}{formatCurrency(adjustment)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t-2 border-blue-300 bg-blue-100 px-2 rounded">
                <span className="text-sm font-semibold text-blue-900">New Value:</span>
                <span className="text-lg font-bold" style={{ color: '#22c55e' }}>
                  {formatCurrency(preview.new)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading || !adjustment || isNaN(Number(adjustment)) || Number(adjustment) <= 0}
            className="flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: operation === 'add' ? '#22c55e' : '#f97316'
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                <i className={`fas fa-${operation === 'add' ? 'plus' : 'minus'}`}></i>
                {operation === 'add' ? 'Add' : 'Subtract'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExtraIncomeDialog;
