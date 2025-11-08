/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, FormEvent, useCallback, useEffect } from "react";
import { registerWithCompany, RegisterCompanyData, ValidationErrors, CheckLicenseResponse, checkCompanyLicense } from "../../service/RegisterService";
import { Eye, EyeOff, CheckCircle, XCircle, Clock } from "lucide-react";

interface RegisterFormProps {
  onRegisterSuccess?: () => void;
}

const initialCompany = {
  license_number: "",
  name: "",
  address: "",
  zip_code: ""
};

const initialUser = {
  user_name: "",
  password: "",
  person: {
    email: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    phone: "",
    address: "",
    id_number: "",
    type_id: ""
  }
};

// InputField existente:
const InputField = React.memo(({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  errors, 
  required = false,
  onBlur,
  validation
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: string[];
  required?: boolean;
  onBlur?: () => void;
  validation?: { isValid: boolean; message?: string };
}) => (
  <div className="mb-4 relative">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      required={required}
      className={`w-full px-4 py-3 pr-10 rounded-lg bg-white text-gray-900 placeholder-gray-500 border transition-all duration-300 focus:outline-none focus:ring-2 focus:border-transparent ${
        errors && errors.length > 0 
          ? "border-red-500 focus:ring-red-500" 
          : validation?.isValid === true
            ? "border-green-500 focus:ring-green-500"
            : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
      }`}
    />
    
    {/* Validation icon */}
    {value && (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {errors && errors.length > 0 ? (
          <XCircle className="text-red-500" size={20} />
        ) : validation?.isValid === true ? (
          <CheckCircle className="text-green-500" size={20} />
        ) : null}
      </div>
    )}
    
    {/* Validation message */}
    {validation?.message && !errors?.length && (
      <p className="text-xs text-blue-600 mt-1">{validation.message}</p>
    )}
    
    {/* Error messages */}
    {errors && errors.length > 0 && (
      <div className="mt-1 ml-1">
        {errors.map((error, index) => (
          <p key={index} className="text-red-500 text-sm flex items-center">
            <XCircle className="mr-1" size={16} />
            {error}
          </p>
        ))}
      </div>
    )}
  </div>
));
// LicenseField con verificación de disponibilidad
const LicenseField = React.memo(({
  value,
  onChange,
  errors,
  isChecking,
  licenseCheck,
  required = false
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: string[];
  isChecking: boolean;
  licenseCheck: CheckLicenseResponse | null;
  required?: boolean;
}) => {
  const getValidationState = () => {
    if (value.length === 0) return null;
    if (value.length < 3) return { isValid: false, message: "Must be at least 3 characters" };
    if (value.length > 50) return { isValid: false, message: "Must not exceed 50 characters" };
    if (isChecking) return { isValid: false, message: "Checking availability..." };
    if (licenseCheck?.exists) return { isValid: false, message: `Already registered to: ${licenseCheck.company_name}` };
    if (licenseCheck && !licenseCheck.exists) return { isValid: true, message: "Available!" };
    return null;
  };

  const validation = getValidationState();

  return (
    <div className="mb-4 relative">
      <input
        type="text"
        placeholder="License Number(e.g. MC-DOT-123456)"
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 pr-10 rounded-lg bg-white text-gray-900 placeholder-gray-500 border transition-all duration-300 focus:outline-none focus:ring-2 focus:border-transparent ${
          errors && errors.length > 0 
            ? "border-red-500 focus:ring-red-500" 
            : validation?.isValid === true
              ? "border-green-500 focus:ring-green-500"
              : validation?.isValid === false
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
        }`}
      />
      
      {/* Status icon */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {isChecking ? (
          <Clock className="text-blue-500 animate-spin" size={20} />
        ) : errors && errors.length > 0 ? (
          <XCircle className="text-red-500" size={20} />
        ) : validation?.isValid === true ? (
          <CheckCircle className="text-green-500" size={20} />
        ) : validation?.isValid === false ? (
          <XCircle className="text-red-500" size={20} />
        ) : null}
      </div>
      
      {/* Validation message */}
      {validation?.message && !errors?.length && (
        <p className={`text-xs mt-1 flex items-center ${
          validation.isValid ? 'text-green-600' : 'text-red-600'
        }`}>
          {validation.isValid ? (
            <CheckCircle className="mr-1" size={16} />
          ) : (
            <XCircle className="mr-1" size={16} />
          )}
          {validation.message}
        </p>
      )}
      
      {/* Error messages */}
      {errors && errors.length > 0 && (
        <div className="mt-1 ml-1">
          {errors.map((error, index) => (
            <p key={index} className="text-red-500 text-sm flex items-center">
              <XCircle className="mr-1" size={16} />
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
});
// --- PasswordField with "eye" toggle ---
const PasswordField = React.memo(({
  value,
  onChange,
  placeholder,
  errors,
  required = false,
  validation
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  errors?: string[];
  required?: boolean;
  validation?: { isValid: boolean; message?: string };
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4 relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 pr-12 rounded-lg bg-white text-gray-900 placeholder-gray-500 border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          errors && errors.length > 0 ? "border-red-500 focus:ring-red-500" : "border-gray-300 hover:border-gray-400"
        }`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>

      {/* Validation message (client-side) shown when there are no explicit errors */}
      {validation?.message && !errors?.length && (
        <p className={`text-xs mt-1 flex items-center ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
          {validation.isValid ? <CheckCircle className="mr-1" size={16} /> : <XCircle className="mr-1" size={16} />}
          {validation.message}
        </p>
      )}

      {errors && errors.length > 0 && (
        <div className="mt-1 ml-1">
          {errors.map((error, index) => (
            <p key={index} className="text-red-500 text-sm">{error}</p>
          ))}
        </div>
      )}
    </div>
  );
});
// Actualizar SelectField para manejar múltiples errores
const SelectField = React.memo(({ 
  placeholder, 
  value, 
  onChange, 
  errors, 
  required = false,
  options 
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  errors?: string[];
  required?: boolean;
  options: { value: string; label: string }[];
}) => (
  <div className="mb-4">
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        errors && errors.length > 0 ? "border-red-500 focus:ring-red-500" : "border-gray-300 hover:border-gray-400"
      } ${!value ? "text-gray-500" : ""}`}
    >
      <option value="" disabled className="text-gray-500">
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="text-gray-900">
          {option.label}
        </option>
      ))}
    </select>
    {errors && errors.length > 0 && (
      <div className="mt-1 ml-1">
        {errors.map((error, index) => (
          <p key={index} className="text-red-500 text-sm">{error}</p>
        ))}
      </div>
    )}
  </div>
));

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [company, setCompany] = useState(initialCompany);
  const [user, setUser] = useState(initialUser);
  const [errors, setErrors] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [licenseCheck, setLicenseCheck] = useState<CheckLicenseResponse | null>(null);
  const [isCheckingLicense, setIsCheckingLicense] = useState(false);
  const [licenseCheckTimeout, setLicenseCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [fieldValidations, setFieldValidations] = useState<{[key: string]: {isValid: boolean; message?: string}}>({});
  console.log(fieldValidations)
  // Opciones para el tipo de ID
  const idTypeOptions = [
    { value: "green_card", label: "Green Card" },
    { value: "passport", label: "Passport" },
    { value: "drivers_license", label: "Driver's License" },
    { value: "state_id", label: "State ID" }
  ];
  // Función para verificar licencia con debounce
  const checkLicenseAvailability = useCallback(async (licenseNumber: string) => {
    if (licenseNumber.trim().length < 3) {
      setLicenseCheck(null);
      return;
    }

    setIsCheckingLicense(true);
    
    try {
      const result = await checkCompanyLicense(licenseNumber.trim());
      setLicenseCheck(result);
    } catch (error) {
      console.error('License check failed:', error);
      // En caso de error, permitir continuar pero mostrar advertencia
      setLicenseCheck({
        status: false,
        exists: false,
        message: 'Unable to verify license. Please ensure it is unique.',
        company_name: null,
        license_number: licenseNumber
      });
    } finally {
      setIsCheckingLicense(false);
    }
  }, []);
  // Effect para verificar licencia con debounce
  useEffect(() => {
    if (licenseCheckTimeout) {
      clearTimeout(licenseCheckTimeout);
    }

    const timeout = setTimeout(() => {
      if (company.license_number.trim().length >= 3) {
        checkLicenseAvailability(company.license_number);
      }
    }, 500); // 500ms debounce

    setLicenseCheckTimeout(timeout);

    return () => {
      clearTimeout(timeout);
    };
  }, [company.license_number, checkLicenseAvailability]);

  // Limpiar verificación cuando se limpia el campo
  useEffect(() => {
    if (company.license_number.trim().length < 3) {
      setLicenseCheck(null);
    }
  }, [company.license_number]);
  
  const validateField = useCallback((field: string, value: string) => {
    let validation = { isValid: true, message: '' };

    switch (field) {
      case 'license_number':
        if (value.length === 0) validation = { isValid: false, message: '' };
        else if (value.length < 3) validation = { isValid: false, message: 'Must be at least 3 characters' };
        else if (value.length > 50) validation = { isValid: false, message: 'Must not exceed 50 characters' };
        else validation = { isValid: true, message: 'Valid length' };
        break;

      case 'company_name':
        if (value.length === 0) validation = { isValid: false, message: '' };
        else if (value.length > 255) validation = { isValid: false, message: 'Must not exceed 255 characters' };
        else if (value.length < 2) validation = { isValid: false, message: 'Must be at least 2 characters' };
        else validation = { isValid: true, message: 'Valid company name' };
        break;

      case 'address':
        if (value.length === 0) validation = { isValid: false, message: '' };
        else if (value.length > 255) validation = { isValid: false, message: 'Must not exceed 255 characters' };
        else if (value.length < 5) validation = { isValid: false, message: 'Must be at least 5 characters' };
        else validation = { isValid: true, message: 'Valid address' };
        break;

      case 'zip_code':
        { const normalizedZip = value.replace(/[^0-9]/g, '');
        if (value.length === 0) validation = { isValid: false, message: '' };
        else if (normalizedZip.length < 3) validation = { isValid: false, message: 'Must contain at least 3 digits' };
        else if (normalizedZip.length > 10) validation = { isValid: false, message: 'Must contain at most 10 digits' };
        else if (!/^[A-Za-z0-9]+$/.test(value)) validation = { isValid: false, message: 'Only letters and numbers allowed' };
        else validation = { isValid: true, message: `Valid zip code (${normalizedZip.length} digits)` };
        break; }

      case 'username':
        if (value.length === 0) validation = { isValid: false, message: '' };
        else if (value.length > 50) validation = { isValid: false, message: 'Must not exceed 50 characters' };
        else if (value.length < 3) validation = { isValid: false, message: 'Must be at least 3 characters' };
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) validation = { isValid: false, message: 'Only letters, numbers, and underscore allowed' };
        else validation = { isValid: true, message: 'Valid username' };
        break;

      case 'password':
        { const passwordChecks = [];
        if (value.length < 8) passwordChecks.push('8+ characters');
        if (!/[A-Z]/.test(value)) passwordChecks.push('1 uppercase');
        if (!/[a-z]/.test(value)) passwordChecks.push('1 lowercase');
        if (!/\d/.test(value)) passwordChecks.push('1 number');
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(value)) passwordChecks.push('1 special char');
        
        if (passwordChecks.length === 0) validation = { isValid: true, message: 'Strong password!' };
        else validation = { isValid: false, message: `Need: ${passwordChecks.join(', ')}` };
        break; }

      case 'email':
        { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value.length === 0) validation = { isValid: false, message: '' };
        else if (!emailRegex.test(value)) validation = { isValid: false, message: 'Invalid email format' };
        else validation = { isValid: true, message: 'Valid email address' };
        break; }

      case 'first_name':
      case 'last_name':
        if (value.length === 0) validation = { isValid: false, message: '' };
        else if (value.length > 100) validation = { isValid: false, message: 'Must not exceed 100 characters' };
        else if (value.length < 2) validation = { isValid: false, message: 'Must be at least 2 characters' };
        else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) validation = { isValid: false, message: 'Only letters and spaces allowed' };
        else validation = { isValid: true, message: 'Valid name' };
        break;

      case 'id_number':
        if (value.length === 0) validation = { isValid: false, message: '' };
        else if (value.length > 50) validation = { isValid: false, message: 'Must not exceed 50 characters' };
        else if (value.length < 5) validation = { isValid: false, message: 'Must be at least 5 characters' };
        else validation = { isValid: true, message: 'Valid ID number' };
        break;
    }

    setFieldValidations(prev => ({ ...prev, [field]: validation }));
    return validation;
  }, []);                   
  // Validaciones locales mejoradas según la documentación de la API
   const validateCompany = () => {
    const errs: any = {};
    
    if (company.license_number.trim().length === 0) errs.license_number = ["License number is required"];
    if (company.license_number.trim().length > 50) errs.license_number = ["License number must not exceed 50 characters"];
    
    // Verificar si la licencia ya existe
    if (licenseCheck?.exists) {
      errs.license_number = errs.license_number 
        ? [...errs.license_number, "This license number is already in use"]
        : ["This license number is already in use"];
    }
    
    // Si todavía se está verificando, no permitir continuar
    if (isCheckingLicense && company.license_number.trim().length >= 3) {
      errs.license_number = errs.license_number 
        ? [...errs.license_number, "Please wait while we verify the license number"]
        : ["Please wait while we verify the license number"];
    }

    if (company.name.trim().length === 0) errs.name = ["Company name is required"];
    if (company.name.trim().length > 255) errs.name = ["Company name must not exceed 255 characters"];
    if (company.address.trim().length === 0) errs.address = ["Address is required"];
    if (company.address.trim().length > 255) errs.address = ["Address must not exceed 255 characters"];
    
    // ZIP validation (existing code)
    if (company.zip_code.trim().length === 0) {
      errs.zip_code = ["Zip code is required"];
    } else {
      if (company.zip_code.trim().length < 3) errs.zip_code = ["Zip code must be at least 3 characters"];
      else if (company.zip_code.trim().length > 10) errs.zip_code = ["Zip code must not exceed 10 characters"];
      if (!/^[A-Za-z0-9]+$/.test(company.zip_code.trim())) {
        errs.zip_code = errs.zip_code ? [...errs.zip_code, "Zip code must contain only letters and numbers (no spaces or special characters)"] : ["Zip code must contain only letters and numbers (no spaces or special characters)"];
      }
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const validateUser = () => {
    const errs: any = {};
    
    // Username validation
    if (user.user_name.trim().length === 0) errs.user_name = ["Username is required"];
    if (user.user_name.trim().length > 50) errs.user_name = ["Username must not exceed 50 characters"];
    
    // Password validation según documentación
    if (user.password.trim().length < 8) {
      errs.password = ["Password must be at least 8 characters long"];
    } else {
      const passwordErrors: string[] = [];
      if (!/[A-Z]/.test(user.password)) passwordErrors.push("Password must contain at least one uppercase letter");
      if (!/[a-z]/.test(user.password)) passwordErrors.push("Password must contain at least one lowercase letter");
      if (!/\d/.test(user.password)) passwordErrors.push("Password must contain at least one number");
      if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(user.password)) {
        passwordErrors.push("Password must contain at least one special character");
      }
      if (passwordErrors.length > 0) errs.password = passwordErrors;
    }

    // Confirm password
    if (confirmPassword !== user.password) {
      errs.confirm_password = ["Passwords do not match"];
    }
    
    // Person validation
    const personErrors: any = {};
    if (!user.person.email.includes("@")) personErrors.email = ["Valid email required"];
    if (user.person.first_name.trim().length === 0) personErrors.first_name = ["First name is required"];
    if (user.person.first_name.trim().length > 100) personErrors.first_name = ["First name must not exceed 100 characters"];
    if (user.person.last_name.trim().length === 0) personErrors.last_name = ["Last name is required"];
    if (user.person.last_name.trim().length > 100) personErrors.last_name = ["Last name must not exceed 100 characters"];
    if (!user.person.id_number.trim()) personErrors.id_number = ["ID number is required"];
    if (user.person.id_number.trim().length > 50) personErrors.id_number = ["ID number must not exceed 50 characters"];
    if (!user.person.type_id.trim()) personErrors.type_id = ["ID type is required"];
    
    if (Object.keys(personErrors).length > 0) {
      errs.person = personErrors;
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setErrors({});
    setValidationErrors({});
    
    if (step === 1) {
      if (validateCompany()) setStep(2);
    } else {
      if (validateUser()) {
        setIsLoading(true);
        
        const registerData: RegisterCompanyData = {
          company,
          user
          // Remover id_plan - la API usa FREE PLAN automáticamente
        };

        try {
          const response = await registerWithCompany(registerData);
          
          if (response.success) {
            console.log("Registration successful:", response.data);
            
            // Mostrar mensaje de éxito
            setShowSuccess(true);
            
            // Después de 3 segundos, redirigir al login
            setTimeout(() => {
              if (onRegisterSuccess) {
                onRegisterSuccess();
              }
            }, 3000);
            
          } else {
            console.error("Registration failed:", response.errorMessage);
            
            // Manejar errores de validación estructurados
            if (response.validationErrors) {
              setValidationErrors(response.validationErrors);
              
              // Si hay errores de company, volver al step 1
              if (response.validationErrors.company && Object.keys(response.validationErrors.company).length > 0) {
                setStep(1);
              }
            } else {
              // Error general
              setErrors({ general: response.errorMessage });
            }
          }
        } catch (error) {
          console.error("Unexpected error:", error);
          setErrors({ general: "An unexpected error occurred. Please try again." });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // handleCompanyChange:
  const handleCompanyChange = useCallback((field: keyof typeof initialCompany) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCompany(prev => ({ ...prev, [field]: value }));
      
      // Validar campo en tiempo real
      validateField(field === 'name' ? 'company_name' : field, value);
      
      // Limpiar errores del campo cuando el usuario empiece a escribir
      if (validationErrors.company?.[field]) {
        setValidationErrors(prev => ({
          ...prev,
          company: {
            ...prev.company,
            [field]: undefined
          }
        }));
      }

      // Si es el campo license_number, limpiar verificación previa
      if (field === 'license_number') {
        setLicenseCheck(null);
        if (errors.license_number) {
          setErrors((prev: any) => ({ ...prev, license_number: undefined }));
        }
      }
    }, [validationErrors, errors, validateField]
  );

  // handleUserChange:
  const handleUserChange = useCallback((field: keyof typeof initialUser) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setUser(prev => ({ ...prev, [field]: value }));
      
      // Validar campo en tiempo real
      if (field === 'user_name') validateField('username', value);
      if (field === 'password') validateField('password', value);
      
      // Limpiar errores del campo cuando el usuario empiece a escribir
      if (validationErrors.user?.[field as keyof typeof validationErrors.user]) {
        setValidationErrors(prev => ({
          ...prev,
          user: {
            ...prev.user,
            [field]: undefined
          }
        }));
      }
      
      if (field === "password") {
        setErrors((prev: any) => ({ ...prev, password: undefined, confirm_password: undefined }));
      }
    }, [validationErrors, validateField]
  );

  // handlePersonChange:
  const handlePersonChange = useCallback((field: keyof typeof initialUser.person) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setUser(prev => ({ 
        ...prev, 
        person: { ...prev.person, [field]: value } 
      }));
      
      // Validar campo en tiempo real
      validateField(field, value);
      
      // Limpiar errores del campo cuando el usuario empiece a escribir
      if (validationErrors.user?.person?.[field]) {
        setValidationErrors(prev => ({
          ...prev,
          user: {
            ...prev.user,
            person: {
              ...prev.user?.person,
              [field]: undefined
            }
          }
        }));
      }
    }, [validationErrors, validateField]
  );

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmPassword(e.target.value);
      // clear errors when user types
      setErrors((prev: any) => ({ ...prev, confirm_password: undefined }));
    };
  
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="text-center">
            <strong>Account created successfully!</strong>
            <p className="text-sm mt-1">Redirecting to login...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-300">Join us and start your journey with FREE PLAN</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">Progress</span>
          <span className="text-sm text-gray-300">{step}/2</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(step / 2) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Container */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Error general */}
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Registration Failed:</strong>
              <p className="mt-1">{errors.general}</p>
            </div>
          )}
          
          {step === 1 ? (
            <>
              {/* Company Section */}
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-[#F09F52] rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Company Information</h3>
                </div>

              <div className="space-y-4">
                <LicenseField
                  value={company.license_number}
                  onChange={handleCompanyChange('license_number')}
                  errors={validationErrors.company?.license_number || errors.license_number}
                  isChecking={isCheckingLicense}
                  licenseCheck={licenseCheck}
                  required
                />

                <InputField
                  type="text"
                  placeholder="Company Name (e.g. ABC Moving Company LLC)"
                  value={company.name}
                  onChange={handleCompanyChange('name')}
                  errors={validationErrors.company?.name || errors.name}
                  validation={fieldValidations['company_name']}
                  required
                />

                <InputField
                  type="text"
                  placeholder="Company Address (e.g. 1234 Main Street, Suite 100, New York, NY)"
                  value={company.address}
                  onChange={handleCompanyChange('address')}
                  errors={validationErrors.company?.address || errors.address}
                  validation={fieldValidations['address']}
                  required
                />

                <InputField
                  type="text"
                  placeholder="Zip Code (e.g. 12345, 90210, M5V3L9)"
                  value={company.zip_code}
                  onChange={handleCompanyChange('zip_code')}
                  errors={validationErrors.company?.zip_code || errors.zip_code}
                  validation={fieldValidations['zip_code']}
                  required
                />
              </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                Continue to User Data →
              </button>
            </>
          ) : (
            <>
              {/* User Section */}
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white-900">User Information</h3>
                </div>

                <div className="space-y-4">
                  {/* Account Info */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-white-700 mb-3">Account Details</h4>
                    <div className="grid grid-cols-1 gap-4">
                     <InputField
                        type="text"
                        placeholder="Username (e.g. john_doe)"
                        value={user.user_name}
                        onChange={handleUserChange('user_name')}
                        errors={validationErrors.user?.user_name || errors.user_name}
                        validation={fieldValidations['username']}
                        required
                      />


                      <PasswordField
                        value={user.password}
                        onChange={handleUserChange('password')}
                        placeholder="Password"
                        errors={validationErrors.user?.password || errors.password}
                        required
                        validation={fieldValidations['password']}
                      />
                      
                      {/* Confirm Password */}
                      <PasswordField
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="Confirm Password"
                        errors={errors.confirm_password} // SOLO usar errors locales, no validationErrors del servidor
                        required
                      />
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-white-700 mb-3">Personal Information</h4>
                    <div className="grid grid-cols-1 gap-4">

                      <InputField
                        type="email"
                        placeholder="Email (e.g. john.doe@company.com)"
                        value={user.person.email}
                        onChange={handlePersonChange('email')}
                        errors={validationErrors.user?.person?.email || errors.person?.email}
                        validation={fieldValidations['email']}
                        required
                      />

                      <InputField
                        type="text"
                        placeholder="First Name (e.g. John)"
                        value={user.person.first_name}
                        onChange={handlePersonChange('first_name')}
                        errors={validationErrors.user?.person?.first_name || errors.person?.first_name}
                        validation={fieldValidations['first_name']}
                        required
                      />

                      <InputField
                        type="text"
                        placeholder="Last Name (e.g. Doe)"
                        value={user.person.last_name}
                        onChange={handlePersonChange('last_name')}
                        errors={validationErrors.user?.person?.last_name || errors.person?.last_name}
                        validation={fieldValidations['last_name']}
                        required
                      />
                      <div className="text-start text-white-400 mb-2">
                        Birthdate
                      </div>
                      <InputField
                        type="date"
                        placeholder=""
                        value={user.person.birth_date}
                        onChange={handlePersonChange('birth_date')}
                        errors={validationErrors.user?.person?.birth_date || errors.person?.birth_date}
                      />

                      <InputField
                        type="tel"
                        placeholder="Phone Number (e.g. +1-555-123-4567, (555) 123-4567)"
                        value={user.person.phone}
                        onChange={handlePersonChange('phone')}
                        errors={validationErrors.user?.person?.phone || errors.person?.phone}
                      />

                      <InputField
                        type="text"
                        placeholder="Address (e.g. 123 Main St, Apt 4B, City, State 12345)"
                        value={user.person.address}
                        onChange={handlePersonChange('address')}
                        errors={validationErrors.user?.person?.address || errors.person?.address}
                      />
                      <div className="text-center">
                        Identification
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          type="text"
                          placeholder="e.g. A123456789, DL123456789"
                          value={user.person.id_number}
                          onChange={handlePersonChange('id_number')}
                          errors={validationErrors.user?.person?.id_number || errors.person?.id_number}
                          validation={fieldValidations['id_number']}
                          required
                        />
                        <SelectField
                          placeholder="Select ID Type"
                          value={user.person.type_id}
                          onChange={handlePersonChange('type_id')}
                          errors={validationErrors.user?.person?.type_id || errors.person?.type_id}
                          options={idTypeOptions}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                  disabled={isLoading || showSuccess}
                >
                  ← Back
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || showSuccess}
                >
                  {isLoading ? "Creating Account..." : showSuccess ? "Account Created!" : "Create FREE Account"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Footer */}
      <div className="text-center mt-6">
        <p className="text-gray-300 text-sm">
          Already have an account? 
          <a href="/login" className="text-blue-400 hover:text-blue-300 ml-1 transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;