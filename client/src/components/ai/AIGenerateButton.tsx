import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface AIGenerateButtonProps {
  onGenerate: () => Promise<string>;
  onSuccess: (generatedText: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

const AIGenerateButton: React.FC<AIGenerateButtonProps> = ({
  onGenerate,
  onSuccess,
  disabled = false,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      const generatedText = await onGenerate();
      onSuccess(generatedText);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.error || err.response?.data?.message || 'Failed to generate content';
      setError(errorMessage);
      console.error('AI generation error:', err);
      
      // Show more detailed error in console for debugging
      if (err.response?.data) {
        console.error('Error details:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variantClasses = {
    default: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700',
    outline: 'border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    ghost: 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20',
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading || disabled}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-lg font-medium
          transition-all duration-200
          flex items-center space-x-1.5
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title="Generate with AI"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 z-10 min-w-[200px]">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGenerateButton;

