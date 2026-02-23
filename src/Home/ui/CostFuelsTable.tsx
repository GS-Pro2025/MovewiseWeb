import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Fuel, DollarSign, Gauge, Calendar } from 'lucide-react';
import { CostFuelByOrderData } from '../../addFuelCostToOrder/domain/AssignOrderToCostFuelModels';

interface CostFuelsTableProps {
  costFuels: CostFuelByOrderData[];
  onAddFuelCost?: () => void;
}

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  gray: '#6b7280',
  fuel: '#ef4444',
};

const CostFuelsTable: React.FC<CostFuelsTableProps> = ({ costFuels, onAddFuelCost }) => {
  const { t, i18n } = useTranslation();

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = Number(value);
    if (isNaN(numValue)) return 'N/A';
    return `$${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = Number(value);
    if (isNaN(numValue)) return 'N/A';
    return numValue.toFixed(2);
  };

  return (
    <div className="inline-block bg-white rounded-lg border overflow-hidden"
      style={{ borderColor: COLORS.primary, maxWidth: 'fit-content' }}>

      {/* Header */}
      <div className="px-2 py-1.5 border-b flex items-center justify-between"
        style={{ backgroundColor: COLORS.fuel, borderColor: COLORS.fuel }}>
        <div className="flex items-center gap-1.5">
          <Fuel size={14} className="text-white" />
          <h3 className="text-xs font-bold text-white">{t('costFuels.title')}</h3>
          <span className="text-xs text-white bg-white/20 px-1.5 py-0.5 rounded-sm">
            {costFuels.length}
          </span>
        </div>
        {onAddFuelCost && (
          <button
            onClick={onAddFuelCost}
            className="px-2 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
            style={{ backgroundColor: COLORS.secondary, color: 'white' }}
          >
            <Plus size={12} />
            {t('costFuels.add')}
          </button>
        )}
      </div>

      {/* Empty State */}
      {costFuels.length === 0 ? (
        <div className="text-center py-6 px-4">
          <Fuel size={40} className="mx-auto mb-2" style={{ color: COLORS.gray, opacity: 0.5 }} />
          <p className="text-xs text-gray-500">{t('costFuels.noFuelCosts')}</p>
          {onAddFuelCost && (
            <button
              onClick={onAddFuelCost}
              className="mt-2 px-3 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm"
              style={{ backgroundColor: COLORS.secondary, color: 'white' }}
            >
              {t('costFuels.addFuelCost')}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-auto">
            <thead className="text-white text-xs" style={{ backgroundColor: COLORS.fuel }}>
              <tr>
                <th className="px-2 py-1.5 text-left font-bold whitespace-nowrap w-16">{t('costFuels.id')}</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-16">{t('costFuels.truck')}</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap w-24">{t('costFuels.totalCost')}</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap w-20">{t('costFuels.costPerGallon')}</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap w-20">{t('costFuels.gallons')}</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap w-20">{t('costFuels.distance')}</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-24">{t('costFuels.date')}</th>
              </tr>
            </thead>
            <tbody>
              {costFuels.map((costFuel, index) => (
                <tr
                  key={`${costFuel.id_fuel}-${index}`}
                  className={`transition-all duration-200 hover:shadow-sm text-xs ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold" style={{ color: COLORS.fuel }}>
                      #{costFuel.id_fuel}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded-sm text-xs font-bold text-white inline-block"
                      style={{ backgroundColor: COLORS.primary }}>
                      {costFuel.truck}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign size={12} style={{ color: COLORS.success }} />
                      <span className="font-bold text-xs" style={{ color: COLORS.success }}>
                        {formatCurrency(costFuel.cost_fuel)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <span className="font-bold text-xs" style={{ color: COLORS.fuel }}>
                      {formatCurrency(costFuel.cost_gl)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Fuel size={12} style={{ color: COLORS.secondary }} />
                      <span className="font-bold text-xs" style={{ color: COLORS.secondary }}>
                        {formatNumber(costFuel.fuel_qty)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Gauge size={12} style={{ color: COLORS.gray }} />
                      <span className="text-xs">
                        {formatNumber(costFuel.distance)} mi
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar size={12} style={{ color: COLORS.gray }} />
                      <span className="text-xs">
                        {new Date(costFuel.date + 'T00:00:00').toLocaleDateString(
                          i18n.language === 'es' ? 'es-ES' : 'en-US',
                          { year: 'numeric', month: '2-digit', day: '2-digit' }
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Summary */}
      {costFuels.length > 0 && (
        <div className="px-2 py-1.5 border-t bg-gray-50 flex items-center justify-between"
          style={{ borderColor: COLORS.fuel }}>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-600">
              <strong>{t('costFuels.totalRecords')}:</strong> {costFuels.length}
            </span>
            <span className="text-gray-600">
              <strong>{t('costFuels.totalCostLabel')}:</strong>{' '}
              <span className="font-bold" style={{ color: COLORS.success }}>
                {formatCurrency(costFuels.reduce((sum, cf) => sum + (Number(cf.cost_fuel) || 0), 0))}
              </span>
            </span>
            <span className="text-gray-600">
              <strong>{t('costFuels.totalGallons')}:</strong>{' '}
              <span className="font-bold" style={{ color: COLORS.secondary }}>
                {formatNumber(costFuels.reduce((sum, cf) => sum + (Number(cf.fuel_qty) || 0), 0))}
              </span>
            </span>
          </div>
          {onAddFuelCost && (
            <button
              onClick={onAddFuelCost}
              className="px-2 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
              style={{ backgroundColor: COLORS.fuel, color: 'white' }}
            >
              <Plus size={10} />
              {t('costFuels.add')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CostFuelsTable;