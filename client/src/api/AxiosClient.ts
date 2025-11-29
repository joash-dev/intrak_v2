import axios from "axios";

// Resolve API base URL based on environment
const resolveBaseURL = (): string => {
  // Check environment variable first (set at build time)
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Runtime detection (works even with old builds)
  if (typeof window !== 'undefined') {
    // Check for runtime API URL (for production builds)
    const runtimeURL = (window as any).__INTRAK_API_URL || (window as any).__APP_API_URL;
    if (runtimeURL) {
      console.log('Using runtime API URL:', runtimeURL);
      return runtimeURL.endsWith('/api') ? runtimeURL : `${runtimeURL}/api`;
    }
    
    // Auto-detect based on hostname (runtime check)
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    
    console.log('Detected hostname:', hostname, 'origin:', origin);
    
    // Production domains - use same origin for API (if server is on same domain)
    // Or use specific API server URL
    if (hostname === 'intrak.onrender.com' || hostname === 'www.intrak.site' || hostname === 'intrak.site') {
      const apiUrl = 'https://intrak.onrender.com/api';
      console.log('Using production API URL:', apiUrl);
      return apiUrl;
    }
    
    if (hostname === 'intrak-v2.onrender.com') {
      const apiUrl = 'https://intrak-backend.onrender.com/api';
      console.log('Using production API URL:', apiUrl);
      return apiUrl;
    }
    
    // If we're on a production-like domain but not localhost, try to infer API URL
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168')) {
      // Try to use same origin with /api
      const inferredUrl = `${origin}/api`;
      console.log('Inferred API URL from origin:', inferredUrl);
      return inferredUrl;
    }
  }
  
  // Default to localhost for development
  console.log('Using default localhost API URL');
  return 'http://localhost:5000/api';
};

let API_BASE_URL = resolveBaseURL();
console.log('Final API_BASE_URL:', API_BASE_URL);

// Runtime override: If we detect we're in production but API_BASE_URL is still localhost, fix it
if (typeof window !== 'undefined' && API_BASE_URL.includes('localhost')) {
  const hostname = window.location.hostname;
  if (hostname === 'intrak.onrender.com' || hostname === 'www.intrak.site' || hostname === 'intrak.site') {
    API_BASE_URL = 'https://intrak.onrender.com/api';
    console.warn('⚠️ Overriding localhost API URL to production:', API_BASE_URL);
  } else if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168')) {
    // Try to infer from current origin
    API_BASE_URL = `${window.location.origin}/api`;
    console.warn('⚠️ Overriding localhost API URL to inferred:', API_BASE_URL);
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // needed if you use cookies/auth
});

// Override baseURL in interceptor as a fallback (critical for old builds)
api.interceptors.request.use(
  (config) => {
    // Runtime check: if baseURL is localhost but we're in production, override it
    if (config.baseURL?.includes('localhost') && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Frontend: intrak.site → Backend: intrak.onrender.com
      if (hostname === 'intrak.site' || hostname === 'www.intrak.site') {
        config.baseURL = 'https://intrak.onrender.com/api';
        console.warn('⚠️ Runtime override: Changed localhost to https://intrak.onrender.com/api');
      } else if (hostname === 'intrak.onrender.com') {
        config.baseURL = 'https://intrak.onrender.com/api';
        console.warn('⚠️ Runtime override: Changed localhost to https://intrak.onrender.com/api');
      } else if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168')) {
        // For any other production domain, try to infer
        config.baseURL = `${window.location.origin}/api`;
        console.warn('⚠️ Runtime override: Changed baseURL to inferred URL in interceptor');
      }
    }
    
    // Add authorization token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    
    const baseURL = config.baseURL ?? api.defaults.baseURL ?? '';
    const requestPath = config.url ?? '';
    console.log('Making request to:', `${baseURL}${requestPath}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Add response interceptor for debugging and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const originalUrl = error.config?.url;
      
      console.log('401 Error - Original URL:', originalUrl);
      console.log('401 Error - Has refresh token:', !!refreshToken);
      
      // Don't try to refresh if the error is from the refresh endpoint itself
      if (originalUrl === '/auth/refresh') {
        console.log('Refresh token endpoint failed, clearing tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      if (refreshToken && error.config && !error.config._retry) {
        error.config._retry = true;
        
        try {
          console.log('Attempting to refresh token...');
          // Attempt to refresh the token
          const response = await api.post('/auth/refresh', {
            refreshToken: refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          console.log('Token refreshed successfully');
          
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(error.config);
        } catch (refreshError: any) {
          console.error('Token refresh failed:', refreshError.response?.data);
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token or already retried, redirect to login
        console.log('No refresh token available or already retried');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
