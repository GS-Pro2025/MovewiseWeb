/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';

interface DocumentsStepProps {
  files: {
    photo?: File;
    license_front?: File;
    license_back?: File;
  };
  errors: Record<string, string>;
  onChange: (files: {
    photo?: File;
    license_front?: File;
    license_back?: File;
  }) => void;
}

const DocumentsStep: React.FC<DocumentsStepProps> = ({
  files,
  errors,
  onChange
}) => {
  const [previews, setPreviews] = useState<{
    photo?: string;
    license_front?: string;
    license_back?: string;
  }>({});

  // contar solo archivos realmente subidos (para progreso)
  const uploadedCount = ['photo', 'license_front', 'license_back'].filter(
    (k) => Boolean((files as any)[k])
  ).length;
  
  const handleFileChange = (field: 'photo' | 'license_front' | 'license_back', file: File | null) => {
    if (file) {
      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);

      // Actualizar archivo
      onChange({ ...files, [field]: file });
    } else {
      // Limpiar
      setPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[field];
        return newPreviews;
      });
      const newFiles = { ...files };
      delete newFiles[field];
      onChange(newFiles);
    }
  };

  const FileUploadBox = ({ 
    label, 
    field, 
    icon, 
    description 
  }: { 
    label: string; 
    field: 'photo' | 'license_front' | 'license_back'; 
    icon: string;
    description: string;
  }) => {
    const hasFile = !!files[field];
    const preview = previews[field];
    const error = errors[field];

    return (
      <div>
        {/* Fotos ahora opcionales: no mostrar asterisco */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
            error 
              ? 'border-red-500 bg-red-50' 
              : hasFile 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt={label}
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleFileChange(field, null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="mt-2 text-sm text-gray-600 text-center truncate">
                <i className="fas fa-check-circle text-green-600 mr-1"></i>
                {files[field]?.name}
              </div>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(field, file);
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center py-6">
                <i className={`${icon} text-4xl mb-3 ${error ? 'text-red-400' : 'text-gray-400'}`}></i>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">{description}</p>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG, JPEG (MAX. 5MB)</p>
              </div>
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-3">
          <i className="fas fa-file-upload text-3xl text-orange-600"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Upload Documents</h3>
        <p className="text-gray-600 mt-1">Required identification and license photos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FileUploadBox
          label="Operator Photo"
          field="photo"
          icon="fas fa-camera"
          description="Clear portrait photo"
        />

        <FileUploadBox
          label="License Front"
          field="license_front"
          icon="fas fa-id-card"
          description="Front side of license"
        />

        <FileUploadBox
          label="License Back"
          field="license_back"
          icon="fas fa-id-card"
          description="Back side of license"
        />
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Upload Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {uploadedCount} / 3 (optional)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(uploadedCount / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {files.photo && (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
            <i className="fas fa-check-circle"></i>
            <span>Photo uploaded</span>
          </div>
        )}
        {files.license_front && (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
            <i className="fas fa-check-circle"></i>
            <span>License front uploaded</span>
          </div>
        )}
        {files.license_back && (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
            <i className="fas fa-check-circle"></i>
            <span>License back uploaded</span>
          </div>
        )}
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start">
          <i className="fas fa-exclamation-triangle text-orange-600 mt-1 mr-3"></i>
          <div>
            {/* indicar que las fotos son opcionales si así se desea */}
            <p className="text-sm text-orange-800 font-medium">Document Guidance (optional)</p>
            <ul className="text-sm text-orange-700 mt-2 space-y-1 list-disc list-inside">
               <li>All photos must be clear and legible</li>
               <li>License images should show all information clearly</li>
               <li>Maximum file size: 5MB per image</li>
               <li>Accepted formats: PNG, JPG, JPEG</li>
               <li>Photos should be well-lit without glare or shadows</li>
             </ul>
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 export default DocumentsStep;