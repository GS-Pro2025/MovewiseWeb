import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, Navigation } from 'lucide-react';
import { Operator } from '../domain/ModelOrdersReport';
import { useNavigate } from 'react-router-dom';
import LocationDialog from './LocationDialog';
import { parseLocation, isJsonLocation, LocationData, RouteData } from '../../service/mapsServices';
import { finishOperatorOrder } from '../../service/AssignService';

interface OperatorsTableProps {
  operators: Operator[];
  orderKey: string;
  onOperatorUpdate?: () => void;
}

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  gray: '#6b7280',
};

const OperatorsTable: React.FC<OperatorsTableProps> = ({ operators, orderKey, onOperatorUpdate }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localOperators, setLocalOperators] = useState<Operator[]>(operators);
  const [loadingOperatorId, setLoadingOperatorId] = useState<number | null>(null);

  React.useEffect(() => {
    setLocalOperators(operators);
  }, [operators]);

  const handleAddOperator = () => {
    navigate(`/app/add-operators-to-order/${orderKey}`);
  };

  const handleFinishOperator = async (operator: Operator) => {
    setLoadingOperatorId(operator.id_assign);
    try {
      const data = await finishOperatorOrder(operator.id_assign, null);
      setLocalOperators(prevOperators =>
        prevOperators.map(op =>
          op.id_assign === operator.id_assign
            ? {
                ...op,
                status_order: data?.status_order || 'finished',
                location_end: data?.location_end || null,
                end_time: data?.end_time || new Date().toISOString()
              }
            : op
        )
      );
      if (onOperatorUpdate) onOperatorUpdate();
      alert(`✅ ${t('operatorsTable.finishSuccess')}`);
    } catch (error) {
      alert(`${t('operatorsTable.finishError')}: ` + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoadingOperatorId(null);
    }
  };

  const handleRouteClick = (locationStart: unknown, locationEnd: unknown) => {
    const parsedStart = parseLocation(locationStart);
    const parsedEnd = parseLocation(locationEnd);
    if (parsedStart && parsedEnd) {
      setSelectedRoute({ origin: parsedStart, destination: parsedEnd });
      setSelectedLocation(null);
      setIsDialogOpen(true);
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = Number(value);
    if (isNaN(numValue)) return 'N/A';
    return `$${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDuration = (start?: string | null, end?: string | null): string | null => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (!isFinite(diff) || diff <= 0) return null;
    const totalMinutes = Math.round(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTooltipTime = (start?: string | null, end?: string | null): string => {
    if (!start || !end) return '';
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    const startStr = new Date(start).toLocaleString(locale, opts);
    const endStr   = new Date(end).toLocaleString(locale, opts);
    return `${t('operatorsTable.tooltipStart')}: ${startStr} - ${t('operatorsTable.tooltipEnd')}: ${endStr}`;
  };

  return (
    <div className="inline-block bg-white rounded-lg border overflow-hidden" style={{ borderColor: COLORS.primary, maxWidth: 'fit-content' }}>
      <LocationDialog
        location={selectedLocation}
        route={selectedRoute}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {/* Header */}
      <div className="px-2 py-1.5 border-b flex items-center justify-between"
        style={{ backgroundColor: COLORS.primary, borderColor: COLORS.primary }}>
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-white" />
          <h3 className="text-xs font-bold text-white">{t('operatorsTable.title')}</h3>
          <span className="text-xs text-white bg-white/20 px-1.5 py-0.5 rounded-sm">
            {operators.length}
          </span>
        </div>
        <button
          onClick={handleAddOperator}
          className="px-2 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
          style={{ backgroundColor: COLORS.secondary, color: 'white' }}
        >
          <Plus size={12} />
          {t('operatorsTable.add')}
        </button>
      </div>

      {/* Empty State */}
      {localOperators.length === 0 ? (
        <div className="text-center py-6 px-4">
          <User size={40} className="mx-auto mb-2" style={{ color: COLORS.gray, opacity: 0.5 }} />
          <p className="text-xs text-gray-500">{t('operatorsTable.noOperators')}</p>
          <button
            onClick={handleAddOperator}
            className="mt-2 px-3 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm"
            style={{ backgroundColor: COLORS.secondary, color: 'white' }}
          >
            {t('operatorsTable.addFirst')}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-auto">
            <thead className="text-white text-xs" style={{ backgroundColor: COLORS.primary }}>
              <tr>
                <th className="px-2 py-1.5 text-left font-bold whitespace-nowrap w-20">{t('operatorsTable.firstName')}</th>
                <th className="px-2 py-1.5 text-left font-bold whitespace-nowrap w-20">{t('operatorsTable.lastName')}</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-16">{t('operatorsTable.role')}</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-16">{t('operatorsTable.code')}</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap w-20">{t('operatorsTable.salary')}</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap w-20">{t('operatorsTable.bonus')}</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-24">{t('operatorsTable.date')}</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-32">{t('operatorsTable.timeWorked')}</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-40">{t('operatorsTable.route')}</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-20">{t('operatorsTable.status')}</th>
              </tr>
            </thead>
            <tbody>
              {localOperators.map((operator, index) => (
                <tr
                  key={`${operator.code}-${index}`}
                  className={`transition-all duration-200 hover:shadow-sm text-xs ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className="font-medium">{operator.first_name}</span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className="font-medium">{operator.last_name}</span>
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded-sm text-xs font-bold text-white inline-block"
                      style={{ backgroundColor: COLORS.primary }}>
                      {operator.role}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    <span className="font-mono text-xs" style={{ color: COLORS.gray }}>
                      {operator.code}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <span className="font-bold text-xs" style={{ color: COLORS.success }}>
                      {formatCurrency(operator.salary)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    {operator.bonus !== null && operator.bonus !== undefined ? (
                      <span className="font-bold text-xs" style={{ color: COLORS.secondary }}>
                        {formatCurrency(operator.bonus)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    <span className="text-xs">
                      {new Date(operator.date + 'T00:00:00').toLocaleDateString(
                        i18n.language === 'es' ? 'es-ES' : 'en-US',
                        { year: 'numeric', month: '2-digit', day: '2-digit' }
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    {operator.start_time && operator.end_time ? (
                      <span
                        className="text-xs cursor-help"
                        title={formatTooltipTime(operator.start_time, operator.end_time)}
                        style={{ color: COLORS.primary }}
                      >
                        {formatDuration(operator.start_time, operator.end_time) || 'N/A'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    {operator.location_start && operator.location_end ? (
                      isJsonLocation(operator.location_start) && isJsonLocation(operator.location_end) ? (
                        <button
                          onClick={() => handleRouteClick(operator.location_start, operator.location_end)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded transition-colors text-xs font-semibold"
                          style={{
                            backgroundColor: COLORS.secondary + '20',
                            color: COLORS.secondary,
                            border: `1px solid ${COLORS.secondary}`
                          }}
                          title={t('operatorsTable.viewRouteTitle')}
                        >
                          <Navigation size={14} style={{ color: COLORS.secondary }} />
                          {t('operatorsTable.viewRoute')}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {!isJsonLocation(operator.location_start) && !isJsonLocation(operator.location_end)
                            ? t('operatorsTable.noCoordinates')
                            : isJsonLocation(operator.location_start)
                              ? t('operatorsTable.endMissing')
                              : t('operatorsTable.startMissing')}
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    {operator.status_order?.toLowerCase() === 'finished' ? (
                      <span className="px-1.5 py-0.5 rounded-sm text-xs font-bold text-white inline-block"
                        style={{ backgroundColor: COLORS.success }}>
                        {operator.status_order}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFinishOperator(operator)}
                        disabled={loadingOperatorId === operator.id_assign}
                        className="px-1.5 py-0.5 rounded-sm text-xs font-bold text-white inline-block transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor:
                            operator.status_order?.toLowerCase() === 'pending' ? COLORS.secondary : COLORS.gray
                        }}
                        title={loadingOperatorId === operator.id_assign
                          ? t('operatorsTable.finalizingTitle')
                          : t('operatorsTable.clickToFinish')}
                      >
                        {loadingOperatorId === operator.id_assign ? '...' : (operator.status_order || 'N/A')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Summary */}
      {localOperators.length > 0 && (
        <div className="px-2 py-1.5 border-t bg-gray-50 flex items-center justify-between"
          style={{ borderColor: COLORS.primary }}>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-600">
              <strong>{t('operatorsTable.total')}:</strong> {localOperators.length}
            </span>
            <span className="text-gray-600">
              <strong>{t('operatorsTable.salary')}:</strong>{' '}
              <span className="font-bold" style={{ color: COLORS.success }}>
                {formatCurrency(localOperators.reduce((sum, op) => sum + (Number(op.salary) || 0), 0))}
              </span>
            </span>
            <span className="text-gray-600">
              <strong>{t('operatorsTable.bonus')}:</strong>{' '}
              <span className="font-bold" style={{ color: COLORS.secondary }}>
                {formatCurrency(localOperators.reduce((sum, op) => sum + (Number(op.bonus) || 0), 0))}
              </span>
            </span>
          </div>
          <button
            onClick={handleAddOperator}
            className="px-2 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
            style={{ backgroundColor: COLORS.primary, color: 'white' }}
          >
            <Plus size={10} />
            {t('operatorsTable.add')}
          </button>
        </div>
      )}
    </div>
  );
};

export default OperatorsTable;