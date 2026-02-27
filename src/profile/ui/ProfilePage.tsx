/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone,
  Edit3, 
  Save, 
  X, 
  Camera, 
  Shield, 
  Building,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  CreditCard,
  Cake,
  ZoomIn,
  Download
} from 'lucide-react';
import { useMediaQuery, useTheme } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next'; // ← asegúrate de tener i18next instalado
import { 
  UserProfile, 
  ProfileFormData, 
  ProfileUseCases 
} from '../domain/ProfileDomain';
import { profileRepository } from '../data/ProfileRepository';

// ─── Reusable Components ───────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 ${className}`}>
    {children}
  </div>
);

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  isMobile?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'outline', 
  size = 'md', 
  children, 
  onClick, 
  disabled, 
  className = '',
  fullWidth = false,
  isMobile = false
}) => {
  const baseClasses = `font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${fullWidth ? 'w-full' : ''}`;
  
  const variantClasses = {
    primary: `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    secondary: `bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    danger: `bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    outline: `border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 focus:ring-blue-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
  };

  const sizeClasses = {
    sm: isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm',
    md: isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm',
    lg: isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, value, onChange, type = 'text', disabled, icon, placeholder, rightIcon, onRightIconClick 
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} ${rightIcon ? 'pr-10' : 'pr-3'} py-3 border-2 border-slate-300 rounded-lg font-medium focus:border-blue-500 focus:outline-none transition-colors ${
          disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
        }`}
      />
      {rightIcon && (
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          onClick={onRightIconClick}
        >
          {rightIcon}
        </button>
      )}
    </div>
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  options: { label: string; value: string }[];
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, disabled, icon, options }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border-2 border-slate-300 rounded-lg font-medium focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white ${
          disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

// ─── Photo Modal ───────────────────────────────────────────────────────────────

interface PhotoModalProps {
  src: string;
  name: string;
  onClose: () => void;
  title: string;
  downloadLabel?: string;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ src, name, onClose, title, downloadLabel = 'Download photo' }) => {
  const handleDownload = async () => {
    try {
      // If it's already a base64/data URL, download directly
      if (src.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = src;
        link.download = `${name.replace(/\s+/g, '_')}_photo.png`;
        link.click();
        return;
      }

      // For remote URLs (e.g. ui-avatars), fetch and convert to blob
      const response = await fetch(src);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${name.replace(/\s+/g, '_')}_photo.png`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-600">{title}</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Full photo — rectangular, no crop */}
        <div className="bg-slate-900 flex items-center justify-center" style={{ minHeight: 320 }}>
          <img
            src={src}
            alt={name}
            className="max-w-full max-h-96 object-contain"
            style={{ display: 'block' }}
          />
        </div>

        {/* Bottom bar: name + download */}
        <div className="flex items-center justify-between px-5 py-4 bg-white">
          <div>
            <p className="text-base font-bold text-slate-800">{name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{title}</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <Download className="h-4 w-4" />
            {downloadLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileUseCases] = useState(() => new ProfileUseCases(profileRepository));
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false); // ← nuevo estado

  const [formData, setFormData] = useState<ProfileFormData>({
    user_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    id_number: '',
    type_id: '',
    photo: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => { loadUserProfile(); }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await profileUseCases.loadProfile();
      setUser(profile);
      setFormData({
        user_name: profile.user_name || '',
        first_name: profile.person.first_name || '',
        last_name: profile.person.last_name || '',
        email: profile.person.email || '',
        phone: profile.person.phone || '',
        address: profile.person.address || '',
        birth_date: profile.person.birth_date || '',
        id_number: profile.person.id_number || '',
        type_id: profile.person.type_id || '',
        photo: profile.photo || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('profile.errors.updateError');
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        const msg = t('profile.photo.sizeError');
        setError(msg);
        enqueueSnackbar(msg, { variant: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (showPasswordChange || formData.new_password || formData.current_password) {
        if (!formData.current_password) {
          const msg = t('profile.errors.currentPasswordRequired');
          setError(msg); enqueueSnackbar(msg, { variant: 'error' }); return;
        }
        if (!formData.new_password) {
          const msg = t('profile.errors.newPasswordRequired');
          setError(msg); enqueueSnackbar(msg, { variant: 'error' }); return;
        }
        if (formData.new_password !== formData.confirm_password) {
          const msg = t('profile.errors.passwordsMismatch');
          setError(msg); enqueueSnackbar(msg, { variant: 'error' }); return;
        }
        if (formData.new_password.length < 6) {
          const msg = t('profile.errors.passwordTooShort');
          setError(msg); enqueueSnackbar(msg, { variant: 'error' }); return;
        }
      }

      const validation = profileUseCases.validateProfileData(formData);
      if (!validation.isValid) {
        const msg = validation.errors.join(', ');
        setError(msg); enqueueSnackbar(msg, { variant: 'error' }); return;
      }

      const updateData = profileUseCases.prepareUpdateData(formData);
      const updatedProfile = await profileUseCases.updateProfile(updateData);
      
      setUser(updatedProfile);
      setEditMode(false);
      setShowPasswordChange(false);
      setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));

      const msg = t('profile.updateSuccess');
      setSuccess(msg);
      enqueueSnackbar(msg, { variant: 'success' });
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      let msg = t('profile.errors.updateError');
      if (err.message?.includes('Current password is incorrect')) msg = t('profile.errors.incorrectPassword');
      else if (err.message?.includes('Current password is required')) msg = t('profile.errors.currentPasswordRequired');
      else if (err.message?.includes('Email already')) msg = t('profile.errors.emailTaken');
      else if (err.message?.includes('ID number already')) msg = t('profile.errors.idTaken');
      else if (err.message) msg = err.message;

      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFormData({
      user_name: user.user_name || '',
      first_name: user.person.first_name || '',
      last_name: user.person.last_name || '',
      email: user.person.email || '',
      phone: user.person.phone || '',
      address: user.person.address || '',
      birth_date: user.person.birth_date || '',
      id_number: user.person.id_number || '',
      type_id: user.person.type_id || '',
      photo: user.photo || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setEditMode(false);
    setShowPasswordChange(false);
    setError(null);
    setSuccess(null);
    enqueueSnackbar(t('profile.changesCancelled'), { variant: 'info' });
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-50 ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (!user) {
    return (
      <div className={`min-h-screen bg-slate-50 ${isMobile ? 'p-4' : 'p-6'}`}>
        <Card className="text-center p-8">
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h3 className="text-2xl font-bold mb-4 text-red-600">{t('profile.errorLoading')}</h3>
          <p className="text-slate-600 mb-6">{t('profile.errorLoadingDesc')}</p>
          <Button variant="primary" onClick={loadUserProfile} isMobile={isMobile}>
            {t('profile.tryAgain')}
          </Button>
        </Card>
      </div>
    );
  }

  const idTypeOptions = [
    { label: t('profile.idTypes.select'),         value: '' },
    { label: t('profile.idTypes.driversLicense'),  value: 'DL' },
    { label: t('profile.idTypes.stateId'),          value: 'SI' },
    { label: t('profile.idTypes.greenCard'),        value: 'GC' },
    { label: t('profile.idTypes.passport'),         value: 'PA' },
  ];

  const currentPhoto = (editMode ? formData.photo : user.photo)?.trim()
    ? (editMode ? formData.photo : user.photo) as string
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.person.first_name} ${user.person.last_name}`)}&background=0458AB&color=fff&size=256`;

  const fullName = editMode
    ? `${formData.first_name} ${formData.last_name}`
    : `${user.person.first_name} ${user.person.last_name}`;

  return (
    <div className={`min-h-screen bg-slate-50 ${isMobile ? 'p-4' : 'p-6'}`}>

      {/* ── Photo Modal ── */}
      {showPhotoModal && (
        <PhotoModal
          src={currentPhoto}
          name={fullName}
          onClose={() => setShowPhotoModal(false)}
          title={t('profile.photo.dialogTitle')}
          downloadLabel={t('profile.photo.downloadLabel')}
        />
      )}

      {/* ── Header ── */}
      <Card className={`${isMobile ? 'p-4' : 'p-8'} mb-6`}>
        <div className={`${isMobile ? 'mb-4' : 'flex items-center justify-between mb-6'}`}>
          <div className={`flex items-center gap-4 ${isMobile ? 'mb-4' : ''}`}>
            <User className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-blue-600`} />
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800`}>
                {t('profile.title')}
              </h1>
              <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-slate-600 mt-2`}>
                {t('profile.subtitle')}
              </p>
            </div>
          </div>

          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-4'}`}>
            {!editMode ? (
              <Button variant="primary" onClick={() => setEditMode(true)} fullWidth={isMobile} isMobile={isMobile}>
                <Edit3 className="h-4 w-4" />
                {t('profile.editButton')}
              </Button>
            ) : (
              <div className={`flex ${isMobile ? 'flex-col' : ''} gap-2`}>
                <Button variant="outline" onClick={handleCancel} fullWidth={isMobile} isMobile={isMobile}>
                  <X className="h-4 w-4" />
                  {t('profile.cancelButton')}
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving} fullWidth={isMobile} isMobile={isMobile}>
                  <Save className="h-4 w-4" />
                  {saving ? t('profile.saving') : t('profile.saveButton')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}
      </Card>

      {/* ── Body ── */}
      <div className={`grid grid-cols-1 ${!isMobile ? 'lg:grid-cols-3' : ''} gap-6`}>

        {/* ── Sidebar: Photo & Basic Info ── */}
        <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="text-center">
            {/* Profile Photo with zoom button */}
            <div className="relative inline-block mb-4">
              <div
                className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto`}
              >
                <img
                  src={currentPhoto}
                  alt={t('profile.photo.altText')}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Camera button (edit mode) */}
              {editMode && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                  title={t('profile.photo.viewLabel')}
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}

              {/* Zoom / view button (always visible) */}
              <button
                onClick={() => setShowPhotoModal(true)}
                className={`absolute ${editMode ? 'bottom-0 left-0' : 'bottom-0 right-0'} w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center hover:bg-slate-900 transition-colors shadow-lg`}
                title={t('profile.photo.viewLabel')}
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800 mb-2`}>
              {fullName}
            </h2>
            <p className="text-blue-600 mb-2 font-medium">
              @{editMode ? formData.user_name : user.user_name}
            </p>
            <p className="text-slate-600 mb-4">
              {editMode ? formData.email : user.person.email}
            </p>
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                user.is_superUser ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Shield className="h-4 w-4" />
                {user.is_superUser ? t('profile.roles.superAdmin') : t('profile.roles.admin')}
              </span>
            </div>
          </div>
        </Card>

        {/* ── Main Form ── */}
        <div className={`${!isMobile ? 'lg:col-span-2' : ''} space-y-6`}>

          {/* Account Info */}
          <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6 flex items-center gap-2`}>
              <User className="h-5 w-5" />
              {t('profile.sections.accountInfo')}
            </h3>
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-6`}>
              <InputField
                label={t('profile.fields.username')}
                value={editMode ? formData.user_name : user.user_name}
                onChange={(v) => handleInputChange('user_name', v)}
                disabled={!editMode}
                icon={<User className="h-4 w-4" />}
                placeholder={t('profile.fields.usernamePlaceholder')}
              />
              <InputField
                label={t('profile.fields.email')}
                value={editMode ? formData.email : user.person.email}
                onChange={(v) => handleInputChange('email', v)}
                disabled={!editMode}
                type="email"
                icon={<Mail className="h-4 w-4" />}
                placeholder={t('profile.fields.emailPlaceholder')}
              />
            </div>
          </Card>

          {/* Personal Info */}
          <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6 flex items-center gap-2`}>
              <Building className="h-5 w-5" />
              {t('profile.sections.personalInfo')}
            </h3>
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-6`}>
              <InputField
                label={t('profile.fields.firstName')}
                value={editMode ? formData.first_name : user.person.first_name}
                onChange={(v) => handleInputChange('first_name', v)}
                disabled={!editMode}
                icon={<User className="h-4 w-4" />}
                placeholder={t('profile.fields.firstNamePlaceholder')}
              />
              <InputField
                label={t('profile.fields.lastName')}
                value={editMode ? formData.last_name : user.person.last_name}
                onChange={(v) => handleInputChange('last_name', v)}
                disabled={!editMode}
                icon={<User className="h-4 w-4" />}
                placeholder={t('profile.fields.lastNamePlaceholder')}
              />
              <InputField
                label={t('profile.fields.phone')}
                value={editMode ? formData.phone : (user.person.phone || '')}
                onChange={(v) => handleInputChange('phone', v)}
                disabled={!editMode}
                icon={<Phone className="h-4 w-4" />}
                placeholder={t('profile.fields.phonePlaceholder')}
              />
              <InputField
                label={t('profile.fields.birthDate')}
                value={editMode ? formData.birth_date : (user.person.birth_date || '')}
                onChange={(v) => handleInputChange('birth_date', v)}
                disabled={!editMode}
                type="date"
                icon={<Cake className="h-4 w-4" />}
              />
              <InputField
                label={t('profile.fields.address')}
                value={editMode ? formData.address : (user.person.address || '')}
                onChange={(v) => handleInputChange('address', v)}
                disabled={!editMode}
                icon={<MapPin className="h-4 w-4" />}
                placeholder={t('profile.fields.addressPlaceholder')}
              />
              <InputField
                label={t('profile.fields.idNumber')}
                value={editMode ? formData.id_number : (user.person.id_number || '')}
                onChange={(v) => handleInputChange('id_number', v)}
                disabled={!editMode}
                icon={<CreditCard className="h-4 w-4" />}
                placeholder={t('profile.fields.idNumberPlaceholder')}
              />
              <div className={`${!isMobile ? 'md:col-span-2' : ''}`}>
                {editMode ? (
                  <SelectField
                    label={t('profile.fields.idType')}
                    value={formData.type_id}
                    onChange={(v) => handleInputChange('type_id', v)}
                    disabled={!editMode}
                    icon={<CreditCard className="h-4 w-4" />}
                    options={idTypeOptions}
                  />
                ) : (
                  <InputField
                    label={t('profile.fields.idType')}
                    value={user.person.type_id || ''}
                    onChange={() => {}}
                    disabled={true}
                    icon={<CreditCard className="h-4 w-4" />}
                    placeholder={t('profile.fields.idTypePlaceholder')}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Security */}
          {editMode && (
            <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 flex items-center gap-2`}>
                  <Lock className="h-5 w-5" />
                  {t('profile.sections.security')}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  isMobile={isMobile}
                >
                  {showPasswordChange ? t('profile.security.cancelChange') : t('profile.security.changePassword')}
                </Button>
              </div>

              {showPasswordChange && (
                <div className="space-y-4">
                  <InputField
                    label={t('profile.security.currentPassword')}
                    value={formData.current_password}
                    onChange={(v) => handleInputChange('current_password', v)}
                    type={showPasswords.current ? 'text' : 'password'}
                    icon={<Lock className="h-4 w-4" />}
                    placeholder={t('profile.security.currentPasswordPlaceholder')}
                    rightIcon={showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onRightIconClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  />
                  <InputField
                    label={t('profile.security.newPassword')}
                    value={formData.new_password}
                    onChange={(v) => handleInputChange('new_password', v)}
                    type={showPasswords.new ? 'text' : 'password'}
                    icon={<Lock className="h-4 w-4" />}
                    placeholder={t('profile.security.newPasswordPlaceholder')}
                    rightIcon={showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onRightIconClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  />
                  <InputField
                    label={t('profile.security.confirmPassword')}
                    value={formData.confirm_password}
                    onChange={(v) => handleInputChange('confirm_password', v)}
                    type={showPasswords.confirm ? 'text' : 'password'}
                    icon={<Lock className="h-4 w-4" />}
                    placeholder={t('profile.security.confirmPasswordPlaceholder')}
                    rightIcon={showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onRightIconClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>{t('profile.security.requirements')}</strong>
                      <br />• {t('profile.security.req1')}
                      <br />• {t('profile.security.req2')}
                      <br />• {t('profile.security.req3')}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;