/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Button, TextField, MenuItem } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import { useSnackbar } from 'notistack';
import { createFreelanceOperator, FreelanceOperator } from '../../data/RepositoryFreelancer';

interface CreateFreelancerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (freelancer: FreelanceOperator) => void;
}

const LOCAL_KEY = 'freelancer_form_draft';

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
};

type IdentificationType = 'id_number' | 'passport' | 'drivers_license' | 'green_card';

const ID_TYPES: { value: IdentificationType; label: string }[] = [
  { value: 'id_number', label: 'ID Number' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'green_card', label: 'Green Card' }
];

const CreateFreelancer: React.FC<CreateFreelancerProps> = ({ isOpen, onClose, onCreated }) => {
  const { enqueueSnackbar } = useSnackbar();

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

  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const cached = localStorage.getItem(LOCAL_KEY);
    if (cached) {
      try {
        setForm(JSON.parse(cached));
      } catch { /* ignore parse errors */ }
    }
  }, [isOpen]);

  const saveDraft = useCallback((data: any) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    } catch {
        // ignore write errors
        console.warn('Could not save draft to localStorage');
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(LOCAL_KEY);
  }, []);

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
    const e: Record<string,string> = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim()) e.last_name = 'Last name is required';
    if (!form.id_number.trim()) e.id_number = 'ID number is required';
    if (!form.type_id.trim()) e.type_id = 'ID type is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (form.salary && isNaN(Number(form.salary))) e.salary = 'Salary must be a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      enqueueSnackbar('Please fix the validation errors', { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        id_number: form.id_number,
        phone: form.phone,
        address: form.address,
        number_licence: form.number_licence,
        salary: form.salary,
        type_id: form.type_id,
      };

      const created = await createFreelanceOperator(payload);
      enqueueSnackbar('Freelancer created successfully', { variant: 'success' });
      clearDraft();
      if (onCreated) onCreated(created);
      onClose();
    } catch (err: any) {
      // Persist draft on error
      saveDraft(form);

      // Try to normalize server error
      let msg = 'Error creating freelancer';
      if (err && typeof err === 'object') {
        if (err.message) msg = String(err.message);
        if (err.errors && typeof err.errors === 'object') {
          const norm: Record<string,string> = {};
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Create Freelancer</h2>
            <p className="text-blue-100 text-sm">Quick registration for freelance operators</p>
          </div>
          <button onClick={onClose} className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-10">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="First Name"
              value={form.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              error={!!errors.first_name}
              helperText={errors.first_name}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={form.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              error={!!errors.last_name}
              helperText={errors.last_name}
              fullWidth
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="ID Number"
              value={form.id_number}
              onChange={(e) => handleChange('id_number', e.target.value)}
              error={!!errors.id_number}
              helperText={errors.id_number}
              fullWidth
            />
            <TextField
              select
              label="ID Type"
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

          <div>
            <label className="block text-sm text-gray-700 mb-1">Phone</label>
            <PhoneInput
              country={'us'}
              value={form.phone}
              onChange={(phone) => handleChange('phone', phone)}
              inputProps={{
                name: 'phone',
                required: true,
              }}
              inputStyle={{
                width: '100%',
                height: '56px',
                fontSize: '16px',
                backgroundColor: 'white',
                border: errors.phone ? `1px solid ${COLORS.error}` : '1px solid rgba(0,0,0,0.23)',
                borderRadius: '8px',
                paddingLeft: '48px'
              }}
              buttonStyle={{
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.23)',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
              }}
            />
            {errors.phone && <div className="text-sm text-red-600 mt-1">{errors.phone}</div>}
          </div>

          <TextField
            label="Address"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            fullWidth
          />

          {/* give more vertical spacing so License Number / Salary don't stick to the field above */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <TextField
              label="License Number"
              value={form.number_licence}
              onChange={(e) => handleChange('number_licence', e.target.value)}
              fullWidth
            />
            <TextField
              label="Salary"
              value={form.salary}
              onChange={(e) => handleChange('salary', e.target.value)}
              error={!!errors.salary}
              helperText={errors.salary}
              fullWidth
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={onClose} variant="outlined" sx={{ borderColor: COLORS.primary }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: COLORS.primary }}
            >
              {submitting ? 'Creating...' : 'Create Freelancer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFreelancer;