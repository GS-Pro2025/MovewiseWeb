import React from 'react';

interface Props {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  submitting: boolean;
  submitDisabled?: boolean;
  error?: string | null;
  cancelLabel?: string;
  children: React.ReactNode;
}

export const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0B2863]/30 focus:border-[#0B2863]';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="block">
    <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
  </div>
);

export const ModalShell: React.FC<Props> = ({
  title, onClose, onSubmit, submitLabel, submitting, submitDisabled, error, cancelLabel, children,
}) => (
  <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
    <form
      onSubmit={onSubmit}
      onMouseDown={e => e.stopPropagation()}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
    >
      <div className="px-5 py-4 bg-[#0B2863] rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
        <h3 className="text-[15px] font-semibold text-white">{title}</h3>
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white" aria-label="close">
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="px-5 py-4 space-y-3">
        {children}
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      </div>
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={submitting}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          {cancelLabel ?? '✕'}
        </button>
        <button type="submit" disabled={submitting || submitDisabled}
          className="px-4 py-2 text-sm rounded-lg bg-[#0B2863] text-white font-semibold hover:bg-[#0B2863]/90 disabled:opacity-50">
          {submitting ? '…' : submitLabel}
        </button>
      </div>
    </form>
  </div>
);
