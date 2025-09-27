import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/sidebar';
import Home from './Home/ui/home';
import LoginPage from './components/Login_Register/loginPage';
import { isAuthenticated } from './service/authService';
import { useState, useEffect } from 'react';
import LoadingSpinner from './components/Login_Register/LoadingSpinner';
import PayrollPage from './Payroll/pages/PayrollPage';
import ResumeFuel from './resumeFuel/ui/pages/ResumeFuel';
import SummaryCost from './summaryCost/ui/pages/SummaryCost'
import ExtraCost from './extraCost/ui/pages/ExtraCost';
import AddOperatorsToOrder from './addOperatorToOrder/ui/addOperatorsToOrder';
import CreateOrder from './createOrder/ui/CreateOrder';
import WarehouseView from './warehouse/ui/WarehouseView';
import CreateWarehouseView from './warehouse/ui/CreateWarehouseView';
import Statistics from './statistics/ui/Statistics';
import CustomersView from './settings/customer/UI/customersView';
import CreateAdminView from './createAdmin/ui/createAdminView';
import JobsAndToolsGUI from './settings/jobAndTools/UI/JobsAndToolsGui';
import OrderBreakdownPage from './statistics/ui/OrderBreakdownPage';
import OperatorsPage from './operators/ui/OperatorsPage';
import AdminsPage from './adminPanel/ui/AdminsPage';
import ProfilePage from './profile/ui/ProfilePage';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkAuth = () => {
      try {
        // IMPORTANTE: Durante pre-rendering, react-snap no tiene acceso a localStorage/cookies
        // Solo verificar autenticación si estamos en el navegador
        if (typeof window !== 'undefined' && window.navigator) {
          const authStatus = isAuthenticated();
          setAuthenticated(authStatus);
        } else {
          // Durante pre-rendering, asumir no autenticado
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Solo agregar event listeners en el navegador
    if (typeof window !== 'undefined') {
      const handler = () => {
        setSessionExpired(true);
        setTimeout(() => {
          setSessionExpired(false);
          window.location.href = '/';
        }, 2000);
      };
      window.addEventListener('sessionExpired', handler);
      return () => window.removeEventListener('sessionExpired', handler);
    }
  }, []);

  // Durante pre-rendering (react-snap), mostrar el contenido sin loading
  if (!isClient && typeof window === 'undefined') {
    // Esto es durante el pre-rendering
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // En el navegador, comportamiento normal
  if (!isClient || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {sessionExpired && (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-4 z-50 shadow-lg">
          <strong>¡Session expired!</strong> Redirecting to home...
        </div>
      )}
      <Routes>
        <Route 
          path="/login" 
          element={authenticated ? <Navigate to="/app/dashboard" replace /> : <LoginPage />} 
        />
        
        <Route 
          path="/register" 
          element={<Navigate to="/app/login?mode=register" replace />} 
        />

        <Route 
          path="/app" 
          element={authenticated ? <Layout /> : <Navigate to="/app/login" replace />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Home />} />
          <Route path="resume-fuel" element={<ResumeFuel />} />
          <Route path="summary-cost" element={<SummaryCost />} />
          <Route path="operators" element={<OperatorsPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="extra-cost" element={<ExtraCost />} />
          <Route path="add-operators-to-order/:orderKey" element={<AddOperatorsToOrder />} />
          <Route path="create-daily" element={<CreateOrder/>} />
          <Route path="warehouse" element={<WarehouseView/>}/>
          <Route path="create-warehouse" element={<CreateWarehouseView/>}/>
          <Route path="customers" element={<CustomersView />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="create-admin" element={<CreateAdminView />} />
          <Route path="jobs-tools" element={<JobsAndToolsGUI />} />
          <Route path="statistics" element={<Statistics/>} />
          <Route path="/order-breakdown" element={<OrderBreakdownPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route 
          path="*" 
          element={
            authenticated ? 
              <Navigate to="/app/dashboard" replace /> : 
              <Navigate to="/app/login" replace />
          } 
        />
      </Routes>
    </>
  );
};

export default App;