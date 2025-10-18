import React from "react";

interface ModernLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "purple" | "green" | "red";
  text?: string;
  className?: string;
}

const ModernLoader: React.FC<ModernLoaderProps> = ({
  size = "md",
  color = "blue",
  text,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    red: "text-red-600",
  };

  const spinnerSizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      {/* Animated Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div
          className={`${spinnerSizeClasses[size]} border-gray-200 dark:border-gray-700 rounded-full animate-spin`}
        ></div>
        {/* Inner ring with color */}
        <div
          className={`absolute top-0 left-0 ${spinnerSizeClasses[size]} border-transparent border-t-current ${colorClasses[color]} rounded-full animate-spin`}
        ></div>
        {/* Pulsing dot */}
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 ${colorClasses[color]} rounded-full animate-pulse`}
        ></div>
      </div>

      {/* Loading text */}
      {text && (
        <p
          className={`text-sm font-medium ${colorClasses[color]} animate-pulse`}
        >
          {text}
        </p>
      )}
    </div>
  );
};

// Skeleton Loader Component
export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
      <div className="flex justify-end space-x-2">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      </div>
    </div>
  </div>
);

// Pulse Loading for Tables
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center space-x-4 p-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className={`h-4 bg-gray-300 dark:bg-gray-600 rounded ${
              colIndex === 0
                ? "w-8"
                : colIndex === columns - 1
                ? "w-16"
                : "w-24"
            }`}
          ></div>
        ))}
      </div>
    ))}
  </div>
);

// Shimmer Loading Effect
export const ShimmerLoader: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`animate-pulse ${className}`}>
    <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);

export default ModernLoader;
