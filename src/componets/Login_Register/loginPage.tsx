import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import Logo from '../../assets/logo.png';
import patron_modo_oscuro from '../../assets/patron_modo_oscuro.png';
import RecursoMovewise from '../../assets/RecursoMovewise.png';
import { sendForgotPasswordEmail } from '../../service/userService';

// Componentes
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import WelcomePanel from './WelcomePanel';
import ForgotPasswordDialog from './ForgotPasswordDialog';
import Snackbar from './Snackbar';

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  // Estados para el dialog de forgot password
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>('');
  
  // Estados para snackbar
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  console.log('env:', import.meta.env.VITE_URL_BASE);

  // Efecto para detectar si viene de selección de plan
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsFlipped(true);
      
      // Mostrar información del plan seleccionado
      const planName = localStorage.getItem('selectedPlanName');
      const planPrice = localStorage.getItem('selectedPlanPrice');
      
      if (planName && planPrice) {
        setSnackbarMessage(`Selected plan: ${planName} - ${planPrice}. Complete registration to continue.`);
        setShowSnackbar(true);
      }
    }
  }, [searchParams]);

  // Handler para forgot password
  const handleForgotPasswordSubmit = async (email: string) => {
    try {
      const data = await sendForgotPasswordEmail(email);
      
      // Mostrar el mensaje en snackbar
      setSnackbarMessage(data.detail || 'If that email exists, you will receive instructions via email.');
      setShowSnackbar(true);
      
      // Cerrar el dialog
      setShowForgotPassword(false);
      
    } catch (error) {
      console.error('Error sending forgot password email:', error);
      setSnackbarMessage('An error occurred. Please try again.');
      setShowSnackbar(true);
    }
  };

  // Handler para abrir dialog de forgot password
  const handleOpenForgotPassword = (email: string) => {
    setForgotPasswordEmail(email);
    setShowForgotPassword(true);
  };

  // Handler para cerrar dialog de forgot password
  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
  };

  // Handler para flip de panel
  const handlePanelFlip = (flipped: boolean) => {
    setIsFlipped(flipped);
  };

  // Handler para registro exitoso
  const handleRegisterSuccess = () => {
    setSnackbarMessage('Account created successfully!');
    setShowSnackbar(true);
    // Limpiar datos del plan del localStorage después del registro exitoso
    localStorage.removeItem('selectedPlanId');
    localStorage.removeItem('selectedPlanName');
    localStorage.removeItem('selectedPlanPrice');
  };

  // Handler para cerrar snackbar
  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <div className="min-h-screen flex items-stretch text-white relative text-base md:text-lg">
      {/* Back to Home Button */}
      <RouterLink 
        to="/"
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </RouterLink>

      {/* Left Side - Welcome Panel */}
      <WelcomePanel isFlipped={isFlipped} onFlip={handlePanelFlip} />

      {/* Right Side - Forms */}
      <div className="lg:w-2/5 w-full flex items-center justify-center text-center bg-[#0B2863] relative">
        <div
          className="absolute inset-0 bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${patron_modo_oscuro})` }}
        >
          <div className="absolute bg-black opacity-60 inset-0"></div>
        </div>

        <div className="w-full py-6 px-4 sm:px-8 z-20">
          {/* Logo */}
          <div className="my-6 flex justify-center items-center gap-4">
            <img src={Logo} alt="Company Logo" className="h-16 object-contain rounded-full bg-white" />
            <img src={RecursoMovewise} alt="Movingwise" className="h-16 object-contain" />
          </div>

          {/* Forms */}
          {!isFlipped ? (
            <>
              <LoginForm onForgotPassword={handleOpenForgotPassword} />
              
              {/* Mobile Register Button */}
              <div className="lg:hidden mt-6">
                <p className="text-gray-300 mb-4">New to Movingwise?</p>
                <button 
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="px-6 py-2 border border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300"
                >
                  Create Account
                </button>
              </div>
            </>
          ) : (
            <>
              <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
              
              {/* Mobile Login Button */}
              <div className="lg:hidden mt-6">
                <p className="text-gray-300 mb-4">Already have an account?</p>
                <button 
                  type="button"
                  onClick={() => setIsFlipped(false)}
                  className="px-6 py-2 border border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300"
                >
                  Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        isOpen={showForgotPassword}
        onClose={handleCloseForgotPassword}
        onSubmit={handleForgotPasswordSubmit}
        initialEmail={forgotPasswordEmail}
      />

      {/* Snackbar */}
      <Snackbar
        message={snackbarMessage}
        isVisible={showSnackbar}
        onClose={handleCloseSnackbar}
      />
    </div>
  );
};

export default LoginPage;