import React from 'react';
import { RegistryOperator } from '../../../domain/RegistryOperatorModel';

interface OperatorDataStepProps {
  data: Partial<RegistryOperator>;
  errors: Record<string, string>;
  onChange: (data: Partial<RegistryOperator>) => void;
}

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SALARY_TYPES = [
  { value: 'day', label: 'Per Day' },
  { value: 'hour', label: 'Per Hour' }
];

const OperatorDataStep: React.FC<OperatorDataStepProps> = ({
  data,
  errors,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
          <i className="fas fa-id-badge text-3xl text-purple-600"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Operator Details</h3>
        <p className="text-gray-600 mt-1">Professional information and work details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Operator Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operator Code <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-hashtag text-gray-400"></i>
            </div>
            <input
              type="text"
              value={data.code || ''}
              onChange={(e) => onChange({ code: e.target.value })}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="OP-001"
            />
          </div>
          {errors.code && (
            <p className="mt-1 text-sm text-red-500">{errors.code}</p>
          )}
        </div>

        {/* License Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-id-card text-gray-400"></i>
            </div>
            <input
              type="text"
              value={data.number_licence || ''}
              onChange={(e) => onChange({ number_licence: e.target.value })}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.number_licence ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="DL123456789"
            />
          </div>
          {errors.number_licence && (
            <p className="mt-1 text-sm text-red-500">{errors.number_licence}</p>
          )}
        </div>

        {/* Salary Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Salario <span className="text-red-500">*</span>
          </label>
          <select
            value={data.salary_type || 'day'}
            onChange={(e) => onChange({ salary_type: e.target.value as 'hour' | 'day' })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.salary_type ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {SALARY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.salary_type && (
            <p className="mt-1 text-sm text-red-500">{errors.salary_type}</p>
          )}
        </div>

        {/* Salary (Por día) */}
        {data.salary_type === 'day' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Per Day <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-dollar-sign text-gray-400"></i>
              </div>
              <input
                type="number"
                value={data.salary || ''}
                onChange={(e) => onChange({ salary: parseFloat(e.target.value) || 0 })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.salary ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100.00"
                min="0"
                step="0.01"
              />
            </div>
            {errors.salary && (
              <p className="mt-1 text-sm text-red-500">{errors.salary}</p>
            )}
          </div>
        )}

        {/* Hourly Salary (Por hora) */}
        {data.salary_type === 'hour' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Salary <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-dollar-sign text-gray-400"></i>
              </div>
              <input
                type="number"
                value={data.hourly_salary || ''}
                onChange={(e) => onChange({ hourly_salary: parseFloat(e.target.value) || 0 })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.hourly_salary ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="25.50"
                min="0"
                step="0.01"
              />
            </div>
            {errors.hourly_salary && (
              <p className="mt-1 text-sm text-red-500">{errors.hourly_salary}</p>
            )}
          </div>
        )}

        {/* T-Shirt Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            T-Shirt Size <span className="text-red-500">*</span>
          </label>
          <select
            value={data.size_t_shirt || ''}
            onChange={(e) => onChange({ size_t_shirt: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.size_t_shirt ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select size</option>
            {T_SHIRT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          {errors.size_t_shirt && (
            <p className="mt-1 text-sm text-red-500">{errors.size_t_shirt}</p>
          )}
        </div>

        {/* T-Shirt Name (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name for T-Shirt
          </label>
          <input
            type="text"
            value={data.name_t_shirt || ''}
            onChange={(e) => onChange({ name_t_shirt: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nick or preferred name"
          />
          <p className="mt-1 text-xs text-gray-500">Optional: Name to print on uniform</p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={data.status || 'active'}
            onChange={(e) => onChange({ status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <i className="fas fa-briefcase text-purple-600 mt-1 mr-3"></i>
          <div>
            <p className="text-sm text-purple-800 font-medium">Professional Details</p>
            <p className="text-sm text-purple-700 mt-1">
              Ensure license number is valid and matches official documentation. Salary information is confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDataStep;