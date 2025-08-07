import { useEffect } from 'react';
import authService from '../lib/auth';

export const ProtectedRoute = ({ children }) => {
  useEffect(() => {
    // Check auth status on component mount
    authService.auth_status();
  }, []);

  return children;
}; 