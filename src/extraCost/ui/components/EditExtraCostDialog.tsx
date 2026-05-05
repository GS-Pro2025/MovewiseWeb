import React, { useState, useEffect } from 'react';
import { Dialog } from '@mui/material';
import { ExtraCostRepository } from '../../data/ExtraCostRepository';
import { ExtraCost } from '../../domain/ExtraCostModel';

interface Props {
  open: boolean;
  onClose: () => void;
  extraCost: ExtraCost | null;
  onSuccess: () => void;
}

const EditExtraCostDialog: React.FC<Props> = ({ open, onClose, extraCost, onSuccess }) => {
  const repository = new ExtraCostRepository();

  const [form, setForm] = useState({ name: '', cost: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (extraCost) {
      setForm({
        name: extraCost.name,
        cost: extraCost.cost,
        type: extraCost.type,
      });
    }
  }, [extraCost]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validate = (): boolean => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return false; }
    if (!form.type.trim()) { setError('El tipo es obligatorio'); return false; }
    const costValue = parseFloat(form.cost);
    if (!form.cost || isNaN(costValue) || costValue <= 0) {
      setError('El costo debe ser un número mayor a 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!extraCost || !validate()) return;
    try {
      setLoading(true);
      setError(null);
      await repository.updateExtraCost(extraCost.id_workCost, {
        name: form.name.trim(),
        cost: parseFloat(form.cost),
        type: form.type.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el costo extra');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#092961]/20 focus:border-[#092961] transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-400';
  const labelCls = 'block mb-1.5 text-sm font-medium';
  const btnBase = 'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200';

  return (
    <Dialog
      open={open}
      onClose={loading || success ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: 'rounded-xl overflow-hidden' }}
    >
      <div className="p-6">

        {/* Header */}
        <div className="mb-6 border-b-2 pb-3" style={{ borderColor: '#F09F52' }}>
          <h2 className="text-2xl font-semibold m-0" style={{ color: '#092961' }}>
            Editar Costo Extra
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Orden: <span className="font-medium text-[#092961]">{extraCost?.order.key_ref}</span>
          </p>
        </div>

        {/* Success */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>¡Costo extra actualizado!</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <span className="text-base">✗</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">

          {/* Nombre */}
          <div>
            <label className={labelCls} style={{ color: '#092961' }}>
              Nombre <span style={{ color: '#F09F52' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputCls}
              placeholder="Ej: Peaje, Estacionamiento, etc."
              disabled={loading || success}
            />
          </div>

          {/* Costo */}
          <div>
            <label className={labelCls} style={{ color: '#092961' }}>
              Costo ($) <span style={{ color: '#F09F52' }}>*</span>
            </label>
            <input
              type="number"
              name="cost"
              value={form.cost}
              onChange={handleChange}
              className={inputCls}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={loading || success}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className={labelCls} style={{ color: '#092961' }}>
              Tipo <span style={{ color: '#F09F52' }}>*</span>
            </label>
            <input
              type="text"
              name="type"
              value={form.type}
              onChange={handleChange}
              className={inputCls}
              placeholder="Ej: Labor, Fuel, Mantenimiento"
              disabled={loading || success}
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading || success}
            className={`${btnBase} border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-[#092961] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className={`${btnBase} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: loading ? '#F09F52' : '#092961' }}
            onMouseEnter={(e) => { if (!loading && !success) e.currentTarget.style.backgroundColor = '#F09F52'; }}
            onMouseLeave={(e) => { if (!loading && !success) e.currentTarget.style.backgroundColor = '#092961'; }}
          >
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              : success
                ? '✓ ¡Guardado!'
                : 'Guardar cambios'
            }
          </button>
        </div>

      </div>
    </Dialog>
  );
};

export default EditExtraCostDialog;
