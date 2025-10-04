import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import { RegistryOperator } from '../../../domain/RegistryOperatorModel';

interface ContactInfoStepProps {
  data: Partial<RegistryOperator>;
  errors: Record<string, string>;
  onChange: (data: Partial<RegistryOperator>) => void;
}

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({
  data,
  errors,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
          <i className="fas fa-address-card text-3xl text-green-600"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Contact Information</h3>
        <p className="text-gray-600 mt-1">How to reach the operator</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <PhoneInput
              country={'us'}
              value={data.phone || ''}
              onChange={(phone: string) => onChange({ phone })}
              inputProps={{
                name: 'phone',
                required: true,
                autoFocus: false,
              }}
              inputStyle={{
                width: '100%',
                height: '56px',
                fontSize: '16px',
                backgroundColor: 'white',
                border: errors.phone ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.23)',
                borderRadius: '8px',
                paddingLeft: '48px'
              }}
              buttonStyle={{
                backgroundColor: 'white',
                border: errors.phone ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.23)',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
              }}
              specialLabel="Phone"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-envelope text-gray-400"></i>
            </div>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => onChange({ email: e.target.value })}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="john.doe@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <i className="fas fa-map-marker-alt text-gray-400"></i>
            </div>
            <textarea
              value={data.address || ''}
              onChange={(e) => onChange({ address: e.target.value })}
              rows={3}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123 Main Street, Apt 4B"
            />
          </div>
          {errors.address && (
            <p className="mt-1 text-sm text-red-500">{errors.address}</p>
          )}
        </div>

        {/* Zip Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zip Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-mail-bulk text-gray-400"></i>
            </div>
            <input
              type="text"
              value={data.zipcode || ''}
              onChange={(e) => onChange({ zipcode: e.target.value })}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.zipcode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="12345"
            />
          </div>
          {errors.zipcode && (
            <p className="mt-1 text-sm text-red-500">{errors.zipcode}</p>
          )}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <i className="fas fa-shield-alt text-green-600 mt-1 mr-3"></i>
          <div>
            <p className="text-sm text-green-800 font-medium">Privacy Notice</p>
            <p className="text-sm text-green-700 mt-1">
              Contact information will be kept confidential and used only for official communications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoStep;