// components/FinancialSummaryCards.tsx
import React from 'react';
import { Typography } from '@mui/material';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Income Card */}
      <div 
        className="rounded-2xl shadow-lg border-2 transform hover:scale-105 transition-all duration-300"
        style={{ 
          background: 'linear-gradient(135deg, #0B2863 0%, #1e40af 100%)',
          borderColor: '#0B2863'
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">💰</span>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 230, 123, 0.2)' }}
            >
              <span className="text-lg font-bold" style={{ color: '#FFE67B' }}>$</span>
            </div>
          </div>
          <Typography variant="h6" className="!text-white !font-semibold !mb-2">
            Total Income
          </Typography>
          <Typography variant="h3" className="!text-white !font-bold">
            ${summary.totalIncome.toLocaleString()}
          </Typography>
          <div className="mt-3 text-sm opacity-90 text-white">
            Revenue generated
          </div>
        </div>
      </div>

      {/* Total Cost Card */}
      <div 
        className="rounded-2xl shadow-lg border-2 transform hover:scale-105 transition-all duration-300"
        style={{ 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderColor: '#ef4444'
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">💸</span>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <span className="text-lg font-bold text-white">-</span>
            </div>
          </div>
          <Typography variant="h6" className="!text-white !font-semibold !mb-2">
            Total Cost
          </Typography>
          <Typography variant="h3" className="!text-white !font-bold">
            ${summary.totalCost.toLocaleString()}
          </Typography>
          <div className="mt-3 text-sm opacity-90 text-white">
            Total expenses
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div 
        className="rounded-2xl shadow-lg border-2 transform hover:scale-105 transition-all duration-300"
        style={{ 
          background: summary.totalProfit >= 0 
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderColor: summary.totalProfit >= 0 ? '#22c55e' : '#ef4444'
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">{summary.totalProfit >= 0 ? '📈' : '📉'}</span>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <span className="text-lg font-bold text-white">
                {summary.totalProfit >= 0 ? '+' : '-'}
              </span>
            </div>
          </div>
          <Typography variant="h6" className="!text-white !font-semibold !mb-2">
            Net Profit
          </Typography>
          <Typography variant="h3" className="!text-white !font-bold">
            ${summary.totalProfit.toLocaleString()}
          </Typography>
          <div className="mt-3 text-sm opacity-90 text-white">
            {summary.totalProfit >= 0 ? 'Profit margin' : 'Loss amount'}
          </div>
        </div>
      </div>

      {/* Orders Status Card */}
      <div 
        className="rounded-2xl shadow-lg border-2 transform hover:scale-105 transition-all duration-300"
        style={{ 
          background: 'linear-gradient(135deg, #FFE67B 0%, #fbbf24 100%)',
          borderColor: '#FFE67B'
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📋</span>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(11, 40, 99, 0.1)' }}
            >
              <span className="text-lg font-bold" style={{ color: '#0B2863' }}>#</span>
            </div>
          </div>
          <Typography 
            variant="h6" 
            className="!font-semibold !mb-4"
            style={{ color: '#0B2863' }}
          >
            Orders Status
          </Typography>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white bg-green-500"
              >
                {summary.paidOrders} Paid
              </span>
              <span className="text-lg font-bold" style={{ color: '#0B2863' }}>
                {summary.paidOrders}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border-2"
                style={{ 
                  color: '#0B2863',
                  borderColor: '#0B2863',
                  backgroundColor: 'rgba(11, 40, 99, 0.1)'
                }}
              >
                {summary.unpaidOrders} Unpaid
              </span>
              <span className="text-lg font-bold" style={{ color: '#0B2863' }}>
                {summary.unpaidOrders}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(11, 40, 99, 0.2)' }}>
            <Typography 
              variant="caption" 
              className="!font-medium"
              style={{ color: '#0B2863' }}
            >
              Total: {summary.paidOrders + summary.unpaidOrders} orders
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryCards;