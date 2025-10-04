import React from 'react';
import { weekdayKeys } from '../../models/payrroll';
import { formatCurrency, formatDateForHeader } from '../util/PayrollUtil';
import { OperatorRowExtended } from '../types/payroll.types';
import IconButton from '@mui/material/IconButton';
import EmailIcon from '@mui/icons-material/Email';
import Tooltip from '@mui/material/Tooltip';

interface PayrollTableProps {
  filteredOperators: OperatorRowExtended[];
  weekDates: { [key: string]: string };
  searchTerm: string;
  onOperatorClick: (operator: OperatorRowExtended) => void;
  onSendEmail: (operator: OperatorRowExtended) => void; // <-- NUEVO
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  filteredOperators,
  weekDates,
  searchTerm,
  onOperatorClick,
  onSendEmail, // <-- NUEVO
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-b-2 border-blue-200">
              <th className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wide text-xs">
                Actions
              </th>
              <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                Pay
              </th>
              <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                Code
              </th>
              <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                Cost
              </th>
              <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                Name
              </th>
              <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                Last Name
              </th>
              {weekdayKeys.map((day) => {
                const dateStr = weekDates[day];
                const displayDate = dateStr ? formatDateForHeader(dateStr) : day;
                return (
                  <th
                    key={day}
                    className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wide text-xs border-l border-gray-200"
                  >
                    <div className="text-xs text-gray-500 font-semibold mb-1">{day}</div>
                    <div className="font-bold text-gray-800">{displayDate}</div>
                  </th>
                );
              })}
              <th className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wide text-xs border-l-2 border-blue-300">
                Additional Bonuses
              </th>
              <th className="py-3 px-4 text-center font-bold text-red-600 uppercase tracking-wide text-xs border-l border-gray-200">
                Expenses
              </th>
              <th className="py-3 px-4 text-center font-bold text-purple-600 uppercase tracking-wide text-xs border-l border-gray-200">
                💰 Grand Total
              </th>
              <th className="py-3 px-4 text-center font-bold text-emerald-600 uppercase tracking-wide text-xs border-l border-gray-200">
                💎 Total to Pay
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOperators.length ? (
              filteredOperators.map((r, index) => (
                <tr
                  key={r.code}
                  className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="py-2 px-4 text-center">
                    <Tooltip title={`Send payment summary to ${r.name} ${r.lastName}`}>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendEmail(r);
                        }}
                        size="small"
                        sx={{ color: '#3b82f6' }}
                      >
                        <EmailIcon />
                      </IconButton>
                    </Tooltip>
                  </td>
                  <td 
                    className="py-2 px-4 text-center cursor-pointer"
                    onClick={() => onOperatorClick(r)}
                  >
                    {r.pay != null ? (
                      <span className="text-xl">✅</span>
                    ) : (
                      <span className="text-xl">⚠️</span>
                    )}
                  </td>
                  <td 
                    className="py-2 px-4 font-bold text-gray-800 cursor-pointer"
                    onClick={() => onOperatorClick(r)}
                  >
                    {r.code}
                  </td>
                  <td className="py-2 px-4 font-semibold text-gray-700">{formatCurrency(r.cost)}</td>
                  <td className="py-2 px-4 font-semibold text-gray-700">{r.name}</td>
                  <td className="py-2 px-4 font-semibold text-gray-700">{r.lastName}</td>
                  {weekdayKeys.map((day) => {
                    const value = r[day];
                    return (
                      <td key={day} className="py-2 px-4 text-center border-l border-gray-100">
                        {value ? (
                          <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md text-sm">
                            {formatCurrency(value)}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-semibold">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-4 text-center font-bold text-blue-600 border-l-2 border-blue-200 bg-blue-50">
                    {formatCurrency(r.additionalBonuses || 0)}
                  </td>
                  <td className="py-2 px-4 text-center font-bold text-red-600 border-l border-gray-200">
                    {r.expense && r.expense > 0 ? (
                      <span className="bg-red-100 px-2 py-1 rounded-lg border border-red-200 text-sm">
                        -{formatCurrency(r.expense)}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-semibold">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-center font-bold text-purple-600 border-l border-gray-200 bg-purple-50">
                    {formatCurrency(r.grandTotal || 0)}
                  </td>
                  <td className="py-2 px-4 text-center font-bold text-emerald-600 border-l border-gray-200 bg-emerald-50">
                    {formatCurrency(r.netTotal || 0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={weekdayKeys.length + 11} // +1 for new Actions column
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-bold text-xl">
                      {searchTerm
                        ? `No operators found matching "${searchTerm}"`
                        : "No data available"}
                    </p>
                    <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};