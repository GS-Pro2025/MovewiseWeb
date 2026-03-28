/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { StatementRecord } from '../domain/StatementModels';
import { updateStatement } from '../data/StatementRepository';

interface EditStatementDialogProps {
  record: StatementRecord | null;
  onClose: () => void;
  onSaved: (updated: StatementRecord) => void;
}

interface FormState {
  keyref: string;
  date: string;
  week: string;
  shipper_name: string;
  income: string;
  expense: string;
}

const inputClass =
  'w-full px-3 py-2 border-2 rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-300';

// ── Standalone Field — defined OUTSIDE parent to prevent remount on each render ──
interface FieldProps {
  label: string;
  field: keyof FormState;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}

const Field: React.FC<FieldProps> = ({ label, field, value, error, disabled, onChange, type = 'text', min, max, step }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0B2863' }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`${inputClass} ${error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:border-blue-400'}`}
      style={{ borderColor: error ? undefined : '#cbd5e1' }}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// ── Week range helper ──
function getWeekDateRange(week: number, year: number): { start: string; end: string } | null {
  if (!week || week < 1 || week > 53 || !year) return null;
  // ISO week: week 1 is the week containing the first Thursday of the year
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Mon=1 … Sun=7
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

const EditStatementDialog: React.FC<EditStatementDialogProps> = ({ record, onClose, onSaved }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const [form, setForm] = useState<FormState>({
    keyref: '',
    date: '',
    week: '',
    shipper_name: '',
    income: '',
    expense: '',
  });

  useEffect(() => {
    if (record) {
      setForm({
        keyref: record.keyref ?? '',
        date: record.date ?? '',
        week: String(record.week ?? ''),
        shipper_name: record.shipper_name ?? '',
        income: record.income ?? '',
        expense: record.expense ?? '',
      });
      setErrors({});
    }
  }, [record]);

  if (!record) return null;

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.keyref.trim()) e.keyref = t('editStatement.validation.keyref', 'Key ref is required');
    if (!form.date.trim()) e.date = t('editStatement.validation.date', 'Date is required');
    const weekNum = Number(form.week);
    if (!form.week || isNaN(weekNum) || weekNum < 1 || weekNum > 53)
      e.week = t('editStatement.validation.week', 'Week must be 1–53');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await updateStatement(record.id, {
        keyref: form.keyref.trim(),
        date: form.date,
        week: Number(form.week),
        shipper_name: form.shipper_name.trim() || undefined,
        income: form.income || undefined,
        expense: form.expense || undefined,
      });
      enqueueSnackbar(t('editStatement.success', 'Statement updated'), { variant: 'success' });
      onSaved(updated);
    } catch (err: any) {
      enqueueSnackbar(err?.message || t('editStatement.error', 'Error updating statement'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Derive year from form.date if available, else current year
  const dateYear = form.date ? new Date(form.date).getUTCFullYear() : new Date().getFullYear();
  const weekNum = Number(form.week);
  const weekRange = !isNaN(weekNum) ? getWeekDateRange(weekNum, dateYear) : null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div
          className="px-6 py-5 text-white"
          style={{ background: 'linear-gradient(135deg, #0B2863 0%, #1a4a9e 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{t('editStatement.title', 'Edit Statement')}</h2>
              <p className="text-blue-200 text-sm mt-0.5">
                {t('editStatement.subtitle', 'Modify the fields and save')}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <Field
            label={t('editStatement.fields.keyref', 'Key Ref')}
            field="keyref" value={form.keyref} error={errors.keyref}
            disabled={saving} onChange={handleChange}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t('editStatement.fields.date', 'Date')}
              field="date" value={form.date} error={errors.date}
              disabled={saving} onChange={handleChange} type="date"
            />
            <div>
              <Field
                label={t('editStatement.fields.week', 'Week')}
                field="week" value={form.week} error={errors.week}
                disabled={saving} onChange={handleChange} type="number" min="1" max="53"
              />
              {weekRange && !errors.week && (
                <p className="text-xs mt-1 font-medium" style={{ color: '#0B2863' }}>
                  {weekRange.start} → {weekRange.end}
                </p>
              )}
            </div>
          </div>
          <Field
            label={t('editStatement.fields.shipperName', 'Shipper Name')}
            field="shipper_name" value={form.shipper_name} error={errors.shipper_name}
            disabled={saving} onChange={handleChange}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t('editStatement.fields.income', 'Income')}
              field="income" value={form.income} error={errors.income}
              disabled={saving} onChange={handleChange} type="number" min="0" step="0.01"
            />
            <Field
              label={t('editStatement.fields.expense', 'Expense')}
              field="expense" value={form.expense} error={errors.expense}
              disabled={saving} onChange={handleChange} type="number" min="0" step="0.01"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-3 border-2 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: '#0B2863', color: '#0B2863' }}
          >
            {t('editStatement.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0B2863 0%, #1a4a9e 100%)' }}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t('editStatement.saving', 'Saving...')}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('editStatement.save', 'Save Changes')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStatementDialog;

