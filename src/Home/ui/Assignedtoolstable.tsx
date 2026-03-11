import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, Plus, Package } from 'lucide-react';
import type { AssignedTool } from '../data/Assigntoolrepository';

interface AssignedToolsTableProps {
  tools: AssignedTool[];
  onAssignTools?: () => void;
}

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
};

const AssignedToolsTable: React.FC<AssignedToolsTableProps> = ({ tools, onAssignTools }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 max-w-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between py-2 rounded-t-lg"
      style={{ background: COLORS.primary }}
      >
        <div className="flex items-center gap-1.5 text-white">
          <Wrench size={14} />
          <span className="text-xs font-bold uppercase tracking-wide text-white">
            {t('assignTool.assignedToOrder', 'Assigned Tools')}
          </span>
          {tools.length > 0 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-sm text-white bg-white/20"
              
            >
              {tools.length}
            </span>
          )}
        </div>
        {onAssignTools && (
          <button
            onClick={onAssignTools}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:shadow-sm"
            style={{ backgroundColor: COLORS.secondary, color: 'white' }}
            title={t('assignTool.title', 'Assign Tools')}
          >
            <Plus size={11} />
            {t('assignTool.assign', 'Assign')}
          </button>
        )}
      </div>

      {/* Table */}
      {tools.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-4 rounded-lg border-2 border-dashed gap-1"
          style={{ borderColor: '#e5e7eb' }}
        >
          <Package size={20} style={{ color: '#9ca3af' }} />
          <p className="text-xs text-gray-400">
            {t('assignTool.noneAssigned', 'No tools assigned yet.')}
          </p>
          {onAssignTools && (
            <button
              onClick={onAssignTools}
              className="text-xs font-semibold mt-1 underline"
              style={{ color: COLORS.primary }}
            >
              {t('assignTool.assign', 'Assign tools')}
            </button>
          )}
        </div>
      ) : (
        <div className=" border overflow-hidden rounded-b-lg" style={{ borderColor: '#0B2863' }}>
          <table className="w-full text-xs">
            <thead style={{ backgroundColor: COLORS.primary }}>
              <tr>
                <th className="px-2 py-1.5 text-left text-white font-bold">
                  {t('assignTool.toolName', 'Tool')}
                </th>
                <th className="px-2 py-1.5 text-center text-white font-bold">
                  {t('assignTool.qty', 'Qty')}
                </th>
                <th className="px-2 py-1.5 text-left text-white font-bold">
                  {t('assignTool.describePlaceholder', 'Notes')}
                </th>
                <th className="px-2 py-1.5 text-right text-white font-bold">
                  {t('table.date', 'Date')}
                </th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool, idx) => (
                <tr
                  key={tool.id_assign_tool}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <Wrench size={10} style={{ color: COLORS.primary, flexShrink: 0 }} />
                      <span className="font-semibold" style={{ color: COLORS.primary }}>
                        {tool.tool_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span
                      className="font-bold px-1.5 py-0.5 rounded text-white text-xs"
                      style={{ backgroundColor: tool.quantity > 0 ? COLORS.success : '#9ca3af' }}
                    >
                      {tool.quantity ?? 0}
                      {tool.tool_unit ? ` ${tool.tool_unit}` : ''}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-gray-500 italic truncate max-w-[120px]">
                    {tool.describe ?? '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right text-gray-400 whitespace-nowrap">
                    {tool.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignedToolsTable;