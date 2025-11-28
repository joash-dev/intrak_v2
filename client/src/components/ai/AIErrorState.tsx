import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AIErrorStateProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const AIErrorState: React.FC<AIErrorStateProps> = ({
  message,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-start space-x-2 p-3
        bg-red-50 dark:bg-red-900/20
        border border-red-200 dark:border-red-800
        rounded-lg text-sm text-red-600 dark:text-red-400
        ${className}
      `}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-900/40 rounded p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default AIErrorState;

