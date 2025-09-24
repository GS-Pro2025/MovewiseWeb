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
  Cake
} from 'lucide-react';
import { useMediaQuery, useTheme } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { 
  UserProfile, 
  ProfileFormData, 
  ProfileUseCases 
} from '../domain/ProfileDomain';
import { profileRepository } from '../data/ProfileRepository';

// Reusable Components - MOVED OUTSIDE to prevent re-creation on each render
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
  label, 
  value, 
  onChange, 
  type = 'text', 
  disabled, 
  icon, 
  placeholder, 
  rightIcon, 
  onRightIconClick 
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">
      {label}
    </label>
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

const SelectField: React.FC<SelectFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  disabled, 
  icon, 
  options 
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">
      {label}
    </label>
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
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

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize use cases
  const [profileUseCases] = useState(() => new ProfileUseCases(profileRepository));
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Form states
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

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const profile = await profileUseCases.loadProfile();
      setUser(profile);
      
      // Initialize form data
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
      const errorMessage = err instanceof Error ? err.message : 'Error loading profile';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const errorMessage = 'Image size must be less than 5MB';
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          photo: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validación específica para cambio de contraseña
      if (showPasswordChange || formData.new_password || formData.current_password) {
        // Si está intentando cambiar contraseña
        if (!formData.current_password) {
          const errorMessage = 'Current password is required to change password';
          setError(errorMessage);
          enqueueSnackbar(errorMessage, { variant: 'error' });
          return;
        }
        
        if (!formData.new_password) {
          const errorMessage = 'New password is required';
          setError(errorMessage);
          enqueueSnackbar(errorMessage, { variant: 'error' });
          return;
        }
        
        if (formData.new_password !== formData.confirm_password) {
          const errorMessage = 'Passwords do not match';
          setError(errorMessage);
          enqueueSnackbar(errorMessage, { variant: 'error' });
          return;
        }
        
        if (formData.new_password.length < 6) {
          const errorMessage = 'Password must be at least 6 characters long';
          setError(errorMessage);
          enqueueSnackbar(errorMessage, { variant: 'error' });
          return;
        }
      }
      
      // Validate form data
      const validation = profileUseCases.validateProfileData(formData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
        return;
      }
      
      // Prepare update data
      const updateData = profileUseCases.prepareUpdateData(formData);
      
      // DEBUG: Log what we're sending
      console.log('DEBUG Frontend: Sending data:', updateData);
      
      // Update profile
      const updatedProfile = await profileUseCases.updateProfile(updateData);
      
      setUser(updatedProfile);
      setEditMode(false);
      setShowPasswordChange(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
      // Success messages
      const successMessage = 'Profile updated successfully';
      setSuccess(successMessage);
      enqueueSnackbar(successMessage, { variant: 'success' });
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      let errorMessage = 'Error updating profile';
      
      // Handle specific API errors
      if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Frontend error:', err);
      
      // Handle specific error cases from the backend
      if (err.message?.includes('Current password is incorrect')) {
        errorMessage = 'Current password is incorrect. Please verify and try again.';
        enqueueSnackbar(errorMessage, { variant: 'error' });
        setError(errorMessage);
        return;
      }
      
      if (err.message?.includes('Current password is required')) {
        errorMessage = 'Current password is required to change password';
        enqueueSnackbar(errorMessage, { variant: 'error' });
        setError(errorMessage);
        return;
      }
      
      if (err.message?.includes('Email already')) {
        errorMessage = 'This email is already registered to another user';
        enqueueSnackbar(errorMessage, { variant: 'error' });
        setError(errorMessage);
        return;
      }
      
      if (err.message?.includes('ID number already')) {
        errorMessage = 'This ID number is already registered to another user';
        enqueueSnackbar(errorMessage, { variant: 'error' });
        setError(errorMessage);
        return;
      }
      
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      console.error('Error updating profile:', err);
      
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
    
    // Show cancel message
    enqueueSnackbar('Changes cancelled', { variant: 'info' });
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-50 ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen bg-slate-50 ${isMobile ? 'p-4' : 'p-6'}`}>
        <Card className="text-center p-8">
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h3 className="text-2xl font-bold mb-4 text-red-600">Error Loading Profile</h3>
          <p className="text-slate-600 mb-6">Could not load user profile data.</p>
          <Button variant="primary" onClick={loadUserProfile} isMobile={isMobile}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Add the ID Type options
  const idTypeOptions = [
    { label: "Select ID Type", value: "" },
    { label: "Driver's License", value: "DL" },
    { label: "State ID", value: "SI" },
    { label: "Green Card", value: "GC" },
    { label: "Passport", value: "PA" },
  ];

  return (
    <div className={`min-h-screen bg-slate-50 ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <Card className={`${isMobile ? 'p-4' : 'p-8'} mb-6`}>
        <div className={`${isMobile ? 'mb-4' : 'flex items-center justify-between mb-6'}`}>
          <div className={`flex items-center gap-4 ${isMobile ? 'mb-4' : ''}`}>
            <User className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-blue-600`} />
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800`}>
                My Profile
              </h1>
              <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-slate-600 mt-2`}>
                View and edit your profile information
              </p>
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-4'}`}>
            {!editMode ? (
              <Button 
                variant="primary" 
                onClick={() => setEditMode(true)}
                fullWidth={isMobile}
                isMobile={isMobile}
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className={`flex ${isMobile ? 'flex-col' : ''} gap-2`}>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  fullWidth={isMobile}
                  isMobile={isMobile}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth={isMobile}
                  isMobile={isMobile}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
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

      {/* Profile Content */}
      <div className={`grid grid-cols-1 ${!isMobile ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Profile Photo & Basic Info */}
        <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="text-center">
            {/* Profile Photo */}
            <div className="relative inline-block mb-4">
              <div className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto`}>
                <img
                  src={
                    (editMode ? formData.photo : user.photo)?.trim() 
                      ? (editMode ? formData.photo : user.photo) || undefined
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.person.first_name} ${user.person.last_name}`)}&background=0458AB&color=fff&size=256`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {editMode && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Name */}
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800 mb-2`}>
              {editMode ? `${formData.first_name} ${formData.last_name}` : `${user.person.first_name} ${user.person.last_name}`}
            </h2>
            
            {/* Username */}
            <p className="text-blue-600 mb-2 font-medium">
              @{editMode ? formData.user_name : user.user_name}
            </p>
            
            {/* Email */}
            <p className="text-slate-600 mb-4">
              {editMode ? formData.email : user.person.email}
            </p>

            {/* Role Badge */}
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                user.is_superUser 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <Shield className="h-4 w-4" />
                {user.is_superUser ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <div className={`${!isMobile ? 'lg:col-span-2' : ''} space-y-6`}>
          {/* Account Information */}
          <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6 flex items-center gap-2`}>
              <User className="h-5 w-5" />
              Account Information
            </h3>
            
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-6`}>
              <InputField
                label="Username"
                value={editMode ? formData.user_name : user.user_name}
                onChange={(value) => handleInputChange('user_name', value)}
                disabled={!editMode}
                icon={<User className="h-4 w-4" />}
                placeholder="Enter username"
              />
              
              <InputField
                label="Email"
                value={editMode ? formData.email : user.person.email}
                onChange={(value) => handleInputChange('email', value)}
                disabled={!editMode}
                type="email"
                icon={<Mail className="h-4 w-4" />}
                placeholder="Enter email address"
              />
            </div>
          </Card>

          {/* Personal Information */}
          <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6 flex items-center gap-2`}>
              <Building className="h-5 w-5" />
              Personal Information
            </h3>
            
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-6`}>
              <InputField
                label="First Name"
                value={editMode ? formData.first_name : user.person.first_name}
                onChange={(value) => handleInputChange('first_name', value)}
                disabled={!editMode}
                icon={<User className="h-4 w-4" />}
                placeholder="Enter first name"
              />
              
              <InputField
                label="Last Name"
                value={editMode ? formData.last_name : user.person.last_name}
                onChange={(value) => handleInputChange('last_name', value)}
                disabled={!editMode}
                icon={<User className="h-4 w-4" />}
                placeholder="Enter last name"
              />
              
              <InputField
                label="Phone"
                value={editMode ? formData.phone : (user.person.phone || '')}
                onChange={(value) => handleInputChange('phone', value)}
                disabled={!editMode}
                icon={<Phone className="h-4 w-4" />}
                placeholder="Enter phone number"
              />
              
              <InputField
                label="Birth Date"
                value={editMode ? formData.birth_date : (user.person.birth_date || '')}
                onChange={(value) => handleInputChange('birth_date', value)}
                disabled={!editMode}
                type="date"
                icon={<Cake className="h-4 w-4" />}
              />
              
              <InputField
                label="Address"
                value={editMode ? formData.address : (user.person.address || '')}
                onChange={(value) => handleInputChange('address', value)}
                disabled={!editMode}
                icon={<MapPin className="h-4 w-4" />}
                placeholder="Enter address"
              />
              
              <InputField
                label="ID Number"
                value={editMode ? formData.id_number : (user.person.id_number || '')}
                onChange={(value) => handleInputChange('id_number', value)}
                disabled={!editMode}
                icon={<CreditCard className="h-4 w-4" />}
                placeholder="Enter ID number"
              />
              
              <div className={`${!isMobile ? 'md:col-span-2' : ''}`}>
                {editMode ? (
                  <SelectField
                    label="ID Type"
                    value={formData.type_id}
                    onChange={(value) => handleInputChange('type_id', value)}
                    disabled={!editMode}
                    icon={<CreditCard className="h-4 w-4" />}
                    options={idTypeOptions}
                  />
                ) : (
                  <InputField
                    label="ID Type"
                    value={user.person.type_id || ''}
                    onChange={() => {}}
                    disabled={true}
                    icon={<CreditCard className="h-4 w-4" />}
                    placeholder="e.g. Driver License, Passport, etc."
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Account Security */}
          {editMode && (
            <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 flex items-center gap-2`}>
                  <Lock className="h-5 w-5" />
                  Account Security
                </h3>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  isMobile={isMobile}
                >
                  {showPasswordChange ? 'Cancel' : 'Change Password'}
                </Button>
              </div>

              {showPasswordChange && (
                <div className="space-y-4">
                  <InputField
                    label="Current Password"
                    value={formData.current_password}
                    onChange={(value) => handleInputChange('current_password', value)}
                    type={showPasswords.current ? 'text' : 'password'}
                    icon={<Lock className="h-4 w-4" />}
                    placeholder="Enter current password"
                    rightIcon={showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onRightIconClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  />
                  
                  <InputField
                    label="New Password"
                    value={formData.new_password}
                    onChange={(value) => handleInputChange('new_password', value)}
                    type={showPasswords.new ? 'text' : 'password'}
                    icon={<Lock className="h-4 w-4" />}
                    placeholder="Enter new password"
                    rightIcon={showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onRightIconClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  />
                  
                  <InputField
                    label="Confirm New Password"
                    value={formData.confirm_password}
                    onChange={(value) => handleInputChange('confirm_password', value)}
                    type={showPasswords.confirm ? 'text' : 'password'}
                    icon={<Lock className="h-4 w-4" />}
                    placeholder="Confirm new password"
                    rightIcon={showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onRightIconClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  />
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Password Requirements:</strong>
                      <br />• At least 6 characters long
                      <br />• New password must be different from current password
                      <br />• Current password is required to change password
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