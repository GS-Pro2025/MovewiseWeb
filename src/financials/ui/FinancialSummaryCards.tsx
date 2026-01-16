// components/FinancialSummaryCards.tsx
import React from 'react';
import { Typography } from '@mui/material';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  TrendingDown as Loss,
  FileText,
} from 'lucide-react';

interface FinancialSummary {
  totalIncome: number;
  totalCost: number;
  totalProfit: number;
  paidOrders: number;
  unpaidOrders: number;
}

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
}

const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">

      {/* Income */}
      <MiniCard
        label="Income"
        value={`$${summary.totalIncome.toLocaleString()}`}
        color="text-blue-700"
        icon={<DollarSign size={16} />}
      />

      {/* Cost */}
      <MiniCard
        label="Cost"
        value={`$${summary.totalCost.toLocaleString()}`}
        color="text-red-600"
        icon={<TrendingDown size={16} />}
      />

      {/* Profit */}
      <MiniCard
        label="Profit"
        value={`$${summary.totalProfit.toLocaleString()}`}
        color={summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}
        icon={summary.totalProfit >= 0 ? <TrendingUp size={16} /> : <Loss size={16} />}
      />

      {/* Paid Orders */}
      <MiniCard
        label="Paid"
        value={summary.paidOrders}
        color="text-green-700"
        icon={<FileText size={16} />}
      />

      {/* Unpaid Orders */}
      <MiniCard
        label="Unpaid"
        value={summary.unpaidOrders}
        color="text-gray-600"
        icon={<FileText size={16} />}
      />
    </div>
  );
};

interface MiniCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const MiniCard: React.FC<MiniCardProps> = ({ label, value, icon, color }) => (
  <div className="border rounded-lg px-3 py-2 flex items-center justify-between">
    <div>
      <Typography
        variant="caption"
        className="!text-xs !font-medium text-gray-500 uppercase"
      >
        {label}
      </Typography>

      <Typography
        variant="body1"
        className={`!font-semibold ${color}`}
      >
        {value}
      </Typography>
    </div>

    <div className={`${color} opacity-80`}>
      {icon}
    </div>
  </div>
);

export default FinancialSummaryCards;
