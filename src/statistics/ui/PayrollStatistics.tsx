/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { fetchOperators, fetchInactiveOperators, activateOperator } from '../data/repositoryOperators';
import { fetchWeeklyOperatorRanking } from '../data/repositoryStatistics';
import { Operator } from '../domain/OperatorsModels';
import { OperatorWeeklyRanking } from '../domain/OperatorWeeklyRankingModels';
import { InactiveOperator } from '../domain/OperatortsInactiveModels';
import WeekPicker from "../../components/WeekPicker";

const PayrollStatistics: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [inactiveOperators, setInactiveOperators] = useState<InactiveOperator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inactiveLoading, setInactiveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inactiveError, setInactiveError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'directory' | 'ranking' | 'inactive'>('directory');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inactiveSearchTerm, setInactiveSearchTerm] = useState<string>('');

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

  const filteredOperators = useMemo(() => {
    if (!searchTerm.trim()) return operators;
    const term = searchTerm.toLowerCase().trim();
    return operators.filter(op => {
      const fullName = `${op.first_name || ''} ${op.last_name || ''}`.toLowerCase();
      return fullName.includes(term) || (op.email || '').toLowerCase().includes(term) || (op.code || '').toLowerCase().includes(term);
    });
  }, [operators, searchTerm]);

  const filteredInactiveOperators = useMemo(() => {
    if (!inactiveSearchTerm.trim()) return inactiveOperators;
    const term = inactiveSearchTerm.toLowerCase().trim();
    return inactiveOperators.filter(op => {
      const fullName = `${op.first_name || ''} ${op.last_name || ''}`.toLowerCase();
      return fullName.includes(term) || (op.email || '').toLowerCase().includes(term);
    });
  }, [inactiveOperators, inactiveSearchTerm]);

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) years.push(i);
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
        const msg = err instanceof Error ? err.message : t('payrollStatistics.errors.loadOperators');
        setError(msg);
        enqueueSnackbar(msg, { variant: 'error' });
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
          const msg = err instanceof Error ? err.message : t('payrollStatistics.errors.loadRanking');
          setRankingError(msg);
          enqueueSnackbar(msg, { variant: 'error' });
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
          const msg = err instanceof Error ? err.message : t('payrollStatistics.errors.loadInactive');
          setInactiveError(msg);
          enqueueSnackbar(msg, { variant: 'error' });
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
      enqueueSnackbar(t('payrollStatistics.inactive.activatedSuccess'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('payrollStatistics.inactive.activateError'), { variant: 'error' });
    }
  };

  // Función para obtener el salario diario del operador
  const getDailySalary = (operator: Operator): number => {
    if (operator.salary_type === 'hour') {
      const hourlyRate = parseFloat(operator.hourly_salary?.toString() || '0');
      return hourlyRate * 8; // Asume 8 horas por día laboral
    } else {
      return parseFloat(operator.salary); // Ya es salario diario
    }
  };

  // Función para obtener el valor semanal (5 días laborales)
  const getWeeklySalary = (operator: Operator): number => {
    return getDailySalary(operator) * 5; // 5 días laborales por semana
  };

  // Función para obtener el valor mensual (22 días laborales promedio)
  const getMonthlySalary = (operator: Operator): number => {
    return getDailySalary(operator) * 22; // 22 días laborales promedio por mes
  };

  // Función para calcular lo que ganó un operador en una semana específica basado en sus asignaciones
  const getWeeklyEarnings = (operatorCode: string, assignCount: number): number => {
    const operator = operators.find(op => op.code === operatorCode);
    if (!operator) return 0;
    
    const dailySalary = getDailySalary(operator);
    // Asumiendo que cada asignación representa un día de trabajo
    return dailySalary * assignCount;
  };

  const getTotalWeeklyPayroll = (): number => {
    return operators.reduce((total, op) => total + getWeeklySalary(op), 0);
  };

  const getTotalMonthlyPayroll = (): number => {
    return operators.reduce((total, op) => total + getMonthlySalary(op), 0);
  };

  const getAverageDailySalary = (): number => {
    if (operators.length === 0) return 0;
    const totalDaily = operators.reduce((total, op) => total + getDailySalary(op), 0);
    return totalDaily / operators.length;
  };

  const getAverageWeeklySalary = (): number => {
    if (operators.length === 0) return 0;
    const totalWeekly = operators.reduce((total, op) => total + getWeeklySalary(op), 0);
    return totalWeekly / operators.length;
  };

  const getAverageMonthlySalary = (): number => {
    if (operators.length === 0) return 0;
    return getTotalMonthlyPayroll() / operators.length;
  };

  const getFullName = (operator: Operator): string => `${operator.first_name} ${operator.last_name}`;

  // Función mejorada para formatear salario según el tipo
  const formatSalary = (operator: Operator): string => {
    if (operator.salary_type === 'hour') {
      const hourlyRate = parseFloat(operator.hourly_salary?.toString() || '0');
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(hourlyRate) + '/hora';
    } else {
      const dailyRate = parseFloat(operator.salary);
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      }).format(dailyRate) + '/día';
    }
  };

  const renderAvatar = (operator: Operator) =>
    operator.photo ? (
      <img className="h-10 w-10 rounded-full object-cover" src={operator.photo} alt={getFullName(operator)} />
    ) : (
      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
        <span className="text-sm font-medium text-white">
          {operator.first_name.charAt(0)}{operator.last_name.charAt(0)}
        </span>
      </div>
    );

  function getWeekRange(year: number, week: number): { start: string; end: string } {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
    const endDate = new Date(startDate.getTime() + 6 * 86400000);
    return { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] };
  }

  // Calcular total de la nómina semanal basado en el ranking
  const getTotalRankingWeeklyPayroll = (): number => {
    return ranking.reduce((total, item) => {
      return total + getWeeklyEarnings(item.code, item.assign_count);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <i className="fas fa-spinner animate-spin text-blue-600 text-xl"></i>
          <span className="text-gray-600">{t('payrollStatistics.loadingPayroll')}</span>
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('payrollStatistics.errorTitle')}</h3>
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
          {([
            { key: 'directory', color: 'blue'   },
            { key: 'ranking',   color: 'purple' },
            { key: 'inactive',  color: 'yellow' },
          ] as const).map(({ key, color }) => (
            <button
              key={key}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === key
                  ? `bg-${color}-600 text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab(key)}
            >
              {t(`payrollStatistics.tabs.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Directory ── */}
      {activeTab === 'directory' && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{t('payrollStatistics.directory.title')}</h2>
                <p className="text-gray-600">{t('payrollStatistics.directory.subtitle')}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{t('payrollStatistics.directory.totalPayrollMonthly')}</div>
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    .format(getTotalMonthlyPayroll())}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('payrollStatistics.directory.basedOnDays', { days: 22 })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">{t('payrollStatistics.directory.totalEmployees')}</p>
                    <p className="text-2xl font-bold text-blue-800">{operators.length}</p>
                  </div>
                  <i className="fas fa-users text-2xl text-blue-500"></i>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">{t('payrollStatistics.directory.averageDailySalary')}</p>
                    <p className="text-2xl font-bold text-green-800">
                      {operators.length > 0 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                            .format(getAverageDailySalary())
                        : '$0'}
                    </p>
                  </div>
                  <i className="fas fa-sun text-2xl text-green-500"></i>
                </div>
              </div>

              <div className="bg-teal-50 rounded-lg p-4 border-l-4 border-teal-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-600">{t('payrollStatistics.directory.averageWeeklySalary')}</p>
                    <p className="text-2xl font-bold text-teal-800">
                      {operators.length > 0 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                            .format(getAverageWeeklySalary())
                        : '$0'}
                    </p>
                  </div>
                  <i className="fas fa-clock text-2xl text-teal-500"></i>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">{t('payrollStatistics.directory.averageMonthlySalary')}</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {operators.length > 0 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                            .format(getAverageMonthlySalary())
                        : '$0'}
                    </p>
                  </div>
                  <i className="fas fa-calendar-alt text-2xl text-purple-500"></i>
                </div>
              </div>
            </div>

            {/* Nota explicativa */}
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <i className="fas fa-info-circle mr-1"></i>
              {t('payrollStatistics.directory.calculationNote', { hours: 8, days: 5, monthDays: 22 })}
            </div>

            {/* Resumen de tipos de salario */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('payrollStatistics.directory.hourlyEmployees')}</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {operators.filter(op => op.salary_type === 'hour').length}
                    </p>
                  </div>
                  <i className="fas fa-hourglass-half text-gray-400"></i>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('payrollStatistics.directory.dailyEmployees')}</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {operators.filter(op => op.salary_type === 'day').length}
                    </p>
                  </div>
                  <i className="fas fa-sun text-gray-400"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Buscador */}
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
                placeholder={t('payrollStatistics.directory.searchPlaceholder')}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                {t('payrollStatistics.directory.showing', { filtered: filteredOperators.length, total: operators.length })}
                {filteredOperators.length === 0 && (
                  <span className="text-red-500 ml-2">{t('payrollStatistics.directory.noMatch', { term: searchTerm })}</span>
                )}
              </div>
            )}
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{t('payrollStatistics.directory.tableTitle')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {(['colEmployee', 'colEmail', 'colSalary', 'colStatus'] as const).map(col => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(`payrollStatistics.directory.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOperators.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center">
                        <div className="text-gray-400">
                          <i className="fas fa-search text-3xl mb-2"></i>
                          <p className="text-sm">
                            {searchTerm
                              ? t('payrollStatistics.directory.noMatch', { term: searchTerm })
                              : t('payrollStatistics.directory.noEmployees')}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOperators.map((operator) => (
                      <tr key={operator.id_operator} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">{renderAvatar(operator)}</div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{getFullName(operator)}</div>
                              <div className="text-sm text-gray-500">{t('payrollStatistics.directory.code', { code: operator.code })}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{operator.email}</div>
                          <div className="text-sm text-gray-500">{operator.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatSalary(operator)}</div>
                          <div className="text-xs text-gray-500">
                            {operator.salary_type === 'hour' 
                              ? t('payrollStatistics.directory.hourlyRate')
                              : t('payrollStatistics.directory.dailyRate')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            operator.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

      {/* ── Ranking ── */}
      {activeTab === 'ranking' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('payrollStatistics.ranking.title')}</h3>
              <p className="text-gray-500 text-sm">
                {t('payrollStatistics.ranking.subtitle', { week: selectedWeek, year: selectedYear })}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {(() => {
                  const range = getWeekRange(selectedYear, selectedWeek);
                  return t('payrollStatistics.ranking.weekRange', { start: range.start, end: range.end });
                })()}
              </p>
              {ranking.length > 0 && (
                <p className="text-xs font-semibold text-green-600 mt-1">
                  {t('payrollStatistics.ranking.totalWeeklyPayroll', { 
                    total: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      .format(getTotalRankingWeeklyPayroll())
                  })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">{t('payrollStatistics.ranking.labelYear')}</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {getAvailableYears().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">{t('payrollStatistics.ranking.labelWeek')}</label>
                <div style={{ position: 'relative', overflow: 'visible', minWidth: 120 }}>
                  <WeekPicker week={selectedWeek} onWeekSelect={(w) => setSelectedWeek(w)} min={1} max={53} className="" />
                </div>
              </div>
            </div>
          </div>

          {rankingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <i className="fas fa-spinner animate-spin text-purple-600 text-xl"></i>
                <span className="text-gray-600">{t('payrollStatistics.ranking.loading')}</span>
              </div>
            </div>
          ) : rankingError ? (
            <div className="text-center text-red-500 py-8">{rankingError}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {(['colRank', 'colEmployee', 'colEmail', 'colAssignments', 'colEarnings'] as const).map(col => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(`payrollStatistics.ranking.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ranking.map((op, idx) => {
                    const weeklyEarnings = getWeeklyEarnings(op.code, op.assign_count);
                    const rowClass = idx === 0 ? 'bg-yellow-50' : idx <= 4 ? 'bg-blue-50' : idx <= 14 ? 'bg-green-50' : '';
                    return (
                      <tr key={op.code} className={`hover:bg-gray-50 transition-colors ${rowClass}`}>
                        <td className="px-6 py-4 font-medium">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{op.first_name} {op.last_name}</td>
                        <td className="px-6 py-4 text-gray-700">{op.email}</td>
                        <td className="px-6 py-4 text-purple-700 font-bold">{op.assign_count}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-600">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                              .format(weeklyEarnings)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({t('payrollStatistics.ranking.perAssignment', { amount: 
                              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                .format(weeklyEarnings / op.assign_count)
                            })})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm text-gray-700">
                      {t('payrollStatistics.ranking.total')}:
                    </td>
                    <td className="px-6 py-3 text-green-600 font-bold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                        .format(getTotalRankingWeeklyPayroll())}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Inactive ── */}
      {activeTab === 'inactive' && (
        <>
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
                placeholder={t('payrollStatistics.inactive.searchPlaceholder')}
              />
              {inactiveSearchTerm && (
                <button onClick={() => setInactiveSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            {inactiveSearchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                {t('payrollStatistics.inactive.showing', { filtered: filteredInactiveOperators.length, total: inactiveOperators.length })}
                {filteredInactiveOperators.length === 0 && (
                  <span className="text-red-500 ml-2">{t('payrollStatistics.inactive.noMatch', { term: inactiveSearchTerm })}</span>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{t('payrollStatistics.inactive.title')}</h3>
              <p className="text-gray-500 text-sm">{t('payrollStatistics.inactive.subtitle')}</p>
            </div>
            {inactiveLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <i className="fas fa-spinner animate-spin text-yellow-600 text-xl"></i>
                  <span className="text-gray-600">{t('payrollStatistics.inactive.loading')}</span>
                </div>
              </div>
            ) : inactiveError ? (
              <div className="text-center text-red-500 py-8">{inactiveError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {(['colEmployee', 'colEmail', 'colStatus', 'colActions'] as const).map(col => (
                        <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(`payrollStatistics.inactive.${col}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInactiveOperators.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <div className="text-gray-400">
                            <i className="fas fa-search text-3xl mb-2"></i>
                            <p className="text-sm">
                              {inactiveSearchTerm
                                ? t('payrollStatistics.inactive.noMatch', { term: inactiveSearchTerm })
                                : t('payrollStatistics.inactive.noInactive')}
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
                              {t('payrollStatistics.inactive.activate')}
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