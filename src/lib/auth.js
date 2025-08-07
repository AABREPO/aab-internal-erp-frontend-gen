import { metaApiClient } from './metaApi';
import { META_API_ENDPOINTS, STORAGE_KEYS } from './constants';

// Authentication service class
class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await metaApiClient.post(META_API_ENDPOINTS.LOGIN, {
        email,
        password,
      });
      
      const  user  = response.data;
      
      // set the username in local storage
      
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, user.access_token);


      return {
        success: true,
        user,
      };
    } catch (error) {
      // Handle CORS errors specifically
      if (error.isCorsError) {
        return {
          success: false,
          error: 'CORS Error: Unable to connect to the server. Please check if the server is running and accessible.',
          isCorsError: true,
        };
      }

      // Handle network errors
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        return {
          success: false,
          error: 'Network Error: Unable to connect to the server. Please check your internet connection.',
          isNetworkError: true,
        };
      }

      // Handle HTTP errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Login failed';
        
        return {
          success: false,
          error: message,
          status: status,
          isHttpError: true,
        };
      }

      // Handle other errors
      return {
        success: false,
        error: error.message || 'Login failed. Please try again.',
        isOtherError: true,
      };
    }
  }

  // Logout user
  async logout() {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await metaApiClient.post(META_API_ENDPOINTS.LOGOUT, {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data regardless of API call success
      this.clearAuthData();
    }
  }

  // Get current user data
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!(accessToken);
  }

  // Check auth status and handle redirects
  auth_status() {
    const isAuth = this.isAuthenticated();
    const currentPath = window.location.pathname;
    
    // If authenticated and on login page, redirect to home
    if (isAuth && currentPath === '/login') {
      window.location.href = '/';
      return { isAuthenticated: true, shouldRedirect: true, redirectTo: '/' };
    }
    
    // If not authenticated and not on login page, redirect to login
    if (!isAuth && currentPath !== '/login') {
      window.location.href = '/login';
      return { isAuthenticated: false, shouldRedirect: true, redirectTo: '/login' };
    }
    
    // No redirect needed
    return { 
      isAuthenticated: isAuth, 
      shouldRedirect: false, 
      currentPath 
    };
  }

  // Get access token
  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // Update user data
  updateUserData(userData) {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  // Clear all authentication data
  clearAuthData() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATUS);
  }

  // Refresh user profile
  async refreshUserProfile() {
    try {
      const response = await metaApiClient.get(META_API_ENDPOINTS.USER_PROFILE);
      const userData = response.data;
      this.updateUserData(userData);
      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to refresh profile',
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await metaApiClient.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      return {
        success: true,
        message: response.data.message || 'Password changed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to change password',
      };
    }
  }

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await metaApiClient.put(META_API_ENDPOINTS.USER_PROFILE, profileData);
      const updatedUser = response.data;
      this.updateUserData(updatedUser);

      return {
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile',
      };
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await metaApiClient.post('/forgot-password', { email });
      return {
        success: true,
        message: response.data.message || 'Password reset email sent',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send reset email',
      };
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await metaApiClient.post('/reset-password', {
        token,
        new_password: newPassword,
      });

      return {
        success: true,
        message: response.data.message || 'Password reset successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reset password',
      };
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await metaApiClient.post('/verify-email', { token });
      return {
        success: true,
        message: response.data.message || 'Email verified successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify email',
      };
    }
  }

  // Register user (if applicable)
  async register(userData) {
    try {
      const response = await metaApiClient.post('/register', userData);
      return {
        success: true,
        message: response.data.message || 'Registration successful',
        user: response.data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export { authService };
export default authService; 