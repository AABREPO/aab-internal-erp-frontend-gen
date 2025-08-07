import axios from 'axios';
import { META_API_BASE_URL, REQUEST_TIMEOUTS, STORAGE_KEYS, HTTP_STATUS } from './constants';

// Create meta axios instance for auth-related functionality
const metaApi = axios.create({
  baseURL: META_API_BASE_URL,
  timeout: REQUEST_TIMEOUTS.DEFAULT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
metaApi.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
metaApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle CORS errors
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Meta API CORS Error or Network Error:', error);
      return Promise.reject({
        success: false,
        error: 'Network error. Please check your connection or contact support.',
        isCorsError: true
      });
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          // Try to refresh the token
          const refreshResponse = await metaApi.post('/refresh-token', {
            refresh_token: refreshToken,
          });
          
          if (refreshResponse.data.access_token) {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, refreshResponse.data.access_token);
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
            return metaApi(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear auth data and redirect to login
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Helper methods for common HTTP operations
export const metaApiClient = {
  // GET request
  get: (url, config = {}) => metaApi.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => metaApi.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => metaApi.put(url, data, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => metaApi.patch(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => metaApi.delete(url, config),
};

export default metaApi; 