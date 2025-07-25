import React from 'react';

interface MonthlyTargetCardProps {
  percent: number; // 0-100
  change: number; // porcentaje de cambio, ej: 10 para +10%
  target: string;
  revenue: string;
  today: string;
}

const MonthlyTargetCard: React.FC<MonthlyTargetCardProps> = ({
  percent,
  change,
  target,
  revenue,
  today,
}) => {
  // Para el arco, usamos SVG simple
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = circumference * (1 - percent / 100);

  return (
    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-md mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Monthly Target</h2>
        <p className="text-sm text-gray-400">Target you’ve set for each month</p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="relative mb-2">
          <svg height={radius * 2} width={radius * 2}>
            <circle
              stroke="#E5E7EB"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#6366F1"
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference + ' ' + circumference}
              strokeDashoffset={progress}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              style={{ transition: 'stroke-dashoffset 0.5s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{percent}%</span>
            <span className={`mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {change >= 0 ? '+' : ''}
              {change}%
            </span>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm mb-4">
          You earn <span className="font-semibold text-gray-700">{today}</span> today, it's higher than last month.<br />
          Keep up your good work!
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t pt-4 mt-2 text-center text-sm">
        <div>
          <div className="text-gray-400">Target</div>
          <div className="font-semibold text-gray-700 flex items-center justify-center gap-1">
            {target}
            <span className="text-red-500 text-xs">↓</span>
          </div>
        </div>
        <div>
          <div className="text-gray-400">Revenue</div>
          <div className="font-semibold text-gray-700 flex items-center justify-center gap-1">
            {revenue}
            <span className="text-green-500 text-xs">↑</span>
          </div>
        </div>
        <div>
          <div className="text-gray-400">Today</div>
          <div className="font-semibold text-gray-700 flex items-center justify-center gap-1">
            {today}
            <span className="text-green-500 text-xs">↑</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTargetCard;