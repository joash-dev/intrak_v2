import React from "react";

// Skeleton for System Resource Metric Card
export const MetricCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    {/* Sparkline skeleton */}
    <div className="h-12 w-full flex items-end space-x-0.5 mb-2">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t"
          style={{ height: `${Math.random() * 40 + 20}%`, minHeight: '2px' }}
        />
      ))}
    </div>
    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
  </div>
);

// Skeleton for Circular Progress Card (Disk Usage)
export const CircularProgressCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    {/* Circular progress skeleton */}
    <div className="relative w-16 h-16 mx-auto mb-2">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
  </div>
);

// Skeleton for Info Card (Database, Uptime, etc.)
export const InfoCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

// Skeleton for Welcome Banner
export const WelcomeBannerSkeleton: React.FC = () => (
  <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 animate-pulse">
    <div className="h-8 w-64 bg-white/20 rounded mb-2"></div>
    <div className="h-4 w-32 bg-white/20 rounded mb-2"></div>
    <div className="h-4 w-96 bg-white/20 rounded"></div>
  </div>
);

// Skeleton for Activity/Alert List Item
export const ActivityItemSkeleton: React.FC = () => (
  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

// Skeleton for Activity/Alert Section
export const ActivitySectionSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <ActivityItemSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Complete Admin Overview Skeleton
export const AdminOverviewSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Welcome Banner Skeleton */}
    <WelcomeBannerSkeleton />

    {/* System Resource Metrics Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <CircularProgressCardSkeleton />
      <InfoCardSkeleton />
      <InfoCardSkeleton />
      <InfoCardSkeleton />
    </div>

    {/* Activities and Alerts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ActivitySectionSkeleton />
      <ActivitySectionSkeleton />
    </div>
  </div>
);

// Skeleton for User Management Table
export const UserTableSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#19191c] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
    {/* Table Header */}
    <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
    {/* Table Rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="grid grid-cols-6 gap-4 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for Stats Cards
export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#19191c] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

// Skeleton for Settings Section
export const SettingsSectionSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#19191c] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      ))}
    </div>
  </div>
);

// Complete Settings Page Skeleton
export const AdminSettingsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Settings Navigation Skeleton */}
    <div className="lg:col-span-1">
      <div className="bg-white dark:bg-[#19191c] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 animate-pulse">
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
    {/* Settings Content Skeleton */}
    <div className="lg:col-span-3">
      <div className="bg-white dark:bg-[#19191c] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AdminOverviewSkeleton;

