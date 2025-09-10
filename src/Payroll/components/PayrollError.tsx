import React from 'react';

interface PayrollErrorProps {
  error: string;
}

export const PayrollError: React.FC<PayrollErrorProps> = ({ error }) => {
  return (
    <div className="bg-red-50 border-l-8 border-red-400 p-6 mb-8 rounded-r-2xl shadow-lg">
      <div className="flex items-center">
        <div className="bg-red-100 rounded-xl p-3 mr-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-700 font-bold text-lg">{error}</p>
      </div>
    </div>
  );
};