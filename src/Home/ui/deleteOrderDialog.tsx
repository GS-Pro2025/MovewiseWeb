import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

interface DeleteOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderRef?: string;
  orderDate?: string;
  title?: string;
  description?: string;
  confirmText?: string;
  icon?: React.ReactNode;
}

const DeleteOrderDialog: React.FC<DeleteOrderDialogProps> = ({
  open,
  onClose,
  onConfirm,
  orderRef,
  orderDate,
  title = "Delete Order",
  description = "Are you sure you want to delete this order?",
  confirmText = "Delete",
  icon,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>
      {icon} {title}
    </DialogTitle>
    <DialogContent>
      <Typography>{description}</Typography>
      {orderRef && <Typography>Reference: {orderRef}</Typography>}
      {orderDate && <Typography>Date: {orderDate}</Typography>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteOrderDialog;