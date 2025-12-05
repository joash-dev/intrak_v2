import axios from 'axios';

const ensureApiPath = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

const resolveBaseURL = (): string => {
  const envCandidates = [
    import.meta.env.VITE_API_URL as string | undefined,
    import.meta.env.VITE_API_BASE_URL as string | undefined,
  ].filter(Boolean) as string[];

  for (const candidate of envCandidates) {
    const normalized = ensureApiPath(candidate);
    if (normalized) {
      return normalized;
    }
  }

  if (typeof window !== 'undefined') {
    const runtimeCandidate =
      (window as unknown as Record<string, unknown>).__INTRAK_API_URL ??
      (window as unknown as Record<string, unknown>).__APP_API_URL;
    if (runtimeCandidate) {
      const normalized = ensureApiPath(String(runtimeCandidate));
      if (normalized) {
        return normalized;
      }
    }

    const hostname = window.location.hostname;
    const origin = window.location.origin;
    
    // Production domains - use same origin for API (server is on same domain via Nginx)
    if (hostname === 'intrak.onrender.com' || hostname === 'www.intrak.site' || hostname === 'intrak.site') {
      return `${origin}/api`;
    }
    
    if (hostname === 'intrak-v2.onrender.com') {
      return 'https://intrak-backend.onrender.com/api';
    }
    
    // If we're on a production-like domain but not localhost, try to infer API URL
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168')) {
      // Try to use same origin with /api
      return `${origin}/api`;
    }
  }

  return 'http://localhost:5000/api';
};

const API_BASE_URL = resolveBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
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