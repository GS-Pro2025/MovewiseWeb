/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, FormEvent, useCallback } from "react";
import { registerWithCompany, RegisterCompanyData, ValidationErrors } from "../../service/RegisterService";

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

// Actualizar InputField para manejar múltiples errores
const InputField = React.memo(({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  errors, 
  required = false 
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: string[];
  required?: boolean;
}) => (
  <div className="mb-4 relative">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        errors && errors.length > 0 ? "border-red-500 focus:ring-red-500" : "border-gray-300 hover:border-gray-400"
      }`}
    />
    {errors && errors.length > 0 && (
      <div className="mt-1 ml-1">
        {errors.map((error, index) => (
          <p key={index} className="text-red-500 text-sm">{error}</p>
        ))}
      </div>
    )}
  </div>
));

// --- NEW: PasswordField with "eye" toggle ---
const PasswordField = React.memo(({
  value,
  onChange,
  placeholder,
  errors,
  required = false
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  errors?: string[];
  required?: boolean;
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
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "🙈" : "👁️"}
      </button>
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
