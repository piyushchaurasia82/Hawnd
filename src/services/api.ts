import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Token storage keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  SESSION_TOKEN: 'session_token',
  USER_DATA: 'user_data'
} as const;

// Token management utilities
export const tokenManager = {
  // Get tokens from localStorage
  getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN),
  getRefreshToken: (): string | null => localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN),
  getSessionToken: (): string | null => localStorage.getItem(TOKEN_KEYS.SESSION_TOKEN),
  getUserData: (): any => {
    const userData = localStorage.getItem(TOKEN_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  // Set tokens in localStorage
  setTokens: (access: string, refresh: string, userData?: any): void => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refresh);
    localStorage.setItem(TOKEN_KEYS.SESSION_TOKEN, access);
    if (userData) {
      localStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(userData));
    }
  },

  // Clear all tokens
  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.SESSION_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER_DATA);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    return !!token && !isTokenExpired(token);
  },

  // Get username from access token
  getUsername: (): string | null => {
    // Prefer user_data if available
    const userData = localStorage.getItem(TOKEN_KEYS.USER_DATA);
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.username) return parsed.username;
      } catch {}
    }
    // Fallback to decoding the access token
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    if (!token) return null;
    const decoded = decodeJwt(token);
    return decoded && (decoded.username || decoded.user_name || decoded.sub || decoded.name) ?
      (decoded.username || decoded.user_name || decoded.sub || decoded.name) : null;
  }
};

// JWT decode function
function decodeJwt(token: string) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Check if token is expired or will expire soon
function isTokenExpired(token: string, thresholdMinutes: number = 5): boolean {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  return (expiryTime - currentTime) <= thresholdMs;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Refresh token function
const refreshAccessToken = async (refreshToken: string): Promise<{ access: string; refresh: string }> => {
  try {
    console.log('Attempting to refresh token with:', refreshToken.substring(0, 20) + '...');
    
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/projectmanagement/refresh-token/`,
      { 
        refresh: refreshToken,
        refresh_lifetime: '90d'
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Refresh token response:', response.data);

    // Handle different response formats
    if (response.data.status === 'success' && response.data.data) {
      console.log('Token refresh successful (format 1)');
      return response.data.data;
    } else if (response.data.access && response.data.refresh) {
      console.log('Token refresh successful (format 2)');
      return response.data;
    } else if (response.data.data && response.data.data.data && response.data.data.data.access) {
      console.log('Token refresh successful (format 3 - nested structure)');
      return response.data.data.data;
    } else {
      console.error('Invalid refresh token response format:', response.data);
      throw new Error('Invalid refresh token response format');
    }
  } catch (error: any) {
    console.error('Token refresh failed:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw new Error(error.response?.data?.message || error.message || 'Failed to refresh token');
  }
};

// Request interceptor: only attach token, do not refresh here
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401, refresh, and retry
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        tokenManager.clearTokens();
        window.location.href = '/auth';
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { access, refresh } = await refreshAccessToken(refreshToken);
          tokenManager.setTokens(access, refresh);
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          processQueue(null, access);
          isRefreshing = false;

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          tokenManager.clearTokens();
          window.location.href = '/auth';
          return Promise.reject(refreshError);
        }
      } else {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }
    }

    return Promise.reject(error);
  }
);

// --- Periodic proactive token refresh ---
function setupProactiveTokenRefresh() {
  setInterval(async () => {
    const accessToken = tokenManager.getAccessToken();
    const refreshToken = tokenManager.getRefreshToken();
    if (!accessToken || !refreshToken) return;
    // If access token will expire in 5 minutes, refresh it
    if (isTokenExpired(accessToken, 5)) {
      try {
        console.log('[Proactive Refresh] Access token expiring soon, refreshing...');
        const { access, refresh } = await refreshAccessToken(refreshToken);
        tokenManager.setTokens(access, refresh);
        console.log('[Proactive Refresh] Tokens refreshed and stored.');
      } catch (err) {
        console.error('[Proactive Refresh] Failed to refresh token:', err);
        // Optionally, handle logout or notification here
      }
    }
  }, 60 * 1000); // Check every 1 minute
}

// Start the proactive refresh timer when this module is loaded
setupProactiveTokenRefresh();

// Export the enhanced api instance and token manager
export default api; 