import React, { useState, useEffect } from 'react';
import { fetchOperators } from '../data/repositoryOperators';
import { Operator } from '../domain/OperatorsModels';

const PayrollStatistics: React.FC = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchOperators();
        setOperators(response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading operators');
        console.error('Error loading operators:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOperators();
  }, []);

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

  // NUEVO: Función para generar el avatar
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
              {operators.map((operator) => (
                <tr key={operator.id_operator} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {/* CAMBIO: Usar la función renderAvatar */}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollStatistics;