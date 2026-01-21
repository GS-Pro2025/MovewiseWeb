import React from 'react';
import { Operator } from '../../domain/OperatorsModels';
import OperatorAvatar from './OperatorAvatar';

interface OperatorDetailsModalProps {
  operator: Operator;
  isOpen: boolean;
  onClose: () => void;
}

const OperatorDetailsModal: React.FC<OperatorDetailsModalProps> = ({
  operator,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatCurrency = (salary: string): string => {
    const amount = parseFloat(salary);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFullName = (): string => {
    return `${operator.first_name} ${operator.last_name}`;
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Operator Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-200"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-user text-blue-500 mr-2"></i>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4">
                <OperatorAvatar operator={operator} />
                <div>
                  <div className="font-medium text-gray-900">{getFullName()}</div>
                  <div className="text-gray-500">Code: {operator.code}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div><span className="font-medium">Birth Date:</span> {operator.birth_date}</div>
                <div><span className="font-medium">ID Type:</span> {operator.type_id}</div>
                <div><span className="font-medium">ID Number:</span> {operator.id_number}</div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-address-book text-green-500 mr-2"></i>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2"><span className="font-medium">Email:</span> {operator.email}</div>
                <div className="mb-2"><span className="font-medium">Phone:</span> {operator.phone}</div>
              </div>
              <div>
                <div className="mb-2"><span className="font-medium">Address:</span> {operator.address}</div>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-briefcase text-purple-500 mr-2"></i>
              Work Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2"><span className="font-medium">License Number:</span> {operator.number_licence}</div>
                <div className="mb-2"><span className="font-medium">Shift Name:</span> {operator.name_t_shift}</div>
                <div className="mb-2"><span className="font-medium">Shift Size:</span> {operator.size_t_shift}</div>
              </div>
              <div>
                <div className="mb-2">
                  <span className="font-medium">Salary Type:</span>
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {operator.salary_type === 'hour' ? 'Por Hora' : 'Por Día'}
                  </span>
                </div>
                {operator.salary_type === 'hour' ? (
                  <div className="mb-2"><span className="font-medium">Hourly Salary:</span> ${operator.hourly_salary || 0}</div>
                ) : (
                  <div className="mb-2"><span className="font-medium">Daily Salary:</span> {formatCurrency(operator.salary)}</div>
                )}
                <div className="mb-2">
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    operator.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {operator.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-users text-orange-500 mr-2"></i>
              Family Information
            </h3>
            <div className="mb-4">
              <span className="font-medium">Number of Children:</span> {operator.n_children}
            </div>
            {operator.sons && operator.sons.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Children Details:</h4>
                <div className="space-y-2">
                  {operator.sons.map((son, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-3 gap-4">
                        <div><span className="font-medium">Name:</span> {son.name}</div>
                        <div><span className="font-medium">Birth Date:</span> {son.birth_date}</div>
                        <div><span className="font-medium">Gender:</span> {son.gender}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* License Images */}
          {(operator.license_front || operator.license_back) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-id-card text-red-500 mr-2"></i>
                License Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {operator.license_front && (
                  <div>
                    <h4 className="font-medium mb-2">Front</h4>
                    <img
                      src={operator.license_front}
                      alt="License Front"
                      className="w-full h-48 object-cover rounded border"
                    />
                  </div>
                )}
                {operator.license_back && (
                  <div>
                    <h4 className="font-medium mb-2">Back</h4>
                    <img
                      src={operator.license_back}
                      alt="License Back"
                      className="w-full h-48 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatorDetailsModal;