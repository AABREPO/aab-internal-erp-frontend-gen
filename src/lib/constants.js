// API Base URLs
export const META_API_BASE_URL = 'http://localhost:8081/api'; // Auth related
export const CORE_API_BASE_URL = 'http://localhost:8082/api'; // Core functionality

// Meta API Endpoints (Auth related - port 8081)
export const META_API_ENDPOINTS = {
  LOGIN: '/login',
  LOGOUT: '/logout',
  REFRESH_TOKEN: '/refresh-token',
  USER_PROFILE: '/user/profile',
  USERS: '/users',
  VENDOR_NAMES: '/vendor_Names/getAll',
  // Add more auth-related endpoints as needed
};

// Core API Endpoints (Core functionality - port 8082)
export const CORE_API_ENDPOINTS = {
  // Purchase Order endpoints
  PURCHASE_ORDERS: '/purchase_orders',
  GET_ALL_PURCHASE_ORDERS: '/purchase_orders/getAll',
  GET_PURCHASE_ORDER_DETAILS: '/purchase_orders/details',
  CREATE_PURCHASE_ORDER: '/purchase_orders/create',
  UPDATE_PURCHASE_ORDER: '/purchase_orders/update',
  DELETE_PURCHASE_ORDER: '/purchase_orders/delete',
  // Add more core functionality endpoints as needed
};

// Legacy API_ENDPOINTS for backward compatibility
export const API_ENDPOINTS = {
  ...META_API_ENDPOINTS,
  ...CORE_API_ENDPOINTS,
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,  
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  AUTH_STATUS: 'auth_status',
};

// Request Timeouts
export const REQUEST_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  UPLOAD: 60000, // 60 seconds for file uploads
  DOWNLOAD: 120000, // 2 minutes for downloads
}; 