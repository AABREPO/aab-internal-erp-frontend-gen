import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../lib/auth';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Re-check on route changes as well
    authService.auth_status();
  }, [location.pathname]);

  const isAuth = authService.isAuthenticated();
  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};