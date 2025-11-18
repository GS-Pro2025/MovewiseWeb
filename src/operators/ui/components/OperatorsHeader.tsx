import React from 'react';
import { Users, UserX, Baby, Filter, Search, UserPlus } from 'lucide-react';
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
  onRegisterOperator: () => void;
}

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
  gray: '#6b7280',
};

const OperatorsHeader: React.FC<OperatorsHeaderProps> = ({
  operators,
  inactiveOperators,
  activeTab,
  searchTerm,
  filteredOperators,
  filteredInactiveOperators,
  onTabChange,
  onSearchChange,
  onRegisterOperator
}) => {
  return (
    <>
      {/* Header with Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: COLORS.primary }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
              <Users size={20} />
              Operators Directory
            </h2>
            <p className="text-xs text-gray-600">Manage and view operator information</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Botón de Registro */}
            {activeTab === 'active' && (
              <button
                onClick={onRegisterOperator}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md"
                style={{ backgroundColor: COLORS.primary }}
              >
                <UserPlus size={16} />
                <span>Register Operator</span>
              </button>
            )}
            <div className="text-right">
              <div className="text-xs text-gray-500">Total Operators</div>
              <div className="text-xl font-bold" style={{ color: COLORS.primary }}>
                {operators.length + inactiveOperators.length}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search 
              size={14} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: COLORS.gray }}
            />
            <input
              type="text"
              placeholder="Search operators by name, code, email, phone, or license..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ borderColor: COLORS.primary }}
              onFocus={(e) => {
                e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`;
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div 
            className="rounded-lg p-3 border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ borderColor: COLORS.success }}
            onClick={() => onTabChange('active')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: COLORS.success }}>
                  Active Operators
                </p>
                <p className="text-xl font-bold" style={{ color: COLORS.success }}>
                  {operators.length}
                </p>
              </div>
              <Users size={24} style={{ color: COLORS.success }} />
            </div>
          </div>
          
          <div 
            className="rounded-lg p-3 border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ borderColor: COLORS.error }}
            onClick={() => onTabChange('inactive')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: COLORS.error }}>
                  Inactive Operators
                </p>
                <p className="text-xl font-bold" style={{ color: COLORS.error }}>
                  {inactiveOperators.length}
                </p>
              </div>
              <UserX size={24} style={{ color: COLORS.error }} />
            </div>
          </div>
          
          <div 
            className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-md"
            style={{ borderColor: COLORS.secondary }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: COLORS.secondary }}>
                  With Children
                </p>
                <p className="text-xl font-bold" style={{ color: COLORS.secondary }}>
                  {operators.filter(op => op.n_children > 0).length}
                </p>
              </div>
              <Baby size={24} style={{ color: COLORS.secondary }} />
            </div>
          </div>

          <div 
            className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-md"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: COLORS.primary }}>
                  Search Results
                </p>
                <p className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {activeTab === 'active' ? filteredOperators.length : filteredInactiveOperators.length}
                </p>
              </div>
              <Filter size={24} style={{ color: COLORS.primary }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-3" style={{ borderColor: COLORS.primary }}>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: activeTab === 'active' ? COLORS.success : 'transparent' }}
            onClick={() => onTabChange('active')}
          >
            <Users size={16} />
            Active Operators
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'inactive'
                ? 'text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: activeTab === 'inactive' ? COLORS.error : 'transparent' }}
            onClick={() => onTabChange('inactive')}
          >
            <UserX size={16} />
            Inactive Operators
          </button>
        </div>
      </div>
    </>
  );
};

export default OperatorsHeader;