import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './componets/sidebar';
import Home from './Home/ui/home';
import LoginPage from './componets/loginPage';
import { isAuthenticated } from './service/authService';
import { useState, useEffect } from 'react';
import LoadingSpinner from './componets/LoadingSpinner';
import PayrollPage from './Payroll/pages/PayrollPage';
import ResumeFuel from './resumeFuel/ui/pages/ResumeFuel';
import SummaryCost from './summaryCost/ui/pages/SummaryCost'
import ExtraCost from './extraCost/ui/pages/ExtraCost';
import AddOperatorsToOrder from './addOperatorToOrder/ui/addOperatorsToOrder';
import CreateOrder from './createOrder/ui/CreateOrder';
import FinancialView from './financials/ui/FinancialView';
import WarehouseView from './warehouse/ui/WarehouseView';
import CreateWarehouseView from './warehouse/ui/CreateWarehouseView';
import Statistics from './statistics/ui/Statistics';
import CustomersView from './settings/customer/UI/customersView';
import CreateAdminView from './createAdmin/ui/createAdminView';
import JobsAndToolsGUI from './settings/jobAndTools/UI/JobsAndToolsGui';
import OrderBreakdownPage from './statistics/ui/OrderBreakdownPage';
import OperatorsPage from './operators/ui/OperatorsPage';
import AdminsPage from './adminPanel/ui/AdminsPage';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Marca que estamos en el cliente
    setIsClient(true);

    const checkAuth = () => {
      try {
        const authStatus = isAuthenticated();
        setAuthenticated(authStatus);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Escuchar evento global de expiración de sesión
    const handler = () => {
      setSessionExpired(true);
      setTimeout(() => {
        setSessionExpired(false);
        window.location.href = '/login';
      }, 2000);
    };
    window.addEventListener('sessionExpired', handler);
    return () => window.removeEventListener('sessionExpired', handler);
  }, []);

  // Mostrar loading hasta que se complete la hidratación
  if (!isClient || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {sessionExpired && (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-4 z-50 shadow-lg">
          <strong>¡Session expired!</strong>Please login again.
        </div>
      )}
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
            <Route path="summary-cost" element={<SummaryCost />} />
            <Route path="/operators" element={<OperatorsPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="extra-cost" element={<ExtraCost />} />
            <Route path="/add-operators-to-order/:orderKey" element={<AddOperatorsToOrder />} />
            <Route path="create-daily" element={<CreateOrder/>} />
            <Route path="/financialsView" element={<FinancialView/>} />
            <Route path="/warehouse" element={<WarehouseView/>}/>
            <Route path="/create-warehouse" element={<CreateWarehouseView/>}/>
            <Route path="/customers" element={<CustomersView />} />
            <Route path="/admins" element={<AdminsPage />} />
            <Route path="/create-admin" element={<CreateAdminView />} />
            <Route path="/jobs-tools" element={<JobsAndToolsGUI />} />
            <Route path="statistics" element={<Statistics/>} />
            <Route path="/order-breakdown" element={<OrderBreakdownPage />} />
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
    </>
  );
};

export default App;