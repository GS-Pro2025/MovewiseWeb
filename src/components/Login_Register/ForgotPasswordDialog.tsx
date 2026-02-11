import React, { useState, FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ForgotPasswordDialogProps } from '../../types/authTypes';

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialEmail = ''
}) => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
    }
  }, [isOpen, initialEmail]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(email);
    } catch (error) {
      console.error('Error in forgot password dialog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{t('login.forgot.title')}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-sm">
          {t('login.forgot.description')}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.forgot.emailLabel')}
            </label>
            <input
              type="email"
              id="forgotEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder={t('login.forgot.emailPlaceholder')}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              {t('login.forgot.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0458AB] text-white rounded-lg hover:bg-[#60A3D9] transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? t('login.forgot.sending') : t('login.forgot.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordDialog;