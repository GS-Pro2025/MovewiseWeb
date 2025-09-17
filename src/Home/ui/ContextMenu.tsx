import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
          <ContentCopyIcon fontSize="small" color="primary" />
        </ListItemIcon>
        <ListItemText>Continue Order</ListItemText>
      </MenuItem>
      
      <MenuItem 
        onClick={() => handleAction('finish')}
        disabled={row?.status === 'finished'}
      >
        <ListItemIcon>
          <CheckIcon fontSize="small" color="success" />
        </ListItemIcon>
        <ListItemText>
          {row?.status === 'finished' ? 'Already Finished' : 'Finish Order'}
        </ListItemText>
      </MenuItem>
      
      <MenuItem onClick={() => handleAction('edit')}>
        <ListItemIcon>
          <EditIcon fontSize="small" color="primary" />
        </ListItemIcon>
        <ListItemText>Edit Order</ListItemText>
      </MenuItem>

      <MenuItem 
        onClick={() => handleAction('inactivate')}
        sx={{ color: 'warning.main' }}
      >
        <ListItemIcon>
          <BlockIcon fontSize="small" color="warning" />
        </ListItemIcon>
        <ListItemText>Inactivate Order</ListItemText>
      </MenuItem>

      <MenuItem 
        onClick={() => handleAction('delete')}
        sx={{ color: 'error.main' }}
      >
        <ListItemIcon>
          <DeleteIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText>Delete Order (Absolute)</ListItemText>
      </MenuItem>
    </Menu>
  );
};