import React from 'react';

interface StatItem {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface StatsComparisonCardProps {
  title?: string;
  stats: StatItem[];
  onStatClick?: (stat: StatItem, index: number) => void; // NUEVO
}

const StatsComparisonCard: React.FC<StatsComparisonCardProps> = ({
  title = "Performance Overview",
  stats,
  onStatClick // NUEVO
}) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        border: 'border-green-200'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        border: 'border-purple-200'
      },
      orange: {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        border: 'border-orange-200'
      },
      red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        border: 'border-red-200'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">Compare key metrics and performance indicators</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const colorClasses = getColorClasses(stat.color);
          const isPositive = stat.change >= 0;
          const isClickable = stat.label.includes('Total Orders') && onStatClick;
          
          return (
            <div
              key={index}
              className={`relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-l-4 ${colorClasses.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                isClickable ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300' : ''
              }`}
              onClick={() => isClickable && onStatClick(stat, index)}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colorClasses.bg} mb-4`}>
                <i className={`fas ${stat.icon} text-xl ${colorClasses.icon}`}></i>
              </div>
              
              {/* Content */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </p>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </h3>
                  <div className={`flex items-center text-sm font-semibold ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <i className={`fas ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs mr-1`}></i>
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      isPositive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.abs(stat.change) * 5, 100)}%` }}
                  ></div>
                </div>
                
                <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? 'Increased' : 'Decreased'} from last week
                </p>
              </div>
              
              {/* Indicador de clickeable */}
              {isClickable && (
                <div className="absolute bottom-3 right-3 text-blue-500 text-sm">
                  <i className="fas fa-external-link-alt"></i>
                </div>
              )}
              
              {/* Decorative element */}
              <div className={`absolute top-4 right-4 w-8 h-8 ${colorClasses.bg} rounded-full opacity-20`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsComparisonCard;