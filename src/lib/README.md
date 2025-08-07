# Authentication & API Client Documentation

## Quick Start

### Authentication Service (`authService`)

```javascript
import authService from './lib/auth';

// Login
const result = await authService.login(email, password);
if (result.success) {
  // User is logged in
  console.log('User:', result.user);
} else {
  console.error('Login failed:', result.error);
}

// Check authentication status
const authStatus = authService.auth_status();
// Returns: { isAuthenticated: boolean, shouldRedirect: boolean, redirectTo?: string }

// Logout
await authService.logout();

// Check if user is authenticated
const isAuth = authService.isAuthenticated();

// Get current user
const user = authService.getCurrentUser();
```

### API Client (`apiClient`)

```javascript
import { apiClient } from './lib/api';

// GET request
const response = await apiClient.get('/users');

// POST request
const response = await apiClient.post('/users', { name: 'John' });

// PUT request
const response = await apiClient.put('/users/1', { name: 'Jane' });

// DELETE request
const response = await apiClient.delete('/users/1');

// File upload
const response = await apiClient.upload('/upload', file);

// File download
const response = await apiClient.download('/download/file.pdf');
```

## Authentication Flow

### 1. Login Process
1. User submits login form
2. `authService.login()` is called
3. On success, tokens and user data are stored in localStorage
4. User is redirected to dashboard

### 2. Authentication Check
1. `authService.auth_status()` checks localStorage
2. If authenticated and on login page → redirect to home
3. If not authenticated and not on login page → redirect to login
4. Returns status object for component use

### 3. Protected Routes
- Wrap your main app routes with `<ProtectedRoute>`
- This automatically checks auth status on route changes
- Handles redirects based on authentication state

### 4. Logout Process
1. `authService.logout()` is called
2. API logout request is made (if possible)
3. All auth data is cleared from localStorage
4. User is redirected to login page

## Error Handling

### CORS Errors
- Short, user-friendly messages
- "CORS error: Can't connect to server."
- "Network error: Can't connect to server."

### HTTP Errors
- Status code and message from server
- `HTTP Error 401: Invalid credentials`

### Network Errors
- Connection issues
- "Network error: Can't connect to server."

## Configuration

### API Base URL
```javascript
// src/lib/constants.js
export const API_BASE_URL = 'https://backendaab.in/aabuilderDash/api';
```

### Storage Keys
```javascript
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  AUTH_STATUS: 'auth_status',
};
```

## Best Practices

1. **Always use `authService.auth_status()`** to check authentication
2. **Wrap protected routes** with `<ProtectedRoute>`
3. **Handle errors gracefully** with specific error types
4. **Use the API client** for all HTTP requests
5. **Clear auth data** on logout and token expiration

## Security Features

- **Automatic token refresh** on 401 responses
- **Request/response interceptors** for authentication
- **Secure token storage** in localStorage
- **CORS handling** with development proxy
- **Automatic logout** on authentication failures 