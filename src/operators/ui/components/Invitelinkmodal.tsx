// components/InviteLinkModal.tsx
import React, { useState, useCallback } from 'react';
import { Link, Copy, CheckCheck, X, Clock, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateOperatorInviteLink, InviteLinkResponse } from '../../data/RepositoryOperators';

const COLORS = {
  primary: '#0B2863',
  secondary: '#F09F52',
  success: '#22c55e',
  error: '#ef4444',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const InviteLinkModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [inviteData, setInviteData] = useState<InviteLinkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCopied(false);
      const data = await generateOperatorInviteLink();
      setInviteData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('operators.inviteLink.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleCopy = useCallback(async () => {
    if (!inviteData?.link) return;
    try {
      await navigator.clipboard.writeText(inviteData.link);
    } catch {
      const el = document.createElement('textarea');
      el.value = inviteData.link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [inviteData]);

  const handleClose = useCallback(() => {
    setInviteData(null);
    setError(null);
    setCopied(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: COLORS.primary }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.secondary }}
            >
              <Link size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">
                {t('operators.inviteLink.title')}
              </h2>
              <p className="text-blue-200 text-xs">
                {t('operators.inviteLink.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-blue-200 hover:text-white transition-colors rounded-full p-1 hover:bg-white hover:bg-opacity-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">

          {/* Info box */}
          <div
            className="rounded-xl p-4 border-l-4 text-sm text-gray-700"
            style={{ backgroundColor: 'rgba(11,40,99,0.05)', borderLeftColor: COLORS.primary }}
          >
            {t('operators.inviteLink.description')}
          </div>

          {/* Generate / Regenerate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: inviteData ? COLORS.secondary : COLORS.primary }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                {t('operators.inviteLink.generating')}
              </>
            ) : inviteData ? (
              <>
                <RefreshCw size={16} />
                {t('operators.inviteLink.regenerate')}
              </>
            ) : (
              <>
                <Link size={16} />
                {t('operators.inviteLink.generate')}
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl p-3 border text-sm flex items-center gap-2"
              style={{
                borderColor: COLORS.error,
                backgroundColor: 'rgba(239,68,68,0.05)',
                color: COLORS.error,
              }}
            >
              <X size={16} />
              {error}
            </div>
          )}

          {/* Result */}
          {inviteData && (
            <div className="space-y-3">

              {/* Expiry badge */}
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: COLORS.secondary }} />
                <span className="text-xs font-semibold" style={{ color: COLORS.secondary }}>
                  {t('operators.inviteLink.expiresIn')}: {inviteData.expires_in}
                </span>
              </div>

              {/* Link + Copy */}
              <div
                className="rounded-xl border-2 overflow-hidden"
                style={{ borderColor: COLORS.primary }}
              >
                <div
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {t('operators.inviteLink.registrationLink')}
                </div>
                <div className="flex items-stretch">
                  <div className="flex-1 px-3 py-3 text-xs text-gray-700 break-all font-mono bg-gray-50 flex items-center min-h-[52px]">
                    {inviteData.link}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 py-3 text-white font-semibold text-xs transition-all duration-200 hover:opacity-90 min-h-[52px]"
                    style={{ backgroundColor: copied ? COLORS.success : COLORS.secondary }}
                  >
                    {copied ? (
                      <>
                        <CheckCheck size={16} />
                        <span>{t('operators.inviteLink.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>{t('operators.inviteLink.copy')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Token collapsed */}
              <details className="text-xs">
                <summary
                  className="cursor-pointer font-semibold select-none"
                  style={{ color: COLORS.primary }}
                >
                  {t('operators.inviteLink.showToken')}
                </summary>
                <div className="mt-2 p-2 rounded-lg bg-gray-100 font-mono text-gray-600 break-all">
                  {inviteData.token}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 hover:bg-gray-100"
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
          >
            {t('operators.inviteLink.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteLinkModal;