import React from 'react';
import { RegistryOperator, IdentificationType } from '../../../domain/RegistryOperatorModel';
import IDTypePicker from '../../../../components/IDTypePicker';
import { XCircle } from 'lucide-react';

interface PersonalDataStepProps {
  data: Partial<RegistryOperator>;
  errors: Record<string, string>;
  onChange: (data: Partial<RegistryOperator>) => void;
}

const PersonalDataStep: React.FC<PersonalDataStepProps> = ({
  data,
  errors,
  onChange
}) => {
  // Handler específico para IDTypePicker
  const handleTypeIdChange = (value: string) => {
    onChange({ type_id: value as IdentificationType });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
          <i className="fas fa-user text-3xl text-blue-600"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
        <p className="text-gray-600 mt-1">Basic personal details of the operator</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.first_name || ''}
            onChange={(e) => onChange({ first_name: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.first_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.last_name || ''}
            onChange={(e) => onChange({ last_name: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.last_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Doe"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
          )}
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={data.birth_date || ''}
            onChange={(e) => onChange({ birth_date: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.birth_date ? 'border-red-500' : 'border-gray-300'
            }`}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.birth_date && (
            <p className="mt-1 text-sm text-red-500">{errors.birth_date}</p>
          )}
        </div>

        {/* ID Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Type <span className="text-red-500">*</span>
          </label>
          <IDTypePicker
            value={data.type_id || ''}
            onChange={handleTypeIdChange}
            placeholder="Select ID Type"
            className={`${errors.type_id ? 'border-red-500' : ''}`}
          />
          {errors.type_id && (
            <div className="mt-1">
              <p className="text-red-500 text-sm flex items-center">
                <XCircle className="mr-1" size={16} />
                {errors.type_id}
              </p>
            </div>
          )}
        </div>

        {/* ID Number */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.id_number || ''}
            onChange={(e) => onChange({ id_number: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.id_number ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter ID number"
          />
          {errors.id_number && (
            <p className="mt-1 text-sm text-red-500">{errors.id_number}</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <i className="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
          <div>
            <p className="text-sm text-blue-800 font-medium">Important Information</p>
            <p className="text-sm text-blue-700 mt-1">
              Make sure all personal information is accurate. This data will be used for official documentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDataStep;