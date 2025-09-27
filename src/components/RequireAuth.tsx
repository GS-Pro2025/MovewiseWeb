import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface RequireAuthProps {
  children: ReactElement;
  isAuthenticated: boolean;
}

const RequireAuth = ({ children, isAuthenticated }: RequireAuthProps) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;