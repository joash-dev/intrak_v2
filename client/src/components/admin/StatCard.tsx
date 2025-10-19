import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm font-outfit">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${iconColor}`}>{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
