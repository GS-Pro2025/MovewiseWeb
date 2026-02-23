import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, CheckCircle, AlertCircle, DollarSign, Wallet, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../util/PayrollUtil';
import { OperatorRowExtended } from '../types/payroll.types';

interface PayrollStatsProps {
  countDays: number;
  filteredOperators: OperatorRowExtended[];
  grouped: OperatorRowExtended[];
  searchTerm: string;
  paymentStats: {
    paid: number; unpaid: number; total: number; paidAmount: number; unpaidAmount: number;
  };
  filteredTotalGrand: number;
  totalGrand: number;
  totalExpenses: number;
  filteredTotalNet: number;
  totalNet: number;
}

export const PayrollStats: React.FC<PayrollStatsProps> = ({
  countDays, filteredOperators, grouped, searchTerm,
  paymentStats, filteredTotalGrand, totalGrand,
  totalExpenses, filteredTotalNet, totalNet,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-blue-700/0 rounded-2xl p-6 mb-6 shadow-lg relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 opacity-80" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">

        {/* Working Days */}
        <div className="bg-white rounded-xl p-4 shadow-md border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ borderColor: '#0B2863' }}>
          <div className="flex justify-center mb-2">
            <div className="bg-blue-100 rounded-lg p-2"><Calendar className="w-5 h-5 text-blue-600" /></div>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1 text-center">{countDays}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">
            {t('payroll.stats.workingDays')}
          </div>
        </div>

        {/* Total Operators */}
        <div className="bg-white rounded-xl p-4 shadow-md border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ borderColor: '#0B2863' }}>
          <div className="flex justify-center mb-2">
            <div className="bg-green-100 rounded-lg p-2"><Users className="w-5 h-5 text-green-600" /></div>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1 text-center">
            {filteredOperators.length}
            {filteredOperators.length !== grouped.length && (
              <span className="text-lg text-gray-400"> / {grouped.length}</span>
            )}
          </div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">
            {searchTerm ? t('payroll.stats.filteredOperators') : t('payroll.stats.totalOperators')}
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-xl p-4 shadow-md border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ borderColor: '#0B2863' }}>
          <div className="flex justify-center mb-2">
            <div className="bg-orange-100 rounded-lg p-2"><CheckCircle className="w-5 h-5 text-orange-600" /></div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{paymentStats.paid}</div>
              <div className="text-xs text-green-600 font-bold">{t('payroll.stats.paid')}</div>
            </div>
            <div className="text-gray-400 font-bold">/</div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{paymentStats.unpaid}</div>
              <div className="text-xs text-red-600 font-bold">{t('payroll.stats.pending')}</div>
            </div>
          </div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">
            {t('payroll.stats.paymentStatus')}
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white rounded-xl p-4 shadow-md border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ borderColor: '#0B2863' }}>
          <div className="flex justify-center mb-2">
            <div className="bg-red-100 rounded-lg p-2"><AlertCircle className="w-5 h-5 text-red-600" /></div>
          </div>
          <div className="text-xl font-bold text-red-600 mb-1 text-center">
            {formatCurrency(paymentStats.unpaidAmount)}
          </div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">
            {t('payroll.stats.pendingAmount')}
          </div>
          {paymentStats.unpaid > 0 && (
            <div className="text-xs text-red-500 mt-1 font-semibold bg-red-50 rounded-md px-1 py-0.5 text-center">
              {t(
                paymentStats.unpaid !== 1 ? 'payroll.stats.operatorsPending_plural' : 'payroll.stats.operatorsPending',
                { count: paymentStats.unpaid }
              )}
            </div>
          )}
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-4 shadow-md border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ borderColor: '#0B2863' }}>
          <div className="flex justify-center mb-2">
            <div className="bg-red-100 rounded-lg p-2"><TrendingDown className="w-5 h-5 text-red-600" /></div>
          </div>
          <div className="text-xl font-bold text-red-600 mb-1 text-center">{formatCurrency(totalExpenses)}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">
            {t('payroll.stats.totalExpenses')}
          </div>
          {totalExpenses > 0 && (
            <div className="text-xs text-red-500 mt-1 font-semibold bg-red-50 rounded-md px-1 py-0.5 text-center">
              {t('payroll.stats.deductedFromPay')}
            </div>
          )}
        </div>

        {/* Total to Pay */}
        <div className="bg-white rounded-xl p-4 shadow-md border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ borderColor: '#0B2863' }}>
          <div className="flex justify-center mb-2">
            <div className="bg-emerald-100 rounded-lg p-2"><Wallet className="w-5 h-5 text-emerald-600" /></div>
          </div>
          <div className="text-xl font-bold text-emerald-600 mb-1 text-center">{formatCurrency(filteredTotalNet)}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">
            {t('payroll.stats.totalToPay')}
          </div>
          <div className="text-xs text-emerald-500 mt-1 font-semibold bg-emerald-50 rounded-md px-1 py-0.5 text-center">
            {t('payroll.stats.afterExpenses')}
          </div>
          {searchTerm && (
            <div className="text-xs text-gray-500 mt-1 text-center">
              {t('payroll.stats.full', { amount: formatCurrency(totalNet) })}
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="bg-white rounded-xl p-4 shadow-md border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ borderColor: '#0B2863' }}>
          <div className="flex justify-center mb-2">
            <div className="bg-purple-100 rounded-lg p-2"><DollarSign className="w-5 h-5 text-purple-600" /></div>
          </div>
          <div className="text-xl font-bold text-purple-600 mb-1 text-center">{formatCurrency(filteredTotalGrand)}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">
            {t('payroll.stats.grandTotal')}
          </div>
          <div className="text-xs text-purple-500 mt-1 font-semibold bg-purple-50 rounded-md px-1 py-0.5 text-center">
            {t('payroll.stats.beforeExpenses')}
          </div>
          {searchTerm && (
            <div className="text-xs text-gray-500 mt-1 text-center">
              {t('payroll.stats.full', { amount: formatCurrency(totalGrand) })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};