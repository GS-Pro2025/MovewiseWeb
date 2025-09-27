import React from 'react';
import { Operator } from '../../domain/OperatorsModels';

interface ConfirmDeleteDialogProps {
  operator: Operator;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({ 
  operator, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
            <h3 className="text-lg font-semibold text-gray-800">Confirm Deactivation</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to deactivate operator <strong>{operator.first_name} {operator.last_name}</strong>? 
            This will move them to the inactive operators list.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteDialog;