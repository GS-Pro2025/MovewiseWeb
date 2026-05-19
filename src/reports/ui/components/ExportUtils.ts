import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
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

/** Convert YYYY-MM-DD → DD/MM/YYYY. Passes through any other string. */
function formatDate(v: unknown): string {
  const s = String(v ?? '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
}

/** Truncate to max chars for compact display (PDF cells). */
function truncate(s: string, max = 25): string {
  return s.length > max ? `${s.slice(0, max)}...` : s;
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
    // One column per requested person field (data from first order in group)
    (config.person_fields ?? []).forEach((f) => cols.push(`person.${f}`));
  }
  if (config.include_job) cols.push('job');                 // concatenated unique jobs
  if (config.include_customer_factory) cols.push('customer_factory');
  if (config.include_assigns) cols.push('assigns_summary'); // kept for flattenOrderGroup fallback safety
  // assigns, tools and fuel cost have their own dedicated sections — excluded from main table
  return cols.filter((c) => c !== 'assigns_summary');
}

function buildOperatorsColumns(config: ReportConfig): string[] {
  const cols: string[] = [...(config.operator_fields ?? [])];
  if (config.include_assignments) {
    (config.assignment_fields ?? []).forEach((f) => cols.push(`assignment.${f}`));
  }
  return cols;
}

function columnHeader(col: string): string {
  if (col === 'assigns_summary') return 'Operators';
  if (col === 'fuel_summary') return 'Fuel';
  if (col === 'tools_summary') return 'Tools';
  if (col === 'job') return 'Job';
  if (col === 'customer_factory') return 'Factory';
  // strip prefix (person., assignment.)
  const raw = col.includes('.') ? col.split('.')[1] : col;
  return label(raw);
}

/**
 * Flatten one super-order GROUP into a single export row.
 * Uses consolidated totals from the backend; nested arrays become summary strings.
 */
function flattenOrderGroup(group: Record<string, unknown>, cols: string[]): FlatRow {
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

  const row: FlatRow = {};

  for (const col of cols) {
    // ── Consolidated numeric totals (backend already summed) ─────────────
    if (col === 'income')   { row[col] = renderCell('income',   consolidated['total_income']);   continue; }
    if (col === 'expense')  { row[col] = renderCell('expense',  consolidated['total_expense']);  continue; }
    if (col === 'weight')   { row[col] = renderCell('weight',   consolidated['total_weight']);   continue; }
    if (col === 'distance') { row[col] = renderCell('distance', consolidated['total_distance']); continue; }

    // ── Date: range if multi-day (DD/MM/YYYY -> DD/MM/YYYY) ──────────────
    if (col === 'date') {
      const d1 = consolidated['date_first'];
      const d2 = consolidated['date_last'];
      row[col] = d1 === d2 ? formatDate(d1) : `${formatDate(d1)} -> ${formatDate(d2)}`;
      continue;
    }

    // ── key_ref from group root ──────────────────────────────────────────
    if (col === 'key_ref') { row[col] = renderCell('key_ref', group['key_ref']); continue; }

    // ── key: show order count in group ───────────────────────────────────
    if (col === 'key') { row[col] = String(consolidated['order_count'] ?? orders.length); continue; }

    // ── status / payStatus: unique values across all orders ──────────────
    if (col === 'status') {
      const vals = [...new Set(orders.map((o) => o['status']).filter(Boolean))];
      row[col] = vals.join(', ');
      continue;
    }
    if (col === 'payStatus') {
      const vals = [...new Set(orders.map((o) => o['payStatus']))].map(formatPayStatus);
      row[col] = vals.join(', ');
      continue;
    }

    // ── state_usa / address: unique values concatenated ──────────────────
    if (col === 'state_usa' || col === 'address') {
      const vals = [...new Set(orders.map((o) => o[col]).filter((v) => v != null && v !== ''))];
      row[col] = vals.join(', ');
      continue;
    }

    // ── Person fields (first order that has person data) ─────────────────
    if (col.startsWith('person.')) {
      const field = col.split('.')[1];
      const person = orders.map((o) => o['person']).find((p) => p != null) as
        | Record<string, unknown>
        | undefined;
      row[col] = renderCell(field, person?.[field]);
      continue;
    }

    // ── Job: unique names concatenated ───────────────────────────────────
    if (col === 'job') {
      const jobs = [...new Set(orders.map((o) => o['job']).filter((v) => v != null && v !== ''))];
      row[col] = jobs.join(', ');
      continue;
    }

    // ── Customer factory: first non-null ─────────────────────────────────
    if (col === 'customer_factory') {
      row[col] = formatValue(orders.map((o) => o['customer_factory']).find((v) => v != null));
      continue;
    }

    // ── Operators: unique count ──────────────────────────────────────────
    if (col === 'assigns_summary') {
      if (allAssigns.length === 0) { row[col] = ''; continue; }
      const uniqueOps = new Set(
        allAssigns.map((a) => a['operator_code'] || a['operator_name']).filter(Boolean),
      );
      const n = uniqueOps.size || allAssigns.length;
      row[col] = `${n} operator${n !== 1 ? 's' : ''}`;
      continue;
    }

    // ── Fuel: entry count ────────────────────────────────────────────────
    if (col === 'fuel_summary') {
      const n = allFuel.length;
      row[col] = n === 0 ? '' : `${n} entr${n !== 1 ? 'ies' : 'y'}`;
      continue;
    }

    // ── Tools: names concatenated (with qty) ─────────────────────────────
    if (col === 'tools_summary') {
      if (allTools.length === 0) { row[col] = ''; continue; }
      const parts = allTools
        .map((t) => {
          const qty = Number(t['quantity'] ?? 1);
          return qty > 1 ? `${t['tool_name']} x${qty}` : String(t['tool_name'] ?? '');
        })
        .filter(Boolean);
      row[col] = parts.join(', ');
      continue;
    }

    // ── Fallback: first order's raw value ────────────────────────────────
    row[col] = orders.length > 0 ? renderCell(col, orders[0][col]) : '';
  }

  return row;
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

  // Orders: 1 row per super-order GROUP using consolidated totals + summary strings.
  // Operators: 1 row per operator (multiplied by assignments if included).
  const rows =
    config.report_type === 'orders'
      ? result.data.map((group) => flattenOrderGroup(group, cols))
      : result.data.flatMap((record) => flattenOperatorRecord(record, cols));

  return { cols, rows };
}

// ─── Shared detail-section builders (used by both Excel and PDF) ────────────────────────────

function collectToolRows(result: ReportResult): string[][] {
  const rows: string[][] = [];
  for (const group of result.data) {
    const keyRef = String(group['key_ref'] ?? '');
    const orders = Array.isArray(group['orders'])
      ? (group['orders'] as Record<string, unknown>[])
      : [];
    const person = orders.map((o) => o['person']).find((p) => p != null) as
      | Record<string, unknown>
      | undefined;
    const clientName = person
      ? `${person['first_name'] ?? ''} ${person['last_name'] ?? ''}`.trim()
      : '';
    for (const order of orders) {
      const day = formatDate(order['date']);
      const tools = Array.isArray(order['tools'])
        ? (order['tools'] as Record<string, unknown>[])
        : [];
      for (const tool of tools) {
        rows.push([keyRef, clientName, day, String(tool['tool_name'] ?? ''), String(tool['quantity'] ?? 1)]);
      }
    }
  }
  return rows;
}

function collectFuelRows(result: ReportResult): string[][] {
  const rows: string[][] = [];
  for (const group of result.data) {
    const keyRef = String(group['key_ref'] ?? '');
    const orders = Array.isArray(group['orders'])
      ? (group['orders'] as Record<string, unknown>[])
      : [];
    const person = orders.map((o) => o['person']).find((p) => p != null) as
      | Record<string, unknown>
      | undefined;
    const clientName = person
      ? `${person['first_name'] ?? ''} ${person['last_name'] ?? ''}`.trim()
      : '';
    for (const order of orders) {
      const day = formatDate(order['date']);
      const fuels = Array.isArray(order['cost_fuel'])
        ? (order['cost_fuel'] as Record<string, unknown>[])
        : [];
      for (const fuel of fuels) {
        rows.push([
          keyRef,
          clientName,
          day,
          formatValue(fuel['cost_fuel_distributed']),
          formatValue(fuel['fuel_qty_distributed']),
          formatValue(fuel['distance_distributed']),
          String(fuel['truck_number'] ?? ''),
        ]);
      }
    }
  }
  return rows;
}

function collectAssignRows(
  result: ReportResult,
  config: ReportConfig,
): { head: string[]; rows: string[][] } {
  const fields = (config.assign_fields?.length ? config.assign_fields : [
    'operator_name', 'operator_code', 'rol', 'salary', 'truck_number', 'assigned_at',
  ]);
  const ASSIGN_LABELS: Record<string, string> = {
    operator_name: 'Operator', operator_code: 'Code', rol: 'Role',
    salary: 'Salary', salary_type: 'Salary Type', hourly_salary: 'Hr Salary',
    truck_number: 'Truck', assigned_at: 'Assigned', start_time: 'Start',
    end_time: 'End', additional_costs: 'Extra Costs',
  };
  const head = ['Order #', 'Client', 'Day', ...fields.map((f) => ASSIGN_LABELS[f] ?? f)];
  const rows: string[][] = [];
  for (const group of result.data) {
    const keyRef = String(group['key_ref'] ?? '');
    const orders = Array.isArray(group['orders'])
      ? (group['orders'] as Record<string, unknown>[])
      : [];
    const person = orders.map((o) => o['person']).find((p) => p != null) as
      | Record<string, unknown>
      | undefined;
    const clientName = person
      ? `${person['first_name'] ?? ''} ${person['last_name'] ?? ''}`.trim()
      : '';
    for (const order of orders) {
      const day = formatDate(order['date']);
      const assigns = Array.isArray(order['assigns'])
        ? (order['assigns'] as Record<string, unknown>[])
        : [];
      for (const assign of assigns) {
        rows.push([
          keyRef, clientName, day,
          ...fields.map((f) => {
            if (f === 'salary_type') return formatSalaryType(assign[f]);
            if (f === 'assigned_at') return formatDate(assign[f]);
            return formatValue(assign[f]);
          }),
        ]);
      }
    }
  }
  return { head, rows };
}

// ─── Section-title SVG icons (inlined from /public) ─────────────────────────
// These are stroke-only Lucide icons; stroke="currentColor" is replaced with white at render time.

const SVG_WRENCH = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/></svg>`;

const SVG_FUEL = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5"/><path d="M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16"/><path d="M2 21h13"/><path d="M3 9h11"/></svg>`;

const SVG_SQUARE_USER_ROUND = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21a6 6 0 0 0-12 0"/><circle cx="12" cy="11" r="4"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`;

/**
 * Render a stroke-only SVG as an orange circle + white icon PNG (base64).
 * Async because Image loading is async even for data URLs on some browsers.
 */
function createIconPng(svgRaw: string): Promise<string> {
  const size = 60;
  const svgWhite = svgRaw.replace(/stroke="currentColor"/g, 'stroke="#FFFFFF"');
  const blob = new Blob([svgWhite], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const fallback = () => {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const cx = c.getContext('2d')!;
    cx.fillStyle = '#F09F52';
    cx.beginPath();
    cx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    cx.fill();
    return c.toDataURL('image/png');
  };

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      // Orange circle background
      ctx.fillStyle = '#F09F52';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      // White icon with padding
      const pad = Math.round(size * 0.14);
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(fallback()); };
    img.src = url;
  });
}

/**
 * Render a styled section-title bar in the PDF.
 * Dark-blue rounded background + per-section icon as embedded PNG.
 */
function drawSectionTitle(
  doc: jsPDF,
  pageW: number,
  y: number,
  title: string,
  iconPng: string,
): void {
  doc.setFillColor(11, 40, 99);
  doc.roundedRect(7, y - 8, pageW - 14, 12, 3, 3, 'F');
  // Icon: 8×8 mm, vertically centred in the 12 mm bar
  doc.addImage(iconPng, 'PNG', 10, y - 6, 8, 8);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 21, y + 1);
}

