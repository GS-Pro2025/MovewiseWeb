/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { fetchOperators, fetchInactiveOperators, activateOperator } from '../data/repositoryOperators';
import { fetchWeeklyOperatorRanking } from '../data/repositoryStatistics';
import { Operator } from '../domain/OperatorsModels';
import { OperatorWeeklyRanking } from '../domain/OperatorWeeklyRankingModels';
import { InactiveOperator } from '../domain/OperatortsInactiveModels';
import WeekPicker from "../../components/WeekPicker";

const PayrollStatistics: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [inactiveOperators, setInactiveOperators] = useState<InactiveOperator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inactiveLoading, setInactiveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inactiveError, setInactiveError] = useState<string | null>(null);

  // Estado para tab activo
  const [activeTab, setActiveTab] = useState<'directory' | 'ranking' | 'inactive'>('directory');

  // Estados para buscador
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inactiveSearchTerm, setInactiveSearchTerm] = useState<string>('');

  // Estado para ranking
  const [ranking, setRanking] = useState<OperatorWeeklyRanking[]>([]);
  const [rankingLoading, setRankingLoading] = useState<boolean>(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

  const now = new Date();
  const getCurrentWeek = () => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const yearStartDayNum = yearStart.getUTCDay() || 7;
    yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const [selectedWeek, setSelectedWeek] = useState<number>(getCurrentWeek());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Filtros con useMemo para optimizar rendimiento
  const filteredOperators = useMemo(() => {
    if (!searchTerm.trim()) return operators;
    
    const term = searchTerm.toLowerCase().trim();
    return operators.filter(operator => {
      const fullName = `${operator.first_name || ''} ${operator.last_name || ''}`.toLowerCase();
      const email = (operator.email || '').toLowerCase();
      const code = (operator.code || '').toLowerCase();
      
      return fullName.includes(term) || 
             email.includes(term) || 
             code.includes(term);
    });
  }, [operators, searchTerm]);

  const filteredInactiveOperators = useMemo(() => {
    if (!inactiveSearchTerm.trim()) return inactiveOperators;
    
    const term = inactiveSearchTerm.toLowerCase().trim();
    return inactiveOperators.filter(operator => {
      const fullName = `${operator.first_name || ''} ${operator.last_name || ''}`.toLowerCase();
      const email = (operator.email || '').toLowerCase();
      
      return fullName.includes(term) || email.includes(term);
    });
  }, [inactiveOperators, inactiveSearchTerm]);

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  useEffect(() => {
    const loadOperators = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchOperators();
        setOperators(response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading operators');
        enqueueSnackbar(err instanceof Error ? err.message : 'Error loading operators', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadOperators();
  }, []);

  useEffect(() => {
    if (activeTab === 'ranking') {
      const loadRanking = async () => {
        try {
          setRankingLoading(true);
          setRankingError(null);
          const data = await fetchWeeklyOperatorRanking(selectedYear, selectedWeek);
          setRanking(data);
        } catch (err) {
          setRankingError(err instanceof Error ? err.message : 'Error loading ranking');
          enqueueSnackbar(err instanceof Error ? err.message : 'Error loading ranking', { variant: 'error' });
        } finally {
          setRankingLoading(false);
        }
      };
      loadRanking();
    }
  }, [activeTab, selectedYear, selectedWeek]);

  useEffect(() => {
    if (activeTab === 'inactive') {
      const loadInactive = async () => {
        try {
          setInactiveLoading(true);
          setInactiveError(null);
          const data = await fetchInactiveOperators();
          setInactiveOperators(data.results);
        } catch (err) {
          setInactiveError(err instanceof Error ? err.message : 'Error loading inactive operators');
          enqueueSnackbar(err instanceof Error ? err.message : 'Error loading inactive operators', { variant: 'error' });
        } finally {
          setInactiveLoading(false);
        }
      };
      loadInactive();
    }
  }, [activeTab]);

  const handleActivate = async (id_operator: number) => {
    try {
      await activateOperator(id_operator);
      setInactiveOperators(prev => prev.filter(op => op.id_operator !== id_operator));
      enqueueSnackbar('Operator activated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Error activating operator', { variant: 'error' });
    }
  };

  const formatCurrency = (salary: string): string => {
    const amount = parseFloat(salary);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFullName = (operator: Operator): string => {
    return `${operator.first_name} ${operator.last_name}`;
  };

  const getTotalPayroll = (): number => {
    return operators.reduce((total, operator) => total + parseFloat(operator.salary), 0);
  };

  const renderAvatar = (operator: Operator) => {
    if (operator.photo) {
      return (
        <img
          className="h-10 w-10 rounded-full object-cover"
          src={operator.photo}
          alt={getFullName(operator)}
        />
      );
    } else {
      return (
        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {operator.first_name.charAt(0)}{operator.last_name.charAt(0)}
          </span>
        </div>
      );
    }
  };

  function getWeekRange(year: number, week: number): { start: string; end: string } {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
    const endDate = new Date(startDate.getTime() + 6 * 86400000);
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }

  // Función para limpiar el buscador
  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearInactiveSearch = () => {
    setInactiveSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <i className="fas fa-spinner animate-spin text-blue-600 text-xl"></i>
          <span className="text-gray-600">Loading payroll data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Payroll</h3>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'directory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('directory')}
          >
            Employee Directory
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'ranking'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('ranking')}
          >
            Weekly Operator Ranking
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'inactive'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('inactive')}
          >
            Inactive Operators
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'directory' && (
        <>
          {/* Header con resumen */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Payroll Overview</h2>
                <p className="text-gray-600">Manage employee salaries and information</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Payroll</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotalPayroll().toString())}
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Employees</p>
                    <p className="text-2xl font-bold text-blue-800">{operators.length}</p>
                  </div>
                  <i className="fas fa-users text-2xl text-blue-500"></i>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Average Salary</p>
                    <p className="text-2xl font-bold text-green-800">
                      {operators.length > 0 ? formatCurrency((getTotalPayroll() / operators.length).toString()) : '$0'}
                    </p>
                  </div>
                  <i className="fas fa-dollar-sign text-2xl text-green-500"></i>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Active Status</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {operators.filter(op => op.status === 'active').length}
                    </p>
                  </div>
                  <i className="fas fa-check-circle text-2xl text-purple-500"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Buscador para empleados activos */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search employees by name, email, or code..."
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {filteredOperators.length} of {operators.length} employees
                {filteredOperators.length === 0 && (
                  <span className="text-red-500 ml-2">No employees found matching "{searchTerm}"</span>
                )}
              </div>
            )}
          </div>

          {/* Lista de operadores */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Employee Directory</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOperators.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center">
                        <div className="text-gray-400">
                          <i className="fas fa-search text-3xl mb-2"></i>
                          <p className="text-sm">
                            {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees available'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOperators.map((operator) => (
                      <tr key={operator.id_operator} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {renderAvatar(operator)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {getFullName(operator)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Code: {operator.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{operator.email}</div>
                          <div className="text-sm text-gray-500">{operator.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(operator.salary)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            operator.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {operator.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ranking' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Weekly Operator Ranking</h3>
              <p className="text-gray-500 text-sm">
                Most assigned operators for week {selectedWeek}, {selectedYear}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {(() => {
                  const range = getWeekRange(selectedYear, selectedWeek);
                  return `Week range: ${range.start} → ${range.end}`;
                })()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {getAvailableYears().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Week:</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', overflow: 'visible', minWidth: 120 }}>
                    <WeekPicker
                      week={selectedWeek}
                      onWeekSelect={(w) => setSelectedWeek(w)}
                      min={1}
                      max={53}
                      className=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {rankingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <i className="fas fa-spinner animate-spin text-purple-600 text-xl"></i>
                <span className="text-gray-600">Loading ranking...</span>
              </div>
            </div>
          ) : rankingError ? (
            <div className="text-center text-red-500 py-8">{rankingError}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignments</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ranking.map((op, idx) => {
                    let rowClass = "";
                    if (idx === 0) {
                      rowClass = "bg-yellow-50";
                    } else if (idx >= 1 && idx <= 4) {
                      rowClass = "bg-blue-50";
                    } else if (idx >= 5 && idx <= 14) {
                      rowClass = "bg-green-50";
                    }
                    return (
                      <tr key={op.code} className={`hover:bg-gray-50 transition-colors ${rowClass}`}>
                        <td className="px-6 py-4">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{op.first_name} {op.last_name}</td>
                        <td className="px-6 py-4 text-gray-700">{op.email}</td>
                        <td className="px-6 py-4 text-purple-700 font-bold">{op.assign_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inactive' && (
        <>
          {/* Buscador para operadores inactivos */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={inactiveSearchTerm}
                onChange={(e) => setInactiveSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Search inactive operators by name or email..."
              />
              {inactiveSearchTerm && (
                <button
                  onClick={clearInactiveSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            {inactiveSearchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {filteredInactiveOperators.length} of {inactiveOperators.length} inactive operators
                {filteredInactiveOperators.length === 0 && (
                  <span className="text-red-500 ml-2">No operators found matching "{inactiveSearchTerm}"</span>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Inactive Operators</h3>
              <p className="text-gray-500 text-sm">Operators currently inactive</p>
            </div>
            {inactiveLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <i className="fas fa-spinner animate-spin text-yellow-600 text-xl"></i>
                  <span className="text-gray-600">Loading inactive operators...</span>
                </div>
              </div>
            ) : inactiveError ? (
              <div className="text-center text-red-500 py-8">{inactiveError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInactiveOperators.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <div className="text-gray-400">
                            <i className="fas fa-search text-3xl mb-2"></i>
                            <p className="text-sm">
                              {inactiveSearchTerm ? `No inactive operators found matching "${inactiveSearchTerm}"` : 'No inactive operators available'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredInactiveOperators.map((op) => (
                        <tr key={op.id_operator} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{op.first_name} {op.last_name}</td>
                          <td className="px-6 py-4 text-gray-700">{op.email}</td>
                          <td className="px-6 py-4 text-red-700 font-bold">{op.status}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleActivate(op.id_operator)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                              Activate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PayrollStatistics;