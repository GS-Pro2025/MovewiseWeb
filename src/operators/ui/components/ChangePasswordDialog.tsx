import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon, CheckCircle, ContentCopy } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { changeOperatorPassword } from '../../data/RepositoryOperators';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  operatorCode: string;
  operatorName: string;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onClose,
  operatorCode,
  operatorName,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [success, setSuccess] = useState(false);
  const [savedPassword, setSavedPassword] = useState('');

  const validate = (): boolean => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    } else if (newPassword === operatorCode) {
      newErrors.newPassword = 'Password cannot be the same as the operator code';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm the password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await changeOperatorPassword(operatorCode, newPassword);
      enqueueSnackbar(result.message || 'Password changed successfully', { variant: 'success' });
      setSavedPassword(newPassword);
      setSuccess(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error changing password';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(savedPassword);
    enqueueSnackbar('Password copied to clipboard!', { variant: 'success' });
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
    setLoading(false);
    setSuccess(false);
    setSavedPassword('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: success ? '#22c55e' : '#0B2863',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {success ? <CheckCircle /> : <LockIcon />}
        {success ? 'Password Changed Successfully!' : 'Change Operator Password'}
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {!success ? (
          <>
            <div className="mb-4 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Operator:</strong> {operatorName}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Code:</strong> {operatorCode}
              </p>
            </div>

            <div className="space-y-4">
              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                fullWidth
                required
                error={!!errors.newPassword}
                helperText={errors.newPassword || 'Minimum 6 characters. Cannot be equal to operator code.'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                          size="small"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                fullWidth
                required
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </div>
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              The password has been successfully changed for <strong>{operatorName}</strong>
            </Alert>

            <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <p className="text-sm font-semibold text-green-900 mb-2">
                📋 New Password:
              </p>
              <div className="flex items-center gap-2 bg-white p-3 rounded border border-green-200">
                <code className="flex-1 text-lg font-mono font-bold text-green-800">
                  {savedPassword}
                </code>
                <IconButton
                  onClick={handleCopyPassword}
                  size="small"
                  sx={{
                    bgcolor: '#22c55e',
                    color: 'white',
                    '&:hover': { bgcolor: '#16a34a' },
                  }}
                  title="Copy password"
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </div>
            </div>

            <Alert severity="warning" icon="🔐">
              <strong>Important:</strong> Share this password <strong>only</strong> with the operator{' '}
              <strong>{operatorName}</strong>. Keep it confidential and secure!
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!success ? (
          <>
            <Button onClick={handleClose} disabled={loading} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant="contained"
              sx={{ bgcolor: '#0B2863', '&:hover': { bgcolor: '#0a2050' } }}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' } }}
            startIcon={<CheckCircle />}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
