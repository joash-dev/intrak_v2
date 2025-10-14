import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // needed if you use cookies/auth
});

// Add request interceptor for authentication and debugging
api.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    
    console.log('Making request to:', config.baseURL + config.url);
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
