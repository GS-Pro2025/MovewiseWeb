import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ReportConfig, ReportResult } from '../../domain/ReportModels';
import { FIELD_LABELS } from '../../domain/ReportModels';

// ─── Label helpers ─────────────────────────────────────────────────────────────

function label(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatPayStatus(v: unknown): string {
  if (v === 1 || v === '1') return 'Paid';
  if (v === 0 || v === '0') return 'Unpaid';
  return formatValue(v);
}

function formatSalaryType(v: unknown): string {
  if (v === 'day') return 'Per Day';
  if (v === 'hour') return 'Per Hour';
  return formatValue(v);
}

function renderCell(key: string, value: unknown): string {
  if (key === 'payStatus') return formatPayStatus(value);
  if (key === 'salary_type') return formatSalaryType(value);
  return formatValue(value);
}

// ─── Flatten logic ─────────────────────────────────────────────────────────────
//
// For orders: one row per nested array item (assigns, cost_fuel, tools).
// The first nested array found drives row multiplication. For simplicity,
// if multiple nested arrays exist we expand by the longest one.
//
// For operators: one row per assignment.

interface FlatRow {
  [key: string]: string;
}

function buildOrdersColumns(config: ReportConfig): string[] {
  const cols: string[] = [...(config.order_fields ?? [])];
  if (config.include_person) {
    (config.person_fields ?? []).forEach((f) => cols.push(`person.${f}`));
  }
  if (config.include_job) cols.push('job');
  if (config.include_customer_factory) cols.push('customer_factory');
  if (config.include_assigns) {
    (config.assign_fields ?? []).forEach((f) => cols.push(`assign.${f}`));
  }
  if (config.include_costfuel) {
    ['cost_fuel_distributed', 'fuel_qty_distributed', 'distance_distributed', 'date', 'truck_number'].forEach(
      (f) => cols.push(`fuel.${f}`),
    );
  }
  if (config.include_tools) {
    ['tool_name', 'quantity', 'describe'].forEach((f) => cols.push(`tool.${f}`));
  }
  return cols;
}

function buildOperatorsColumns(config: ReportConfig): string[] {
  const cols: string[] = [...(config.operator_fields ?? [])];
  if (config.include_assignments) {
    (config.assignment_fields ?? []).forEach((f) => cols.push(`assignment.${f}`));
  }
  return cols;
}

function columnHeader(col: string): string {
  // strip prefix (person., assign., fuel., tool., assignment.)
  const raw = col.includes('.') ? col.split('.')[1] : col;
  return label(raw);
}

function flattenOrderRecord(record: Record<string, unknown>, cols: string[]): FlatRow[] {
  // Determine the nested arrays present
  const assigns = Array.isArray(record['assigns']) ? (record['assigns'] as Record<string, unknown>[]) : [];
  const costFuels = Array.isArray(record['cost_fuel']) ? (record['cost_fuel'] as Record<string, unknown>[]) : [];
  const tools = Array.isArray(record['tools']) ? (record['tools'] as Record<string, unknown>[]) : [];

  const maxRows = Math.max(1, assigns.length, costFuels.length, tools.length);
  const rows: FlatRow[] = [];

  for (let i = 0; i < maxRows; i++) {
    const row: FlatRow = {};
    for (const col of cols) {
      if (col.startsWith('person.')) {
        const field = col.split('.')[1];
        const person = record['person'] as Record<string, unknown> | undefined;
        row[col] = i === 0 ? renderCell(field, person?.[field]) : '';
      } else if (col.startsWith('assign.')) {
        const field = col.split('.')[1];
        const item = assigns[i];
        row[col] = item ? renderCell(field, item[field]) : '';
      } else if (col.startsWith('fuel.')) {
        const field = col.split('.')[1];
        const item = costFuels[i];
        row[col] = item ? renderCell(field, item[field]) : '';
      } else if (col.startsWith('tool.')) {
        const field = col.split('.')[1];
        const item = tools[i];
        row[col] = item ? renderCell(field, item[field]) : '';
      } else {
        // top-level field — repeat only on first row
        row[col] = i === 0 ? renderCell(col, record[col]) : '';
      }
    }
    rows.push(row);
  }
  return rows;
}

function flattenOperatorRecord(record: Record<string, unknown>, cols: string[]): FlatRow[] {
  const assignments = Array.isArray(record['assignments'])
    ? (record['assignments'] as Record<string, unknown>[])
    : [];

  const maxRows = Math.max(1, assignments.length);
  const rows: FlatRow[] = [];

  for (let i = 0; i < maxRows; i++) {
    const row: FlatRow = {};
    for (const col of cols) {
      if (col.startsWith('assignment.')) {
        const field = col.split('.')[1];
        const item = assignments[i];
        row[col] = item ? renderCell(field, item[field]) : '';
      } else {
        row[col] = i === 0 ? renderCell(col, record[col]) : '';
      }
    }
    rows.push(row);
  }
  return rows;
}

function buildFlatRows(result: ReportResult, config: ReportConfig): { cols: string[]; rows: FlatRow[] } {
  const cols =
    config.report_type === 'orders' ? buildOrdersColumns(config) : buildOperatorsColumns(config);

  const rows = result.data.flatMap((record) =>
    config.report_type === 'orders'
      ? flattenOrderRecord(record, cols)
      : flattenOperatorRecord(record, cols),
  );

  return { cols, rows };
}

// ─── Excel ─────────────────────────────────────────────────────────────────────

export function exportToExcel(result: ReportResult, config: ReportConfig, filename: string): void {
  const { cols, rows } = buildFlatRows(result, config);

  const sheetData = [
    cols.map(columnHeader), // header row
    ...rows.map((row) => cols.map((col) => row[col] ?? '')),
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── CSV ───────────────────────────────────────────────────────────────────────

export function exportToCSV(result: ReportResult, config: ReportConfig, filename: string): void {
  const { cols, rows } = buildFlatRows(result, config);

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const header = cols.map(columnHeader).map(escape).join(',');
  const body = rows
    .map((row) => cols.map((col) => escape(row[col] ?? '')).join(','))
    .join('\n');

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── PDF ───────────────────────────────────────────────────────────────────────

export function exportToPDF(result: ReportResult, config: ReportConfig, filename: string): void {
  const { cols, rows } = buildFlatRows(result, config);

  const isLandscape = cols.length > 7;
  const doc = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header bar ──────────────────────────────────────────────────────────────
  // Brand colour rectangle
  doc.setFillColor(11, 40, 99); // #0B2863
  doc.rect(0, 0, pageW, 20, 'F');

  // Title (white)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const reportTypeLabel =
    result.report_type === 'orders' ? 'Orders Report' : 'Operators Report';
  doc.text(`Movewise  |  ${reportTypeLabel}`, 10, 13);

  // Record count badge (right-aligned)
  const badge = `${result.total_records} records`;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const badgeW = doc.getTextWidth(badge) + 6;
  doc.setFillColor(240, 159, 82); // #F09F52 accent
  doc.roundedRect(pageW - badgeW - 8, 5, badgeW, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(badge, pageW - badgeW - 5, 11.5);

  // ── Subtitle row ────────────────────────────────────────────────────────────
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  // Use plain ASCII only — jsPDF built-in fonts do not support Unicode arrows
  const subtitle = `Date range: ${result.date_range.start}  to  ${result.date_range.end}`;
  doc.text(subtitle, 10, 27);

  autoTable(doc, {
    startY: 31,
    head: [cols.map(columnHeader)],
    body: rows.map((row) => cols.map((col) => row[col] ?? '')),
    styles: {
      fontSize: 7,
      cellPadding: 2,
      // Wrap at word boundaries, never character-by-character
      overflow: 'linebreak',
      // No column can be squeezed below this width (points)
      minCellWidth: 18,
    },
    headStyles: { fillColor: [11, 40, 99], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    // When there are too many columns to fit horizontally,
    // split the table across multiple pages instead of crushing columns
    horizontalPageBreak: true,
    horizontalPageBreakRepeatTableHeadRows: 1,
    // Narrow margins to maximise usable width
    margin: { top: 10, right: 7, bottom: 10, left: 7 },
  });

  doc.save(`${filename}.pdf`);
}
