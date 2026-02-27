/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import {
  Building2, IdCard, MapPin, Mail, Star, CreditCard,
  Crown, CheckCircle, Clock, XCircle, HelpCircle, DollarSign,
  CalendarDays, PlayCircle, StopCircle, CalendarPlus,
  Pencil, X, Save, Loader2, Camera, ZoomIn, Download,
  AlertTriangle, AlertCircle, Info,
} from 'lucide-react';
import { CompanyModel } from '../domain/CompanyModel';
import { getMyCompany, updateCompany, UpdateCompanyData } from '../repository/CompanyRepository';
import { validateCompanyPayload, checkCompanyLicense } from '../../service/RegisterService';

// ─── Brand palette ──────────────────────────────────────────────────────────────
const BRAND = {
  primary:   '#0B2863',
  secondary: '#F09F52',
};

interface FormData {
  license_number: string;
  name: string;
  address: string;
  zip_code: string;
  logo_upload: string | null;
}

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// ─── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (src.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = src;
        a.download = 'company_logo.png';
        a.click();
      } else {
        const res = await fetch(src);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'company_logo.png';
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
        className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ backgroundColor: BRAND.primary }}
        >
          <span className="text-white font-semibold text-sm">{t('company.logo.alt')}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? t('company.logo.downloading') : t('company.logo.download')}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Image */}
        <div className="bg-gray-100 flex items-center justify-center p-6 max-h-[70vh] overflow-auto">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[60vh] object-contain rounded shadow"
          />
        </div>
      </div>
    </div>
  );
};

// ─── Shared field error ────────────────────────────────────────────────────────
const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
      <AlertCircle className="w-3.5 h-3.5" />
      {msg}
    </p>
  ) : null;

