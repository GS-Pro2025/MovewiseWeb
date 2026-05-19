import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import TableViewIcon from '@mui/icons-material/TableView';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import { FIELD_LABELS, type ReportConfig, type ReportResult } from '../../domain/ReportModels';
import { exportToCSV, exportToExcel, exportToPDF } from './ExportUtils';

interface Props {
  result: ReportResult;
  config: ReportConfig;
  isPreview?: boolean; // true = subset, full export available
  onExportAll?: () => void; // triggers re-generate without page_size
  exportLoading?: boolean;
}

/** Returns a human-readable label for a field, stripping internal prefixes. */
function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

/** Top-level scalar columns derived from config (excluding nested arrays) */
function getPreviewColumns(config: ReportConfig): string[] {
  if (config.report_type === 'orders') {
    return config.order_fields ?? [];
  }
  return config.operator_fields ?? [];
}

/** Format a cell value for display */
function displayValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (key === 'payStatus') return value === 1 || value === '1' ? 'Paid' : 'Unpaid';
  if (key === 'salary_type') return value === 'day' ? 'Per Day' : value === 'hour' ? 'Per Hour' : String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Count items in a nested array key */
function nestedCount(record: Record<string, unknown>, key: string): number {
  const val = record[key];
  return Array.isArray(val) ? val.length : 0;
}

const ReportResults: React.FC<Props> = ({
  result,
  config,
  isPreview = false,
  onExportAll,
  exportLoading = false,
}) => {
  const { t } = useTranslation();

  const previewCols = getPreviewColumns(config);

  // Determine which nested arrays are included (for summary columns)
  const nestedSummaryKeys: { key: string; label: string }[] = [];
  if (config.report_type === 'orders') {
    if (config.include_assigns) nestedSummaryKeys.push({ key: 'assigns', label: t('reports.results.assigns') });
    if (config.include_costfuel) nestedSummaryKeys.push({ key: 'cost_fuel', label: t('reports.results.costFuel') });
    if (config.include_tools) nestedSummaryKeys.push({ key: 'tools', label: t('reports.results.tools') });
    if (config.include_person) nestedSummaryKeys.push({ key: 'person', label: t('reports.results.client') });
    if (config.include_job) nestedSummaryKeys.push({ key: 'job', label: t('reports.results.job') });
  }
  if (config.report_type === 'operators') {
    if (config.include_assignments) nestedSummaryKeys.push({ key: 'assignments', label: t('reports.results.assignments') });
  }

  const reportName = `movewise-report-${result.date_range.start}-${result.date_range.end}`;

  return (
    <Box>
      {/* ── Header bar ── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            {t('reports.results.title')}
          </Typography>
          <Chip
            label={`${result.total_records} ${t('reports.results.records')}`}
            size="small"
            color="primary"
          />
          {isPreview && (
            <Chip
              label={t('reports.results.previewBadge', { count: result.data.length })}
              size="small"
              variant="outlined"
              color="warning"
            />
          )}
        </Box>

        {/* Export buttons */}
        <Box display="flex" gap={1} flexWrap="wrap">
          <Tooltip title={t('reports.results.exportExcelTooltip')}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<GridOnIcon />}
              onClick={() => exportToExcel(result, config, reportName)}
            >
              Excel
            </Button>
          </Tooltip>
          <Tooltip title={t('reports.results.exportCsvTooltip')}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<TableViewIcon />}
              onClick={() => exportToCSV(result, config, reportName)}
            >
              CSV
            </Button>
          </Tooltip>
          <Tooltip title={t('reports.results.exportPdfTooltip')}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => exportToPDF(result, config, reportName)}
            >
              PDF
            </Button>
          </Tooltip>
          {isPreview && onExportAll && (
            <Button
              size="small"
              variant="contained"
              onClick={onExportAll}
              disabled={exportLoading}
            >
              {exportLoading ? t('reports.results.exporting') : t('reports.results.exportAll')}
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Preview table ── */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              {previewCols.map((col) => (
                <TableCell key={col}>
                  <strong>{fieldLabel(col)}</strong>
                </TableCell>
              ))}
              {nestedSummaryKeys.map(({ key, label }) => (
                <TableCell key={key}>
                  <strong>{label}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {result.data.map((record, idx) => (
              <TableRow key={idx} hover>
                {previewCols.map((col) => (
                  <TableCell key={col}>
                    {displayValue(col, record[col])}
                  </TableCell>
                ))}
                {nestedSummaryKeys.map(({ key }) => {
                  if (key === 'person') {
                    const person = record['person'] as Record<string, unknown> | null | undefined;
                    return (
                      <TableCell key={key}>
                        {person
                          ? `${person['first_name'] ?? ''} ${person['last_name'] ?? ''}`.trim() || '—'
                          : '—'}
                      </TableCell>
                    );
                  }
                  if (key === 'job') {
                    return <TableCell key={key}>{String(record['job'] ?? '—')}</TableCell>;
                  }
                  // nested arrays — show count
                  const count = nestedCount(record, key);
                  return (
                    <TableCell key={key}>
                      {count > 0 ? (
                        <Chip label={count} size="small" variant="outlined" />
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          0
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {isPreview && (
        <Typography variant="caption" color="text.secondary" mt={1} display="block">
          {t('reports.results.previewNote', { shown: result.data.length, total: result.total_records })}
        </Typography>
      )}
    </Box>
  );
};

export default ReportResults;
