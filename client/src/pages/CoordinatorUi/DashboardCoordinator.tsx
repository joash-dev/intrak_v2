import React, { useState, useEffect } from "react";
import {
  Users,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  BarChart3,
  Activity,
  Bell,
  UserCheck,
  FileText,
  Menu,
  X,
  TrendingUp,
  LogOut,
  Settings,
  Home,
  MessageSquare,
  // FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";

import CoordinatorDocumentsTab from "./CoordinatorDocumentsTab";
import CoordinatorCompanyManagement from "./CoordinatorCompanyManagement";
import CoordinatorAnnouncementsTab from "./CoordinatorAnnouncement";
import CoordinatorSettingsTab from "./CoordinatorSettings";
import CoordinatorStudentManagement from "./CoordinatorStudentManagement";
import { coordinatorService } from "../../services/coordinatorService";
import { settingsService } from "../../services/settingsService";

// Utility function to format student ID
const formatStudentId = (studentNumber: string) => {
  // If already in correct format, return as is
  if (/^\d{2}-[A-Z]{2}-\d{4}$/.test(studentNumber)) {
    return studentNumber;
  }

  // If it's in format like "2021-12345", convert to "21-UR-1234"
  if (/^\d{4}-\d{5}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4); // Get last 2 digits of year
    const number = studentNumber.substring(5, 9); // Get first 4 digits of the number part
    return `${year}-UR-${number}`;
  }

  // If it's in format like "2021-1234", convert to "21-UR-1234"
  if (/^\d{4}-\d{4}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4); // Get last 2 digits of year
    const number = studentNumber.substring(5); // Get the number part
    return `${year}-UR-${number}`;
  }

  // Default fallback
  return studentNumber || "22-UR-0592";
};

