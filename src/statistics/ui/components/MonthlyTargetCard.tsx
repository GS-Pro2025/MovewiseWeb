import React from 'react';

interface MonthlyTargetCardProps {
  percent: number;
  change: number;
  target: string;
  revenue: string;
  today: string;
  // NUEVAS PROPS PARA PAYROLL
  totalExpenses?: number;
  grandTotal?: number;
  previousExpenses?: number;
  previousGrandTotal?: number;
}

const MonthlyTargetCard: React.FC<MonthlyTargetCardProps> = ({
  percent,
  change,
  target,
  revenue,
  today,
  totalExpenses = 0,
  grandTotal = 0,
  previousExpenses = 0,
  previousGrandTotal = 0,
}) => {
  // Para el arco, usamos SVG simple
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = circumference * (1 - percent / 100);

  // Calcular cambios para expenses
  const expenseChange = previousExpenses > 0 
    ? ((totalExpenses - previousExpenses) / previousExpenses) * 100
    : 0;

  // Función para formatear currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para formatear números grandes
  const formatLargeNumber = (amount: number): string => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-md mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Weekly Payroll Target</h2>
        <p className="text-sm text-gray-400">Weekly payroll performance vs target</p>
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
            <span className="text-3xl font-bold text-gray-800">{percent.toFixed(1)}%</span>
            <span className={`mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {change >= 0 ? '+' : ''}
              {change}%
            </span>
          </div>
        </div>
        
        <div className="text-center text-gray-500 text-sm mb-4">
          Weekly grand total: <span className="font-semibold text-gray-700">{formatLargeNumber(grandTotal)}</span><br />
          {change >= 0 ? "Higher than last week. Great work!" : "Lower than last week. Room for improvement."}
        </div>
      </div>

      {/* Grid con 4 elementos: Target, Revenue, Today, Expenses */}
      <div className="grid grid-cols-2 gap-3 border-t pt-4 mt-2 text-center text-sm">
        <div>
          <div className="text-gray-400">Target</div>
          <div className="font-bold text-gray-700 text-lg flex items-center justify-center gap-1">
            {target}
            <span className="text-blue-500 text-sm">🎯</span>
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Grand Total</div>
          <div className="font-bold text-gray-700 text-lg flex items-center justify-center gap-1">
            {revenue}
            <span className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? '↑' : '↓'}
            </span>
          </div>
        </div>
              
        
        <div>
          <div className="text-gray-400">Daily Avg</div>
          <div className="font-semibold text-gray-700 flex items-center justify-center gap-1">
            {today}
            <span className="text-blue-500 text-xs">📊</span>
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Expenses</div>
          <div className="font-semibold text-gray-700 flex items-center justify-center gap-1">
            {formatLargeNumber(totalExpenses)}
            <span className={`text-xs ${expenseChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {expenseChange <= 0 ? '↓' : '↑'}
            </span>
          </div>
        </div>
      </div>

      {/* Información adicional de comparación */}
      <div className="mt-4 pt-3 border-t text-xs text-gray-500">
        <div className="flex justify-between">
          <span>vs Previous Week:</span>
          <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
            {change >= 0 ? '+' : ''}{formatCurrency(grandTotal - previousGrandTotal)}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Expense Change:</span>
          <span className={expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}>
            {expenseChange >= 0 ? '+' : ''}{formatCurrency(totalExpenses - previousExpenses)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTargetCard;