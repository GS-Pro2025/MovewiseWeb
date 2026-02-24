import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Check, Edit, Ban, Trash2, Copy, Image, Fuel, PlusCircle } from 'lucide-react';
import { TableData } from '../domain/TableData';

interface ContextMenuProps {
  anchorPosition: { top: number; left: number } | null;
  row: TableData | null;
  onClose: () => void;
  onContinueOrder: (order: TableData) => void;
  onFinishOrder: (orderId: string) => void;
  onEditOrder: (order: TableData) => void;
  onInactivateOrder: (order: TableData) => void;
  onDeleteOrder: (order: TableData) => void;
  onViewDispatchTicket?: (order: TableData) => void;
  onAddFuelCost?: (order: TableData) => void;
  onCreateExtraCost?: (order: TableData) => void; // Asegúrate de que esta línea está presente
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  anchorPosition,
  row,
  onClose,
  onContinueOrder,
  onFinishOrder,
  onEditOrder,
  onInactivateOrder,
  onDeleteOrder,
  onViewDispatchTicket,
  onAddFuelCost,
  onCreateExtraCost, // Asegúrate de que esta línea está presente en la desestructuración
}) => {
  const { t } = useTranslation();

  const handleAction = (action: string) => {
    if (!row) return;
    switch (action) {
      case 'continue':     onContinueOrder(row); break;
      case 'finish':       if (row.status !== 'finished') onFinishOrder(row.id); break;
      case 'edit':         onEditOrder(row); break;
      case 'inactivate':   onInactivateOrder(row); break;
      case 'delete':       onDeleteOrder(row); break;
      case 'view-dispatch': if (onViewDispatchTicket) onViewDispatchTicket(row); break;
      case 'addFuelCost':  if (onAddFuelCost) onAddFuelCost(row); break;
      case 'createExtraCost': if (onCreateExtraCost) onCreateExtraCost(row); break; 
    }
    onClose();
  };

  return (
    <Menu
      open={anchorPosition !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition || undefined}
      slotProps={{
        paper: {
          sx: {
            minWidth: 180,
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid #e0e0e0',
          }
        }
      }}
    >
      <MenuItem onClick={() => handleAction('continue')} disabled={!row}>
        <ListItemIcon><Copy size={20} color="#3b82f6" /></ListItemIcon>
        <ListItemText>{t('contextMenu.continueOrder')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction('finish')} disabled={row?.status === 'finished'}>
        <ListItemIcon>
          <Check size={20} color={row?.status === 'finished' ? '#9ca3af' : '#22c55e'} />
        </ListItemIcon>
        <ListItemText>
          {row?.status === 'finished' ? t('contextMenu.alreadyFinished') : t('contextMenu.finishOrder')}
        </ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction('edit')}>
        <ListItemIcon><Edit size={20} color="#3b82f6" /></ListItemIcon>
        <ListItemText>{t('contextMenu.editOrder')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction('inactivate')} sx={{ color: 'warning.main' }}>
        <ListItemIcon><Ban size={20} color="#f59e0b" /></ListItemIcon>
        <ListItemText>{t('contextMenu.inactivateOrder')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
        <ListItemIcon><Trash2 size={20} color="#ef4444" /></ListItemIcon>
        <ListItemText>{t('contextMenu.deleteOrder')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction('view-dispatch')} disabled={!row?.dispatch_ticket}>
        <ListItemIcon>
          <Image size={20} color={row?.dispatch_ticket ? "#f59e0b" : "#9ca3af"} />
        </ListItemIcon>
        <ListItemText>{t('contextMenu.viewDispatchTicket')}</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction('addFuelCost')}>
        <ListItemIcon><Fuel size={16} /></ListItemIcon>
        <ListItemText>{t('contextMenu.addFuelCost')}</ListItemText>
      </MenuItem>

      {/* Nuevo menú item para Crear Costo Extra */}
      <MenuItem onClick={() => handleAction('createExtraCost')}>
        <ListItemIcon>
          <PlusCircle size={16} color="#0B2863" />
        </ListItemIcon>
        <ListItemText>{t('contextMenu.createExtraCost')}</ListItemText>
      </MenuItem>
    </Menu>
  );
};