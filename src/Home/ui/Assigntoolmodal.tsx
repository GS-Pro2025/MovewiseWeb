import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { X, Wrench, Plus, CheckCircle, AlertCircle, Package, Hash } from 'lucide-react';
import { AssignToolRepository, ToolByJob, AssignedTool } from '../data/Assigntoolrepository';
import type { TableData } from '../domain/TableData';

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
  gray: '#6b7280',
};

interface AssignToolModalProps {
  open: boolean;
  order: TableData | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ToolWithQuantity extends ToolByJob {
  quantity: number;
  describe: string;
}

export const AssignToolModal: React.FC<AssignToolModalProps> = ({
  open,
  order,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();

  const [availableTools, setAvailableTools] = useState<ToolWithQuantity[]>([]);
  const [assignedTools, setAssignedTools] = useState<AssignedTool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [successIds, setSuccessIds] = useState<Set<number>>(new Set());
  const [errorIds, setErrorIds] = useState<Map<number, string>>(new Map());

  const fetchToolsByJob = useCallback(async (jobId: number) => {
    setLoadingTools(true);
    const res = await AssignToolRepository.getToolsByJob(jobId);
    if (res.status === 'success' && res.data) {
      setAvailableTools(
        res.data.map((tool) => ({ ...tool, quantity: 1, describe: tool.name }))
      );
    }
    setLoadingTools(false);
  }, []);

  const fetchAssignedTools = useCallback(async (id: string) => {
    setLoadingAssigned(true);
    const res = await AssignToolRepository.getAssignedToolsByOrder(id);
    if (res.status === 'success' && res.data) {
      setAssignedTools(res.data);
    }
    setLoadingAssigned(false);
  }, []);

  useEffect(() => {
    if (open && order) {
      setSuccessIds(new Set());
      setErrorIds(new Map());
      if (order.job_id) fetchToolsByJob(order.job_id); // ← número, no string
      if (order.id) fetchAssignedTools(order.id);
    }
  }, [open, order, fetchToolsByJob, fetchAssignedTools]);

  const handleQuantityChange = (id_tool: number, value: string) => {
    const num = parseInt(value, 10);
    setAvailableTools((prev) =>
      prev.map((t) =>
        t.id_tool === id_tool ? { ...t, quantity: isNaN(num) ? 1 : Math.max(1, num) } : t
      )
    );
  };

  const handleDescribeChange = (id_tool: number, value: string) => {
    setAvailableTools((prev) =>
      prev.map((t) => (t.id_tool === id_tool ? { ...t, describe: value } : t))
    );
  };

  const handleAssign = async (tool: ToolWithQuantity) => {
    if (!order?.id) return;
    setSubmitting(tool.id_tool);
    setErrorIds((prev) => { const m = new Map(prev); m.delete(tool.id_tool); return m; });

    const res = await AssignToolRepository.assignTool({
      id_tool: tool.id_tool,
      key: order.id,
      quantity: tool.quantity,
      describe: tool.describe,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });

    if (res.status === 'success') {
      setSuccessIds((prev) => new Set(prev).add(tool.id_tool));
      fetchAssignedTools(order.id);
      onSuccess?.();
    } else {
      setErrorIds((prev) => new Map(prev).set(tool.id_tool, res.message || 'Error'));
    }
    setSubmitting(null);
  };

  const handleClose = () => {
    setAvailableTools([]);
    setAssignedTools([]);
    setSuccessIds(new Set());
    setErrorIds(new Map());
    onClose();
  };

  const isAlreadyAssigned = (id_tool: number) =>
    assignedTools.some((a) => a.id_tool === id_tool);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          border: `2px solid ${COLORS.primary}`,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: COLORS.primary,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2,
        }}
      >
        <div className="flex items-center gap-2">
          <Wrench size={18} />
          <div>
            <p className="text-sm font-bold leading-tight">
              {t('assignTool.title', 'Assign Tools')}
            </p>
            {order && (
              <p className="text-xs opacity-75 font-normal leading-tight">
                {order.key_ref} — {order.firstName} {order.lastName}
                {order.job ? ` · ${order.job}` : ''}
              </p>
            )}
          </div>
        </div>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }} dividers>
        <div className="flex flex-col md:flex-row h-full" style={{ minHeight: 400 }}>

          {/* Left: Available tools */}
          <div className="flex-1 p-4 border-r" style={{ borderColor: '#e5e7eb' }}>
            <h3
              className="text-xs font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wide"
              style={{ color: COLORS.primary }}
            >
              <Package size={14} />
              {t('assignTool.availableTools', 'Available Tools for this Job')}
            </h3>

            {loadingTools ? (
              <div className="flex justify-center py-8">
                <CircularProgress size={24} style={{ color: COLORS.primary }} />
              </div>
            ) : availableTools.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                {t('assignTool.noTools', 'No tools found for this job type.')}
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 380 }}>
                {availableTools.map((tool) => {
                  const alreadyAssigned = isAlreadyAssigned(tool.id_tool);
                  const isSuccess = successIds.has(tool.id_tool);
                  const errorMsg = errorIds.get(tool.id_tool);
                  const isLoading = submitting === tool.id_tool;

                  return (
                    <div
                      key={tool.id_tool}
                      className="rounded-lg border p-3 transition-all"
                      style={{
                        borderColor: isSuccess
                          ? COLORS.success
                          : alreadyAssigned
                          ? COLORS.secondary
                          : '#e5e7eb',
                        backgroundColor: isSuccess
                          ? '#f0fdf4'
                          : alreadyAssigned
                          ? '#fffbf5'
                          : 'white',
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-bold" style={{ color: COLORS.primary }}>
                            {tool.name}
                          </p>
                          {tool.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{tool.description}</p>
                          )}
                          {tool.unit && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block"
                              style={{ backgroundColor: '#eff6ff', color: COLORS.primary }}
                            >
                              {tool.unit}
                            </span>
                          )}
                        </div>
                        {alreadyAssigned && !isSuccess && (
                          <Tooltip
                            title={t('assignTool.alreadyAssigned', 'Already assigned to this order')}
                            arrow
                          >
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ backgroundColor: '#fff3e0', color: COLORS.secondary }}
                            >
                              {t('assignTool.assigned', 'Assigned')}
                            </span>
                          </Tooltip>
                        )}
                        {isSuccess && (
                          <CheckCircle size={16} style={{ color: COLORS.success }} />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Hash size={11} style={{ color: COLORS.gray }} />
                          <input
                            type="number"
                            min={1}
                            value={tool.quantity}
                            onChange={(e) => handleQuantityChange(tool.id_tool, e.target.value)}
                            className="w-16 border rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2"
                            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                          />
                        </div>

                        <input
                          type="text"
                          value={tool.describe}
                          onChange={(e) => handleDescribeChange(tool.id_tool, e.target.value)}
                          placeholder={t('assignTool.describePlaceholder', 'Notes (optional)')}
                          className="flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1"
                          style={{ borderColor: '#d1d5db', color: '#374151' }}
                        />

                        <button
                          onClick={() => handleAssign(tool)}
                          disabled={isLoading || tool.quantity < 1}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: isSuccess ? COLORS.success : COLORS.primary,
                            color: 'white',
                          }}
                        >
                          {isLoading ? (
                            <CircularProgress size={12} style={{ color: 'white' }} />
                          ) : isSuccess ? (
                            <CheckCircle size={12} />
                          ) : (
                            <Plus size={12} />
                          )}
                          {isSuccess
                            ? t('assignTool.done', 'Done')
                            : t('assignTool.assign', 'Assign')}
                        </button>
                      </div>

                      {errorMsg && (
                        <div
                          className="flex items-center gap-1 mt-1.5 text-xs"
                          style={{ color: COLORS.error }}
                        >
                          <AlertCircle size={11} />
                          {errorMsg}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Already assigned tools */}
          <div className="w-full md:w-64 p-4 bg-gray-50">
            <h3
              className="text-xs font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wide"
              style={{ color: COLORS.primary }}
            >
              <CheckCircle size={14} />
              {t('assignTool.assignedToOrder', 'Assigned to this Order')}
            </h3>

            {loadingAssigned ? (
              <div className="flex justify-center py-6">
                <CircularProgress size={20} style={{ color: COLORS.primary }} />
              </div>
            ) : assignedTools.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                {t('assignTool.noneAssigned', 'No tools assigned yet.')}
              </p>
            ) : (
              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 380 }}>
                {assignedTools.map((a) => (
                  <div
                    key={a.id_assign_tool}
                    className="rounded-lg border bg-white p-2.5"
                    style={{ borderColor: COLORS.success }}
                  >
                    <p className="text-xs font-bold" style={{ color: COLORS.primary }}>
                      {a.tool_name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {t('assignTool.qty', 'Qty')}: <strong>{a.quantity}</strong>
                        {a.tool_unit ? ` ${a.tool_unit}` : ''}
                      </span>
                      <span className="text-xs text-gray-400">{a.date}</span>
                    </div>
                    {a.describe && (
                      <p className="text-xs text-gray-400 mt-0.5 italic truncate">
                        {a.describe}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: `1px solid #e5e7eb` }}>
        <button
          onClick={handleClose}
          className="px-4 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:bg-gray-50"
          style={{ borderColor: COLORS.primary, color: COLORS.primary }}
        >
          {t('common.close', 'Close')}
        </button>
      </DialogActions>
    </Dialog>
  );
};