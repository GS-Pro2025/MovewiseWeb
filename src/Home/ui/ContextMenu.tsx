import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { 
  Check, 
  Edit, 
  Ban, 
  Trash2, 
  Copy,
  Image,
  Fuel
} from 'lucide-react';
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
}) => {
  const handleAction = (action: string) => {
    if (!row) return;
    
    switch (action) {
      case 'continue':
        onContinueOrder(row);
        break;
      case 'finish':
        if (row.status !== 'finished') {
          onFinishOrder(row.id);
        }
        break;
      case 'edit':
        onEditOrder(row);
        break;
      case 'inactivate':
        onInactivateOrder(row);
        break;
      case 'delete':
        onDeleteOrder(row);
        break;
      case 'view-dispatch':
        if (onViewDispatchTicket) onViewDispatchTicket(row);
        break;
      case 'addFuelCost':
        if (onAddFuelCost) {
          onAddFuelCost(row);
        }
        break;
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
      <MenuItem 
        onClick={() => handleAction('continue')}
        disabled={!row}
      >
        <ListItemIcon>
          <Copy size={20} color="#3b82f6" />
        </ListItemIcon>
        <ListItemText>Continue Order</ListItemText>
      </MenuItem>
      
      <MenuItem 
        onClick={() => handleAction('finish')}
        disabled={row?.status === 'finished'}
      >
        <ListItemIcon>
          <Check size={20} color={row?.status === 'finished' ? '#9ca3af' : '#22c55e'} />
        </ListItemIcon>
        <ListItemText>
          {row?.status === 'finished' ? 'Already Finished' : 'Finish Order'}
        </ListItemText>
      </MenuItem>
      
      <MenuItem onClick={() => handleAction('edit')}>
        <ListItemIcon>
          <Edit size={20} color="#3b82f6" />
        </ListItemIcon>
        <ListItemText>Edit Order</ListItemText>
      </MenuItem>

      <MenuItem 
        onClick={() => handleAction('inactivate')}
        sx={{ color: 'warning.main' }}
      >
        <ListItemIcon>
          <Ban size={20} color="#f59e0b" />
        </ListItemIcon>
        <ListItemText>Inactivate Order</ListItemText>
      </MenuItem>

      <MenuItem 
        onClick={() => handleAction('delete')}
        sx={{ color: 'error.main' }}
      >
        <ListItemIcon>
          <Trash2 size={20} color="#ef4444" />
        </ListItemIcon>
        <ListItemText>Delete Order (Absolute)</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => handleAction('view-dispatch')}
        disabled={!row?.dispatch_ticket}
      >
        <ListItemIcon>
          <Image size={20} color={row?.dispatch_ticket ? "#f59e0b" : "#9ca3af"} />
        </ListItemIcon>
        <ListItemText>View Dispatch Ticket</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleAction('addFuelCost')}>
        <ListItemIcon>
          <Fuel size={16} />
        </ListItemIcon>
        <ListItemText primary="Add Fuel Cost" />
      </MenuItem>
    </Menu>
  );
};