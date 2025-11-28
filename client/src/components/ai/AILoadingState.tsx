import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface AILoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AILoadingState: React.FC<AILoadingStateProps> = ({
  message = 'Generating with AI...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
      <Loader2 className={`${iconSizes[size]} animate-spin`} />
      <span className={sizeClasses[size]}>{message}</span>
    </div>
  );
};

export default AILoadingState;

