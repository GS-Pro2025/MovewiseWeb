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

/** Convert YYYY-MM-DD → DD/MM/YYYY. Passes through any other string. */
function formatDate(v: unknown): string {
  const s = String(v ?? '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
}

/** Top-level scalar columns derived from config (excluding nested arrays) */
function getPreviewColumns(config: ReportConfig): string[] {
  if (config.report_type === 'orders') {
    return config.order_fields ?? [];
  }
  return config.operator_fields ?? [];
}

/**
 * Build a display record for one super-order group, mapping consolidated
 * totals and aggregated nested data into the shape expected by the table.
 */
function buildGroupDisplayRecord(group: Record<string, unknown>): Record<string, unknown> {
  const consolidated = (group['consolidated'] ?? {}) as Record<string, unknown>;
  const orders = Array.isArray(group['orders'])
    ? (group['orders'] as Record<string, unknown>[])
    : [];

  const allAssigns = orders.flatMap((o) =>
    Array.isArray(o['assigns']) ? (o['assigns'] as Record<string, unknown>[]) : [],
  );
  const allFuel = orders.flatMap((o) =>
    Array.isArray(o['cost_fuel']) ? (o['cost_fuel'] as Record<string, unknown>[]) : [],
  );
  const allTools = orders.flatMap((o) =>
    Array.isArray(o['tools']) ? (o['tools'] as Record<string, unknown>[]) : [],
  );

  const uniqueOps = new Set(
    allAssigns.map((a) => a['operator_code'] || a['operator_name']).filter(Boolean),
  );
  const opCount = uniqueOps.size || allAssigns.length;

  const toolStr = allTools
    .map((t) => {
      const qty = Number(t['quantity'] ?? 1);
      return qty > 1 ? `${t['tool_name']} x${qty}` : String(t['tool_name'] ?? '');
    })
    .filter(Boolean)
    .join(', ');

  const jobs = [
    ...new Set(orders.map((o) => o['job']).filter((v) => v != null && v !== '')),
  ];

  return {
    // Identifiers
    key_ref: group['key_ref'],
    key: consolidated['order_count'] ?? orders.length,
    // Consolidated numeric totals
    income: consolidated['total_income'],
    expense: consolidated['total_expense'],
    weight: consolidated['total_weight'],
    distance: consolidated['total_distance'],
    // Date range (DD/MM/YYYY, with -> separator for multi-day)
    date:
      consolidated['date_first'] === consolidated['date_last']
        ? formatDate(consolidated['date_first'])
        : `${formatDate(consolidated['date_first'])} -> ${formatDate(consolidated['date_last'])}`,
    // Aggregated scalar fields
    status: [...new Set(orders.map((o) => o['status']).filter(Boolean))].join(', '),
    payStatus: orders.find((o) => o['payStatus'] != null)?.['payStatus'] ?? null,
    state_usa: orders.map((o) => o['state_usa']).find((v) => v != null) ?? null,
    address: orders.map((o) => o['address']).find((v) => v != null) ?? null,
    // Nested — kept as arrays so nestedCount() still works
    assigns: allAssigns,
    cost_fuel: allFuel,
    tools: allTools,
    // Person from first order that has person data
    person: orders.map((o) => o['person']).find((p) => p != null) ?? null,
    // Job names concatenated
    job: jobs.join(', '),
    // Pre-computed summary strings for display
    _assigns_display: opCount === 0 ? null : `${opCount} operator${opCount !== 1 ? 's' : ''}`,
    _tools_display: toolStr || null,
  };
}

/**
 * For orders the API returns GROUPS (by key_ref). Build one display record per
 * group using consolidated totals. For operators the items are already flat.
 */
function getPreviewRecords(result: ReportResult): Record<string, unknown>[] {
  if (result.report_type === 'orders') {
    return result.data.map(buildGroupDisplayRecord);
  }
  return result.data;
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
  const previewRecords = getPreviewRecords(result);

  // Determine which nested arrays are included (for summary columns)
  const nestedSummaryKeys: { key: string; label: string }[] = [];
  if (config.report_type === 'orders') {
    // assigns, tools and fuel cost are shown in their own PDF/Excel sections, not in the main table
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
          {result.report_type === 'orders' ? (
            <>
              <Chip
                label={`${result.total_groups ?? result.data.length} ${t('reports.results.groups', 'groups')}`}
                size="small"
                color="primary"
              />
              <Chip
                label={`${result.total_individual_orders ?? previewRecords.length} ${t('reports.results.records')}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            </>
          ) : (
            <Chip
              label={`${result.total_records ?? result.data.length} ${t('reports.results.records')}`}
              size="small"
              color="primary"
            />
          )}
          {isPreview && (
            <Chip
              label={t('reports.results.previewBadge', { count: previewRecords.length })}
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
              onClick={() => void exportToPDF(result, config, reportName)}
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
            {previewRecords.map((record, idx) => (
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
                  // Operators: show unique count string
                  if (key === 'assigns') {
                    const display = record['_assigns_display'];
                    return (
                      <TableCell key={key}>
                        {display
                          ? <Chip label={String(display)} size="small" variant="outlined" />
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                    );
                  }
                  // Tools: show concatenated names
                  if (key === 'tools') {
                    const display = record['_tools_display'];
                    return (
                      <TableCell key={key} sx={{ maxWidth: 200 }}>
                        {display
                          ? <Typography variant="body2" sx={{ fontSize: '0.75rem', wordBreak: 'break-word' }}>{String(display)}</Typography>
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                    );
                  }
                  // Other nested arrays — show count chip
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
          {t('reports.results.previewNote', {
            shown: previewRecords.length,
            total: result.report_type === 'orders'
              ? result.total_individual_orders
              : result.total_records,
          })}
        </Typography>
      )}
    </Box>
  );
};

export default ReportResults;
