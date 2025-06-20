import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

interface DeleteOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderRef?: string;
  orderDate?: string;
}

const DeleteOrderDialog: React.FC<DeleteOrderDialogProps> = ({
  open,
  onClose,
  onConfirm,
  orderRef,
  orderDate,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Delete Order</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete the order
        {orderRef ? ` (Reference: "${orderRef}")` : ""}
        {orderDate ? ` from ${orderDate}` : ""}
        ? This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="inherit">
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteOrderDialog;