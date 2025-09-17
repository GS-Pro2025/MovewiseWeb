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
      <div 
        className="rounded-2xl shadow-lg p-6 border-2"
        style={{ 
          backgroundColor: '#ffffff',
          borderColor: '#0B2863'
        }}
      >
        <div className="flex items-center justify-center h-80">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
              <div 
                className="w-12 h-12 border-4 rounded-full animate-spin absolute top-0 left-0"
                style={{ 
                  borderColor: '#0B2863',
                  borderTopColor: 'transparent'
                }}
              ></div>
            </div>
            <span className="text-lg font-semibold" style={{ color: '#0B2863' }}>
              Loading payment status...
            </span>
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

  const ChangeIndicator = ({ change, positive }: { change: number, positive?: boolean }) => {
    if (change === 0) return null;
    
    const isPositive = positive !== undefined ? positive : change > 0;
    return (
      <div className={`text-xs flex items-center gap-1 mt-1 font-semibold ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'}`}></i>
        {Math.abs(change).toFixed(1)}% vs last week
      </div>
    );
  };

  return (
    <div 
      className="rounded-2xl shadow-lg p-6 border-2"
      style={{ 
        backgroundColor: '#ffffff',
        borderColor: '#0B2863'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <h3 className="text-2xl font-bold" style={{ color: '#0B2863' }}>
              Payment Status
            </h3>
          </div>
          <p className="text-gray-600 font-medium">
            Weekly orders payment breakdown
          </p>
        </div>
        <div className="text-right">
          <div 
            className="text-sm font-semibold mb-1"
            style={{ color: '#0B2863' }}
          >
            Total Orders
          </div>
          <div 
            className="text-3xl font-bold mb-1"
            style={{ color: '#0B2863' }}
          >
            {currentStats.totalOrders}
          </div>
          <ChangeIndicator change={changes.totalOrdersChange} />
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* SVG Pie Chart */}
        <div className="flex-1 flex justify-center">
          <div className="relative">
            <svg width="240" height="240" viewBox="0 0 200 200" className="transform -rotate-90">
              {/* Fondo gris claro */}
              <circle 
                cx="100" 
                cy="100" 
                r="80" 
                fill="#f8fafc" 
                stroke="#e5e7eb" 
                strokeWidth="2"
              />
              
              {/* Sección de órdenes pagadas */}
              {currentStats.paidOrders > 0 && (
                <path
                  d={paidPath}
                  fill="#22c55e"
                  stroke="white"
                  strokeWidth="3"
                  className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-lg"
                />
              )}
              
              {/* Sección de órdenes no pagadas */}
              {currentStats.unpaidOrders > 0 && (
                <path
                  d={unpaidPath}
                  fill="#FFE67B"
                  stroke="white"
                  strokeWidth="3"
                  className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-lg"
                />
              )}
              
              {/* Círculo interior para crear efecto donut */}
              <circle 
                cx="100" 
                cy="100" 
                r="50" 
                fill="white" 
                stroke="#0B2863" 
                strokeWidth="2"
              />
            </svg>
            
            {/* Centro con estadísticas */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div 
                className="text-3xl font-bold"
                style={{ color: '#0B2863' }}
              >
                {currentStats.totalOrders}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                Total Orders
              </div>
            </div>
            
            {/* Labels de porcentajes */}
            {currentStats.paidOrders > 0 && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                <div 
                  className="text-sm px-3 py-1 rounded-full font-bold text-white shadow-lg"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  {paidPercentage.toFixed(1)}%
                </div>
              </div>
            )}
            
            {currentStats.unpaidOrders > 0 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div 
                  className="text-sm px-3 py-1 rounded-full font-bold shadow-lg"
                  style={{ 
                    backgroundColor: '#FFE67B',
                    color: '#0B2863'
                  }}
                >
                  {unpaidPercentage.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[280px]">
          {/* Paid Orders */}
          <div 
            className="border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: '#f0fdf4',
              borderColor: '#22c55e'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              ></div>
              <span 
                className="font-semibold"
                style={{ color: '#0B2863' }}
              >
                Paid Orders
              </span>
            </div>
            <div 
              className="text-3xl font-bold mb-1"
              style={{ color: '#22c55e' }}
            >
              {currentStats.paidOrders}
            </div>
            <div 
              className="text-sm font-medium mb-2"
              style={{ color: '#0B2863' }}
            >
              {currentStats.paidPercentage.toFixed(1)}% of total
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Income: 
              <span 
                className="font-bold ml-1"
                style={{ color: '#22c55e' }}
              >
                ${(currentStats.paidIncome / 1000).toFixed(1)}K
              </span>
            </div>
            <ChangeIndicator change={changes.paidOrdersChange} />
          </div>

          {/* Unpaid Orders */}
          <div 
            className="border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: '#fffbeb',
              borderColor: '#FFE67B'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#FFE67B' }}
              ></div>
              <span 
                className="font-semibold"
                style={{ color: '#0B2863' }}
              >
                Unpaid Orders
              </span>
            </div>
            <div 
              className="text-3xl font-bold mb-1"
              style={{ color: '#0B2863' }}
            >
              {currentStats.unpaidOrders}
            </div>
            <div 
              className="text-sm font-medium mb-2"
              style={{ color: '#0B2863' }}
            >
              {currentStats.unpaidPercentage.toFixed(1)}% of total
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Pending: 
              <span 
                className="font-bold ml-1"
                style={{ color: '#0B2863' }}
              >
                ${(currentStats.unpaidIncome / 1000).toFixed(1)}K
              </span>
            </div>
            <ChangeIndicator change={changes.unpaidOrdersChange} positive={changes.unpaidOrdersChange < 0} />
          </div>

          {/* Previous Week Comparison */}
          <div 
            className="border-2 rounded-xl p-4 transition-all duration-200"
            style={{ 
              backgroundColor: '#f8fafc',
              borderColor: '#0B2863'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📈</span>
              <span 
                className="font-semibold"
                style={{ color: '#0B2863' }}
              >
                Previous Week
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Paid:</span>
                <div className="flex items-center gap-2">
                  <span 
                    className="font-bold"
                    style={{ color: '#22c55e' }}
                  >
                    {previousStats.paidOrders}
                  </span>
                  <span 
                    className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ 
                      backgroundColor: '#22c55e',
                      color: '#ffffff'
                    }}
                  >
                    {previousStats.paidPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Unpaid:</span>
                <div className="flex items-center gap-2">
                  <span 
                    className="font-bold"
                    style={{ color: '#0B2863' }}
                  >
                    {previousStats.unpaidOrders}
                  </span>
                  <span 
                    className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ 
                      backgroundColor: '#FFE67B',
                      color: '#0B2863'
                    }}
                  >
                    {previousStats.unpaidPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div 
        className="flex flex-wrap justify-center gap-6 mt-6 pt-4 border-t-2"
        style={{ borderTopColor: '#0B2863' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-5 h-5 rounded shadow-sm"
            style={{ backgroundColor: '#22c55e' }}
          ></div>
          <span 
            className="font-semibold"
            style={{ color: '#0B2863' }}
          >
            Paid Orders ({currentStats.paidOrders})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="w-5 h-5 rounded shadow-sm"
            style={{ backgroundColor: '#FFE67B' }}
          ></div>
          <span 
            className="font-semibold"
            style={{ color: '#0B2863' }}
          >
            Unpaid Orders ({currentStats.unpaidOrders})
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusChart;