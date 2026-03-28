/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { StatementRecord } from '../domain/StatementModels';
import { deleteStatement } from '../data/StatementRepository';

interface DeleteStatementDialogProps {
  record: StatementRecord | null;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

const DeleteStatementDialog: React.FC<DeleteStatementDialogProps> = ({ record, onClose, onDeleted }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [deleting, setDeleting] = useState(false);

  if (!record) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStatement(record.id);
      enqueueSnackbar(
        t('deleteStatement.success', { keyref: record.keyref, defaultValue: `"${record.keyref}" deleted` }),
        { variant: 'success' }
      );
      onDeleted(record.id);
    } catch (err: any) {
      enqueueSnackbar(err?.message || t('deleteStatement.error', 'Error deleting statement'), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {t('deleteStatement.title', 'Delete Statement')}
                </h2>
                <p className="text-red-200 text-xs mt-0.5">
                  {t('deleteStatement.subtitle', 'This action cannot be undone')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={deleting}
              className="hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-700 text-sm mb-4">
            {t('deleteStatement.confirm', 'Are you sure you want to delete this statement?')}
          </p>

          {/* Record summary card */}
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">
                {t('deleteStatement.keyref', 'Key Ref')}
              </span>
              <span className="font-bold text-gray-900">{record.keyref}</span>
            </div>
            {record.shipper_name && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">
                  {t('deleteStatement.shipper', 'Shipper')}
                </span>
                <span className="text-gray-700">{record.shipper_name}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">
                {t('deleteStatement.date', 'Date')}
              </span>
              <span className="text-gray-700">{record.date}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-3 border-2 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: '#0B2863', color: '#0B2863' }}
          >
            {t('deleteStatement.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)' }}
          >
            {deleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t('deleteStatement.deleting', 'Deleting...')}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{t('deleteStatement.confirm_btn', 'Yes, Delete')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteStatementDialog;
