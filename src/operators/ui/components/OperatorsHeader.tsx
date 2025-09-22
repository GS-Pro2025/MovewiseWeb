import React from 'react';
import { Operator, InactiveOperator } from '../../domain/OperatorsModels';

interface OperatorsHeaderProps {
  operators: Operator[];
  inactiveOperators: InactiveOperator[];
  activeTab: 'active' | 'inactive';
  searchTerm: string;
  filteredOperators: Operator[];
  filteredInactiveOperators: InactiveOperator[];
  onTabChange: (tab: 'active' | 'inactive') => void;
  onSearchChange: (term: string) => void;
}

const OperatorsHeader: React.FC<OperatorsHeaderProps> = ({
  operators,
  inactiveOperators,
  activeTab,
  searchTerm,
  filteredOperators,
  filteredInactiveOperators,
  onTabChange,
  onSearchChange
}) => {
  return (
    <>
      {/* Header with Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Operators Directory</h2>
            <p className="text-gray-600">Manage and view operator information</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Operators</div>
            <div className="text-2xl font-bold text-blue-600">{operators.length + inactiveOperators.length}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search operators by name, code, email, phone, or license..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => onTabChange('active')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Operators</p>
                <p className="text-2xl font-bold text-green-800">{operators.length}</p>
              </div>
              <i className="fas fa-user-check text-2xl text-green-500"></i>
            </div>
          </div>
          
          <div 
            className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => onTabChange('inactive')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Inactive Operators</p>
                <p className="text-2xl font-bold text-red-800">{inactiveOperators.length}</p>
              </div>
              <i className="fas fa-user-times text-2xl text-red-500"></i>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">With Children</p>
                <p className="text-2xl font-bold text-purple-800">
                  {operators.filter(op => op.n_children > 0).length}
                </p>
              </div>
              <i className="fas fa-baby text-2xl text-purple-500"></i>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Search Results</p>
                <p className="text-2xl font-bold text-blue-800">
                  {activeTab === 'active' ? filteredOperators.length : filteredInactiveOperators.length}
                </p>
              </div>
              <i className="fas fa-filter text-2xl text-blue-500"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onTabChange('active')}
          >
            Active Operators
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'inactive'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onTabChange('inactive')}
          >
            Inactive Operators
          </button>
        </div>
      </div>
    </>
  );
};

export default OperatorsHeader;