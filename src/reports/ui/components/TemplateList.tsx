import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import type { ReportTemplate } from '../../domain/ReportModels';
import { deleteTemplate } from '../../data/ReportTemplatesRepository';

interface Props {
  templates: ReportTemplate[];
  loading: boolean;
  onEdit: (template: ReportTemplate) => void;
  onRefresh: () => void;
}

const TemplateList: React.FC<Props> = ({ templates, loading, onEdit, onRefresh }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteTarget, setDeleteTarget] = useState<ReportTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTemplate(deleteTarget.id);
      enqueueSnackbar(t('reports.templates.deleteSuccess'), { variant: 'success' });
      onRefresh();
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t('reports.templates.deleteError'),
        { variant: 'error' },
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (templates.length === 0) {
    return (
      <Box py={6} textAlign="center">
        <Typography color="text.secondary">{t('reports.templates.empty')}</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>{t('reports.templates.colName')}</strong></TableCell>
              <TableCell><strong>{t('reports.templates.colDescription')}</strong></TableCell>
              <TableCell><strong>{t('reports.templates.colType')}</strong></TableCell>
              <TableCell><strong>{t('reports.templates.colCreatedBy')}</strong></TableCell>
              <TableCell align="right"><strong>{t('reports.templates.colActions')}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((tpl) => (
              <TableRow
                key={tpl.id}
                hover
                onClick={() => onEdit(tpl)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{tpl.name}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 240 }}>
                    {tpl.description ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={tpl.report_type === 'orders'
                      ? t('reports.config.typeOrders')
                      : t('reports.config.typeOperators')}
                    size="small"
                    color={tpl.report_type === 'orders' ? 'primary' : 'secondary'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {tpl.created_by ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={t('reports.templates.editTooltip')}>
                    <IconButton size="small" onClick={() => onEdit(tpl)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('reports.templates.deleteTooltip')}>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(tpl); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{t('reports.templates.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('reports.templates.deleteConfirmText', { name: deleteTarget?.name ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t('reports.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} /> : <DeleteIcon />}
          >
            {t('reports.templates.deleteConfirmBtn')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TemplateList;
