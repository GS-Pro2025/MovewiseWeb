import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone,
  Calendar, 
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
  Lock
} from 'lucide-react';
import { useMediaQuery, useTheme } from '@mui/material';
import { fetchUserProfile, updateUserProfile } from '../../service/userService';
import { UserProfile } from '../../models/UserModels';
import Cookies from 'js-cookie';
import { decodeJWTAsync } from '../../service/tokenDecoder';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
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
      const token = Cookies.get('authToken');
      const decodedToken = await decodeJWTAsync(token ?? '');
      
      if (!decodedToken) {
        setError('Token invalid');
        return;
      }
      
      const userId = (decodedToken as any).person_id;
      if (!userId) {
        setError('User ID not found');
        return;
      }
      
      const profile = await fetchUserProfile(Number(userId));
      setUser(profile);
      setFormData({
        first_name: profile.person.first_name,
        last_name: profile.person.last_name,
        email: profile.person.email,
        phone: profile.person.phone || '',
        photo: profile.photo || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
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

  const validateForm = (): boolean => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Name and last name are required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    
    // Password validation if changing password
    if (showPasswordChange) {
      if (!formData.current_password) {
        setError('Current password is required');
        return false;
      }
      
      if (!formData.new_password) {
        setError('New password is required');
        return false;
      }
      
      if (formData.new_password.length < 6) {
        setError('New password must be at least 6 characters');
        return false;
      }
      
      if (formData.new_password !== formData.confirm_password) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        photo: formData.photo
      };
      
      // Add password fields if changing password
      if (showPasswordChange) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }
      
      await updateUserProfile(user!.user_id, updateData);
      
      setSuccess('Profile updated successfully');
      setEditMode(false);
      setShowPasswordChange(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
      // Reload profile to get updated data
      await loadUserProfile();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    
    setFormData({
      first_name: user.person.first_name,
      last_name: user.person.last_name,
      email: user.person.email,
      phone: user.person.phone || '',
      photo: user.photo || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setEditMode(false);
    setShowPasswordChange(false);
    setError(null);
    setSuccess(null);
  };

  // Reusable Components
  const Card: React.FC<{
    children: React.ReactNode;
    className?: string;
  }> = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-lg border border-slate-200 ${className}`}>
      {children}
    </div>
  );

  const Button: React.FC<{
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
  }> = ({ 
    variant = 'outline', 
    size = 'md', 
    children, 
    onClick, 
    disabled, 
    className = '',
    fullWidth = false
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

  const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
    placeholder?: string;
    rightIcon?: React.ReactNode;
  }> = ({ label, value, onChange, type = 'text', disabled, icon, placeholder, rightIcon }) => (
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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => {
              if (type === 'password') {
                // Handle password visibility toggle
              }
            }}
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );

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
          <Button variant="primary" onClick={loadUserProfile}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

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
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth={isMobile}
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
                    (editMode ? formData.photo : user.photo) && (editMode ? formData.photo : user.photo)!.trim() !== ''
                      ? (editMode ? formData.photo : user.photo)
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
          {/* Personal Information */}
          <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6 flex items-center gap-2`}>
              <User className="h-5 w-5" />
              Personal Information
            </h3>
            
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-6`}>
              <InputField
                label="First Name"
                value={editMode ? formData.first_name : user.person.first_name}
                onChange={(value) => handleInputChange('first_name', value)}
                disabled={!editMode}
                icon={<User className="h-4 w-4" />}
              />
              
              <InputField
                label="Last Name"
                value={editMode ? formData.last_name : user.person.last_name}
                onChange={(value) => handleInputChange('last_name', value)}
                disabled={!editMode}
                icon={<User className="h-4 w-4" />}
              />
              
              <InputField
                label="Email"
                value={editMode ? formData.email : user.person.email}
                onChange={(value) => handleInputChange('email', value)}
                disabled={!editMode}
                type="email"
                icon={<Mail className="h-4 w-4" />}
              />
              
              <InputField
                label="Phone"
                value={editMode ? formData.phone : (user.person.phone || '')}
                onChange={(value) => handleInputChange('phone', value)}
                disabled={!editMode}
                icon={<Phone className="h-4 w-4" />}
                placeholder="Phone number"
              />
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
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  
                  <InputField
                    label="New Password"
                    value={formData.new_password}
                    onChange={(value) => handleInputChange('new_password', value)}
                    type={showPasswords.new ? 'text' : 'password'}
                    icon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  
                  <InputField
                    label="Confirm New Password"
                    value={formData.confirm_password}
                    onChange={(value) => handleInputChange('confirm_password', value)}
                    type={showPasswords.confirm ? 'text' : 'password'}
                    icon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </div>
              )}
            </Card>
          )}

          {/* Account Information (Read-only) */}
          <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6 flex items-center gap-2`}>
              <Building className="h-5 w-5" />
              Account Information
            </h3>
            
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-6`}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  User ID
                </label>
                <div className="px-3 py-3 bg-slate-100 border-2 border-slate-200 rounded-lg text-slate-600">
                  #{user.user_id}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Account Type
                </label>
                <div className="px-3 py-3 bg-slate-100 border-2 border-slate-200 rounded-lg text-slate-600">
                  {user.is_superUser ? 'Super Administrator' : 'Administrator'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Member Since
                </label>
                <div className="px-3 py-3 bg-slate-100 border-2 border-slate-200 rounded-lg text-slate-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;