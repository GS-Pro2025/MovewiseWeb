import { useState } from 'react';
import { Cost } from '../../domain/ModelsCost';

interface CostsTableDropdownProps {
  costs: Cost[];
  totalAmount: number;
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

const CostsTableDropdown: React.FC<CostsTableDropdownProps> = ({ costs, totalAmount }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(costs.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCosts = costs.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
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
            <span>Costs from Database Table</span>
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              {costs.length} ITEMS
            </span>
          </div>
        </td>
        <td className="px-6 py-3 text-right font-semibold" style={{ color: '#8b5cf6' }}>
          {formatCurrency(totalAmount)}
        </td>
        <td className="px-6 py-3 text-center text-gray-400 text-sm">
          Click to expand
        </td>
      </tr>

      {/* Tabla expandible */}
      {isExpanded && (
        <tr>
          <td colSpan={3} className="px-6 py-4 bg-purple-50">
            <div className="bg-white rounded-lg border-2 border-purple-200 overflow-hidden">
              {/* Header de la tabla */}
              <div className="bg-purple-600 text-white px-4 py-2 font-semibold text-sm flex items-center justify-between">
                <span>Database Costs Detail</span>
                <span className="text-xs bg-purple-700 px-2 py-1 rounded">
                  Showing {startIndex + 1}-{Math.min(endIndex, costs.length)} of {costs.length}
                </span>
              </div>

              {/* Tabla de costos */}
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-purple-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-purple-900">#</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-purple-900">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-purple-900">Type</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-purple-900">Amount</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-purple-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCosts.map((cost, index) => (
                      <tr 
                        key={cost.id_cost} 
                        className="border-b border-purple-100 hover:bg-purple-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                          {cost.description}
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className={`px-2 py-1 text-xs rounded-full font-semibold ${
                              cost.type.toUpperCase() === 'FIXED' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {cost.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#8b5cf6' }}>
                          {formatCurrency(cost.cost)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {formatDate(cost.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-purple-50 px-4 py-3 flex items-center justify-between border-t-2 border-purple-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevPage();
                    }}
                    disabled={currentPage === 0}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
                  >
                    ← Previous
                  </button>
                  
                  <span className="text-sm font-medium text-purple-900">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextPage();
                    }}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Footer con resumen */}
              <div className="bg-purple-100 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-purple-900">
                  Total Database Costs:
                </span>
                <span className="text-lg font-bold" style={{ color: '#8b5cf6' }}>
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default CostsTableDropdown;