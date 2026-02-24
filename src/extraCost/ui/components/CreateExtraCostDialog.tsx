import React, { useState, useEffect } from 'react';
import { Dialog } from '@mui/material';
import { ExtraCostRepository } from '../../data/ExtraCostRepository';
import { CreateExtraCostDTO } from '../../domain/ExtraCostModel';

interface Props {
  open: boolean;
  onClose: () => void;
  id_order: string;
  onSuccess: () => void;
}

const CreateExtraCostDialog: React.FC<Props> = ({
  open,
  onClose,
  id_order,
  onSuccess
}) => {
  const repository = new ExtraCostRepository();

  const [form, setForm] = useState({
    name: '',
    cost: '',
    type: '',
    id_order: id_order || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Mantener id_order sincronizado
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      id_order: id_order || ''
    }));
  }, [id_order]);

  // Resetear formulario cuando se cierra
  useEffect(() => {
    if (!open) {
      setForm({
        name: '',
        cost: '',
        type: '',
        id_order: id_order || ''
      });
      setError(null);
      setSuccess(false);
    }
  }, [open, id_order]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar errores cuando el usuario empieza a escribir
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }

    if (!form.type.trim()) {
      setError('El tipo es obligatorio');
      return false;
    }

    const costValue = parseFloat(form.cost);
    if (!form.cost || isNaN(costValue) || costValue <= 0) {
      setError('El costo debe ser un número mayor a 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const payload: CreateExtraCostDTO = {
        name: form.name.trim(),
        cost: parseFloat(form.cost),
        type: form.type.trim(),
        id_order: form.id_order.replace(/-/g, '')
      };

      console.log("📦 JSON enviado al backend:");
      console.log(JSON.stringify(payload, null, 2));

      await repository.createExtraCost(payload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear el costo extra');
    } finally {
      setLoading(false);
    }
  };

  // Estilos comunes
  const inputClassName = "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#092961]/20 focus:border-[#092961] transition-all duration-200";
  const labelClassName = "block mb-1.5 text-sm font-medium";
  const buttonBaseClassName = "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "rounded-xl overflow-hidden"
      }}
    >
      <div className="p-6">

        {/* Header */}
        <div className="mb-6 border-b-2 pb-3" style={{ borderColor: '#F09F52' }}>
          <h2 className="text-2xl font-semibold m-0" style={{ color: '#092961' }}>
            Crear Costo Extra
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Completa los detalles del costo adicional
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            ✓ ¡Costo extra creado exitosamente!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            ✗ {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className={labelClassName} style={{ color: '#092961' }}>
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClassName}
              placeholder="Ej: Peaje, Estacionamiento, etc"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className={labelClassName} style={{ color: '#092961' }}>
              Costo ($) *
            </label>
            <input
              type="text"
              name="cost"
              value={form.cost}
              onChange={handleChange}
              className={inputClassName}
              placeholder="0.00"
              disabled={loading || success}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingresa cualquier número (ej: 25.50, 100, 45.75)
            </p>
          </div>

          <div>
            <label className={labelClassName} style={{ color: '#092961' }}>
              Tipo *
            </label>
            <input
              type="text"
              name="type"
              value={form.type}
              onChange={handleChange}
              className={inputClassName}
              placeholder="Ej: Labor, Fuel, Mantenimiento"
              disabled={loading || success}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading || success}
            className={`${buttonBaseClassName} border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-[#092961] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className={`${buttonBaseClassName} text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg`}
            style={{
              backgroundColor: loading ? '#F09F52' : '#092961'
            }}
            onMouseEnter={(e) => {
              if (!loading && !success) {
                e.currentTarget.style.backgroundColor = '#F09F52';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !success) {
                e.currentTarget.style.backgroundColor = '#092961';
              }
            }}
          >
            {loading ? 'Creando...' : success ? '¡Creado!' : 'Crear Costo Extra'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateExtraCostDialog;