import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useSnackbar } from 'notistack';
import type { ReportConfig, ReportResult, ReportTemplate } from '../../domain/ReportModels';
import { DEFAULT_ORDER_CONFIG } from '../../domain/ReportModels';
import { generateReport } from '../../data/ReportGenerateRepository';
import ReportConfigBuilder from './ReportConfigBuilder';
import ReportResults from './ReportResults';
import { exportToExcel } from './ExportUtils';

interface Props {
  templates: ReportTemplate[];
}

type Mode = 'template' | 'adhoc';

const PREVIEW_PAGE_SIZE = 50;

const ReportGeneratorTab: React.FC<Props> = ({ templates }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [mode, setMode] = useState<Mode>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [adhocConfig, setAdhocConfig] = useState<ReportConfig>(DEFAULT_ORDER_CONFIG);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [generating, setGenerating] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [activeConfig, setActiveConfig] = useState<ReportConfig | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  const resolvedConfig = (): ReportConfig | null => {
    if (mode === 'template') {
      const tpl = templates.find((t) => t.id === selectedTemplateId);
      return tpl?.config ?? null;
    }
    return adhocConfig;
  };

  const buildRequest = (withPageSize: boolean) => {
    const request: Parameters<typeof generateReport>[0] = {
      start_date: startDate,
      end_date: endDate,
    };
    if (mode === 'template' && selectedTemplateId !== '') {
      request.template_id = selectedTemplateId as number;
    } else {
      request.config = adhocConfig;
    }
    if (withPageSize) {
      request.page_size = PREVIEW_PAGE_SIZE;
    }
    return request;
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      enqueueSnackbar(t('reports.generator.datesRequired'), { variant: 'warning' });
      return;
    }
    if (mode === 'template' && selectedTemplateId === '') {
      enqueueSnackbar(t('reports.generator.templateRequired'), { variant: 'warning' });
      return;
    }

    setGenerating(true);
    setResult(null);
    setActiveConfig(null);

    try {
      const data = await generateReport(buildRequest(true));
      const cfg = resolvedConfig();
      setResult(data);
      setActiveConfig(cfg);
      setIsPreview((data.total_records ?? 0) > PREVIEW_PAGE_SIZE);
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t('reports.generator.generateError'),
        { variant: 'error' },
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const data = await generateReport(buildRequest(false));
      const cfg = resolvedConfig();
      if (!cfg) return;

      const filename = `movewise-report-${startDate}-${endDate}`;
      exportToExcel(data, cfg, filename);
      setResult(data);
      setActiveConfig(cfg);
      setIsPreview(false);
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t('reports.generator.generateError'),
        { variant: 'error' },
      );
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* ── Source ── */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('reports.generator.sourceLabel')}
        </Typography>

        <RadioGroup row value={mode} onChange={(e) => { setMode(e.target.value as Mode); setResult(null); }}>
          <FormControlLabel
            value="template"
            control={<Radio size="small" />}
            label={t('reports.generator.useSavedTemplate')}
          />
          <FormControlLabel
            value="adhoc"
            control={<Radio size="small" />}
            label={t('reports.generator.useAdhoc')}
          />
        </RadioGroup>

        {mode === 'template' && (
          <FormControl size="small" sx={{ mt: 1.5, minWidth: 280 }}>
            <InputLabel>{t('reports.generator.selectTemplate')}</InputLabel>
            <Select
              value={selectedTemplateId}
              label={t('reports.generator.selectTemplate')}
              onChange={(e) => setSelectedTemplateId(e.target.value as number | '')}
            >
              {templates.length === 0 && (
                <MenuItem value="" disabled>
                  {t('reports.generator.noTemplates')}
                </MenuItem>
              )}
              {templates.map((tpl) => (
                <MenuItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {mode === 'adhoc' && (
          <Box mt={2}>
            <ReportConfigBuilder value={adhocConfig} onChange={setAdhocConfig} />
          </Box>
        )}
      </Paper>

      {/* ── Date range ── */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('reports.generator.dateRange')}
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label={t('reports.generator.startDate')}
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <TextField
            label={t('reports.generator.endDate')}
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
        </Box>
      </Paper>

      {/* ── Generate ── */}
      <Box>
        <Button
          variant="contained"
          size="large"
          startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
          onClick={handleGenerate}
          disabled={generating || exportingAll}
        >
          {generating ? t('reports.generator.generating') : t('reports.generator.preview', { count: PREVIEW_PAGE_SIZE })}
        </Button>
        <Typography variant="caption" color="text.secondary" ml={2}>
          {t('reports.generator.previewNote', { count: PREVIEW_PAGE_SIZE })}
        </Typography>
      </Box>

      {/* ── Results ── */}
      {result && activeConfig && (
        <>
          <Divider />
          <ReportResults
            result={result}
            config={activeConfig}
            isPreview={isPreview}
            onExportAll={handleExportAll}
            exportLoading={exportingAll}
          />
        </>
      )}
    </Box>
  );
};

export default ReportGeneratorTab;
