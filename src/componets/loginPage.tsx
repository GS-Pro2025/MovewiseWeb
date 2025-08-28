import React, { useState, FormEvent } from 'react';
import Logo from '../assets/logo.png';
import BackgroundIm from '../assets/imagenBg.webp';
import patron_modo_oscuro from '../assets/patron_modo_oscuro.png';
import { login } from '../service/authService';
import RecursoMovewise from '../assets/RecursoMovewise.png';
import { sendForgotPasswordEmail } from '../service/userService';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  
  // Estados para el dialog de forgot password
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  console.log('env:', import.meta.env.VITE_URL_BASE);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await login(email, password);
    setMessage(result.message);
    if (result.success) {
       window.location.href = '/home'
    }
  };

  // Handler para forgot password
  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotLoading(true);
    
    try {
      const data = await sendForgotPasswordEmail(forgotEmail);
      
      // Mostrar el mensaje en snackbar
      setSnackbarMessage(data.detail || 'If that email exists, you will receive instructions via email.');
      setShowSnackbar(true);
      
      // Cerrar el dialog
      setShowForgotPassword(false);
      setForgotEmail('');
      
      // Auto-hide snackbar después de 5 segundos
      setTimeout(() => {
        setShowSnackbar(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error sending forgot password email:', error);
      setSnackbarMessage('An error occurred. Please try again.');
      setShowSnackbar(true);
      setTimeout(() => {
        setShowSnackbar(false);
      }, 5000);
    } finally {
      setForgotLoading(false);
    }
  };


  // Handler para abrir dialog
  const handleOpenForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotEmail(email); // Pre-fill con el email del login si existe
  };

  // Handler para cerrar dialog
  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen flex items-stretch text-white relative text-base md:text-lg">
      {/* Left Side */}
      <div
        className="lg:flex w-3/5 hidden bg-gray-500 bg-no-repeat bg-cover relative items-center"
        style={{
          backgroundImage: `url(${BackgroundIm})`,
        }}
      >
        <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
        <div className="w-full px-24 z-10">
          <h1 className="text-5xl font-bold text-left tracking-wide">Welcome to Movingwise</h1>
          <p className="text-3xl my-4">
            Organize, plan and control every step of your move from one place.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="lg:w-2/5 w-full flex items-center justify-center text-center bg-[#0B2863] relative">
        <div
          className="absolute inset-0 bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${patron_modo_oscuro})` }}
        >
          <div className="absolute bg-black opacity-60 inset-0"></div>
        </div>

        <div className="w-full py-6 px-4 sm:px-8 z-20">
          <div className="my-6 flex justify-center items-center gap-4">
            <img src={Logo} alt="Company Logo" className="h-16 object-contain rounded-full bg-white" />
            <img src={RecursoMovewise} alt="Movingwise" className="h-16 object-contain" />
          </div>

          <p className="text-xl text-gray-100 mb-6">or use email to sign into your account</p>

          {message && <p className="text-lg text-red-400">{message}</p>}

          <form className="sm:w-2/3 w-full mx-auto" onSubmit={handleLogin}>
            <div className="pb-2 pt-4">
              <input
                type="email"
                id="email"
                placeholder="Email"
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
                placeholder="Password"
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
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="text-right text-gray-400 hover:underline hover:text-gray-100 text-lg">
              <button
                type="button"
                onClick={handleOpenForgotPassword}
                className="hover:underline hover:text-gray-100"
              >
                Forgot your password?
              </button>
            </div>

            <div className="px-4 pb-2 pt-6">
              <button
                type="submit"
                className="uppercase block w-full p-4 text-lg font-semibold rounded-full bg-[#0458AB] hover:bg-[#60A3D9] focus:outline-none"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
          onClick={handleCloseForgotPassword}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Reset Password</h3>
              <button
                onClick={handleCloseForgotPassword}
                className="text-gray-400 hover:text-gray-600 text-xl"
                disabled={forgotLoading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <p className="text-gray-600 mb-6 text-sm">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="forgotEmail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter your email"
                  required
                  disabled={forgotLoading}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseForgotPassword}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={forgotLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-[#0458AB] text-white rounded-lg hover:bg-[#60A3D9] transition-colors disabled:opacity-50"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <i className="fas fa-spinner animate-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send Reset Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {showSnackbar && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <i className="fas fa-check-circle"></i>
            <span className="text-sm font-medium">{snackbarMessage}</span>
            <button
              onClick={() => setShowSnackbar(false)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;

