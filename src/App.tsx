import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './componets/sidebar';
import Home from './componets/home';
import LoginPage from './componets/loginPage';
import { isAuthenticated } from './service/authService';
import { useState, useEffect } from 'react';
import LoadingSpinner from './componets/LoadingSpinner'; // Crea este componente
import PayrollPage from './Payroll/pages/PayrollPage';
import ResumeFuel from './resumeFuel/ui/pages/ResumeFuel';
import SummaryCost from './summaryCost/ui/pages/SummaryCost';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Simulamos un delay para verificar la autenticación
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
      setAuthenticated(isAuthenticated());
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />; // Muestra un spinner mientras carga
  }

  return (
    <Router>
      <Routes>
        {/* Login - accesible solo si no está autenticado */}
        <Route 
          path="/login" 
          element={authenticated ? <Navigate to="/home" replace /> : <LoginPage />} 
        />
        
        {/* Rutas protegidas */}
        <Route 
          path="/" 
          element={authenticated ? <Layout /> : <Navigate to="/login" replace />}
        >
        
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="resume-fuel" element={<ResumeFuel />} />
          <Route path="/summary-cost" element={<SummaryCost />} />
          <Route path="payroll" element={<PayrollPage />} />
          {/* Agrega aquí otras rutas protegidas */}
        </Route>

        {/* Ruta por defecto */}
        <Route 
          path="*" 
          element={
            authenticated ? 
              <Navigate to="/home" replace /> : 
              <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;