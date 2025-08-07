import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../lib/auth';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const auth = authService.auth_status();
    
    if (auth.shouldRedirect) {
      // Let the auth_status function handle the redirect
      return;
    }
    
    setIsAuthenticated(auth.isAuthenticated);
    setUser(authService.getCurrentUser());
    setIsLoading(false);
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    checkAuthStatus,
    logout,
  };
}; 