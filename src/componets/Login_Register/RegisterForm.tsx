import React, { useState, FormEvent } from "react";
import { RegisterFormProps, RegisterFormData } from "../../types/authTypes";

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    licenseNumber: "",
    name: "",
    address: "",
    postalCode: ""
  });

  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (registerData.licenseNumber.trim().length < 5) {
      newErrors.licenseNumber = "License number must be at least 5 characters";
    }

    if (registerData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (registerData.address.trim().length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    }

    if (!/^\d{4,10}$/.test(registerData.postalCode)) {
      newErrors.postalCode = "Please enter a valid postal code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      console.log("Register:", registerData);

      if (onRegisterSuccess) {
        onRegisterSuccess(registerData);
      }

      // Reset form after successful register
      setRegisterData({
        licenseNumber: "",
        name: "",
        address: "",
        postalCode: ""
      });
      setErrors({});
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleInputChange = (
    field: keyof RegisterFormData,
    value: string
  ) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <p className="text-xl text-gray-100 mb-6">Create your account</p>

      <form className="sm:w-2/3 w-full mx-auto" onSubmit={handleRegister}>
        {/* License Number */}
        <div className="pb-2 pt-4">
          <input
            type="text"
            placeholder="License Number"
            value={registerData.licenseNumber}
            onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
            className={`block w-full p-4 text-xl rounded-md bg-black text-white ${
              errors.licenseNumber ? "border border-red-500" : ""
            }`}
            required
          />
          {errors.licenseNumber && (
            <p className="text-red-400 text-sm mt-1">{errors.licenseNumber}</p>
          )}
        </div>

        {/* Name */}
        <div className="pb-2 pt-4">
          <input
            type="text"
            placeholder="Name"
            value={registerData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={`block w-full p-4 text-xl rounded-md bg-black text-white ${
              errors.name ? "border border-red-500" : ""
            }`}
            required
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Address */}
        <div className="pb-2 pt-4">
          <input
            type="text"
            placeholder="Address"
            value={registerData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className={`block w-full p-4 text-xl rounded-md bg-black text-white ${
              errors.address ? "border border-red-500" : ""
            }`}
            required
          />
          {errors.address && (
            <p className="text-red-400 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        {/* Postal Code */}
        <div className="pb-2 pt-4">
          <input
            type="text"
            placeholder="Postal Code"
            value={registerData.postalCode}
            onChange={(e) => handleInputChange("postalCode", e.target.value)}
            className={`block w-full p-4 text-xl rounded-md bg-black text-white ${
              errors.postalCode ? "border border-red-500" : ""
            }`}
            required
          />
          {errors.postalCode && (
            <p className="text-red-400 text-sm mt-1">{errors.postalCode}</p>
          )}
        </div>

        {/* Submit */}
        <div className="px-4 pb-2 pt-6">
          <button
            type="submit"
            className="uppercase block w-full p-4 text-lg font-semibold rounded-full bg-[#0458AB] hover:bg-[#60A3D9] focus:outline-none"
          >
            Create Account
          </button>
        </div>
      </form>
    </>
  );
};

export default RegisterForm;