import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  Tooltip,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import {
  addOrderEvidence,
  deleteOrderEvidence,
} from '../data/repositoryOrders';
import { OrderEvidence } from '../domain/ModelOrdersReport';

interface OrderEvidenceDialogProps {
  open: boolean;
  onClose: () => void;
  orderKey: string;
  orderRef: string;
  /** Evidences already loaded from the orders list response */
  initialEvidences: OrderEvidence[];
  /** Called after an add/delete so the parent can refresh table data */
  onDataChanged?: () => void;
}

const OrderEvidenceDialog: React.FC<OrderEvidenceDialogProps> = ({
  open,
  onClose,
  orderKey,
  orderRef,
  initialEvidences,
  onDataChanged,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  const [evidences, setEvidences] = useState<OrderEvidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Seed local state from the already-loaded list data every time the dialog opens
  useEffect(() => {
    if (open) {
      setEvidences(initialEvidences);
      setPreviewSrc(null);
    } else {
      setEvidences([]);
      setPreviewSrc(null);
    }
  }, [open, initialEvidences]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (!target.files || !target.files[0]) return;
    const file = target.files[0];
    // Reset the input so the same file can be re-selected
    target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('Image cannot be larger than 5 MB.', { variant: 'warning' });
      return;
    }

    setUploading(true);
    const result = await addOrderEvidence(orderKey, file);
    if (result.success && result.data) {
      setEvidences((prev) => [...prev, result.data!]);
      enqueueSnackbar('Evidence photo added.', { variant: 'success' });
      onDataChanged?.();
    } else {
      enqueueSnackbar(result.errorMessage || 'Error uploading evidence', { variant: 'error' });
    }
    setUploading(false);
  };

  const handleDelete = async (ev: OrderEvidence) => {
    setDeletingId(ev.id);
    const result = await deleteOrderEvidence(orderKey, ev.id);
    if (result.success) {
      setEvidences((prev) => prev.filter((e) => e.id !== ev.id));
      if (previewSrc === ev.image_url) setPreviewSrc(null);
      enqueueSnackbar('Evidence photo deleted.', { variant: 'success' });
      onDataChanged?.();
    } else {
      enqueueSnackbar(result.errorMessage || 'Error deleting evidence', { variant: 'error' });
    }
    setDeletingId(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            Evidence Photos
            {orderRef && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                — {orderRef}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {evidences.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body2">No evidence photos yet.</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {evidences.map((ev) => (
                <Grid item xs={12} sm={6} md={4} key={ev.id}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover .overlay': { opacity: 1 },
                    }}
                    onClick={() => setPreviewSrc(ev.image_url)}
                  >
                    <img
                      src={ev.image_url}
                      alt={`Evidence ${ev.id}`}
                      style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <Box
                      className="overlay"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'rgba(0,0,0,0.4)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        p: 0.5,
                      }}
                    >
                      <Tooltip title="Delete photo">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(ev);
                            }}
                            disabled={deletingId === ev.id}
                            sx={{ color: '#fff', bgcolor: 'rgba(220,38,38,0.8)', '&:hover': { bgcolor: 'error.main' } }}
                          >
                            {deletingId === ev.id ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', px: 1, py: 0.5, color: 'text.secondary' }}>
                      {new Date(ev.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          <Button
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={18} /> : <PhotoCamera />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Add Evidence Photo'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button onClick={onClose} variant="text">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full-size preview lightbox */}
      {previewSrc && (
        <Dialog open onClose={() => setPreviewSrc(null)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'flex-end', pb: 0 }}>
            <IconButton onClick={() => setPreviewSrc(null)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
            <img
              src={previewSrc}
              alt="Evidence preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default OrderEvidenceDialog;
