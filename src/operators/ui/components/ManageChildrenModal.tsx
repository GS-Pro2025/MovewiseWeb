import React, { useState } from 'react';
import { Operator } from '../../domain/OperatorsModels';

interface Child {
  name: string;
  birth_date: string;
  gender: 'M' | 'F' | '';
}

interface ManageChildrenModalProps {
  operator: Operator;
  isOpen: boolean;
  onClose: () => void;
  onSave: (childData: Child) => void;
}

const ManageChildrenModal: React.FC<ManageChildrenModalProps> = ({ 
  operator, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [childData, setChildData] = useState<Child>({
    name: '',
    birth_date: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof Child, value: string) => {
    setChildData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(childData);
      // Reset form
      setChildData({
        name: '',
        birth_date: '',
        gender: ''
      });
    } catch (error) {
      console.error('Error saving child:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Manage Children - {operator.first_name} {operator.last_name}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Children List */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-users text-blue-500 mr-2"></i>
              Current Children ({operator.n_children})
            </h3>
            
            {operator.sons && operator.sons.length > 0 ? (
              <div className="space-y-3">
                {operator.sons.map((son, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border flex items-center justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <div className="text-gray-900">{son.name}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Birth Date:</span>
                        <div className="text-gray-900">{son.birth_date}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Gender:</span>
                        <div className="text-gray-900">
                          {son.gender === 'M' ? 'Male' : son.gender === 'F' ? 'Female' : 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Age:</span>
                        <div className="text-gray-900">{calculateAge(son.birth_date)} years</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        son.gender === 'M' ? 'bg-blue-500' : son.gender === 'F' ? 'bg-pink-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-baby text-4xl mb-3 text-gray-300"></i>
                <p>No children registered</p>
              </div>
            )}
          </div>

          {/* Add New Child Form */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-plus-circle text-green-500 mr-2"></i>
              Add New Child
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child's Name *
                  </label>
                  <input
                    type="text"
                    value={childData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter child's full name"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date *
                  </label>
                  <input
                    type="date"
                    value={childData.birth_date}
                    onChange={(e) => handleChange('birth_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={loading}
                    max={new Date().toISOString().split('T')[0]} // No future dates
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    value={childData.gender}
                    onChange={(e) => handleChange('gender', e.target.value as 'M' | 'F' | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>

                <div className="flex items-end">
                  {childData.birth_date && (
                    <div className="text-sm text-gray-600">
                      <i className="fas fa-info-circle mr-1"></i>
                      Age: {calculateAge(childData.birth_date)} years old
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setChildData({ name: '', birth_date: '', gender: '' })}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                  disabled={loading || !childData.name || !childData.birth_date || !childData.gender}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner animate-spin mr-2"></i>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Add Child
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageChildrenModal;