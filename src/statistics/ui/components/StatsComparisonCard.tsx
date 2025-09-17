import React from 'react';

interface StatItem {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}

interface StatsComparisonCardProps {
  title?: string;
  stats: StatItem[];
  onStatClick?: (stat: StatItem, index: number) => void;
}

const StatsComparisonCard: React.FC<StatsComparisonCardProps> = ({
  title = "Performance Overview",
  stats,
  onStatClick
}) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'rgba(11, 40, 99, 0.1)',
        border: '#0B2863',
        text: '#0B2863'
      },
      green: {
        bg: 'rgba(34, 197, 94, 0.1)',
        border: '#22c55e',
        text: '#22c55e'
      },
      orange: {
        bg: 'rgba(240, 159, 82, 0.1)',
        border: '#F09F52',
        text: '#F09F52'
      },
      red: {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: '#ef4444',
        text: '#ef4444'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white border-2 rounded-xl shadow-lg p-6 w-full max-w-6xl mx-auto" style={{ borderColor: '#0B2863' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <i className="fas fa-chart-bar text-white text-lg"></i>
          </div>
          <h2 className="text-xl font-bold" style={{ color: '#0B2863' }}>{title}</h2>
        </div>
        <p className="text-sm text-gray-600 font-medium">Compare key metrics and performance indicators</p>
      </div>
      
      {/* Main 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.slice(0, 3).map((stat, index) => {
          const colorClasses = getColorClasses(stat.color);
          const isPositive = stat.change >= 0;
          const isClickable = onStatClick;
          
          return (
            <div
              key={index}
              className={`bg-white border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                isClickable ? 'cursor-pointer' : ''
              }`}
              style={{ 
                borderColor: colorClasses.border,
                backgroundColor: colorClasses.bg
              }}
              onClick={() => isClickable && onStatClick(stat, index)}
            >
              {/* Header with Icon */}
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
                  style={{ backgroundColor: colorClasses.bg, borderColor: colorClasses.border }}
                >
                  <i className={`fas ${stat.icon} text-xl`} style={{ color: colorClasses.text }}></i>
                </div>
                <div className={`flex items-center text-sm font-bold px-3 py-1 rounded-full ${
                  isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <i className={`fas ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs mr-1`}></i>
                  {Math.abs(stat.change)}%
                </div>
              </div>
              
              {/* Content */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-bold" style={{ color: '#0B2863' }}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </h3>
                
                {/* Progress indicator */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      isPositive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.abs(stat.change) * 2, 100)}%` }}
                  ></div>
                </div>
                
                <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? 'Increased' : 'Decreased'} from last period
                </p>
              </div>
              
              {/* Click indicator */}
              {isClickable && (
                <div className="absolute top-3 right-3 opacity-60">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Metrics Section */}
      {stats.length > 3 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-white text-sm"></i>
            </div>
            <h3 className="text-lg font-bold" style={{ color: '#0B2863' }}>Additional Metrics</h3>
          </div>
          
          <div className="bg-gray-50 border-2 rounded-xl p-6" style={{ borderColor: '#e5e7eb' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.slice(3).map((stat, index) => {
                const colorClasses = getColorClasses(stat.color);
                const isPositive = stat.change >= 0;
                
                return (
                  <div key={index + 3} className="text-center">
                    <div 
                      className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-3 border-2"
                      style={{ backgroundColor: colorClasses.bg, borderColor: colorClasses.border }}
                    >
                      <i className={`fas ${stat.icon} text-2xl`} style={{ color: colorClasses.text }}></i>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <div className="text-xl font-bold" style={{ color: '#0B2863' }}>
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </div>
                      
                      <div className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-full ${
                        isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        <i className={`fas ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs mr-1`}></i>
                        {Math.abs(stat.change)}%
                      </div>
                      
                      {/* Mini progress bar */}
                      <div className="w-full bg-gray-300 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-1000 ${
                            isPositive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(Math.abs(stat.change) * 2, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsComparisonCard;