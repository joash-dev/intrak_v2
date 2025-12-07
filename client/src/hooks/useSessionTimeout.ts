import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface SessionTimeoutConfig {
  timeoutMinutes?: number;
  warningMinutes: number; // Show warning X minutes before timeout
}

const WARNING_BEFORE_TIMEOUT = 5; // Show warning 5 minutes before timeout

export const useSessionTimeout = (config?: SessionTimeoutConfig) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isWarning, setIsWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const warningMinutes = config?.warningMinutes || WARNING_BEFORE_TIMEOUT;
  const warningMs = warningMinutes * 60 * 1000;

  const checkSession = useCallback(async () => {
    try {
      // Make a lightweight API call to check session
      const response = await api.get('/auth/test');
      const remainingHeader = response.headers['x-session-remaining'];
      
      if (remainingHeader) {
        const remaining = parseInt(remainingHeader, 10);
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setIsExpired(true);
          handleLogout();
        } else if (remaining <= warningMs / 1000) {
          setIsWarning(true);
          if (remaining <= 60) {
            // Show warning when less than 1 minute remaining
            toast.error(
              `Your session will expire in ${Math.floor(remaining)} seconds. Please save your work.`,
              { duration: 10000, id: 'session-warning' }
            );
          }
        } else {
          setIsWarning(false);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401 && error.response?.data?.code === 'SESSION_TIMEOUT') {
        setIsExpired(true);
        handleLogout();
      }
    }
  }, [warningMs]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    toast.error('Your session has expired due to inactivity. Please log in again.');
    navigate('/login');
  }, [navigate]);

  const resetSession = useCallback(async () => {
    try {
      // Refresh token to reset session timer
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/refresh', { refreshToken });
        setTimeRemaining(null);
        setIsWarning(false);
        setIsExpired(false);
      }
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  }, []);

  useEffect(() => {
    // Check session every 30 seconds
    const interval = setInterval(() => {
      checkSession();
    }, 30000);

    // Initial check
    checkSession();

    // Track user activity to reset session
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let activityTimer: ReturnType<typeof setTimeout>;

    const handleActivity = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        // Reset session after 1 minute of activity
        resetSession();
      }, 60000);
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearInterval(interval);
      clearTimeout(activityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [checkSession, resetSession]);

  return {
    timeRemaining,
    isWarning,
    isExpired,
    resetSession,
    minutesRemaining: timeRemaining ? Math.floor(timeRemaining / 60) : null,
    secondsRemaining: timeRemaining ? timeRemaining % 60 : null
  };
};

