import React from 'react';
import LoaderSpinner from "../../components/Login_Register/LoadingSpinner";

export const PayrollLoading: React.FC = () => {
  return (
    <div className="bg-white/0 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-12">
      <div className="flex flex-col items-center justify-center">
        <div className="transform scale-75">
          <LoaderSpinner />
        </div>
        <p className="text-gray-500 mt-4 font-medium">
          Loading payroll data...
        </p>
      </div>
    </div>
  );
};