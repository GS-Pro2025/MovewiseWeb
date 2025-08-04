import React from 'react';
import { PaymentStatusStats } from '../../domain/PaymentStatusModels';

interface PaymentStatusChartProps {
  currentStats: PaymentStatusStats;
  previousStats: PaymentStatusStats;
  changes: {
    totalOrdersChange: number;
    paidOrdersChange: number;
    unpaidOrdersChange: number;
    paidPercentageChange: number;
  };
  loading?: boolean;
}

const PaymentStatusChart: React.FC<PaymentStatusChartProps> = ({
  currentStats,
  previousStats,
  changes,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center h-80">
          <div className="flex items-center gap-3">
            <i className="fas fa-spinner animate-spin text-blue-600 text-xl"></i>
            <span className="text-gray-600">Loading payment status...</span>
          </div>
        </div>
      </div>
    );
  }

  // Calcular los ángulos para el gráfico de pastel
  const paidPercentage = currentStats.paidPercentage;
  const unpaidPercentage = currentStats.unpaidPercentage;
  
  // Para SVG, necesitamos convertir porcentajes a coordenadas
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  
  // Calcular el ángulo para la sección de pagadas (en radianes)
  const paidAngle = (paidPercentage / 100) * 2 * Math.PI;
  
  // Coordenadas para el arco de pagadas
  const x1 = centerX + radius * Math.cos(-Math.PI / 2);
  const y1 = centerY + radius * Math.sin(-Math.PI / 2);
  const x2 = centerX + radius * Math.cos(-Math.PI / 2 + paidAngle);
  const y2 = centerY + radius * Math.sin(-Math.PI / 2 + paidAngle);
  
  // Flag para arcos grandes (más de 180 grados)
  const largeArcFlag = paidAngle > Math.PI ? 1 : 0;
  
  // Path para la sección de pagadas
  const paidPath = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  
  // Path para la sección de no pagadas (el resto del círculo)
  const unpaidPath = `M ${centerX} ${centerY} L ${x2} ${y2} A ${radius} ${radius} 0 ${1 - largeArcFlag} 1 ${x1} ${y1} Z`;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Payment Status</h3>
          <p className="text-sm text-gray-600">Weekly orders payment breakdown</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-gray-800">{currentStats.totalOrders}</div>
          {changes.totalOrdersChange !== 0 && (
            <div className={`text-xs flex items-center justify-end gap-1 ${
              changes.totalOrdersChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <i className={`fas fa-arrow-${changes.totalOrdersChange > 0 ? 'up' : 'down'}`}></i>
              {Math.abs(changes.totalOrdersChange)}%
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex items-center">
        {/* SVG Pie Chart */}
        <div className="flex-1 flex justify-center">
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {/* Fondo gris claro */}
              <circle 
                cx="100" 
                cy="100" 
                r="80" 
                fill="#f3f4f6" 
                stroke="#e5e7eb" 
                strokeWidth="1"
              />
              
              {/* Sección de órdenes pagadas */}
              {currentStats.paidOrders > 0 && (
                <path
                  d={paidPath}
                  fill="#10B981"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              )}
              
              {/* Sección de órdenes no pagadas */}
              {currentStats.unpaidOrders > 0 && (
                <path
                  d={unpaidPath}
                  fill="#EF4444"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              )}
              
              {/* Círculo interior para crear efecto donut */}
              <circle 
                cx="100" 
                cy="100" 
                r="45" 
                fill="white" 
                stroke="#e5e7eb" 
                strokeWidth="1"
              />
            </svg>
            
            {/* Centro con estadísticas */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-800">{currentStats.totalOrders}</div>
              <div className="text-xs text-gray-600">Total Orders</div>
            </div>
            
            {/* Labels de porcentajes */}
            {currentStats.paidOrders > 0 && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
                  {paidPercentage.toFixed(1)}%
                </div>
              </div>
            )}
            
            {currentStats.unpaidOrders > 0 && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">
                  {unpaidPercentage.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col gap-4 ml-6 min-w-[200px]">
          {/* Paid Orders */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Paid Orders</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{currentStats.paidOrders}</div>
            <div className="text-sm text-gray-600">{currentStats.paidPercentage.toFixed(1)}% of total</div>
            <div className="text-xs text-gray-500">
              Income: ${(currentStats.paidIncome / 1000).toFixed(1)}K
            </div>
            {changes.paidOrdersChange !== 0 && (
              <div className={`text-xs flex items-center gap-1 mt-1 ${
                changes.paidOrdersChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <i className={`fas fa-arrow-${changes.paidOrdersChange > 0 ? 'up' : 'down'}`}></i>
                {Math.abs(changes.paidOrdersChange).toFixed(1)}% vs last week
              </div>
            )}
          </div>

          {/* Unpaid Orders */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Unpaid Orders</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{currentStats.unpaidOrders}</div>
            <div className="text-sm text-gray-600">{currentStats.unpaidPercentage.toFixed(1)}% of total</div>
            <div className="text-xs text-gray-500">
              Pending: ${(currentStats.unpaidIncome / 1000).toFixed(1)}K
            </div>
            {changes.unpaidOrdersChange !== 0 && (
              <div className={`text-xs flex items-center gap-1 mt-1 ${
                changes.unpaidOrdersChange > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                <i className={`fas fa-arrow-${changes.unpaidOrdersChange > 0 ? 'up' : 'down'}`}></i>
                {Math.abs(changes.unpaidOrdersChange).toFixed(1)}% vs last week
              </div>
            )}
          </div>

          {/* Previous Week Comparison */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="text-xs font-medium text-gray-700 mb-2">Previous Week</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Paid:</span>
                <span>{previousStats.paidOrders} ({previousStats.paidPercentage.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Unpaid:</span>
                <span>{previousStats.unpaidOrders} ({previousStats.unpaidPercentage.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Paid Orders ({currentStats.paidOrders})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-700">Unpaid Orders ({currentStats.unpaidOrders})</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusChart;