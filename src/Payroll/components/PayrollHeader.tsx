import React from 'react';
import { useTranslation } from 'react-i18next';

export const PayrollHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-[#0B2845] rounded-full shadow-lg">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold bg-[#0B2863] bg-clip-text text-transparent mb-3">
        {t('payroll.header.title')}
      </h1>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 rounded-full border border-blue-200">
        <svg className="w-4 h-4 text-[#0B2863]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-[#0B2863] font-medium text-sm">
          {t('payroll.header.subtitle')}
        </span>
      </div>
    </div>
  );
};