// ─── Read-only field display ───────────────────────────────────────────────────
const ReadField: React.FC<{ value: string }> = ({ value }) => (
  <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

// ─── Editable text field ───────────────────────────────────────────────────────
const EditField: React.FC<{
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (v: string) => void;
}> = ({ value, placeholder, error, onChange }) => (
  <>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none transition-colors ${
        error
          ? 'border-red-500 focus:border-red-500 bg-red-50'
          : 'border-gray-300 focus:border-[#0B2863]'
      }`}
    />
    <FieldError msg={error} />
  </>
);

// ─── Stat card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  bg: string;
}> = ({ icon, label, value, bg }) => (
  <div className={`flex items-center gap-3 p-4 ${bg} rounded-xl`}>
    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="font-semibold text-gray-900 text-sm">{value}</p>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const MyCompanyPage: React.FC = () => {
  const { t } = useTranslation();

  const [company, setCompany] = useState<CompanyModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    license_number: '',
    name: '',
    address: '',
    zip_code: '',
    logo_upload: null,
  });

  useEffect(() => { loadCompany(); }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const result = await getMyCompany();
      if (!result.success) {
        enqueueSnackbar(result.errorMessage || t('company.snackbar.loadError'), { variant: 'error' });
        return;
      }
      if (result.data) {
        setCompany(result.data);
        setFormData({
          license_number: result.data.license_number || '',
          name: result.data.name || '',
          address: result.data.address || '',
          zip_code: result.data.zip_code || '',
          logo_upload: null,
        });
        setLogoPreview(result.data.logo_url || null);
        setRemoveLogo(false);
      }
    } catch (error: any) {
      console.error('Error loading company:', error);
      enqueueSnackbar(error.message || t('company.snackbar.loadError'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      enqueueSnackbar(t('company.logo.errorFormat'), { variant: 'error' });
      setFieldErrors(prev => ({ ...prev, logo: t('company.logo.fieldErrorFormat') }));
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      enqueueSnackbar(t('company.logo.errorSize'), { variant: 'error' });
      setFieldErrors(prev => ({ ...prev, logo: t('company.logo.fieldErrorSize') }));
      return;
    }
    setFieldErrors(prev => ({ ...prev, logo: '' }));
    setRemoveLogo(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setFormData(prev => ({ ...prev, logo_upload: b64 }));
      setLogoPreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_upload: '' }));
    setLogoPreview(null);
    setRemoveLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!company) return;
    setFieldErrors({});

    if (!formData.name.trim()) {
      enqueueSnackbar(t('company.snackbar.nameRequired'), { variant: 'warning' });
      setFieldErrors(prev => ({ ...prev, name: t('company.validation.nameRequired') }));
      return;
    }
    if (!formData.license_number.trim()) {
      enqueueSnackbar(t('company.snackbar.licenseRequired'), { variant: 'warning' });
      setFieldErrors(prev => ({ ...prev, license_number: t('company.validation.licenseRequired') }));
      return;
    }

    try {
      const licenseChanged = company.license_number !== formData.license_number.trim();
      const nameChanged    = company.name           !== formData.name.trim();
      const addressChanged = company.address        !== formData.address.trim();
      const zipChanged     = company.zip_code       !== formData.zip_code.trim();
      const logoChanged    = formData.logo_upload !== null || removeLogo;
      const textChanged    = licenseChanged || nameChanged || addressChanged || zipChanged;

      if (!textChanged && !logoChanged) {
        enqueueSnackbar(t('company.snackbar.noChanges'), { variant: 'info' });
        setEditMode(false);
        return;
      }

      if (textChanged) {
        setValidating(true);
        if (licenseChanged) {
          const licenseCheck = await checkCompanyLicense(formData.license_number.trim());
          if (licenseCheck.exists) {
            enqueueSnackbar(
              t('company.snackbar.licenseExists', {
                license: formData.license_number,
                company: licenseCheck.company_name,
              }),
              { variant: 'error' }
            );
            setFieldErrors(prev => ({
              ...prev,
              license_number: t('company.validation.licenseExists', { company: licenseCheck.company_name }),
            }));
            setValidating(false);
            return;
          }
        }

        const validationResult = await validateCompanyPayload({
          license_number: formData.license_number.trim(),
          name: formData.name.trim(),
          address: formData.address.trim(),
          zip_code: formData.zip_code.trim(),
        });

        if (!validationResult.valid) {
          const errors: Record<string, string> = {};
          if (validationResult.errors?.company) {
            Object.entries(validationResult.errors.company).forEach(([field, messages]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              errors[field] = msgs.join(', ');
              enqueueSnackbar(`${field}: ${msgs[0]}`, { variant: 'warning' });
            });
          }
          if (validationResult.errorMessage) enqueueSnackbar(validationResult.errorMessage, { variant: 'error' });
          setFieldErrors(errors);
          setValidating(false);
          return;
        }
        setValidating(false);
      }

      setSaving(true);
      const updateData: UpdateCompanyData = {};
      if (licenseChanged) updateData.license_number = formData.license_number.trim();
      if (nameChanged)    updateData.name            = formData.name.trim();
      if (addressChanged) updateData.address         = formData.address.trim();
      if (zipChanged)     updateData.zip_code        = formData.zip_code.trim();
      if (formData.logo_upload)  updateData.logo_upload = formData.logo_upload;
      else if (removeLogo)       updateData.logo_upload = '';

      const result = await updateCompany(company.id, updateData);
      if (!result.success) {
        enqueueSnackbar(result.errorMessage || t('company.snackbar.updateError'), { variant: 'error' });
        return;
      }
      if (result.data) {
        setCompany({ ...result.data, subscription_details: company.subscription_details });
        setFormData({
          license_number: result.data.license_number || '',
          name: result.data.name || '',
          address: result.data.address || '',
          zip_code: result.data.zip_code || '',
          logo_upload: null,
        });
        setLogoPreview(result.data.logo_url || null);
        setRemoveLogo(false);
      }
      setEditMode(false);
      enqueueSnackbar(t('company.snackbar.updateSuccess'), { variant: 'success' });
    } catch (error: any) {
      console.error('Error updating company:', error);
      enqueueSnackbar(error.message || t('company.snackbar.updateError'), { variant: 'error' });
    } finally {
      setSaving(false);
      setValidating(false);
    }
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        license_number: company.license_number || '',
        name: company.name || '',
        address: company.address || '',
        zip_code: company.zip_code || '',
        logo_upload: null,
      });
      setLogoPreview(company.logo_url || null);
      setRemoveLogo(false);
      setFieldErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setEditMode(false);
    enqueueSnackbar(t('company.snackbar.cancelInfo'), { variant: 'info' });
  };

  // ── Subscription status helpers ──
  const subStatusIcon = (status: string) => {
    if (status === 'ACTIVE')  return <CheckCircle  className="w-5 h-5 text-green-600" />;
    if (status === 'TRIAL')   return <Clock        className="w-5 h-5 text-yellow-600" />;
    if (status === 'EXPIRED') return <XCircle      className="w-5 h-5 text-red-600" />;
    return                           <HelpCircle   className="w-5 h-5 text-gray-500" />;
  };
  const subStatusColor = (status: string) => {
    if (status === 'ACTIVE')  return 'text-green-600';
    if (status === 'TRIAL')   return 'text-yellow-600';
    if (status === 'EXPIRED') return 'text-red-600';
    return 'text-gray-900';
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: BRAND.primary }} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('company.notFound.title')}</h3>
          <p className="text-gray-600">{t('company.notFound.message')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ── Header Card ── */}
          <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-2xl p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Left: logo + title */}
              <div className="flex items-center gap-5">
                {/* Logo */}
                <div className="relative flex-shrink-0">
                  {logoPreview ? (
                    <div className="group relative cursor-pointer" onClick={() => !editMode && setLightboxOpen(true)}>
                      <img
                        src={logoPreview}
                        alt={t('company.logo.alt')}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg transition-transform group-hover:scale-105"
                      />
                      {!editMode && (
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: BRAND.primary }}
                    >
                      <Building2 className="w-9 h-9 text-white" />
                    </div>
                  )}

                  {/* Edit controls */}
                  {editMode && (
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md transition-colors hover:opacity-90"
                        style={{ backgroundColor: BRAND.primary }}
                        title={t('company.logo.upload')}
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      {(logoPreview || company.logo_url) && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 shadow-md transition-colors"
                          title={t('company.logo.remove')}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: BRAND.primary }}>
                    {t('company.title')}
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">{t('company.subtitle')}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('company.createdAt', { date: fmtDate(company.created_at) })}
                  </p>
                  {fieldErrors.logo && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.logo}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: action buttons */}
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <Pencil className="w-4 h-4" />
                  {t('company.buttons.edit')}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={saving || validating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    {t('company.buttons.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || validating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND.primary }}
                  >
                    {validating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{t('company.buttons.validating')}</>
                    ) : saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{t('company.buttons.saving')}</>
                    ) : (
                      <><Save className="w-4 h-4" />{t('company.buttons.save')}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Info Card ── */}
          <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5" style={{ color: BRAND.secondary }} />
              {t('company.sections.info')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {t('company.fields.name')}
                </label>
                {editMode ? (
                  <EditField
                    value={formData.name}
                    placeholder={t('company.fields.namePlaceholder')}
                    error={fieldErrors.name}
                    onChange={(v) => {
                      handleInputChange('name', v);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                  />
                ) : (
                  <ReadField value={company.name || t('company.na')} />
                )}
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <IdCard className="w-4 h-4 text-gray-400" />
                  {t('company.fields.license')}
                </label>
                {editMode ? (
                  <EditField
                    value={formData.license_number}
                    placeholder={t('company.fields.licensePlaceholder')}
                    error={fieldErrors.license_number}
                    onChange={(v) => {
                      handleInputChange('license_number', v);
                      if (fieldErrors.license_number) setFieldErrors(prev => ({ ...prev, license_number: '' }));
                    }}
                  />
                ) : (
                  <ReadField value={company.license_number || t('company.na')} />
                )}
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {t('company.fields.address')}
                </label>
                {editMode ? (
                  <EditField
                    value={formData.address}
                    placeholder={t('company.fields.addressPlaceholder')}
                    error={fieldErrors.address}
                    onChange={(v) => {
                      handleInputChange('address', v);
                      if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: '' }));
                    }}
                  />
                ) : (
                  <ReadField value={company.address || t('company.na')} />
                )}
              </div>

              {/* ZIP Code */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {t('company.fields.zipCode')}
                </label>
                {editMode ? (
                  <EditField
                    value={formData.zip_code}
                    placeholder={t('company.fields.zipCodePlaceholder')}
                    error={fieldErrors.zip_code}
                    onChange={(v) => {
                      handleInputChange('zip_code', v);
                      if (fieldErrors.zip_code) setFieldErrors(prev => ({ ...prev, zip_code: '' }));
                    }}
                  />
                ) : (
                  <ReadField value={company.zip_code || t('company.na')} />
                )}
              </div>

              {/* Subscription Plan (read-only) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-gray-400" />
                  {t('company.fields.subscriptionPlan')}
                </label>
                <ReadField
                  value={company.subscription_details?.plan?.name || t('company.subscription.noSubscription')}
                />
              </div>
            </div>

            {/* ── Subscription Details ── */}
            {company.subscription_details && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" style={{ color: BRAND.secondary }} />
                  {t('company.sections.subscription')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    bg="bg-blue-50"
                    icon={<Crown className="w-5 h-5" style={{ color: BRAND.primary }} />}
                    label={t('company.subscription.plan')}
                    value={company.subscription_details.plan?.name || t('company.na')}
                  />
                  <StatCard
                    bg="bg-gray-50"
                    icon={subStatusIcon(company.subscription_details.status || '')}
                    label={t('company.subscription.status')}
                    value={
                      <span className={subStatusColor(company.subscription_details.status || '')}>
                        {company.subscription_details.status || t('company.na')}
                      </span>
                    }
                  />
                  <StatCard
                    bg="bg-green-50"
                    icon={<DollarSign className="w-5 h-5 text-green-600" />}
                    label={t('company.subscription.price')}
                    value={t('company.subscription.priceValue', {
                      amount: company.subscription_details.plan?.price || '0.00',
                    })}
                  />
                  <StatCard
                    bg="bg-orange-50"
                    icon={<CalendarDays className="w-5 h-5" style={{ color: BRAND.secondary }} />}
                    label={t('company.subscription.duration')}
                    value={t('company.subscription.durationValue', {
                      months: company.subscription_details.plan?.duration_months || 0,
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <StatCard
                    bg="bg-gray-50"
                    icon={<PlayCircle className="w-5 h-5 text-gray-500" />}
                    label={t('company.subscription.startDate')}
                    value={
                      company.subscription_details.start_date
                        ? fmtDate(company.subscription_details.start_date)
                        : t('company.na')
                    }
                  />
                  <StatCard
                    bg="bg-gray-50"
                    icon={<StopCircle className="w-5 h-5 text-gray-500" />}
                    label={t('company.subscription.endDate')}
                    value={
                      company.subscription_details.end_date
                        ? fmtDate(company.subscription_details.end_date)
                        : t('company.na')
                    }
                  />
                </div>
              </div>
            )}

            {/* ── Additional Details ── */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: BRAND.secondary }} />
                {t('company.sections.additional')}
              </h3>
              <StatCard
                bg="bg-green-50"
                icon={<CalendarPlus className="w-5 h-5 text-green-600" />}
                label={t('company.additional.createdAt')}
                value={fmtDate(company.created_at)}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Logo Lightbox ── */}
      {lightboxOpen && logoPreview && (
        <Lightbox
          src={logoPreview}
          alt={t('company.logo.alt')}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default MyCompanyPage;