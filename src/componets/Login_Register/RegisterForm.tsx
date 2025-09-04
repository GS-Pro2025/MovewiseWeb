/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, FormEvent, useCallback } from "react";
import { registerWithCompany, RegisterCompanyData } from "../../service/RegisterService";

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

const InputField = React.memo(({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  error, 
  required = false 
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}) => (
  <div className="mb-4">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? "border-red-500 focus:ring-red-500" : "border-gray-300 hover:border-gray-400"
      }`}
    />
    {error && <p className="text-red-500 text-sm mt-1 ml-1">{error}</p>}
  </div>
));

const SelectField = React.memo(({ 
  placeholder, 
  value, 
  onChange, 
  error, 
  required = false,
  options 
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) => (
  <div className="mb-4">
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? "border-red-500 focus:ring-red-500" : "border-gray-300 hover:border-gray-400"
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
    {error && <p className="text-red-500 text-sm mt-1 ml-1">{error}</p>}
  </div>
));

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [company, setCompany] = useState(initialCompany);
  const [user, setUser] = useState(initialUser);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const id_plan = Number(window.localStorage.getItem("selectedPlanId")) || 1;

  // Opciones para el tipo de ID
  const idTypeOptions = [
    { value: "green_card", label: "Green Card" },
    { value: "passport", label: "Passport" },
    { value: "drivers_license", label: "Driver's License" },
    { value: "state_id", label: "State ID" }
  ];

  const validateCompany = () => {
    const errs: any = {};
    if (company.license_number.trim().length < 5) errs.license_number = "License number must be at least 5 characters";
    if (company.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (company.address.trim().length < 5) errs.address = "Address must be at least 5 characters";
    if (company.zip_code.trim().length < 3) errs.zip_code = "Zip code required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateUser = () => {
    const errs: any = {};
    if (user.user_name.trim().length < 4) errs.user_name = "Username must be at least 4 characters";
    if (user.password.trim().length < 6) errs.password = "Password must be at least 6 characters";
    if (!user.person.email.includes("@")) errs.email = "Valid email required";
    if (user.person.first_name.trim().length < 2) errs.first_name = "First name required";
    if (user.person.last_name.trim().length < 2) errs.last_name = "Last name required";
    if (!user.person.birth_date) errs.birth_date = "Birth date required";
    if (!user.person.phone) errs.phone = "Phone required";
    if (!user.person.address) errs.address = "Address required";
    if (!user.person.id_number) errs.id_number = "ID number required";
    if (!user.person.type_id) errs.type_id = "Type ID required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (validateCompany()) setStep(2);
    } else {
      if (validateUser()) {
        setIsLoading(true);
        
        const registerData: RegisterCompanyData = {
          company,
          user,
          id_plan
        };

        try {
          const response = await registerWithCompany(registerData);
          
          if (response.success) {
            console.log("Registration successful:", response.data);
            
            // Mostrar mensaje de éxito
            setShowSuccess(true);
            
            // Después de 2 segundos, redirigir al login
            setTimeout(() => {
              if (onRegisterSuccess) {
                onRegisterSuccess();
              }
            }, 2000);
            
          } else {
            console.error("Registration failed:", response.errorMessage);
            setErrors({ general: response.errorMessage });
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

  const handleCompanyChange = useCallback((field: keyof typeof initialCompany) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCompany(prev => ({ ...prev, [field]: e.target.value }));
    }, []
  );

  const handleUserChange = useCallback((field: keyof typeof initialUser) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUser(prev => ({ ...prev, [field]: e.target.value }));
    }, []
  );

  const handlePersonChange = useCallback((field: keyof typeof initialUser.person) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUser(prev => ({ 
        ...prev, 
        person: { ...prev.person, [field]: e.target.value } 
      }));
    }, []
  );

  const handlePersonSelectChange = useCallback((field: keyof typeof initialUser.person) => 
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setUser(prev => ({ 
        ...prev, 
        person: { ...prev.person, [field]: e.target.value } 
      }));
    }, []
  );

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          <strong>Account created successfully!</strong> Please login to continue.
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-300">Join us and start your journey</p>
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
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Error general */}
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.general}
            </div>
          )}
          
          {step === 1 ? (
            <>
              {/* Company Section */}
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Company Information</h3>
                </div>

                <div className="space-y-4">
                  <InputField
                    type="text"
                    placeholder="License Number"
                    value={company.license_number}
                    onChange={handleCompanyChange('license_number')}
                    error={errors.license_number}
                    required
                  />

                  <InputField
                    type="text"
                    placeholder="Company Name"
                    value={company.name}
                    onChange={handleCompanyChange('name')}
                    error={errors.name}
                    required
                  />

                  <InputField
                    type="text"
                    placeholder="Company Address"
                    value={company.address}
                    onChange={handleCompanyChange('address')}
                    error={errors.address}
                    required
                  />

                  <InputField
                    type="text"
                    placeholder="Zip Code"
                    value={company.zip_code}
                    onChange={handleCompanyChange('zip_code')}
                    error={errors.zip_code}
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
                  <h3 className="text-xl font-semibold text-gray-900">User Information</h3>
                </div>

                <div className="space-y-4">
                  {/* Account Info */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Account Details</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <InputField
                        type="text"
                        placeholder="Username"
                        value={user.user_name}
                        onChange={handleUserChange('user_name')}
                        error={errors.user_name}
                        required
                      />
                      <InputField
                        type="password"
                        placeholder="Password"
                        value={user.password}
                        onChange={handleUserChange('password')}
                        error={errors.password}
                        required
                      />
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <InputField
                        type="email"
                        placeholder="Email Address"
                        value={user.person.email}
                        onChange={handlePersonChange('email')}
                        error={errors.email}
                        required
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          type="text"
                          placeholder="First Name"
                          value={user.person.first_name}
                          onChange={handlePersonChange('first_name')}
                          error={errors.first_name}
                          required
                        />
                        <InputField
                          type="text"
                          placeholder="Last Name"
                          value={user.person.last_name}
                          onChange={handlePersonChange('last_name')}
                          error={errors.last_name}
                          required
                        />
                      </div>

                      <InputField
                        type="date"
                        placeholder="Birth Date"
                        value={user.person.birth_date}
                        onChange={handlePersonChange('birth_date')}
                        error={errors.birth_date}
                        required
                      />

                      <InputField
                        type="tel"
                        placeholder="Phone Number"
                        value={user.person.phone}
                        onChange={handlePersonChange('phone')}
                        error={errors.phone}
                        required
                      />

                      <InputField
                        type="text"
                        placeholder="Address"
                        value={user.person.address}
                        onChange={handlePersonChange('address')}
                        error={errors.address}
                        required
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          type="text"
                          placeholder="ID Number"
                          value={user.person.id_number}
                          onChange={handlePersonChange('id_number')}
                          error={errors.id_number}
                          required
                        />
                        <SelectField
                          placeholder="Select ID Type"
                          value={user.person.type_id}
                          onChange={handlePersonSelectChange('type_id')}
                          error={errors.type_id}
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
                  {isLoading ? "Creating Account..." : showSuccess ? "Account Created!" : "Create Account"}
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