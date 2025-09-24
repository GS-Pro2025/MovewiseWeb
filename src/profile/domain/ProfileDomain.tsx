/* eslint-disable @typescript-eslint/no-explicit-any */
// Profile Models
export interface Person {
  email: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: string;
  address: string;
  id_number: string;
  type_id: string;
  id_company: number;
}

export interface UserProfile {
  user_name: string;
  person: Person;
  photo: string | null;
  created_at: string;
  updated_at: string;
  is_active_user: boolean;
  person_id: number;
  is_superUser: number;
}

// Update Profile Models
export interface UpdateUserData {
  user_name?: string;
  password?: string;
  photo?: string;
}

export interface UpdatePersonData {
  first_name?: string;
  last_name?: string;
  email?: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  id_number?: string;
  type_id?: string;
}

export interface UpdateProfileRequest {
  user_name?: string;
  password?: string;
  photo?: string;
  person?: UpdatePersonData;
}

// Form Data Interface (for UI)
export interface ProfileFormData {
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  birth_date: string;
  id_number: string;
  type_id: string;
  photo: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// API Response wrapper (if needed)
export interface ProfileApiResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

// Password change interface
export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Profile Repository Interface
export interface IProfileRepository {
  getProfile(): Promise<UserProfile>;
  updateProfile(data: UpdateProfileRequest): Promise<UserProfile>;
}

// Profile Use Cases
export class ProfileUseCases {
  constructor(private repository: IProfileRepository) {}

  async loadProfile(): Promise<UserProfile> {
    return await this.repository.getProfile();
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return await this.repository.updateProfile(data);
  }

  validateProfileData(data: ProfileFormData): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!data.first_name.trim()) {
      errors.push('First name is required');
    }

    if (!data.last_name.trim()) {
      errors.push('Last name is required');
    }

    if (!data.email.trim()) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Please enter a valid email address');
      }
    }

    if (!data.user_name.trim()) {
      errors.push('Username is required');
    }

    // Password validation (if changing password)
    if (data.new_password) {
      if (!data.current_password) {
        errors.push('Current password is required');
      }

      if (data.new_password.length < 6) {
        errors.push('New password must be at least 6 characters long');
      }

      if (data.new_password !== data.confirm_password) {
        errors.push('New password and confirmation do not match');
      }
    }

    // Phone validation (optional but if provided, should be valid)
    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('Please enter a valid phone number');
      }
    }

    // Birth date validation (optional but if provided, should be valid)
    if (data.birth_date && data.birth_date.trim()) {
      const birthDate = new Date(data.birth_date);
      const today = new Date();
      if (birthDate >= today) {
        errors.push('Birth date must be in the past');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  prepareUpdateData(formData: ProfileFormData): any {
    const updateData: any = {};
    
    // User fields
    if (formData.user_name) {
      updateData.user_name = formData.user_name;
    }
    
    // Password handling - CORREGIDO: usar 'password' no 'new_password'
    if (formData.new_password && formData.current_password) {
      updateData.current_password = formData.current_password;
      updateData.password = formData.new_password; // ← CAMBIO CLAVE: 'password' no 'new_password'
    }
    
    // Photo
    if (formData.photo !== undefined) {
      updateData.photo = formData.photo;
    }
    
    // Person fields
    const personData: any = {};
    const personFields = [
      'first_name', 'last_name', 'email', 'phone', 
      'address', 'birth_date', 'id_number', 'type_id'
    ];
    
    let hasPersonChanges = false;
    for (const field of personFields) {
      if (formData[field as keyof ProfileFormData] !== undefined) {
        personData[field] = formData[field as keyof ProfileFormData];
        hasPersonChanges = true;
      }
    }
    
    if (hasPersonChanges) {
      updateData.person = personData;
    }
    
    return updateData;
  }
}