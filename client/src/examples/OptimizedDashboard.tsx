import React, { memo } from "react";
import { useOptimizedData } from "../hooks/useOptimizedData";
import { usePerformanceMonitor } from "../hooks/usePerformanceMonitor";
import DebouncedSearch from "../components/DebouncedSearch";
import VirtualList from "../components/VirtualList";
import OptimizedCard from "../components/OptimizedCard";
import { Users, FileText, Clock, TrendingUp } from "lucide-react";

// Example of how to optimize your existing dashboard components
const OptimizedDashboard = memo(() => {
  const { measureRender } = usePerformanceMonitor("OptimizedDashboard");

  // Optimized data fetching with caching
  const {
    data: dashboardData,
    loading,
    error,
    refresh,
  } = useOptimizedData(
    () =>
      import("../services/dashboardService").then((s) =>
        s.dashboardService.getDashboardData()
      ),
    [], // dependencies
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  // Optimized search with debouncing
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Implement your search logic here
  };

  // Memoized stats cards
  const statsCards = React.useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        title: "Total Students",
        value: dashboardData.student?.totalStudents || 0,
        icon: <Users className="w-6 h-6" />,
        trend: { value: 12, isPositive: true },
      },
      {
        title: "Documents",
        value: dashboardData.documents?.length || 0,
        icon: <FileText className="w-6 h-6" />,
        trend: { value: 5, isPositive: false },
      },
      {
        title: "Hours Completed",
        value: dashboardData.student?.completedHours || 0,
        icon: <Clock className="w-6 h-6" />,
        trend: { value: 8, isPositive: true },
      },
      {
        title: "Progress",
        value: `${Math.round(
          ((dashboardData.student?.completedHours || 0) /
            (dashboardData.student?.totalHours || 1)) *
            100
        )}%`,
        icon: <TrendingUp className="w-6 h-6" />,
      },
    ];
  }, [dashboardData]);

  // Memoized students list for virtual scrolling
  const studentsList = React.useMemo(() => {
    return dashboardData?.students || [];
  }, [dashboardData?.students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Optimized Dashboard
        </h1>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Optimized Search */}
      <div className="max-w-md">
        <DebouncedSearch
          onSearch={handleSearch}
          placeholder="Search students..."
          delay={300}
        />
      </div>

      {/* Optimized Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <OptimizedCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Virtual Scrolling for Large Lists */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Students List</h2>
        <VirtualList
          items={studentsList}
          itemHeight={60}
          containerHeight={400}
          renderItem={(student, index) => (
            <div
              key={student.id}
              className="flex items-center p-3 border-b border-gray-200"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-medium text-sm">
                  {student.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">{student.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {student.program}
                </p>
                <p className="text-xs text-gray-500">Year {student.year}</p>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
});

OptimizedDashboard.displayName = "OptimizedDashboard";

export default OptimizedDashboard;
