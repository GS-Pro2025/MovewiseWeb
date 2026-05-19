import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';
import type { ReportTemplate } from '../domain/ReportModels';
import { listTemplates } from '../data/ReportTemplatesRepository';
import TemplateList from './components/TemplateList';
import TemplateFormDialog from './components/TemplateFormDialog';
import ReportGeneratorTab from './components/ReportGeneratorTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box pt={3}>{children}</Box>}
  </div>
);

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReportTemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await listTemplates();
      setTemplates(data);
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t('reports.templates.loadError'),
        { variant: 'error' },
      );
    } finally {
      setTemplatesLoading(false);
    }
  }, [enqueueSnackbar, t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tpl: ReportTemplate) => {
    setEditTarget(tpl);
    setDialogOpen(true);
  };

  return (
    <Box p={3}>
      {/* Page header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>
          {t('reports.pageTitle')}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={t('reports.tab.templates')} />
          <Tab label={t('reports.tab.generate')} />
        </Tabs>
      </Box>

      {/* Tab 0 — Template Manager */}
      <TabPanel value={tab} index={0}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            {t('reports.templates.createBtn')}
          </Button>
        </Box>

        <TemplateList
          templates={templates}
          loading={templatesLoading}
          onEdit={handleOpenEdit}
          onRefresh={fetchTemplates}
        />
      </TabPanel>

      {/* Tab 1 — Generate Report */}
      <TabPanel value={tab} index={1}>
        <ReportGeneratorTab templates={templates} />
      </TabPanel>

      {/* Create / Edit dialog */}
      <TemplateFormDialog
        open={dialogOpen}
        template={editTarget}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchTemplates}
      />
    </Box>
  );
};

export default ReportsPage;
