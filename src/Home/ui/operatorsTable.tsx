import React, { useState } from 'react';
import { Plus, User, MapPin } from 'lucide-react';
import { Operator } from '../domain/ModelOrdersReport';
import { useNavigate } from 'react-router-dom';
import LocationDialog from './LocationDialog';
import { parseLocation, isJsonLocation, LocationData } from '../../service/mapsServices';

interface OperatorsTableProps {
  operators: Operator[];
  orderKey: string;
}

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  gray: '#6b7280',
};

const OperatorsTable: React.FC<OperatorsTableProps> = ({ operators, orderKey }) => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddOperator = () => {
    navigate(`/app/add-operators-to-order/${orderKey}`);
  };

  const handleLocationClick = (location: unknown) => {
    const parsedLocation = parseLocation(location);
    if (parsedLocation) {
      setSelectedLocation(parsedLocation);
      setIsDialogOpen(true);
    }
  };
  // Función helper para formatear números correctamente
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = Number(value);
    if (isNaN(numValue)) return 'N/A';
    return `$${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDuration = (start?: string | null, end?: string | null): string | null => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    if (!isFinite(diff) || diff <= 0) return null;
    const totalMinutes = Math.round(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTooltipTime = (start?: string | null, end?: string | null): string => {
    if (!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    const startStr = s.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const endStr = e.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Start: ${startStr} - End: ${endStr}`;
  };

  return (
    <div className="inline-block bg-white rounded-lg border overflow-hidden" style={{ borderColor: COLORS.primary, maxWidth: 'fit-content' }}>
      <LocationDialog location={selectedLocation} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
      {/* Header */}
      <div className="px-2 py-1.5 border-b flex items-center justify-between" style={{ 
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary 
      }}>
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-white" />
          <h3 className="text-xs font-bold text-white">Assigned Operators</h3>
          <span className="text-xs text-white bg-white/20 px-1.5 py-0.5 rounded-full">
            {operators.length}
          </span>
        </div>
        <button
          onClick={handleAddOperator}
          className="px-2 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
          style={{ 
            backgroundColor: COLORS.secondary,
            color: 'white'
          }}
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Table */}
      {operators.length === 0 ? (
        <div className="text-center py-6 px-4">
          <User size={40} className="mx-auto mb-2" style={{ color: COLORS.gray, opacity: 0.5 }} />
          <p className="text-xs text-gray-500">No operators assigned yet</p>
          <button
            onClick={handleAddOperator}
            className="mt-2 px-3 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm"
            style={{ 
              backgroundColor: COLORS.secondary,
              color: 'white'
            }}
          >
            Add First Operator
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-auto">
            <thead className="text-white text-xs" style={{ backgroundColor: COLORS.primary }}>
              <tr>
                <th className="px-2 py-1.5 text-left font-bold whitespace-nowrap w-20">First Name</th>
                <th className="px-2 py-1.5 text-left font-bold whitespace-nowrap w-20">Last Name</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-16">Role</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-16">Code</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap w-20">Salary</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap w-20">Bonus</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-24">Date</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-32">Time Worked</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-32">Location Start</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-32">Location End</th>
                <th className="px-2 py-1.5 text-center font-bold whitespace-nowrap w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((operator, index) => (
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
                    <span 
                      className="px-1.5 py-0.5 rounded-full text-xs font-bold text-white inline-block"
                      style={{ backgroundColor: COLORS.primary }}
                    >
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
                      {new Date(operator.date + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
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
                    {operator.location_start ? (
                      <span className="text-xs" style={{ color: COLORS.primary }}>
                        {typeof operator.location_start === 'string' ? operator.location_start : 'N/A'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    {operator.location_end ? (
                      isJsonLocation(operator.location_end) ? (
                        <button
                          onClick={() => handleLocationClick(operator.location_end)}
                          className="inline-flex items-center justify-center p-1.5 rounded hover:bg-gray-200 transition-colors group"
                          title="View end location on map"
                        >
                          <MapPin size={16} style={{ color: COLORS.secondary }} className="group-hover:scale-110 transition-transform" />
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: COLORS.primary }}>
                          {String(operator.location_end)}
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    <span 
                      className="px-1.5 py-0.5 rounded-full text-xs font-bold text-white inline-block"
                      style={{ 
                        backgroundColor: 
                          operator.status_order?.toLowerCase() === 'finished' ? COLORS.success :
                          operator.status_order?.toLowerCase() === 'pending' ? COLORS.secondary :
                          COLORS.gray
                      }}
                    >
                      {operator.status_order || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Summary */}
      {operators.length > 0 && (
        <div className="px-2 py-1.5 border-t bg-gray-50 flex items-center justify-between" style={{ borderColor: COLORS.primary }}>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-600">
              <strong>Total:</strong> {operators.length}
            </span>
            <span className="text-gray-600">
              <strong>Salary:</strong>{' '}
              <span className="font-bold" style={{ color: COLORS.success }}>
                {formatCurrency(operators.reduce((sum, op) => sum + (Number(op.salary) || 0), 0))}
              </span>
            </span>
            <span className="text-gray-600">
              <strong>Bonus:</strong>{' '}
              <span className="font-bold" style={{ color: COLORS.secondary }}>
                {formatCurrency(operators.reduce((sum, op) => sum + (Number(op.bonus) || 0), 0))}
              </span>
            </span>
          </div>
          <button
            onClick={handleAddOperator}
            className="px-2 py-1 rounded text-xs font-bold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
            style={{ 
              backgroundColor: COLORS.primary,
              color: 'white'
            }}
          >
            <Plus size={10} />
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default OperatorsTable;