// ─── Excel style helpers ─────────────────────────────────────────────────────

const XLS_THIN_BORDER = {
  top:    { style: 'thin' as const, color: { rgb: 'FFD0D0D0' } },
  bottom: { style: 'thin' as const, color: { rgb: 'FFD0D0D0' } },
  left:   { style: 'thin' as const, color: { rgb: 'FFD0D0D0' } },
  right:  { style: 'thin' as const, color: { rgb: 'FFD0D0D0' } },
};

function xlsStyle(
  fillRgb: string,
  fontRgb = 'FFFFFFFF',
  bold = false,
  sz = 9,
  hAlign: 'left' | 'center' | 'right' = 'left',
  withBorder = false,
) {
  return {
    fill:      { patternType: 'solid' as const, fgColor: { rgb: fillRgb } },
    font:      { color: { rgb: fontRgb }, bold, sz },
    alignment: { horizontal: hAlign, vertical: 'center' as const, wrapText: false },
    ...(withBorder ? { border: XLS_THIN_BORDER } : {}),
  };
}

const XLS_TITLE    = xlsStyle('FF0B2863', 'FFFFFFFF', true,  14);
const XLS_SUBTITLE = xlsStyle('FFF09F52', 'FFFFFFFF', false,  9);
const XLS_SEC_HDR  = xlsStyle('FF0B2863', 'FFFFFFFF', true,  10);
const XLS_COL_HDR  = xlsStyle('FF1E4080', 'FFFFFFFF', true,   8, 'center', true);
const XLS_ROW_ODD  = xlsStyle('FFFFFFFF', 'FF333333', false,  8, 'left',   true);
const XLS_ROW_EVEN = xlsStyle('FFF5F7FA', 'FF333333', false,  8, 'left',   true);

interface XlsSection {
  title: string;
  head:  string[];
  rows:  string[][];
}

/**
 * Build a single styled worksheet with stacked sections separated by blank rows.
 * Mirrors the PDF section layout: title bar → subtitle → section header → col headers → data.
 */
function buildXlsSheet(
  sections: XlsSection[],
  numCols: number,
  titleText: string,
  subtitleText: string,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws: Record<string, any> = {};
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  const rowHeights: { hpt: number }[] = [];
  let R = 0;

  const enc = (r: number, c: number) => XLSX.utils.encode_cell({ r, c });

  /** Write `style` across the full row width, then overwrite col 0 with `value`. */
  const writeHeaderRow = (style: object, value: string, height: number) => {
    for (let c = 0; c < numCols; c++) {
      ws[enc(R, c)] = { v: '', t: 's', s: style };
    }
    ws[enc(R, 0)] = { v: value, t: 's', s: style };
    merges.push({ s: { r: R, c: 0 }, e: { r: R, c: numCols - 1 } });
    rowHeights[R] = { hpt: height };
    R++;
  };

  // ── Title row ────────────────────────────────────────────────────────────────
  writeHeaderRow(XLS_TITLE, titleText, 30);

  // ── Subtitle row (date range, orange) ────────────────────────────────────────
  writeHeaderRow(XLS_SUBTITLE, subtitleText, 18);

  // ── Blank gap ────────────────────────────────────────────────────────────────
  R++;

  // ── Sections ─────────────────────────────────────────────────────────────────
  for (const section of sections) {
    // Section header
    writeHeaderRow(XLS_SEC_HDR, `  ${section.title}`, 22);

    // Column headers
    for (let c = 0; c < numCols; c++) {
      ws[enc(R, c)] = { v: section.head[c] ?? '', t: 's', s: XLS_COL_HDR };
    }
    rowHeights[R] = { hpt: 18 };
    R++;

    // Data rows (alternating)
    for (let i = 0; i < section.rows.length; i++) {
      const dataRow = section.rows[i];
      const style   = i % 2 === 0 ? XLS_ROW_ODD : XLS_ROW_EVEN;
      for (let c = 0; c < numCols; c++) {
        ws[enc(R, c)] = { v: dataRow[c] ?? '', t: 's', s: style };
      }
      R++;
    }

    // 2 blank separator rows
    R += 2;
  }

  ws['!ref']    = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R - 1, c: numCols - 1 } });
  ws['!merges'] = merges;
  ws['!rows']   = rowHeights;
  // Col widths: order# narrow, client/name wider, rest default
  ws['!cols']   = Array.from({ length: numCols }, (_, i) => ({
    wch: i === 0 ? 14 : i === 1 ? 22 : i === 2 ? 12 : 16,
  }));

  return ws;
}

// ─── Excel ────────────────────────────────────────────────────────────────────

export function exportToExcel(result: ReportResult, config: ReportConfig, filename: string): void {
  const { cols, rows } = buildFlatRows(result, config);

  const reportTypeLabel = result.report_type === 'orders' ? 'Orders Report' : 'Operators Report';
  const titleText    = `Movewise  |  ${reportTypeLabel}`;
  const subtitleText = `Date range: ${formatDate(result.date_range.start)}  ->  ${formatDate(result.date_range.end)}`;

  const sections: XlsSection[] = [];

  // Main section
  sections.push({
    title: result.report_type === 'orders' ? 'Orders' : 'Operators',
    head:  cols.map(columnHeader),
    rows:  rows.map((row) => cols.map((col) => row[col] ?? '')),
  });

  if (config.report_type === 'orders') {
    if (config.include_tools) {
      const toolRows = collectToolRows(result);
      if (toolRows.length > 0) {
        sections.push({
          title: 'Tools Detail',
          head:  ['Order #', 'Client', 'Day', 'Tool', 'Qty'],
          rows:  toolRows,
        });
      }
    }

    if (config.include_costfuel) {
      const fuelRows = collectFuelRows(result);
      if (fuelRows.length > 0) {
        sections.push({
          title: 'Fuel Cost Detail',
          head:  ['Order #', 'Client', 'Day', 'Fuel Cost', 'Fuel (gal)', 'Distance', 'Truck'],
          rows:  fuelRows,
        });
      }
    }

    if (config.include_assigns) {
      const { head: aHead, rows: aRows } = collectAssignRows(result, config);
      if (aRows.length > 0) {
        sections.push({
          title: 'Operator Assignments',
          head:  aHead,
          rows:  aRows,
        });
      }
    }
  }

  const numCols = Math.max(
    ...sections.map((s) => Math.max(s.head.length, ...s.rows.map((r) => r.length))),
  );

  const wb = XLSX.utils.book_new();
  const ws = buildXlsSheet(sections, numCols, titleText, subtitleText);
  XLSX.utils.book_append_sheet(wb, ws, result.report_type === 'orders' ? 'Report' : 'Operators');
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

export async function exportToPDF(result: ReportResult, config: ReportConfig, filename: string): Promise<void> {
  // Pre-render section icons (async: SVG → canvas → PNG base64)
  const [iconTools, iconFuel, iconAssigns] = await Promise.all([
    createIconPng(SVG_WRENCH),
    createIconPng(SVG_FUEL),
    createIconPng(SVG_SQUARE_USER_ROUND),
  ]);

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
  const badge =
    result.report_type === 'orders'
      ? `${result.total_groups ?? result.data.length} groups  |  ${result.total_individual_orders ?? '?'} orders`
      : `${result.total_records ?? result.data.length} records`;
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
  const subtitle = `Date range: ${formatDate(result.date_range.start)}  ->  ${formatDate(result.date_range.end)}`;
  doc.text(subtitle, 10, 27);

  // PDF body: truncate every cell to 25 chars to keep columns compact
  const pdfBody = rows.map((row) => cols.map((col) => truncate(row[col] ?? '')));

  autoTable(doc, {
    startY: 31,
    head: [cols.map(columnHeader)],
    body: pdfBody,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      minCellWidth: 18,
    },
    headStyles: { fillColor: [11, 40, 99], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    horizontalPageBreak: true,
    margin: { top: 10, right: 7, bottom: 10, left: 7 },
  });

  // ── Tools Detail section (PDF only) ─────────────────────────────────────────
  if (config.report_type === 'orders' && config.include_tools) {
    const toolRows: string[][] = [];

    for (const group of result.data) {
      const keyRef = truncate(String(group['key_ref'] ?? ''));
      const orders = Array.isArray(group['orders'])
        ? (group['orders'] as Record<string, unknown>[])
        : [];
      const person = orders.map((o) => o['person']).find((p) => p != null) as
        | Record<string, unknown>
        | undefined;
      const clientName = person
        ? truncate(`${person['first_name'] ?? ''} ${person['last_name'] ?? ''}`.trim())
        : '';

      for (const order of orders) {
        const day = formatDate(order['date']);
        const tools = Array.isArray(order['tools'])
          ? (order['tools'] as Record<string, unknown>[])
          : [];
        for (const tool of tools) {
          toolRows.push([
            keyRef,
            clientName,
            day,
            truncate(String(tool['tool_name'] ?? '')),
            String(tool['quantity'] ?? 1),
          ]);
        }
      }
    }

    if (toolRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastY: number = (doc as any).lastAutoTable?.finalY ?? 31;
      const pageH = doc.internal.pageSize.getHeight();
      let sectionY = lastY + 14;

      if (pageH - lastY < 45) {
        doc.addPage();
        sectionY = 20;
      }

      drawSectionTitle(doc, pageW, sectionY, 'Tools Detail', iconTools);

      autoTable(doc, {
        startY: sectionY + 6,
        head: [['Order #', 'Client', 'Day', 'Tool', 'Qty']],
        body: toolRows,
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [11, 40, 99], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: { 4: { halign: 'center', minCellWidth: 10 } },
        margin: { top: 10, right: 7, bottom: 10, left: 7 },
      });
    }
  }

  // ── Fuel Cost Detail section (PDF only) ────────────────────────────────────────
  if (config.report_type === 'orders' && config.include_costfuel) {
    const fuelRows = collectFuelRows(result).map((r) => r.map((v) => truncate(v)));
    if (fuelRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastY2: number = (doc as any).lastAutoTable?.finalY ?? 31;
      const pageH2 = doc.internal.pageSize.getHeight();
      let fuelSectionY = lastY2 + 14;

      if (pageH2 - lastY2 < 45) {
        doc.addPage();
        fuelSectionY = 20;
      }

      drawSectionTitle(doc, pageW, fuelSectionY, 'Fuel Cost Detail', iconFuel);

      autoTable(doc, {
        startY: fuelSectionY + 6,
        head: [['Order #', 'Client', 'Day', 'Fuel Cost', 'Fuel (gal)', 'Distance', 'Truck']],
        body: fuelRows,
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [11, 40, 99], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 10, right: 7, bottom: 10, left: 7 },
      });
    }
  }

  // ── Operator Assignments Detail section (PDF only) ────────────────────────────────
  if (config.report_type === 'orders' && config.include_assigns) {
    const { head: assignHead, rows: assignRows } = collectAssignRows(result, config);
    const pdfAssignRows = assignRows.map((r) => r.map((v) => truncate(v)));
    if (pdfAssignRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastY3: number = (doc as any).lastAutoTable?.finalY ?? 31;
      const pageH3 = doc.internal.pageSize.getHeight();
      let assignSectionY = lastY3 + 14;

      if (pageH3 - lastY3 < 45) {
        doc.addPage();
        assignSectionY = 20;
      }

      drawSectionTitle(doc, pageW, assignSectionY, 'Operator Assignments', iconAssigns);

      autoTable(doc, {
        startY: assignSectionY + 6,
        head: [assignHead],
        body: pdfAssignRows,
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [11, 40, 99], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        horizontalPageBreak: true,
        margin: { top: 10, right: 7, bottom: 10, left: 7 },
      });
    }
  }

  doc.save(`${filename}.pdf`);
}
