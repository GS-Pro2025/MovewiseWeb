/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, ZoomIn } from 'lucide-react';
import { Operator } from '../../domain/OperatorsModels';

interface EditOperatorModalProps {
  operator: Operator;
  isOpen: boolean;
  onClose: () => void;
  onSave: (operatorData: FormData) => Promise<void>;
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────

const Lightbox: React.FC<{ src: string; alt: string; label: string; onClose: () => void }> = ({
  src, alt, label, onClose
}) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (src.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = src;
        a.download = `${label.replace(/\s+/g, '_')}.png`;
        a.click();
      } else {
        const res = await fetch(src);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${label.replace(/\s+/g, '_')}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      window.open(src, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 bg-[#0B2863]">
          <span className="text-white font-semibold text-sm">{label}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading
                ? t('operators.detailsModal.license.downloading')
                : t('operators.detailsModal.license.download')}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-gray-100 flex items-center justify-center p-4 max-h-[75vh] overflow-auto">
          <img src={src} alt={alt} className="max-w-full max-h-[65vh] object-contain rounded shadow" />
        </div>
      </div>
    </div>
  );
};

// ─── Clickable image thumbnail ─────────────────────────────────────────────────

const ImageThumb: React.FC<{
  src: string;
  alt: string;
  caption: string;
  onView: () => void;
}> = ({ src, alt, caption, onView }) => (
  <div className="mt-2 group relative inline-block cursor-pointer" onClick={onView}>
    <img src={src} alt={alt} className="w-16 h-16 object-cover rounded border border-gray-200 transition-transform group-hover:scale-105" />
    <div className="absolute inset-0 rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <ZoomIn className="w-4 h-4 text-white" />
    </div>
    <p className="text-xs text-gray-500 mt-1">{caption}</p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const EditOperatorModal: React.FC<EditOperatorModalProps> = ({
  operator,
  isOpen,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    code: operator.code || '',
    number_licence: operator.number_licence || '',
    n_children: operator.n_children || 0,
    size_t_shift: operator.size_t_shift || '',
    name_t_shift: operator.name_t_shift || '',
    salary: operator.salary || '',
    hourly_salary: (operator.hourly_salary as number | string) || '',
    salary_type: (operator.salary_type as string) || 'day',
    status: operator.status || 'active',
    person: {
      first_name: operator.first_name || '',
      last_name: operator.last_name || '',
      birth_date: operator.birth_date || '',
      phone: operator.phone || '',
      address: operator.address || '',
      id_number: operator.id_number || '',
      type_id: operator.type_id || '',
      email: operator.email || '',
      status: 'active'
    }
  });

  const [files, setFiles] = useState<{
    photo?: File;
    license_front?: File;
    license_back?: File;
  }>({});

  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<{ message?: string; fieldErrors?: Record<string, string[]> } | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; label: string } | null>(null);

  useEffect(() => {
    if (!operator) return;

    const normalizeTypeId = (raw?: any) => {
      if (!raw && raw !== 0) return '';
      const v = String(raw).toLowerCase().trim();
      const map: Record<string, string> = {
        'green card': 'green_card', 'green_card': 'green_card',
        'passport': 'passport',
        "driver's license": 'drivers_license', 'drivers license': 'drivers_license', 'drivers_license': 'drivers_license',
        'state id': 'state_id', 'state_id': 'state_id',
        'national id': 'national_id', 'national_id': 'national_id',
        'id_number': 'national_id', 'id number': 'national_id'
      };
      return map[v] ?? v.replace(/\s+/g, '_');
    };

    const rawType =
      (operator as any).type_id ??
      (operator as any).id_type ??
      (operator as any).type ??
      (operator as any).person?.type_id ?? '';

    console.debug('EditOperatorModal: rawType for operator', operator.id_operator, rawType);

    setFormData({
      code: operator.code || '',
      number_licence: operator.number_licence || '',
      n_children: operator.n_children || 0,
      size_t_shift: operator.size_t_shift || '',
      name_t_shift: operator.name_t_shift || '',
      salary: operator.salary || '',
      hourly_salary: (operator.hourly_salary as number | string) || '',
      salary_type: (operator.salary_type as string) || 'day',
      status: operator.status || 'active',
      person: {
        first_name: operator.first_name || '',
        last_name: operator.last_name || '',
        birth_date: operator.birth_date || '',
        phone: operator.phone || '',
        address: operator.address || '',
        id_number: operator.id_number || '',
        type_id: normalizeTypeId(rawType),
        email: operator.email || '',
        status: 'active'
      }
    });
    setApiErrors(null);
  }, [operator]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('person.')) {
      const personField = field.replace('person.', '');
      setFormData(prev => ({ ...prev, person: { ...prev.person, [personField]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiErrors(null);

    try {
      const submitFormData = new FormData();
      submitFormData.append('code', formData.code);
      submitFormData.append('number_licence', formData.number_licence);
      submitFormData.append('n_children', formData.n_children.toString());
      submitFormData.append('size_t_shift', formData.size_t_shift);
      submitFormData.append('name_t_shift', formData.name_t_shift);
      submitFormData.append('salary_type', formData.salary_type);
      if (formData.salary_type === 'day') {
        submitFormData.append('salary', String(formData.salary));
      } else {
        submitFormData.append('hourly_salary', String(formData.hourly_salary));
      }
      submitFormData.append('status', formData.status);
      submitFormData.append('first_name', formData.person.first_name);
      submitFormData.append('last_name', formData.person.last_name);
      submitFormData.append('birth_date', formData.person.birth_date);
      submitFormData.append('phone', formData.person.phone);
      submitFormData.append('address', formData.person.address);
      submitFormData.append('id_number', formData.person.id_number);
      submitFormData.append('type_id', formData.person.type_id);
      submitFormData.append('email', formData.person.email);
      if (formData.person.status) submitFormData.append('status', formData.person.status);
      if (files.photo)         submitFormData.append('photo', files.photo);
      if (files.license_front) submitFormData.append('license_front', files.license_front);
      if (files.license_back)  submitFormData.append('license_back', files.license_back);

      await onSave(submitFormData);
    } catch (error: any) {
      const apiError = error?.response?.data || error?.data || error;
      console.error('Error saving operator:', error);
      console.debug('Parsed API error:', apiError);

      if (apiError && (apiError.errors || apiError.message)) {
        setApiErrors({
          message: typeof apiError.message === 'string' ? apiError.message : undefined,
          fieldErrors: typeof apiError.errors === 'object' ? apiError.errors : undefined
        });
      } else if (error?.response?.status) {
        setApiErrors({ message: `Error ${error.response.status}: ${error.response.statusText || 'Request failed'}` });
      } else if (error instanceof Error) {
        setApiErrors({ message: error.message });
      } else if (typeof error === 'string') {
        setApiErrors({ message: error });
      } else {
        setApiErrors({ message: t('operators.editModal.errors.unknown') });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ── Shared input class ──
  const inputCls = (ring: string) =>
    `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${ring} disabled:opacity-60`;

  const fullName = `${operator.first_name} ${operator.last_name}`;

  return (
    <>
      <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">
              {t('operators.editModal.title', { name: fullName })}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
              disabled={loading}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {/* ── API Errors ── */}
          {apiErrors && (
            <div className="p-4 space-y-2">
              {apiErrors.message && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                  <strong>{apiErrors.message}</strong>
                </div>
              )}
              {apiErrors.fieldErrors && Object.entries(apiErrors.fieldErrors).map(([field, msgs]) => (
                <div key={field} className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded">
                  <div className="font-medium text-sm">{field}</div>
                  <div className="text-sm mt-1">{msgs.map((m, i) => <div key={i}>• {m}</div>)}</div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* ── Personal Information ── */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-user text-blue-500 mr-2" />
                {t('operators.editModal.sections.personal')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.firstName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.person.first_name}
                    onChange={(e) => handleInputChange('person.first_name', e.target.value)}
                    className={inputCls('focus:ring-blue-500')}
                    required disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.lastName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.person.last_name}
                    onChange={(e) => handleInputChange('person.last_name', e.target.value)}
                    className={inputCls('focus:ring-blue-500')}
                    required disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.birthDate')} *
                  </label>
                  <input
                    type="date"
                    value={formData.person.birth_date}
                    onChange={(e) => handleInputChange('person.birth_date', e.target.value)}
                    className={inputCls('focus:ring-blue-500')}
                    required disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.idType')} *
                  </label>
                  <select
                    value={formData.person.type_id}
                    onChange={(e) => handleInputChange('person.type_id', e.target.value)}
                    className={inputCls('focus:ring-blue-500')}
                    required disabled={loading}
                  >
                    <option value="">{t('operators.editModal.fields.idTypePlaceholder')}</option>
                    <option value="green_card">{t('operators.editModal.idTypes.greenCard')}</option>
                    <option value="passport">{t('operators.editModal.idTypes.passport')}</option>
                    <option value="drivers_license">{t('operators.editModal.idTypes.driversLicense')}</option>
                    <option value="state_id">{t('operators.editModal.idTypes.stateId')}</option>
                    <option value="national_id">{t('operators.editModal.idTypes.nationalId')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.idNumber')} *
                  </label>
                  <input
                    type="text"
                    value={formData.person.id_number}
                    onChange={(e) => handleInputChange('person.id_number', e.target.value)}
                    className={inputCls('focus:ring-blue-500')}
                    required disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* ── Contact Information ── */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-address-book text-green-500 mr-2" />
                {t('operators.editModal.sections.contact')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.email')} *
                  </label>
                  <input
                    type="email"
                    value={formData.person.email}
                    onChange={(e) => handleInputChange('person.email', e.target.value)}
                    className={inputCls('focus:ring-green-500')}
                    required disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.phone')} *
                  </label>
                  <input
                    type="tel"
                    value={formData.person.phone}
                    onChange={(e) => handleInputChange('person.phone', e.target.value)}
                    className={inputCls('focus:ring-green-500')}
                    required disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.address')} *
                  </label>
                  <textarea
                    value={formData.person.address}
                    onChange={(e) => handleInputChange('person.address', e.target.value)}
                    className={inputCls('focus:ring-green-500')}
                    rows={3}
                    required disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* ── Work Information ── */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-briefcase text-purple-500 mr-2" />
                {t('operators.editModal.sections.work')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.operatorCode')} *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={inputCls('focus:ring-purple-500')}
                    required disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.licenseNumber')} *
                  </label>
                  <input
                    type="text"
                    value={formData.number_licence}
                    onChange={(e) => handleInputChange('number_licence', e.target.value)}
                    className={inputCls('focus:ring-purple-500')}
                    required disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.shiftName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name_t_shift}
                    onChange={(e) => handleInputChange('name_t_shift', e.target.value)}
                    className={inputCls('focus:ring-purple-500')}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.shiftSize')}
                  </label>
                  <select
                    value={formData.size_t_shift}
                    onChange={(e) => handleInputChange('size_t_shift', e.target.value)}
                    className={inputCls('focus:ring-purple-500')}
                    disabled={loading}
                  >
                    <option value="">{t('operators.editModal.fields.shiftSizePlaceholder')}</option>
                    <option value="S">{t('operators.editModal.shiftSizes.s')}</option>
                    <option value="M">{t('operators.editModal.shiftSizes.m')}</option>
                    <option value="L">{t('operators.editModal.shiftSizes.l')}</option>
                    <option value="XL">{t('operators.editModal.shiftSizes.xl')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.salaryType')} *
                  </label>
                  <select
                    value={formData.salary_type}
                    onChange={(e) => handleInputChange('salary_type', e.target.value)}
                    className={inputCls('focus:ring-purple-500')}
                    required disabled={loading}
                  >
                    <option value="day">{t('operators.editModal.salaryTypes.day')}</option>
                    <option value="hour">{t('operators.editModal.salaryTypes.hour')}</option>
                  </select>
                </div>
                {formData.salary_type === 'day' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('operators.editModal.fields.dailySalary')} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      className={inputCls('focus:ring-purple-500')}
                      required disabled={loading}
                    />
                  </div>
                )}
                {formData.salary_type === 'hour' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('operators.editModal.fields.hourlySalary')} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hourly_salary}
                      onChange={(e) => handleInputChange('hourly_salary', e.target.value)}
                      className={inputCls('focus:ring-purple-500')}
                      required disabled={loading}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.status')} *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={inputCls('focus:ring-purple-500')}
                    required disabled={loading}
                  >
                    <option value="active">{t('operators.editModal.statuses.active')}</option>
                    <option value="inactive">{t('operators.editModal.statuses.inactive')}</option>
                    <option value="freelance">{t('operators.editModal.statuses.freelance')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Files ── */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-upload text-orange-500 mr-2" />
                {t('operators.editModal.sections.files')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.profilePhoto')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                    className={inputCls('focus:ring-orange-500')}
                    disabled={loading}
                  />
                  {operator.photo && (
                    <ImageThumb
                      src={operator.photo}
                      alt={t('operators.editModal.fields.profilePhoto')}
                      caption={t('operators.editModal.currentPhoto')}
                      onView={() => setLightbox({
                        src: operator.photo!,
                        alt: t('operators.editModal.fields.profilePhoto'),
                        label: `${fullName} — ${t('operators.editModal.fields.profilePhoto')}`
                      })}
                    />
                  )}
                </div>

                {/* License Front */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.licenseFront')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('license_front', e.target.files?.[0] || null)}
                    className={inputCls('focus:ring-orange-500')}
                    disabled={loading}
                  />
                  {operator.license_front && (
                    <ImageThumb
                      src={operator.license_front}
                      alt={t('operators.editModal.fields.licenseFront')}
                      caption={t('operators.editModal.currentFront')}
                      onView={() => setLightbox({
                        src: operator.license_front!,
                        alt: t('operators.editModal.fields.licenseFront'),
                        label: `${fullName} — ${t('operators.editModal.fields.licenseFront')}`
                      })}
                    />
                  )}
                </div>

                {/* License Back */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('operators.editModal.fields.licenseBack')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('license_back', e.target.files?.[0] || null)}
                    className={inputCls('focus:ring-orange-500')}
                    disabled={loading}
                  />
                  {operator.license_back && (
                    <ImageThumb
                      src={operator.license_back}
                      alt={t('operators.editModal.fields.licenseBack')}
                      caption={t('operators.editModal.currentBack')}
                      onView={() => setLightbox({
                        src: operator.license_back!,
                        alt: t('operators.editModal.fields.licenseBack'),
                        label: `${fullName} — ${t('operators.editModal.fields.licenseBack')}`
                      })}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-60"
                disabled={loading}
              >
                {t('operators.editModal.buttons.cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2" />
                    {t('operators.editModal.buttons.saving')}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2" />
                    {t('operators.editModal.buttons.save')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          label={lightbox.label}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
};

export default EditOperatorModal;