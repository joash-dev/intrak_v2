import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useEffect } from 'react';

interface SessionTimeoutWrapperProps {
  children: React.ReactNode;
}

export const SessionTimeoutWrapper: React.FC<SessionTimeoutWrapperProps> = ({ children }) => {
  const { isWarning, isExpired, minutesRemaining } = useSessionTimeout();

  useEffect(() => {
    if (isExpired) {
      // Session expired, hook will handle logout
      return;
    }

    if (isWarning && minutesRemaining !== null) {
      // Show warning notification (hook already shows toast)
      // Additional UI can be added here if needed
    }
  }, [isWarning, isExpired, minutesRemaining]);

  return <>{children}</>;
};

