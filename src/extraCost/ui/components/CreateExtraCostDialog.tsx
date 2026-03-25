import React, { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    cost: '',
    type: '',
    id_order: id_order || ''
  });

  // ✅ Almacena el string COMPLETO: "data:image/jpeg;base64,/9j/..."
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Mantener id_order sincronizado
  useEffect(() => {
    setForm(prev => ({ ...prev, id_order: id_order || '' }));
  }, [id_order]);

  // Resetear formulario cuando se cierra
  useEffect(() => {
    if (!open) {
      setForm({ name: '', cost: '', type: '', id_order: id_order || '' });
      setImageBase64(null);
      setImagePreview(null);
      setError(null);
      setSuccess(false);
      setDragOver(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, id_order]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG, WEBP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // ✅ Guardamos el string COMPLETO con prefijo "data:image/jpeg;base64,..."
      // El backend espera este formato, NO solo el base64 puro
      setImageBase64(result);
      setImagePreview(result);
      if (error) setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (loading || success) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!loading && !success) setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleRemoveImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        id_order: form.id_order.replace(/-/g, ''),
        // ✅ Se envía el string completo "data:image/jpeg;base64,..."
        // o null si no se seleccionó imagen
        image: imageBase64 ?? null
      };

      // Log sin imprimir el base64 completo para no saturar consola
      console.log("📦 JSON enviado al backend:", {
        ...payload,
        image: payload.image ? `[base64 - ${Math.round((payload.image.length * 3) / 4 / 1024)}KB aprox]` : null
      });

      await repository.createExtraCost(payload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el costo extra');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#092961]/20 focus:border-[#092961] transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-400";
  const labelClassName = "block mb-1.5 text-sm font-medium";
  const buttonBaseClassName = "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200";

  return (
    <Dialog
      open={open}
      onClose={loading || success ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl overflow-hidden" }}
    >
      <div className="p-6">

        {/* Header */}
        <div className="mb-6 border-b-2 pb-3" style={{ borderColor: '#F09F52' }}>
          <h2 className="text-2xl font-semibold m-0" style={{ color: '#092961' }}>
            Crear Costo Extra
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Completa los detalles del costo adicional
          </p>
        </div>

        {/* Success */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>¡Costo extra creado exitosamente!</span>
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
            <label className={labelClassName} style={{ color: '#092961' }}>
              Nombre <span style={{ color: '#F09F52' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClassName}
              placeholder="Ej: Peaje, Estacionamiento, etc."
              disabled={loading || success}
            />
          </div>

          {/* Costo */}
          <div>
            <label className={labelClassName} style={{ color: '#092961' }}>
              Costo ($) <span style={{ color: '#F09F52' }}>*</span>
            </label>
            <input
              type="number"
              name="cost"
              value={form.cost}
              onChange={handleChange}
              className={inputClassName}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={loading || success}
            />
            <p className="text-xs text-gray-400 mt-1">
              Ingresa cualquier número (ej: 25.50, 100, 45.75)
            </p>
          </div>

          {/* Tipo */}
          <div>
            <label className={labelClassName} style={{ color: '#092961' }}>
              Tipo <span style={{ color: '#F09F52' }}>*</span>
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

          {/* Imagen */}
          <div>
            <label className={labelClassName} style={{ color: '#092961' }}>
              Imagen{' '}
              <span className="text-gray-400 font-normal text-xs">(opcional · máx. 5MB)</span>
            </label>

            {imagePreview ? (
              /* Preview de imagen seleccionada */
              <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-44 object-contain"
                />
                {/* Overlay con info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-white text-xs truncate">
                    {Math.round((imageBase64?.length ?? 0) * 3 / 4 / 1024)} KB aprox.
                  </span>
                  {!loading && !success && (
                    <button
                      onClick={handleRemoveImage}
                      className="text-white text-xs bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Zona de drag & drop */
              <div
                onClick={() => !loading && !success && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  w-full h-36 border-2 border-dashed rounded-lg
                  flex flex-col items-center justify-center gap-2
                  transition-all duration-200
                  ${loading || success
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : dragOver
                      ? 'border-[#092961] bg-blue-50/50 cursor-pointer scale-[1.01]'
                      : 'border-gray-300 hover:border-[#F09F52] hover:bg-orange-50/20 cursor-pointer'
                  }
                `}
              >
                <span className="text-3xl select-none">📷</span>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    {dragOver ? 'Suelta la imagen aquí' : 'Click o arrastra una imagen'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG · PNG · WEBP · GIF</p>
                </div>
              </div>
            )}

            {/* Input file oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={loading || success}
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
            className={`${buttonBaseClassName} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: loading ? '#F09F52' : '#092961' }}
            onMouseEnter={(e) => {
              if (!loading && !success) e.currentTarget.style.backgroundColor = '#F09F52';
            }}
            onMouseLeave={(e) => {
              if (!loading && !success) e.currentTarget.style.backgroundColor = '#092961';
            }}
          >
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creando...
                </span>
              : success
                ? '✓ ¡Creado!'
                : 'Crear Costo Extra'
            }
          </button>
        </div>

      </div>
    </Dialog>
  );
};

export default CreateExtraCostDialog;