/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { CompanyModel } from '../domain/CompanyModel';
import { getMyCompany, updateCompany, UpdateCompanyData } from '../repository/CompanyRepository';
import { validateCompanyPayload, checkCompanyLicense } from '../../service/RegisterService';

interface FormData {
  license_number: string;
  name: string;
  address: string;
  zip_code: string;
  logo_upload: string | null; // Base64 encoded image
}

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const MyCompanyPage: React.FC = () => {
  const [company, setCompany] = useState<CompanyModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    license_number: '',
    name: '',
    address: '',
    zip_code: '',
    logo_upload: null,
  });
  const [validating, setValidating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const result = await getMyCompany();
      
      if (!result.success) {
        enqueueSnackbar(result.errorMessage || 'Error loading company data', { variant: 'error' });
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
      enqueueSnackbar(error.message || 'Error loading company data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      enqueueSnackbar('Invalid image format. Allowed: JPEG, PNG, GIF, WebP', { variant: 'error' });
      setFieldErrors(prev => ({ ...prev, logo: 'Invalid image format' }));
      return;
    }

    // Validar tamaño
    if (file.size > MAX_LOGO_SIZE) {
      enqueueSnackbar('Logo image must be less than 5MB', { variant: 'error' });
      setFieldErrors(prev => ({ ...prev, logo: 'Image size must be less than 5MB' }));
      return;
    }

    // Limpiar error previo
    setFieldErrors(prev => ({ ...prev, logo: '' }));
    setRemoveLogo(false);

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, logo_upload: base64String }));
      setLogoPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_upload: '' }));
    setLogoPreview(null);
    setRemoveLogo(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!company) return;

    // Limpiar errores previos
    setFieldErrors({});

    // Validaciones básicas
    if (!formData.name.trim()) {
      enqueueSnackbar('Company name is required', { variant: 'warning' });
      setFieldErrors(prev => ({ ...prev, name: 'Company name is required' }));
      return;
    }

    if (!formData.license_number.trim()) {
      enqueueSnackbar('License number is required', { variant: 'warning' });
      setFieldErrors(prev => ({ ...prev, license_number: 'License number is required' }));
      return;
    }

    try {
      // Detectar qué campos cambiaron
      const licenseChanged = company.license_number !== formData.license_number.trim();
      const nameChanged = company.name !== formData.name.trim();
      const addressChanged = company.address !== formData.address.trim();
      const zipChanged = company.zip_code !== formData.zip_code.trim();
      const logoChanged = formData.logo_upload !== null || removeLogo;

      const textFieldsChanged = licenseChanged || nameChanged || addressChanged || zipChanged;

      // Si no hay cambios, salir
      if (!textFieldsChanged && !logoChanged) {
        enqueueSnackbar('No changes detected', { variant: 'info' });
        setEditMode(false);
        return;
      }

      // Solo validar si cambiaron campos de texto
      if (textFieldsChanged) {
        setValidating(true);

        // Solo verificar license si cambió
        if (licenseChanged) {
          const licenseCheck = await checkCompanyLicense(formData.license_number.trim());
          
          if (licenseCheck.exists) {
            enqueueSnackbar(`License number "${formData.license_number}" is already registered to another company: ${licenseCheck.company_name}`, { variant: 'error' });
            setFieldErrors(prev => ({ ...prev, license_number: `Already registered to: ${licenseCheck.company_name}` }));
            setValidating(false);
            return;
          }
        }

        // Validar el payload con los valores actuales del formulario
        const companyPayload = {
          license_number: formData.license_number.trim(),
          name: formData.name.trim(),
          address: formData.address.trim(),
          zip_code: formData.zip_code.trim(),
        };

        const validationResult = await validateCompanyPayload(companyPayload);

        if (!validationResult.valid) {
          const errors: Record<string, string> = {};
          
          if (validationResult.errors?.company) {
            Object.entries(validationResult.errors.company).forEach(([field, messages]) => {
              const errorMessages = Array.isArray(messages) ? messages : [messages];
              errors[field] = errorMessages.join(', ');
              enqueueSnackbar(`${field}: ${errorMessages[0]}`, { variant: 'warning' });
            });
          }

          if (validationResult.errorMessage) {
            enqueueSnackbar(validationResult.errorMessage, { variant: 'error' });
          }

          setFieldErrors(errors);
          setValidating(false);
          return;
        }

        setValidating(false);
      }

      setSaving(true);

      // Construir updateData solo con los campos que cambiaron
      const updateData: UpdateCompanyData = {};
      
      if (licenseChanged) {
        updateData.license_number = formData.license_number.trim();
      }
      if (nameChanged) {
        updateData.name = formData.name.trim();
      }
      if (addressChanged) {
        updateData.address = formData.address.trim();
      }
      if (zipChanged) {
        updateData.zip_code = formData.zip_code.trim();
      }
      if (formData.logo_upload) {
        updateData.logo_upload = formData.logo_upload;
      } else if (removeLogo) {
        updateData.logo_upload = '';
      }

      const result = await updateCompany(company.id, updateData);

      if (!result.success) {
        enqueueSnackbar(result.errorMessage || 'Error updating company', { variant: 'error' });
        return;
      }

      if (result.data) {
        // Preservar subscription_details ya que el PATCH no los devuelve
        setCompany({
          ...result.data,
          subscription_details: company.subscription_details
        });
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
      enqueueSnackbar('Company updated successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Error updating company:', error);
      enqueueSnackbar(error.message || 'Error updating company', { variant: 'error' });
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setEditMode(false);
    enqueueSnackbar('Changes cancelled', { variant: 'info' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Not Found</h3>
          <p className="text-gray-600">Unable to load company information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                {/* Company Logo */}
                <div className="relative">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Company Logo" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <i className="fas fa-building text-white text-2xl"></i>
                    </div>
                  )}
                  {editMode && (
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-md"
                        title="Upload logo"
                      >
                        <i className="fas fa-camera text-xs"></i>
                      </button>
                      {(logoPreview || company.logo_url) && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors shadow-md"
                          title="Remove logo"
                        >
                          <i className="fas fa-times text-xs"></i>
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
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Company
                  </h1>
                  <p className="text-gray-600">Manage your company information</p>
                </div>
              </div>
              {fieldErrors.logo && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {fieldErrors.logo}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Created: {new Date(company.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <i className="fas fa-edit"></i>
                Edit Company
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving || validating}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || validating}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Validating...
                    </>
                  ) : saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Company Information Card */}
        <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <i className="fas fa-info-circle text-blue-600"></i>
            Company Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <i className="fas fa-building mr-2 text-gray-400"></i>
                Company Name
              </label>
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      handleInputChange('name', e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Enter company name"
                    className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none transition-colors ${
                      fieldErrors.name 
                        ? 'border-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {fieldErrors.name}
                    </p>
                  )}
                </>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <span className="font-medium text-gray-900">{company.name || 'N/A'}</span>
                </div>
              )}
            </div>

            {/* License Number */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <i className="fas fa-id-card mr-2 text-gray-400"></i>
                License Number (MC Number)
              </label>
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => {
                      handleInputChange('license_number', e.target.value);
                      if (fieldErrors.license_number) setFieldErrors(prev => ({ ...prev, license_number: '' }));
                    }}
                    placeholder="e.g., MC-123456"
                    className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none transition-colors ${
                      fieldErrors.license_number 
                        ? 'border-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.license_number && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {fieldErrors.license_number}
                    </p>
                  )}
                </>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <span className="font-medium text-gray-900">{company.license_number || 'N/A'}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                <i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>
                Address
              </label>
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => {
                      handleInputChange('address', e.target.value);
                      if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: '' }));
                    }}
                    placeholder="Enter company address"
                    className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none transition-colors ${
                      fieldErrors.address 
                        ? 'border-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.address && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {fieldErrors.address}
                    </p>
                  )}
                </>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <span className="font-medium text-gray-900">{company.address || 'N/A'}</span>
                </div>
              )}
            </div>

            {/* ZIP Code */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <i className="fas fa-mail-bulk mr-2 text-gray-400"></i>
                ZIP Code
              </label>
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => {
                      handleInputChange('zip_code', e.target.value);
                      if (fieldErrors.zip_code) setFieldErrors(prev => ({ ...prev, zip_code: '' }));
                    }}
                    placeholder="Enter ZIP code"
                    className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none transition-colors ${
                      fieldErrors.zip_code 
                        ? 'border-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.zip_code && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {fieldErrors.zip_code}
                    </p>
                  )}
                </>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <span className="font-medium text-gray-900">{company.zip_code || 'N/A'}</span>
                </div>
              )}
            </div>

            {/* Subscription (Read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <i className="fas fa-star mr-2 text-gray-400"></i>
                Subscription Plan
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                <span className="font-medium text-gray-900">
                  {company.subscription_details?.plan?.name || 'No subscription'}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Details Section */}
          {company.subscription_details && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-credit-card text-purple-600"></i>
                Subscription Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Plan Name */}
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-crown text-purple-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-semibold text-gray-900">{company.subscription_details.plan?.name || 'N/A'}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    company.subscription_details.status === 'ACTIVE' ? 'bg-green-100' :
                    company.subscription_details.status === 'TRIAL' ? 'bg-yellow-100' :
                    company.subscription_details.status === 'EXPIRED' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <i className={`fas ${
                      company.subscription_details.status === 'ACTIVE' ? 'fa-check-circle text-green-600' :
                      company.subscription_details.status === 'TRIAL' ? 'fa-hourglass-half text-yellow-600' :
                      company.subscription_details.status === 'EXPIRED' ? 'fa-times-circle text-red-600' : 'fa-question-circle text-gray-600'
                    }`}></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-semibold ${
                      company.subscription_details.status === 'ACTIVE' ? 'text-green-600' :
                      company.subscription_details.status === 'TRIAL' ? 'text-yellow-600' :
                      company.subscription_details.status === 'EXPIRED' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {company.subscription_details.status || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-green-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-semibold text-gray-900">
                      ${company.subscription_details.plan?.price || '0.00'}/mo
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-orange-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {company.subscription_details.plan?.duration_months || 0} month(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-play-circle text-gray-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">
                      {company.subscription_details.start_date 
                        ? new Date(company.subscription_details.start_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-stop-circle text-gray-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-900">
                      {company.subscription_details.end_date 
                        ? new Date(company.subscription_details.end_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-clock text-blue-600"></i>
              Additional Details
            </h3>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-calendar-plus text-green-600"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(company.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCompanyPage;
