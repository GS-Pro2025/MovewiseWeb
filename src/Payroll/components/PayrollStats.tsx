import React from 'react';
import { formatCurrency } from '../util/PayrollUtil';
import { OperatorRowExtended } from '../types/payroll.types';

interface PayrollStatsProps {
  countDays: number;
  filteredOperators: OperatorRowExtended[];
  grouped: OperatorRowExtended[];
  searchTerm: string;
  paymentStats: {
    paid: number;
    unpaid: number;
    total: number;
    paidAmount: number;
    unpaidAmount: number;
  };
  filteredTotalGrand: number;
  totalGrand: number;
  totalExpenses: number;
  filteredTotalNet: number;
  totalNet: number;
}

export const PayrollStats: React.FC<PayrollStatsProps> = ({
  countDays,
  filteredOperators,
  grouped,
  searchTerm,
  paymentStats,
  filteredTotalGrand,
  totalGrand,
  totalExpenses,
  filteredTotalNet,
  totalNet,
}) => {
  return (
    <div className="bg-blue-700/0 rounded-2xl p-6 mb-6 shadow-lg relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 opacity-80"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {/* Working Days */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-100 rounded-lg p-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">{countDays}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Working Days</div>
        </div>

        {/* Total Operators */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-green-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 rounded-lg p-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {filteredOperators.length}
            {filteredOperators.length !== grouped.length && (
              <span className="text-lg text-gray-400"> / {grouped.length}</span>
            )}
          </div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            {searchTerm ? "Filtered" : "Total"} Operators
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-orange-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-orange-100 rounded-lg p-2">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{paymentStats.paid}</div>
              <div className="text-xs text-green-600 font-bold">Paid</div>
            </div>
            <div className="text-gray-400 font-bold">/</div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{paymentStats.unpaid}</div>
              <div className="text-xs text-red-600 font-bold">Pending</div>
            </div>
          </div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">Payment Status</div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-red-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-100 rounded-lg p-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xl font-bold text-red-600 mb-1">{formatCurrency(paymentStats.unpaidAmount)}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Pending Amount</div>
          {paymentStats.unpaid > 0 && (
            <div className="text-xs text-red-500 mt-1 font-semibold bg-red-50 rounded-md px-1 py-0.5">
              {paymentStats.unpaid} operator{paymentStats.unpaid !== 1 ? "s" : ""} pending
            </div>
          )}
        </div>

        

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-red-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-100 rounded-lg p-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </div>
          </div>
          <div className="text-xl font-bold text-red-600 mb-1">{formatCurrency(totalExpenses)}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total Expenses</div>
          {totalExpenses > 0 && (
            <div className="text-xs text-red-500 mt-1 font-semibold bg-red-50 rounded-md px-1 py-0.5">
              Deducted from pay
            </div>
          )}
        </div>

        {/* Total a Pagar (Neto) */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-emerald-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-emerald-100 rounded-lg p-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 mb-1">{formatCurrency(filteredTotalNet)}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total to Pay</div>
          <div className="text-xs text-emerald-500 mt-1 font-semibold bg-emerald-50 rounded-md px-1 py-0.5">
            After expenses
          </div>
          {searchTerm && (
            <div className="text-xs text-gray-500 mt-1">
              Full: {formatCurrency(totalNet)}
            </div>
          )}
        </div>{/* Grand Total (Sin descuentos) */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-100 rounded-lg p-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="text-xl font-bold text-purple-600 mb-1">{formatCurrency(filteredTotalGrand)}</div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Grand Total</div>
          <div className="text-xs text-purple-500 mt-1 font-semibold bg-purple-50 rounded-md px-1 py-0.5">
            Before expenses
          </div>
          {searchTerm && (
            <div className="text-xs text-gray-500 mt-1">
              Full: {formatCurrency(totalGrand)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};