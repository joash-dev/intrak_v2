import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Add debug logging
    console.log('🔍 API Interceptor - Error Response:', {
      status: error.response?.status,
      url: originalRequest.url,
      method: originalRequest.method,
      message: error.response?.data?.message,
      isRetry: originalRequest._retry
    });

    // Only trigger token refresh for specific 401 errors (token expiration, not authentication failures)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorMessage = error.response?.data?.message;
      
      // Don't refresh token for password-related errors or other authentication failures
      if (errorMessage && (
        errorMessage.includes('Current password is incorrect') ||
        errorMessage.includes('Invalid credentials') ||
        errorMessage.includes('Access denied') ||
        errorMessage.includes('Forbidden')
      )) {
        console.log('🚫 Skipping token refresh for authentication error:', errorMessage);
        return Promise.reject(error);
      }
      
      console.log('🔄 Token refresh triggered for:', originalRequest.url);
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.log('❌ No refresh token available');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        console.log('🔄 Attempting token refresh...');
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        console.log('✅ Token refreshed, retrying request:', originalRequest.url);
        return api(originalRequest);
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;