/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { sendPdfEmail } from '../../../service/EmailRepository';
import { useSnackbar } from 'notistack';

interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  operatorEmail: string;
  operatorName: string;
}

const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  open,
  onClose,
  operatorEmail,
  operatorName,
}) => {
  const [subject, setSubject] = useState(`Payment Receipt for ${operatorName}`);
  const [body, setBody] = useState(
    `Dear ${operatorName},\n\nPlease find attached your payment receipt.`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  // Update defaults when operatorName changes
  useEffect(() => {
    setSubject(`Payment Receipt for ${operatorName}`);
    setBody(`Dear ${operatorName},\n\nPlease find attached your payment receipt.`);
    // reset previous file/state when opening for a different operator
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
  }, [operatorName, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      enqueueSnackbar('Only PDF files are allowed.', { variant: 'error' });
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSendEmail = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file to send.');
      enqueueSnackbar('Please select a PDF file to send.', { variant: 'error' });
      return;
    }

    if (!operatorEmail) {
      setError('Recipient email is missing.');
      enqueueSnackbar('Recipient email is missing.', { variant: 'error' });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await sendPdfEmail(selectedFile, body, subject, operatorEmail);

      if (result.success) {
        setSuccess(true);
        enqueueSnackbar(`Email sent successfully to ${operatorEmail}`, { variant: 'success' });
        onClose(); // Close the dialog on success
      } else {
        const msg = result.errorMessage || 'Failed to send email.';
        setError(msg);
        enqueueSnackbar(msg, { variant: 'error' }); // notify failure
      }
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred.';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' }); // notify exception
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send Payment Receipt to {operatorName}</DialogTitle>
      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Email sent successfully!
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Subject"
          fullWidth
          margin="normal"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <TextField
          label="Body"
          fullWidth
          margin="normal"
          multiline
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Attach PDF
          </Typography>

          {/* Hidden input */}
          <input
            ref={fileInputRef}
            id="pdf-file-input"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Visible drop / click area */}
          <Paper
            onClick={openFilePicker}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            elevation={0}
            sx={{
              border: '2px dashed',
              borderColor: selectedFile ? 'primary.main' : 'grey.300',
              bgcolor: selectedFile ? 'rgba(99,102,241,0.04)' : 'transparent',
              px: 2,
              py: 2,
              borderRadius: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {selectedFile ? selectedFile.name : 'Click or drag a PDF here to attach'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {selectedFile
                  ? `${Math.round((selectedFile.size || 0) / 1024)} KB`
                  : 'Accepted: .pdf — Max file size depends on server'}
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              size="small"
            >
              Choose file
            </Button>
          </Paper>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSendEmail}
          color="primary"
          disabled={loading || !selectedFile}
        >
          Send Email
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendEmailDialog;