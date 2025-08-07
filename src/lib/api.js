import axios from 'axios';
import { CORE_API_BASE_URL, REQUEST_TIMEOUTS, STORAGE_KEYS, HTTP_STATUS } from './constants';

// Create core axios instance for core functionality
const coreApi = axios.create({
  baseURL: CORE_API_BASE_URL,
  timeout: REQUEST_TIMEOUTS.DEFAULT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
  },
  withCredentials: true,
});

// Request interceptor to add auth token and handle CORS
coreApi.interceptors.request.use(
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

// Response interceptor to handle auth errors, token refresh, and CORS errors
coreApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle CORS errors
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Core API CORS Error or Network Error:', error);
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
          // For core API, we'll redirect to login since auth is handled by meta API
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Helper methods for common HTTP operations
export const coreApiClient = {
  // GET request
  get: (url, config = {}) => coreApi.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => coreApi.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => coreApi.put(url, data, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => coreApi.patch(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => coreApi.delete(url, config),
  
  // Upload file
  upload: (url, formData, config = {}) => {
    return coreApi.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
      timeout: REQUEST_TIMEOUTS.UPLOAD,
    });
  },
  
  // Download file
  download: (url, config = {}) => {
    return coreApi.get(url, {
      ...config,
      responseType: 'blob',
      timeout: REQUEST_TIMEOUTS.DOWNLOAD,
    });
  },
};

// Legacy export for backward compatibility
export const apiClient = coreApiClient;

export default coreApi; 