import React, { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { RegistryOperator } from '../../domain/RegistryOperatorModel';
import PersonalDataStep from './RegisterOperatorSteps/PersonalDataStep';
import ContactInfoStep from './RegisterOperatorSteps/ContactInfoStep';
import OperatorDataStep from './RegisterOperatorSteps/OperatorDataStep';
import DocumentsStep from './RegisterOperatorSteps/DocumentsStep';
import ChildrenStep from './RegisterOperatorSteps/ChildrenStep';

interface RegisterOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (operatorData: FormData) => Promise<void>;
}

const STEPS = [
  { id: 1, name: 'Personal Data', icon: 'fa-user' },
  { id: 2, name: 'Contact Info', icon: 'fa-address-card' },
  { id: 3, name: 'Operator Data', icon: 'fa-id-badge' },
  { id: 4, name: 'Documents', icon: 'fa-file-upload' },
  { id: 5, name: 'Children', icon: 'fa-baby' }
];

const RegisterOperatorModal: React.FC<RegisterOperatorModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado del formulario completo
  const [formData, setFormData] = useState<Partial<RegistryOperator>>({
    number_licence: '',
    code: '',
    n_children: 0,
    size_t_shirt: '',
    name_t_shirt: '',
    salary: 0,
    status: 'active',
    first_name: '',
    last_name: '',
    birth_date: '',
    type_id: 'id_number',
    phone: '',
    email: '',
    id_number: '',
    address: '',
    zipcode: '',
    sons: []
  });

  // Archivos separados (para FormData)
  const [files, setFiles] = useState<{
    photo?: File;
    license_front?: File;
    license_back?: File;
  }>({});

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar datos del formulario
  const updateFormData = useCallback((data: Partial<RegistryOperator>) => {
    setFormData(prev => ({ ...prev, ...data }));
    // Limpiar errores del campo actualizado
    const updatedFields = Object.keys(data);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  }, []);

  // Actualizar archivos
  const updateFiles = useCallback((newFiles: typeof files) => {
    setFiles(prev => ({ ...prev, ...newFiles }));
  }, []);

  // Validaciones por paso
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Personal Data
        if (!formData.first_name?.trim()) newErrors.first_name = 'First name is required';
        if (!formData.last_name?.trim()) newErrors.last_name = 'Last name is required';
        if (!formData.birth_date) newErrors.birth_date = 'Birth date is required';
        if (!formData.type_id) newErrors.type_id = 'ID type is required';
        if (!formData.id_number?.trim()) newErrors.id_number = 'ID number is required';
        break;

      case 2: // Contact Info
        if (!formData.phone?.trim()) newErrors.phone = 'Phone is required';
        if (!formData.email?.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        break;

      case 3: // Operator Data
        if (!formData.code?.trim()) newErrors.code = 'Code is required';
        if (!formData.number_licence?.trim()) newErrors.number_licence = 'License number is required';
        if (!formData.size_t_shirt?.trim()) newErrors.size_t_shirt = 'T-shirt size is required';
        if (!formData.salary || formData.salary <= 0) newErrors.salary = 'Valid salary is required';
        break;

      //case 4: // Documents
        //if (!files.photo) newErrors.photo = 'Photo is required';
        //if (!files.license_front) newErrors.license_front = 'License front is required';
        //if (!files.license_back) newErrors.license_back = 'License back is required';
        //break;

      case 5: // Children (opcional, no hay validaciones obligatorias)
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, files]);

  // Navegación entre pasos
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(prev => prev + 1);
      }
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Submit final
  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Crear FormData
      const formDataToSend = new FormData();

      // Datos del operador
      formDataToSend.append('code', formData.code || '');
      formDataToSend.append('number_licence', formData.number_licence || '');
      formDataToSend.append('n_children', (formData.n_children || 0).toString());
      formDataToSend.append('size_t_shirt', formData.size_t_shirt || '');
      formDataToSend.append('name_t_shirt', formData.name_t_shirt || '');
      formDataToSend.append('salary', (formData.salary || 0).toString());
      formDataToSend.append('status', formData.status || 'active');

      // Datos personales (person.campo)
      formDataToSend.append('first_name', formData.first_name || '');
      formDataToSend.append('last_name', formData.last_name || '');
      formDataToSend.append('birth_date', formData.birth_date || '');
      formDataToSend.append('phone', formData.phone || '');
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('id_number', formData.id_number || '');
      formDataToSend.append('type_id', formData.type_id || 'id_number');
      formDataToSend.append('email', formData.email || '');
      formDataToSend.append('status', 'active');

      // Archivos
      if (files.photo) formDataToSend.append('photo', files.photo);
      if (files.license_front) formDataToSend.append('license_front', files.license_front);
      if (files.license_back) formDataToSend.append('license_back', files.license_back);

      // Hijos (si hay)
      if (formData.sons && formData.sons.length > 0) {
        formDataToSend.append('sons', JSON.stringify(formData.sons));
      }

      // Otros campos opcionales
      if (formData.zipcode) formDataToSend.append('zipcode', formData.zipcode);

      await onSave(formDataToSend);
      onClose();
    } catch (error: any) {
      console.error('Error submitting operator:', error);
      // Backend may return structured error: { message, errors }
      if (error && typeof error === 'object') {
        const msg = error.message || 'Server validation error';
        enqueueSnackbar(msg, { variant: 'error' });

        // If there are field errors, normalize and display in the form
        if (error.errors && typeof error.errors === 'object') {
          const normalized: Record<string, string> = {};
          Object.entries(error.errors).forEach(([key, val]) => {
            // val may be array of messages
            const firstMsg = Array.isArray(val) ? (val[0] as string) : String(val);
            // normalize nested keys like "person.email" -> "email"
            const shortKey = key.includes('.') ? key.split('.').pop()! : key;
            normalized[shortKey] = firstMsg;
          });
          setErrors(prev => ({ ...prev, ...normalized }));
        }
      } else {
        enqueueSnackbar(String(error), { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, formData, files, validateStep, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Register New Operator</h2>
              <p className="text-blue-100 mt-1">Step {currentStep} of {STEPS.length}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white scale-110'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      <i className={`fas ${step.icon} text-sm`}></i>
                    )}
                  </div>
                  <span className="text-xs mt-2 text-gray-600 hidden md:block">{step.name}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {currentStep === 1 && (
            <PersonalDataStep
              data={formData}
              errors={errors}
              onChange={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <ContactInfoStep
              data={formData}
              errors={errors}
              onChange={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <OperatorDataStep
              data={formData}
              errors={errors}
              onChange={updateFormData}
            />
          )}
          {currentStep === 4 && (
            <DocumentsStep
              files={files}
              errors={errors}
              onChange={updateFiles}
            />
          )}
          {currentStep === 5 && (
            <ChildrenStep
              sons={formData.sons || []}
              onChange={(sons) => updateFormData({ sons, n_children: sons.length })}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium bg-gray-300 text-gray-700 hover:bg-gray-400 transition-all"
            >
              Cancel
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                Next
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Register Operator
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterOperatorModal;