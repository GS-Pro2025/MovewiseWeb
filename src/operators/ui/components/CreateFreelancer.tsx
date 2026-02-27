/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Button, TextField, MenuItem } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { createFreelanceOperator, FreelanceOperator } from '../../data/RepositoryFreelancer';

interface CreateFreelancerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (freelancer: FreelanceOperator) => void;
}

const LOCAL_KEY = 'freelancer_form_draft';

const COLORS = {
  primary: '#0B2863',
  error: '#ef4444',
};

type IdentificationType = 'id_number' | 'passport' | 'drivers_license' | 'green_card';

const CreateFreelancer: React.FC<CreateFreelancerProps> = ({ isOpen, onClose, onCreated }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  // ID types built from translations — defined inside component so t() is active
  const ID_TYPES: { value: IdentificationType; label: string }[] = [
    { value: 'id_number',       label: t('operators.createFreelancer.idTypes.id_number') },
    { value: 'passport',        label: t('operators.createFreelancer.idTypes.passport') },
    { value: 'drivers_license', label: t('operators.createFreelancer.idTypes.drivers_license') },
    { value: 'green_card',      label: t('operators.createFreelancer.idTypes.green_card') },
  ];

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    phone: '',
    address: '',
    number_licence: '',
    salary: '',
    type_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Draft persistence ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const cached = localStorage.getItem(LOCAL_KEY);
    if (cached) {
      try { setForm(JSON.parse(cached)); } catch { /* ignore */ }
    }
  }, [isOpen]);

  const saveDraft = useCallback((data: any) => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch {
      console.warn('Could not save draft to localStorage');
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(LOCAL_KEY);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (key: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      saveDraft(next);
      return next;
    });
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim())  e.first_name = t('operators.createFreelancer.validation.firstName');
    if (!form.last_name.trim())   e.last_name  = t('operators.createFreelancer.validation.lastName');
    if (!form.id_number.trim())   e.id_number  = t('operators.createFreelancer.validation.idNumber');
    if (!form.type_id.trim())     e.type_id    = t('operators.createFreelancer.validation.idType');
    if (!form.phone.trim())       e.phone      = t('operators.createFreelancer.validation.phone');
    if (form.salary && isNaN(Number(form.salary))) e.salary = t('operators.createFreelancer.validation.salary');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      enqueueSnackbar(t('operators.createFreelancer.validation.fixErrors'), { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        first_name:     form.first_name,
        last_name:      form.last_name,
        id_number:      form.id_number,
        phone:          form.phone,
        address:        form.address,
        number_licence: form.number_licence,
        salary:         form.salary,
        type_id:        form.type_id,
      };

      const created = await createFreelanceOperator(payload);
      enqueueSnackbar(t('operators.createFreelancer.snackbar.success'), { variant: 'success' });
      clearDraft();
      if (onCreated) onCreated(created);
      onClose();
    } catch (err: any) {
      saveDraft(form);

      let msg = t('operators.createFreelancer.snackbar.error');
      if (err && typeof err === 'object') {
        if (err.message) msg = String(err.message);
        if (err.errors && typeof err.errors === 'object') {
          const norm: Record<string, string> = {};
          Object.entries(err.errors).forEach(([k, v]) => {
            const first = Array.isArray(v) ? (v[0] as string) : String(v);
            const shortKey = k.includes('.') ? k.split('.').pop()! : k;
            norm[shortKey] = first;
          });
          setErrors(prev => ({ ...prev, ...norm }));
        }
      } else if (typeof err === 'string') {
        msg = err;
      }
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{t('operators.createFreelancer.title')}</h2>
            <p className="text-blue-100 text-sm">{t('operators.createFreelancer.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-10"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* ── Form ── */}
        <div className="p-6 space-y-4">

          {/* First / Last name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label={t('operators.createFreelancer.fields.firstName')}
              value={form.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              error={!!errors.first_name}
              helperText={errors.first_name}
              fullWidth
            />
            <TextField
              label={t('operators.createFreelancer.fields.lastName')}
              value={form.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              error={!!errors.last_name}
              helperText={errors.last_name}
              fullWidth
            />
          </div>

          {/* ID Number / ID Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label={t('operators.createFreelancer.fields.idNumber')}
              value={form.id_number}
              onChange={(e) => handleChange('id_number', e.target.value)}
              error={!!errors.id_number}
              helperText={errors.id_number}
              fullWidth
            />
            <TextField
              select
              label={t('operators.createFreelancer.fields.idType')}
              value={form.type_id}
              onChange={(e) => handleChange('type_id', e.target.value)}
              error={!!errors.type_id}
              helperText={errors.type_id}
              fullWidth
            >
              {ID_TYPES.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {t('operators.createFreelancer.fields.phone')}
            </label>
            <PhoneInput
              country={'us'}
              value={form.phone}
              onChange={(phone) => handleChange('phone', phone)}
              inputProps={{ name: 'phone', required: true }}
              inputStyle={{
                width: '100%',
                height: '56px',
                fontSize: '16px',
                backgroundColor: 'white',
                border: errors.phone
                  ? `1px solid ${COLORS.error}`
                  : '1px solid rgba(0,0,0,0.23)',
                borderRadius: '8px',
                paddingLeft: '48px',
              }}
              buttonStyle={{
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.23)',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
              }}
            />
            {errors.phone && (
              <div className="text-sm text-red-600 mt-1">{errors.phone}</div>
            )}
          </div>

          {/* Address */}
          <TextField
            label={t('operators.createFreelancer.fields.address')}
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            fullWidth
          />

          {/* License / Salary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <TextField
              label={t('operators.createFreelancer.fields.licenseNumber')}
              value={form.number_licence}
              onChange={(e) => handleChange('number_licence', e.target.value)}
              fullWidth
            />
            <TextField
              label={t('operators.createFreelancer.fields.salary')}
              value={form.salary}
              onChange={(e) => handleChange('salary', e.target.value)}
              error={!!errors.salary}
              helperText={errors.salary}
              fullWidth
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              {t('operators.createFreelancer.buttons.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: '#082050' } }}
            >
              {submitting
                ? t('operators.createFreelancer.buttons.creating')
                : t('operators.createFreelancer.buttons.create')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFreelancer;