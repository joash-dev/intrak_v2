import React, { memo } from "react";

interface OptimizedCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const OptimizedCard = memo<OptimizedCardProps>(
  ({ title, value, icon, trend, className = "" }) => {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <div
                className={`flex items-center mt-1 text-sm ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                <span>{trend.isPositive ? "↗" : "↘"}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </div>
    );
  }
);

OptimizedCard.displayName = "OptimizedCard";

export default OptimizedCard;
