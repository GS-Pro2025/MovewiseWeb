/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { DeleteConfirmDialog } from './DeleteTruckDialog';
import { Truck } from '../../domain/TruckModels';
import { EditTruckDialog } from './UpdateTruckDialog';

// Componente para menú contextual
export const TruckContextMenu: React.FC<{
  truck: { truckId: number; truckName: string; truckNumber: string; truckType: string };
  position: { x: number; y: number };
  onClose: () => void;
  onTruckUpdated: (truck: Truck) => void;
  onTruckDeleted: (truckId: number) => void;
}> = ({ truck, position, onClose, onTruckUpdated, onTruckDeleted }) => {
  console.log('TruckContextMenu rendered with truck:', truck);
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    console.log('Edit clicked for truck:', truck.truckId);
    setShowEditDialog(true);
    onClose(); // Cerrar inmediatamente el menú
  };

  const handleDelete = () => {
    console.log('Delete clicked for truck:', truck.truckId);
    setShowDeleteDialog(true);
    onClose(); // Cerrar inmediatamente el menú
  };

  // Agregar este useEffect para debuggear
  useEffect(() => {
    console.log('ShowEditDialog changed to:', showEditDialog);
    console.log('ShowDeleteDialog changed to:', showDeleteDialog);
  }, [showEditDialog, showDeleteDialog]);

  return (
    <>
      <div
        className="fixed bg-white shadow-lg border border-gray-200 rounded-lg py-2 z-[9998] min-w-[150px]"
        style={{
          top: position.y,
          left: position.x,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleEdit}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        >
          <i className="fas fa-edit text-blue-500"></i>
          Edit Truck
        </button>
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
        >
          <i className="fas fa-trash text-red-500"></i>
          Delete Truck
        </button>
      </div>

      {showEditDialog && (
        <EditTruckDialog
          truck={truck}
          onClose={() => {
            console.log('Closing edit dialog');
            setShowEditDialog(false);
          }}
          onTruckUpdated={onTruckUpdated}
        />
      )}

      {showDeleteDialog && (
        <DeleteConfirmDialog
          truck={truck}
          onClose={() => {
            console.log('Closing delete dialog');
            setShowDeleteDialog(false);
          }}
          onTruckDeleted={onTruckDeleted}
        />
      )}
    </>
  );
};