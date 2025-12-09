/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { ExtraIncomeItem } from '../../domain/ModelsSummaryLight';
import { deleteExtraIncome, updateExtraIncome } from '../../data/ExtraIncomeRepository';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { enqueueSnackbar } from 'notistack';

interface IncomesTableDropdownProps {
  operatorsDiscount: number;
  extraIncomes: ExtraIncomeItem[];
  totalIncome: number;
  onIncomeDeleted?: (incomeId: number) => void;
  onIncomeUpdated?: (updatedIncome: ExtraIncomeItem) => void;
}

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const IncomesTableDropdown: React.FC<IncomesTableDropdownProps> = ({ 
  operatorsDiscount,
  extraIncomes,
  totalIncome,
  onIncomeDeleted,
  onIncomeUpdated
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; income: ExtraIncomeItem | null }>({
    open: false,
    income: null
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(extraIncomes.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentIncomes = extraIncomes.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleDeleteClick = (e: React.MouseEvent, income: ExtraIncomeItem) => {
    e.stopPropagation();
    setDeleteModal({ open: true, income });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.income) return;
    
    setActionLoading(deleteModal.income.id);
    try {
      await deleteExtraIncome(deleteModal.income.id);
      enqueueSnackbar('Extra income deleted successfully', { variant: 'success' });
      onIncomeDeleted?.(deleteModal.income.id);
      setDeleteModal({ open: false, income: null });
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Error deleting extra income', { variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent, income: ExtraIncomeItem) => {
    e.stopPropagation();
    setActionLoading(income.id);
    try {
      const updated = await updateExtraIncome(income.id, { is_active: !income.is_active });
      enqueueSnackbar('Extra income updated successfully', { variant: 'success' });
      onIncomeUpdated?.(updated.data);
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Error updating extra income', { variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      {/* Fila principal con el total */}
      <tr 
        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="px-6 py-3 pl-12 font-semibold text-gray-700">
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Extra Incomes Details</span>
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              {extraIncomes.length} ITEMS
            </span>
          </div>
        </td>
        <td className="px-6 py-3 text-right font-semibold" style={{ color: '#22c55e' }}>
          {formatCurrency(totalIncome)}
        </td>
        <td className="px-6 py-3 text-center text-gray-400 text-sm">
          Click to expand
        </td>
      </tr>

      {/* Tabla expandible */}
      {isExpanded && (
        <tr>
          <td colSpan={3} className="px-6 py-4 bg-green-50">
            <div className="bg-white rounded-lg border-2 border-green-200 overflow-hidden">
              {/* Header de la tabla */}
              <div className="bg-green-600 text-white px-4 py-3 font-semibold text-sm flex items-center justify-between">
                <span>Extra Incomes Detail</span>
                <span className="text-xs bg-green-700 px-2 py-1 rounded">
                  Showing {extraIncomes.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, extraIncomes.length)} of {extraIncomes.length}
                </span>
              </div>

              {/* Tabla de incomes */}
              {extraIncomes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No extra incomes added for this period</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-green-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-green-900">#</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-green-900">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-green-900">Type</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-green-900">Amount</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-green-900">Date</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-green-900">Status</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-green-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentIncomes.map((income, index) => (
                        <tr 
                          key={income.id} 
                          className="border-b border-green-100 hover:bg-green-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                            {income.description}
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className="px-2 py-1 text-xs rounded-full font-semibold bg-blue-100 text-blue-700"
                            >
                              {income.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#22c55e' }}>
                            {formatCurrency(income.value)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {formatDate(income.date)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => handleToggleActive(e, income)}
                              disabled={actionLoading === income.id}
                              className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                income.is_active 
                                  ? 'bg-green-200 text-green-800 hover:bg-green-300' 
                                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                              }`}
                            >
                              {actionLoading === income.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                              ) : (
                                income.is_active ? 'Active' : 'Inactive'
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => handleDeleteClick(e, income)}
                              disabled={actionLoading === income.id}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                            >
                              {actionLoading === income.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-trash text-xs"></i>
                                  Delete
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-green-50 px-4 py-3 flex items-center justify-between border-t-2 border-green-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevPage();
                    }}
                    disabled={currentPage === 0}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                  >
                    ← Previous
                  </button>
                  
                  <span className="text-sm font-medium text-green-900">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextPage();
                    }}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Footer con resumen - incluye operators_discount */}
              <div className="bg-green-100 px-4 py-3 border-t-2 border-green-200">
                <div className="space-y-2">
                    <div className="flex items-center justify-between border-t border-green-200 pt-2">
                        <span className="text-sm font-semibold text-green-900">
                        Total Extra Incomes:
                        </span>
                        <span className="text-lg font-bold" style={{ color: '#22c55e' }}>
                        {formatCurrency(extraIncomes.reduce((sum, inc) => sum + inc.value, 0))}
                        </span>
                    </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-900">
                      Operators Discount:
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#22c55e' }}>
                      {formatCurrency(operatorsDiscount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-green-300 pt-2 bg-green-50 -mx-4 -my-3 px-4 py-3">
                    <span className="text-sm font-bold text-green-900">
                      Total Incomes:
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#22c55e' }}>
                      {formatCurrency(totalIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Delete Modal */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, income: null })}
        onConfirm={handleDeleteConfirm}
        costDescription={`Extra Income: ${deleteModal.income?.description || ""}`}
        loading={actionLoading === deleteModal.income?.id}
      />
    </>
  );
};

export default IncomesTableDropdown;