// =============================================
// COORDINATOR DASHBOARD COMPONENT
// =============================================
const CoordinatorDashboard: React.FC = () => {
  // const [selectedPeriod, setSelectedPeriod] = useState("this_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Optimized data fetching with caching
  const { data: students = [], loading: studentsLoading } = useOptimizedData(
    () => coordinatorService.getAllStudents(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const {
    data: stats = {
      totalStudents: 0,
      activeInterns: 0,
      pendingApprovals: 0,
      completedInternships: 0,
      attendanceRate: 0,
      documentsPending: 0,
      tasksCompleted: 0,
      averageRating: 0,
      trends: { students: 0, attendance: 0, documents: 0, ratings: 0 },
    },
    loading: statsLoading,
  } = useOptimizedData(
    () => coordinatorService.getDashboardStats(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const { data: activities = [], loading: activitiesLoading } =
    useOptimizedData(
      () => coordinatorService.getRecentActivities(),
      [],
      { ttl: 2 * 60 * 1000 } // 2 minutes cache
    );

  const { data: alerts = [], loading: alertsLoading } = useOptimizedData(
    () => coordinatorService.getAlerts(),
    [],
    { ttl: 1 * 60 * 1000 } // 1 minute cache
  );

  const loading =
    studentsLoading || statsLoading || activitiesLoading || alertsLoading;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      suspended: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors.active;
  };

  const getAlertColor = (type: string) => {
    const colors: Record<string, string> = {
      warning: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
      info: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
      error: "border-red-500 bg-red-50 dark:bg-red-900/20",
      success: "border-green-500 bg-green-50 dark:bg-green-900/20",
    };
    return colors[type] || colors.info;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4" />;
      case "attendance":
        return <Clock className="w-4 h-4" />;
      case "evaluation":
        return <Award className="w-4 h-4" />;
      case "task":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // const getTrendIcon = (value: number) => {
  //   return value >= 0 ? (
  //     <ArrowUpRight className="w-4 h-4 text-green-600" />
  //   ) : (
  //     <ArrowDownRight className="w-4 h-4 text-red-600" />
  //   );
  // };

  const filteredStudents = (students || []).filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading coordinator dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
            </div>
            <p className="text-purple-100 text-sm font-medium max-w-xl">
              Monitor and manage all internship activities across the system
            </p>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-purple-100 text-xs font-medium mt-1">
                Total Students
              </p>
              <p className="text-2xl font-bold text-white">
                {stats?.totalStudents || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalStudents || 0}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    +12%
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
              Total Students
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Across all programs
            </p>
          </div>
        </div>

        {/* Active Interns Card */}
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.activeInterns || 0}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    +8%
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
              Active Interns
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Currently interning
            </p>
          </div>
        </div>

        {/* Pending Approvals Card */}
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <FileCheck className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.pendingApprovals || 0}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                    -3%
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
              Pending Approvals
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Documents need review
            </p>
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.averageRating && stats.averageRating > 0
                    ? stats.averageRating.toFixed(1)
                    : "N/A"}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    +0.2
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
              Average Rating
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {stats?.averageRating && stats.averageRating > 0
                ? "out of 5.0"
                : "0 evaluations"}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Alerts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Alerts
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Important notifications and updates
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {(alerts || []).map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-2xl p-5 hover:shadow-md transition-all duration-200 ${getAlertColor(
                alert.type
              )}`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-2">
                    {alert.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">
                      {alert.timestamp}
                    </p>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        alert.type === "warning"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : alert.type === "error"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : alert.type === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      }`}
                    >
                      {alert.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recent Activities
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Latest system activities
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {(activities || []).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-2xl shadow-sm ${getActivityColor(
                      activity.status
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {activity.student}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.action}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${getActivityColor(
                      activity.status
                    )}`}
                  >
                    {activity.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Performance Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Performance Overview
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Key performance metrics
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium text-sm">
              View All
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Attendance Rate
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-lg">
                  {stats?.attendanceRate || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats?.attendanceRate || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Tasks Completed
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-lg">
                  {stats?.tasksCompleted || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats?.tasksCompleted || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Document Approval
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-lg">
                  {(
                    (((stats?.totalStudents || 0) -
                      (stats?.documentsPending || 0)) /
                      (stats?.totalStudents || 1)) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${
                      (((stats?.totalStudents || 0) -
                        (stats?.documentsPending || 0)) /
                        (stats?.totalStudents || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Average Rating
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-lg">
                  {((stats?.averageRating || 0 / 5) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(stats?.averageRating || 0 / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Students List */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Student Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Manage and monitor student progress
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students, companies, or student numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-800 cursor-pointer transition-all duration-200"
                >
                  <td className="py-6 px-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {student.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-base">
                          {student.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatStudentId(student.studentNumber)} •{" "}
                          {student.program}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {student.company}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <span
                      className={`text-xs px-4 py-2 rounded-full font-semibold ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            student.attendance >= 90
                              ? "bg-gradient-to-r from-green-500 to-green-600"
                              : student.attendance >= 75
                              ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              : "bg-gradient-to-r from-red-500 to-red-600"
                          }`}
                          style={{ width: `${student.attendance}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {student.attendance}%
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {student.tasks.completed}/{student.tasks.total}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-lg flex items-center justify-center">
                        <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {student.evaluation}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =============================================
// MAIN COORDINATOR PORTAL
// =============================================
const CoordinatorPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Current user state
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    initials: string;
  } | null>(null);

  // Prevent back button after logout
  React.useEffect(() => {
    const preventBackButton = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", preventBackButton);

    return () => {
      window.removeEventListener("popstate", preventBackButton);
    };
  }, []);

  // Load current user data
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          const name = user.name || user.fullName || "Coordinator";
          const email = user.email || "";
          const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          setCurrentUser({
            name,
            email,
            initials,
          });
        }

        // Load profile photo from server
        const loadProfilePhoto = async () => {
          try {
            const serverPhoto = await settingsService.getProfilePhoto();
            if (serverPhoto) {
              setProfilePhoto(serverPhoto);
            }
          } catch (error) {
            console.log("No profile photo found");
          }
        };
        loadProfilePhoto();
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to default values
        setCurrentUser({
          name: "Coordinator",
          email: "",
          initials: "CO",
        });
      }
    };

    loadUserData();

    // Listen for profile photo updates from settings
    const handleProfilePhotoUpdate = (event: any) => {
      const { photoUrl } = event.detail;
      setProfilePhoto(photoUrl);
    };

    window.addEventListener("profilePhotoUpdated", handleProfilePhotoUpdate);

    return () => {
      window.removeEventListener(
        "profilePhotoUpdated",
        handleProfilePhotoUpdate
      );
    };
  }, []);

  // Check authentication on mount
  React.useEffect(() => {
    const checkAuth = () => {
      // Check if user has valid session/token
      const isLoggedIn = sessionStorage.getItem("isAuthenticated");
      if (!isLoggedIn) {
        setIsAuthenticated(false);
        // Redirect to login if not authenticated
        // window.location.replace('/login');
      }
    };

    // Set initial auth state
    sessionStorage.setItem("isAuthenticated", "true");
    checkAuth();
  }, []);

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest(".user-menu-dropdown")) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "students", label: "Student Management", icon: Users },
    { id: "documents", label: "Review Documents", icon: FileCheck },
    { id: "companies", label: "Company Management", icon: Building2 },
    { id: "announcements", label: "Announcements", icon: MessageSquare },
    //{ id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    // Clear authentication state
    setIsAuthenticated(false);
    sessionStorage.removeItem("isAuthenticated");
    localStorage.clear();

    // Close modal
    setShowLogoutModal(false);

    // Redirect to login page and prevent back navigation
    window.location.replace("/login");
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <CoordinatorDashboard />;
      case "students":
        return <CoordinatorStudentManagement />;
      case "documents":
        return <CoordinatorDocumentsTab />;
      case "companies":
        return <CoordinatorCompanyManagement />;
      case "announcements":
        return <CoordinatorAnnouncementsTab />;
      case "settings":
        return <CoordinatorSettingsTab />;
      default:
        return <CoordinatorDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-outfit">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 lg:ml-72">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Avatar Dropdown */}
              <div className="relative user-menu-dropdown">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {currentUser?.initials || "CO"}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentUser?.name || "Coordinator"}
                    </p>
                    <p className="text-xs text-gray-500">Coordinator</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                          {profilePhoto ? (
                            <img
                              src={profilePhoto}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold">
                              {currentUser?.initials || "CO"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {currentUser?.name || "Coordinator"}
                          </p>
                          <p className="text-sm text-gray-500">Coordinator</p>
                          <p className="text-xs text-gray-400">
                            {currentUser?.email || "coordinator@university.edu"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setActiveTab("settings");
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay - Only show on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <img
                src="/just_logo.png"
                alt="INTRAK Logo"
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-b from-blue-400 to-blue-800 bg-clip-text text-transparent">
                  INTRAK
                </h2>
                <p className="text-xs text-gray-500">Coordinator Portal</p>
              </div>
            </div>
            {/* Only show close button on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Only close sidebar on mobile
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900 dark:to-blue-900 dark:text-purple-300 shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content Area */}
      <main className="p-6 transition-all duration-300 lg:ml-72">
        {renderContent()}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Confirm Logout
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to log out? You will need to sign in again
              to access your account.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorPortal;
