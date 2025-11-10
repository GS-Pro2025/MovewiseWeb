/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { deleteTruck } from '../../data/repositoryTruck';
import { enqueueSnackbar } from 'notistack';

// Componente para confirmar eliminación
export const DeleteConfirmDialog: React.FC<{
  truck: { truckId: number; truckName: string; truckNumber: string };
  onClose: () => void;
  onTruckDeleted: (truckId: number) => void;
}> = ({ truck, onClose, onTruckDeleted }) => {
  console.log('DeleteConfirmDialog rendered with truck:', truck);
  
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    console.log('Attempting to delete truck:', truck.truckId);
    
    try {
      await deleteTruck(truck.truckId);
      console.log('Truck deleted successfully');
      onTruckDeleted(truck.truckId);
      onClose();
      enqueueSnackbar(`Truck ${truck.truckNumber} deleted successfully!`, { variant: 'success' });
    } catch (error: any) {
      console.error('Delete truck error:', error);
      enqueueSnackbar(error.message || 'Error deleting truck', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-red-600">Delete Truck</h3>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete truck <strong>{truck.truckNumber}</strong> ({truck.truckName})?
          </p>
          <p className="text-sm text-red-600 mb-6">
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};