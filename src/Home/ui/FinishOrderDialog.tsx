import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Input,
  CircularProgress,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CheckIcon from '@mui/icons-material/Check';
import { useSnackbar } from 'notistack';

interface FinishOrderDialogProps {
  open: boolean;
  loading: boolean;
  image: File | null;
  onClose: () => void;
  onOk: () => void;
  onImageChange: (file: File | null) => void;
}

const FinishOrderDialog: React.FC<FinishOrderDialogProps> = ({
  open,
  loading,
  image,
  onClose,
  onOk,
  onImageChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar('Sorry, the image cannot be larger than 5mb.', { variant: 'warning' });
        return;
      }
      onImageChange(file);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>¿Quieres terminar la orden?</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PhotoCamera />}
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? 'Change image' : 'Upload image of closure(optional)'}
          </Button>
          <Input
            inputRef={fileInputRef}
            type="file"
            inputProps={{ accept: 'image/*' }}
            sx={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {image && (
            <img
              src={URL.createObjectURL(image)}
              alt="Image preview"
              style={{ maxWidth: 200, marginTop: 8, borderRadius: 8 }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={onOk}
          color="success"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinishOrderDialog;