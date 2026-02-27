/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
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

// Step definitions — labels resolved via i18n at render time
const STEP_IDS = [
  { id: 1, key: 'personalData',  icon: 'fa-user' },
  { id: 2, key: 'contactInfo',   icon: 'fa-address-card' },
  { id: 3, key: 'operatorData',  icon: 'fa-id-badge' },
  { id: 4, key: 'documents',     icon: 'fa-file-upload' },
  { id: 5, key: 'children',      icon: 'fa-baby' }
];

const LOCAL_KEY = 'register_operator_draft_v1';

const RegisterOperatorModal: React.FC<RegisterOperatorModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const [formData, setFormData] = useState<Partial<RegistryOperator>>({
    number_licence: '',
    code: '',
    n_children: 0,
    size_t_shirt: '',
    name_t_shirt: '',
    salary: 0,
    hourly_salary: 0,
    salary_type: 'day',
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

  const [files, setFiles] = useState<{
    photo?: File;
    license_front?: File;
    license_back?: File;
  }>({});

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Draft persistence ──────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setFormData(prev => ({ ...prev, ...(parsed.data || parsed.formData || {}) }));
        }
      }
    } catch (err) {
      console.warn('Could not parse register draft', err);
    }
  }, []);

  const saveDraft = useCallback((payload?: Partial<RegistryOperator>) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ data: { ...formData, ...(payload || {}) } }));
    } catch (err) {
      console.warn('Could not save register draft', err);
    }
  }, [formData]);

  useEffect(() => { saveDraft(); }, [formData, saveDraft]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ }
  }, []);

  // ── Close handling ─────────────────────────────────────────────────────────

  const hasFormData = useCallback((): boolean => {
    return !!(
      formData.first_name?.trim() || formData.last_name?.trim() ||
      formData.email?.trim()       || formData.phone?.trim() ||
      formData.id_number?.trim()   || formData.code?.trim() ||
      formData.number_licence?.trim() || formData.address?.trim() ||
      (formData.sons && formData.sons.length > 0) ||
      files.photo || files.license_front || files.license_back
    );
  }, [formData, files]);

  const handleCloseAttempt = useCallback(() => {
    if (hasFormData()) setShowConfirmClose(true);
    else onClose();
  }, [hasFormData, onClose]);

  const handleConfirmClose = useCallback(() => {
    clearDraft();
    setShowConfirmClose(false);
    onClose();
  }, [clearDraft, onClose]);

  const handleCancelClose = useCallback(() => { setShowConfirmClose(false); }, []);

  // ── Form update ────────────────────────────────────────────────────────────

  const updateFormData = useCallback((data: Partial<RegistryOperator>) => {
    setFormData(prev => {
      const next = { ...prev, ...data };
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ data: next })); } catch { /* ignore */ }
      return next;
    });
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(data).forEach(field => delete newErrors[field]);
      return newErrors;
    });
  }, []);

  const updateFiles = useCallback((newFiles: typeof files) => {
    setFiles(prev => ({ ...prev, ...newFiles }));
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.first_name?.trim()) newErrors.first_name = t('operators.registerModal.validation.firstName');
        if (!formData.last_name?.trim())  newErrors.last_name  = t('operators.registerModal.validation.lastName');
        if (!formData.birth_date)         newErrors.birth_date = t('operators.registerModal.validation.birthDate');
        if (!formData.type_id)            newErrors.type_id    = t('operators.registerModal.validation.typeId');
        if (!formData.id_number?.trim())  newErrors.id_number  = t('operators.registerModal.validation.idNumber');
        break;

      case 2:
        if (!formData.phone?.trim()) {
          newErrors.phone = t('operators.registerModal.validation.phone');
        }
        if (!formData.email?.trim()) {
          newErrors.email = t('operators.registerModal.validation.email');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = t('operators.registerModal.validation.emailInvalid');
        }
        break;

      case 3:
        if (!formData.code?.trim())           newErrors.code           = t('operators.registerModal.validation.code');
        if (!formData.number_licence?.trim()) newErrors.number_licence = t('operators.registerModal.validation.numberLicence');
        if (!formData.size_t_shirt?.trim())   newErrors.size_t_shirt   = t('operators.registerModal.validation.tShirtSize');
        if (!formData.salary_type)            newErrors.salary_type    = t('operators.registerModal.validation.salaryType');
        if (formData.salary_type === 'day' && (!formData.salary || formData.salary <= 0))
          newErrors.salary = t('operators.registerModal.validation.salary');
        if (formData.salary_type === 'hour' && (!formData.hourly_salary || formData.hourly_salary <= 0))
          newErrors.hourly_salary = t('operators.registerModal.validation.hourlySalary');
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setHighestStepReached(prev => Math.max(prev, nextStep));
    } else {
      enqueueSnackbar(t('operators.registerModal.validation.fixErrors'), { variant: 'error' });
    }
  }, [currentStep, validateStep, enqueueSnackbar, t]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  }, [currentStep]);

  const handleStepClick = useCallback((stepId: number) => {
    if (stepId <= highestStepReached) setCurrentStep(stepId);
  }, [highestStepReached]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const allErrors: Record<string, string> = {};
    if (!formData.first_name?.toString().trim())    allErrors.first_name    = t('operators.registerModal.validation.firstName');
    if (!formData.last_name?.toString().trim())     allErrors.last_name     = t('operators.registerModal.validation.lastName');
    if (!formData.id_number?.toString().trim())     allErrors.id_number     = t('operators.registerModal.validation.idNumber');
    if (!formData.type_id)                          allErrors.type_id       = t('operators.registerModal.validation.typeId');
    if (!formData.phone?.toString().trim())         allErrors.phone         = t('operators.registerModal.validation.phone');
    if (!formData.number_licence?.toString().trim()) allErrors.number_licence = t('operators.registerModal.validation.numberLicence');
    if (!formData.salary_type)                      allErrors.salary_type   = t('operators.registerModal.validation.salaryType');
    if (formData.salary_type === 'day' && (!formData.salary || Number(formData.salary) <= 0))
      allErrors.salary = t('operators.registerModal.validation.salary');
    if (formData.salary_type === 'hour' && (!formData.hourly_salary || Number(formData.hourly_salary) <= 0))
      allErrors.hourly_salary = t('operators.registerModal.validation.hourlySalary');

    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      enqueueSnackbar(t('operators.registerModal.validation.fixBeforeSubmit'), { variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('code', formData.code || '');
      formDataToSend.append('number_licence', formData.number_licence || '');
      formDataToSend.append('n_children', (formData.n_children || 0).toString());
      formDataToSend.append('size_t_shirt', formData.size_t_shirt || '');
      formDataToSend.append('name_t_shirt', formData.name_t_shirt || '');
      formDataToSend.append('salary_type', formData.salary_type || 'day');
      if (formData.salary_type === 'day') {
        formDataToSend.append('salary', (formData.salary || 0).toString());
      } else {
        formDataToSend.append('hourly_salary', (formData.hourly_salary || 0).toString());
      }
      formDataToSend.append('status', formData.status || 'active');
      formDataToSend.append('first_name', formData.first_name || '');
      formDataToSend.append('last_name', formData.last_name || '');
      formDataToSend.append('birth_date', formData.birth_date || '');
      formDataToSend.append('phone', formData.phone || '');
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('id_number', formData.id_number || '');
      formDataToSend.append('type_id', formData.type_id || 'id_number');
      formDataToSend.append('email', formData.email || '');

      if (files.photo)         formDataToSend.append('photo', files.photo);
      if (files.license_front) formDataToSend.append('license_front', files.license_front);
      if (files.license_back)  formDataToSend.append('license_back', files.license_back);

      if (formData.sons && formData.sons.length > 0)
        formDataToSend.append('sons', JSON.stringify(formData.sons));

      if (formData.zipcode) formDataToSend.append('zipcode', formData.zipcode);

      await onSave(formDataToSend);
      clearDraft();
      enqueueSnackbar(t('operators.registerModal.snackbar.success'), { variant: 'success' });
      onClose();
    } catch (error: any) {
      console.error('Error submitting operator:', error);

      const extractCleanMessage = (err: any): string => {
        if (err && typeof err === 'object') {
          if (err.errors?.non_field_errors?.length) return err.errors.non_field_errors[0];
          if (err.errors && typeof err.errors === 'object') {
            const firstKey = Object.keys(err.errors)[0];
            if (firstKey) {
              const firstErr = err.errors[firstKey];
              return Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
            }
          }
        }
        let rawMsg = err?.message || String(err);
        const jsonMatch = rawMsg.match(/- (\{.*\})$/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.errors?.non_field_errors?.length) return parsed.errors.non_field_errors[0];
            rawMsg = parsed.message || rawMsg;
          } catch { /* ignore */ }
        }
        const errorDetailMatch = rawMsg.match(/ErrorDetail\(string='([^']+)'/);
        if (errorDetailMatch) return errorDetailMatch[1];
        rawMsg = rawMsg.replace(/^Unexpected error:\s*/i, '').replace(/^\[|\]$/g, '');
        return rawMsg || t('operators.registerModal.snackbar.fallbackError');
      };

      enqueueSnackbar(extractCleanMessage(error), { variant: 'error' });

      if (error?.errors && typeof error.errors === 'object') {
        const normalized: Record<string, string> = {};
        Object.entries(error.errors).forEach(([key, val]) => {
          if (key === 'non_field_errors') return;
          const firstMsg = Array.isArray(val) ? (val[0] as string) : String(val);
          const shortKey = key.includes('.') ? key.split('.').pop()! : key;
          normalized[shortKey] = firstMsg;
        });
        if (Object.keys(normalized).length > 0) setErrors(prev => ({ ...prev, ...normalized }));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, files, onSave, clearDraft, enqueueSnackbar, onClose, t]);

  if (!isOpen) return null;

  const STEPS = STEP_IDS.map(s => ({
    ...s,
    name: t(`operators.registerModal.steps.${s.key}`)
  }));

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      {/* ── Confirm Close Dialog ── */}
      {showConfirmClose && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('operators.registerModal.confirmClose.title')}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('operators.registerModal.confirmClose.subtitle')}
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              {t('operators.registerModal.confirmClose.message')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelClose}
                className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
              >
                {t('operators.registerModal.confirmClose.keepEditing')}
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-all"
              >
                {t('operators.registerModal.confirmClose.discard')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Modal ── */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t('operators.registerModal.title')}</h2>
              <p className="text-blue-100 mt-1">
                {t('operators.registerModal.stepIndicator', {
                  current: currentStep,
                  total: STEPS.length
                })}
              </p>
            </div>
            <button
              onClick={handleCloseAttempt}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className="flex flex-col items-center"
                  onClick={() => handleStepClick(step.id)}
                  style={{ cursor: step.id <= highestStepReached ? 'pointer' : 'default' }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white scale-110'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : step.id <= highestStepReached
                        ? 'bg-blue-200 text-blue-700 hover:bg-blue-300'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                    title={
                      step.id <= highestStepReached
                        ? t('operators.registerModal.stepTooltip', { name: step.name })
                        : step.name
                    }
                  >
                    {currentStep > step.id
                      ? <i className="fas fa-check" />
                      : <i className={`fas ${step.icon} text-sm`} />
                    }
                  </div>
                  <span className={`text-xs mt-2 hidden md:block ${
                    step.id <= highestStepReached ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-all ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <form
          autoComplete="off"
          className="p-6 overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 280px)' }}
          onSubmit={(e) => e.preventDefault()}
        >
          {currentStep === 1 && <PersonalDataStep data={formData} errors={errors} onChange={updateFormData} />}
          {currentStep === 2 && <ContactInfoStep  data={formData} errors={errors} onChange={updateFormData} />}
          {currentStep === 3 && <OperatorDataStep data={formData} errors={errors} onChange={updateFormData} />}
          {currentStep === 4 && <DocumentsStep    files={files}   errors={errors} onChange={updateFiles} />}
          {currentStep === 5 && (
            <ChildrenStep
              sons={formData.sons || []}
              onChange={(sons) => updateFormData({ sons, n_children: sons.length })}
            />
          )}
        </form>

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
            <i className="fas fa-arrow-left mr-2" />
            {t('operators.registerModal.footer.previous')}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleCloseAttempt}
              className="px-6 py-2 rounded-lg font-medium bg-gray-300 text-gray-700 hover:bg-gray-400 transition-all"
            >
              {t('operators.registerModal.footer.cancel')}
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                {t('operators.registerModal.footer.next')}
                <i className="fas fa-arrow-right ml-2" />
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
                    <i className="fas fa-spinner fa-spin mr-2" />
                    {t('operators.registerModal.footer.saving')}
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2" />
                    {t('operators.registerModal.footer.register')}
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