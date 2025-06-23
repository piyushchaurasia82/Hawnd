# Enhanced Axios Instance with Automatic Token Management

This project includes an enhanced axios instance that automatically handles JWT token management, including storage, refresh, and authentication state.

## Features

- ✅ **Automatic Token Storage**: Access and refresh tokens are automatically stored in localStorage
- ✅ **Automatic Token Refresh**: Tokens are refreshed before they expire (5-minute threshold)
- ✅ **Request Queue Management**: Prevents multiple simultaneous refresh requests
- ✅ **Automatic Retry**: Failed requests are automatically retried after token refresh
- ✅ **Automatic Logout**: Redirects to login page when authentication fails
- ✅ **User Data Management**: Stores and manages user profile data
- ✅ **JWT Expiration Checking**: Validates token expiration before making requests

## File Structure

```
src/
└── services/
    └── api.ts          # Enhanced axios instance with token management
```

## Usage

### Basic API Calls

The enhanced axios instance automatically handles token management. You can use it like a regular axios instance:

```typescript
import api from '../services/api';

// GET request - automatically adds Authorization header
const response = await api.get('/api/projectmanagement/profile/');

// POST request - automatically adds Authorization header
const response = await api.post('/api/projectmanagement/projects/', {
  name: 'New Project',
  description: 'Project description'
});

// PUT request - automatically adds Authorization header
const response = await api.put('/api/projectmanagement/profile/', {
  first_name: 'Updated Name'
});

// DELETE request - automatically adds Authorization header
const response = await api.delete('/api/projectmanagement/projects/123/');
```

### Using the Token Manager Directly

```typescript
import { tokenManager } from '../services/api';

// Get tokens
const accessToken = tokenManager.getAccessToken();
const refreshToken = tokenManager.getRefreshToken();
const userData = tokenManager.getUserData();

// Check authentication status
const isAuth = tokenManager.isAuthenticated();

// Set tokens (usually done by auth service)
tokenManager.setTokens(accessToken, refreshToken, userData);

// Clear all tokens (logout)
tokenManager.clearTokens();
```

## How It Works

### 1. Request Interceptor

Before each request, the interceptor:
- Checks if an access token exists
- Validates if the token is expired or will expire soon
- If expired, automatically refreshes the token
- Adds the valid token to the request headers

### 2. Response Interceptor

After each response, the interceptor:
- Checks for 401 (Unauthorized) errors
- If 401 occurs, attempts to refresh the token
- Retries the original request with the new token
- If refresh fails, redirects to login page

### 3. Token Refresh Process

1. **Check Expiration**: JWT tokens are decoded to check expiration time
2. **Queue Management**: If a refresh is already in progress, new requests are queued
3. **API Call**: Refresh token is sent to the server
4. **Storage Update**: New tokens are stored in localStorage
5. **Request Retry**: Original requests are retried with new tokens

### 4. Error Handling

- **Network Errors**: Handled gracefully with user-friendly messages
- **Authentication Errors**: Automatic logout and redirect to login
- **Token Refresh Failures**: Clear all tokens and redirect to login
- **API Errors**: Proper error messages displayed to users

## Configuration

### Environment Variables

Make sure to set the API base URL (domain only, no path) in your environment variables:

```env
VITE_API_BASE_URL=https://hawnd-api.ebizneeds.com/
```

All API calls will automatically use this domain as the base URL.

### Token Expiration Threshold

The default threshold for token refresh is 5 minutes. You can modify this in `api.ts`:

```typescript
function isTokenExpired(token: string, thresholdMinutes: number = 5): boolean {
  // ... implementation
}
```

### Storage Keys

The localStorage keys used for token storage:

```typescript
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  SESSION_TOKEN: 'session_token',
  USER_DATA: 'user_data'
} as const;
```

## Security Features

- **Automatic Token Cleanup**: Tokens are cleared on logout or authentication failure
- **Secure Storage**: Tokens are stored in localStorage (consider using httpOnly cookies for production)
- **Expiration Validation**: Tokens are validated before each request
- **Refresh Token Rotation**: New refresh tokens are issued on each refresh
- **Queue Protection**: Prevents token refresh race conditions

## Best Practices

1. **Always use the enhanced axios instance** for API calls that require authentication
2. **Handle loading states** to provide good user experience
3. **Implement proper error handling** for failed API calls
4. **Test token refresh scenarios** to ensure smooth user experience

## Example Implementation

```typescript
// Example: Making authenticated API calls
import api from '../services/api';

// This will automatically include the Authorization header
const fetchUserProfile = async () => {
  try {
    const response = await api.get('/api/projectmanagement/profile/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
};

// Example: Creating a new project
const createProject = async (projectData: any) => {
  try {
    const response = await api.post('/api/projectmanagement/projects/', projectData);
    return response.data;
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
};

// Example: Using token manager for logout
import { tokenManager } from '../services/api';

const logout = () => {
  tokenManager.clearTokens();
  window.location.href = '/auth';
};
```

## Success Criteria

Your enhanced axios instance is working correctly if:

1. ✅ **No manual token management required** - tokens are handled automatically
2. ✅ **Seamless user experience** - users never see authentication errors due to expired tokens
3. ✅ **Automatic token refresh** - tokens are refreshed before they expire
4. ✅ **Proper error handling** - all error scenarios are handled gracefully
5. ✅ **Queue management** - multiple requests don't cause token refresh conflicts
6. ✅ **Security** - tokens are properly stored and cleared

The enhanced axios instance now handles all the complexity of JWT token management automatically, so you can focus on building your application features without worrying about authentication details!

## Testing

The Dashboard includes comprehensive testing tools:

### 🔍 **Basic Tests**
- **API Connection Test**: Verifies the axios instance can make authenticated requests
- **Token Status Check**: Shows current token state and authentication status
- **Real-time Feedback**: Displays test results in the UI

### 🧪 **Advanced Token Testing**
- **Manual Token Expiration**: Manually expires the current access token to test refresh flow
- **Complete Flow Test**: Tests the entire token refresh process from start to finish
- **Token Comparison**: Shows before/after token values to verify refresh worked
- **API Response Validation**: Confirms API calls work after token refresh

### 🎯 **How to Test Token Refresh**

1. **Login to the application** to get valid tokens
2. **Go to Dashboard** and use the testing tools
3. **Click "Manually Expire Token"** to force token expiration
4. **Watch the automatic refresh** as the system detects the expired token
5. **Verify new tokens** are generated and stored in localStorage
6. **Check API calls** still work with the new tokens

### 📊 **Test Results Include**
- Token presence and validity
- Before/after token comparison
- API response success/failure
- Token refresh success/failure
- Detailed error messages if any issues occur

## Security Features 