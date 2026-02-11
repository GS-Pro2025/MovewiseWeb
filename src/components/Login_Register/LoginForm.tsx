import React, { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { login } from '../../service/authService';
import { LoginFormProps } from '../../types/authTypes';

const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword }) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { t } = useTranslation();
  const [snackbar, setSnackbar] = useState<{ open: boolean; text: string; variant: 'success' | 'error' }>({
    open: false,
    text: '',
    variant: 'success'
  });

  const enqueueSnackbar = (text: string, variant: 'success' | 'error' = 'success', duration = 2500) => {
    setSnackbar({ open: true, text, variant });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), duration);
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      enqueueSnackbar(result.message || t('login.form.loginSuccess'), 'success', 1400);
      // pequeña espera para que se vea el snackbar antes de redirigir
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1400);
    } else {
      enqueueSnackbar(result.message || t('login.form.loginFailed'), 'error', 3500);
    }
  };

  const handleForgotPasswordClick = () => {
    onForgotPassword(email);
  };

  return (
    <>
      <p className="text-xl text-gray-100 mb-6">{t('login.form.signInTitle')}</p>
      {/* Snackbar */}
      {snackbar.open && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white text-sm ${
            snackbar.variant === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {snackbar.text}
        </div>
      )}

      <form className="sm:w-2/3 w-full mx-auto" onSubmit={handleLogin}>
        <div className="pb-2 pt-4">
          <input
            type="email"
            id="email"
            placeholder={t('login.form.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full p-4 text-xl rounded-md bg-black text-white"
            required
          />
        </div>

        <div className="pb-2 pt-4 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            placeholder={t('login.form.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full p-4 text-xl rounded-md bg-black text-white pr-14"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg text-gray-400 hover:text-gray-200"
          >
            {showPassword ? t('login.form.hidePassword') : t('login.form.showPassword')}
          </button>
        </div>

        <div className="text-right text-gray-400 hover:underline hover:text-gray-100 text-lg">
          <button
            type="button"
            onClick={handleForgotPasswordClick}
            className="hover:underline hover:text-gray-100"
          >
            {t('login.form.forgotPassword')}
          </button>
        </div>

        <div className="px-4 pb-2 pt-6">
          <button
            type="submit"
            className="uppercase block w-full p-4 text-lg font-semibold rounded-full bg-[#0458AB] hover:bg-[#60A3D9] focus:outline-none"
          >
            {t('login.form.signInButton')}
          </button>
        </div>
      </form>
    </>
  );
};

export default LoginForm;