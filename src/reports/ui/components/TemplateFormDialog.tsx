import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Divider,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import EditIcon from '@mui/icons-material/Edit';
import { useSnackbar } from 'notistack';
import type { ReportTemplate } from '../../domain/ReportModels';
import { DEFAULT_ORDER_CONFIG, type ReportConfig } from '../../domain/ReportModels';
import { createTemplate, updateTemplate } from '../../data/ReportTemplatesRepository';
import ReportConfigBuilder from './ReportConfigBuilder';

interface Props {
  open: boolean;
  template: ReportTemplate | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const TemplateFormDialog: React.FC<Props> = ({ open, template, onClose, onSaved }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_ORDER_CONFIG);
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? '');
      setConfig(template.config);
    } else {
      setName('');
      setDescription('');
      setConfig(DEFAULT_ORDER_CONFIG);
    }
  }, [template, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      enqueueSnackbar(t('reports.templates.nameRequired'), { variant: 'warning' });
      return;
    }

    // Validate at least one base field selected
    const hasFields =
      config.report_type === 'orders'
        ? (config.order_fields?.length ?? 0) > 0
        : (config.operator_fields?.length ?? 0) > 0;

    if (!hasFields) {
      enqueueSnackbar(t('reports.templates.fieldsRequired'), { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        report_type: config.report_type,
        config,
      };

      if (template) {
        await updateTemplate(template.id, payload);
        enqueueSnackbar(t('reports.templates.updateSuccess'), { variant: 'success' });
      } else {
        await createTemplate(payload);
        enqueueSnackbar(t('reports.templates.createSuccess'), { variant: 'success' });
      }
      onSaved();
      onClose();
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t('reports.templates.saveError'),
        { variant: 'error' },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Gradient header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0B2863 0%, #1a4a9c 100%)',
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'rgba(255,255,255,0.15)',
            width: 44,
            height: 44,
            color: 'white',
          }}
        >
          {template ? <EditIcon /> : <BookmarkAddIcon />}
        </Avatar>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={700} color="white" lineHeight={1.2}>
            {template ? t('reports.templates.editTitle') : t('reports.templates.createTitle')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {template
              ? t('reports.templates.editSubtitle', 'Modify the template configuration')
              : t('reports.templates.createSubtitle', 'Configure fields, filters and data to include')}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Name & description */}
          <TextField
            label={t('reports.templates.nameLabel')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            size="small"
            inputProps={{ maxLength: 120 }}
            helperText={
              <Typography variant="caption" color={name.length > 100 ? 'warning.main' : 'text.secondary'} component="span">
                {name.length}/120
              </Typography>
            }
          />
          <TextField
            label={t('reports.templates.descriptionLabel')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            inputProps={{ maxLength: 500 }}
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            {t('reports.templates.configSection')}
          </Typography>

          <ReportConfigBuilder value={config} onChange={setConfig} />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('reports.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
        >
          {t('reports.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateFormDialog;
