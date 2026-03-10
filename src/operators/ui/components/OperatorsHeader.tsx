import React from 'react';
import { Users, UserX, Baby, Filter, Search, UserPlus, Link, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Operator, InactiveOperator } from '../../domain/OperatorsModels';

interface OperatorsHeaderProps {
  operators: Operator[];
  inactiveOperators: InactiveOperator[];
  activeTab: 'active' | 'inactive';
  searchTerm: string;
  filteredOperators: Operator[];
  filteredInactiveOperators: InactiveOperator[];
  missingSalaryCount: number; // ← nuevo prop
  onTabChange: (tab: 'active' | 'inactive') => void;
  onSearchChange: (term: string) => void;
  onRegisterOperator: () => void;
  onInviteLink: () => void;
}

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  warningText: '#92400E',
  gray: '#6b7280',
};

const OperatorsHeader: React.FC<OperatorsHeaderProps> = ({
  operators,
  inactiveOperators,
  activeTab,
  searchTerm,
  filteredOperators,
  filteredInactiveOperators,
  missingSalaryCount,
  onTabChange,
  onSearchChange,
  onRegisterOperator,
  onInviteLink,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* ── Alerta global si hay operadores sin salario ── */}
      {missingSalaryCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-sm"
          style={{
            backgroundColor: COLORS.warningBg,
            borderColor: COLORS.warning,
          }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
            style={{ backgroundColor: COLORS.warning }}
          >
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: COLORS.warningText }}>
              {missingSalaryCount === 1
                ? t('operators.header.missingSalary.singular', '1 operador sin salario configurado')
                : t('operators.header.missingSalary.plural', `${missingSalaryCount} operadores sin salario configurado`)}
            </p>
            <p className="text-xs" style={{ color: COLORS.warningText }}>
              {t('operators.header.missingSalary.hint', 'Edita cada operador para asignar su salario.')}
            </p>
          </div>
          <button
            onClick={() => onTabChange('active')}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover:shadow-md"
            style={{
              backgroundColor: COLORS.warning,
              color: 'white',
            }}
          >
            {t('operators.header.missingSalary.viewButton', 'Ver operadores')}
          </button>
        </div>
      )}

      {/* ── Header with Search ── */}
      <div className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: COLORS.primary }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
              <Users size={20} />
              {t('operators.header.title')}
            </h2>
            <p className="text-xs text-gray-600">{t('operators.header.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onInviteLink}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md"
              style={{ backgroundColor: COLORS.secondary }}
            >
              <Link size={16} />
              <span>{t('operators.header.inviteLinkButton')}</span>
            </button>

            {activeTab === 'active' && (
              <button
                onClick={onRegisterOperator}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md"
                style={{ backgroundColor: COLORS.primary }}
              >
                <UserPlus size={16} />
                <span>{t('operators.header.registerButton')}</span>
              </button>
            )}

            <div className="text-right">
              <div className="text-xs text-gray-500">{t('operators.header.totalLabel')}</div>
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
              placeholder={t('operators.header.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              autoComplete="off"
              className="block w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ borderColor: COLORS.primary }}
              onFocus={(e) => { e.target.style.boxShadow = `0 0 0 3px rgba(11, 40, 99, 0.3)`; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Stats cards — ahora 5 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Active */}
          <div
            className="rounded-lg p-3 border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ borderColor: COLORS.success }}
            onClick={() => onTabChange('active')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: COLORS.success }}>
                  {t('operators.header.stats.active')}
                </p>
                <p className="text-xl font-bold" style={{ color: COLORS.success }}>
                  {operators.length}
                </p>
              </div>
              <Users size={24} style={{ color: COLORS.success }} />
            </div>
          </div>

          {/* Inactive */}
          <div
            className="rounded-lg p-3 border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ borderColor: COLORS.error }}
            onClick={() => onTabChange('inactive')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: COLORS.error }}>
                  {t('operators.header.stats.inactive')}
                </p>
                <p className="text-xl font-bold" style={{ color: COLORS.error }}>
                  {inactiveOperators.length}
                </p>
              </div>
              <UserX size={24} style={{ color: COLORS.error }} />
            </div>
          </div>

          {/* With Children */}
          <div
            className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-md"
            style={{ borderColor: COLORS.secondary }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: COLORS.secondary }}>
                  {t('operators.header.stats.withChildren')}
                </p>
                <p className="text-xl font-bold" style={{ color: COLORS.secondary }}>
                  {operators.filter(op => op.n_children > 0).length}
                </p>
              </div>
              <Baby size={24} style={{ color: COLORS.secondary }} />
            </div>
          </div>

          {/* Sin Salario — nueva card, solo visible si hay al menos 1 */}
          <div
            className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-md cursor-pointer"
            style={{
              borderColor: missingSalaryCount > 0 ? COLORS.warning : '#D1D5DB',
              backgroundColor: missingSalaryCount > 0 ? COLORS.warningBg : 'transparent',
            }}
            onClick={() => missingSalaryCount > 0 && onTabChange('active')}
            title={missingSalaryCount > 0 ? 'Ver operadores sin salario' : undefined}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: missingSalaryCount > 0 ? COLORS.warningText : COLORS.gray }}
                >
                  {t('operators.header.stats.missingSalary', 'Sin Salario')}
                </p>
                <p
                  className="text-xl font-bold"
                  style={{ color: missingSalaryCount > 0 ? COLORS.warning : COLORS.gray }}
                >
                  {missingSalaryCount}
                </p>
              </div>
              <AlertTriangle
                size={24}
                style={{ color: missingSalaryCount > 0 ? COLORS.warning : '#D1D5DB' }}
              />
            </div>
          </div>

          {/* Search Results */}
          <div
            className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-md"
            style={{ borderColor: COLORS.primary }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: COLORS.primary }}>
                  {t('operators.header.stats.searchResults')}
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

      {/* ── Tabs ── */}
      <div className="bg-white rounded-xl shadow-sm border p-3" style={{ borderColor: COLORS.primary }}>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'active' ? 'text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: activeTab === 'active' ? COLORS.success : 'transparent' }}
            onClick={() => onTabChange('active')}
          >
            <Users size={16} />
            {t('operators.header.tabs.active')}
            {/* Badge de alerta en el tab si hay faltantes */}
            {missingSalaryCount > 0 && activeTab !== 'active' && (
              <span
                className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full text-white"
                style={{ backgroundColor: COLORS.warning }}
              >
                {missingSalaryCount}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'inactive' ? 'text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: activeTab === 'inactive' ? COLORS.error : 'transparent' }}
            onClick={() => onTabChange('inactive')}
          >
            <UserX size={16} />
            {t('operators.header.tabs.inactive')}
          </button>
        </div>
      </div>
    </>
  );
};

export default OperatorsHeader;