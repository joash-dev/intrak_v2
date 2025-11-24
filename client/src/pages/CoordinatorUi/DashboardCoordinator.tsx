import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  Award,
  Search,
  BarChart3,
  Activity,
  Bell,
  FileText,
  Menu,
  X,
  TrendingUp,
  LogOut,
  Settings,
  Home,
  MessageSquare,
  // FileSpreadsheet,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";

import CoordinatorDocumentsTab from "./CoordinatorDocumentsTab";
import CoordinatorCompanyManagement from "./CoordinatorCompanyManagement";
import CoordinatorAnnouncementsTab from "./CoordinatorAnnouncement";
import CoordinatorSettingsTab from "./CoordinatorSettings";
import CoordinatorStudentManagement from "./CoordinatorStudentManagement";
import { coordinatorService } from "../../services/coordinatorService";
import { settingsService } from "../../services/settingsService";
import { formatDateTime } from "../../services/localeService";
import {
  notificationService,
  type NotificationItem,
} from "../../services/notificationService";
import { useTranslation } from "react-i18next";

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
interface CoordinatorDashboardProps {
  notificationsLoading: boolean;
}

const CoordinatorDashboard = ({
  notificationsLoading,
}: CoordinatorDashboardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const { data: activities, loading: activitiesLoading } = useOptimizedData(
    () => coordinatorService.getRecentActivities(),
    [],
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const { data: alerts, loading: alertsLoading } = useOptimizedData(
    () => coordinatorService.getAlerts(),
    [],
    { ttl: 1 * 60 * 1000 } // 1 minute cache
  );

  const loading =
    studentsLoading ||
    statsLoading ||
    activitiesLoading ||
    alertsLoading ||
    notificationsLoading;

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

  const getStatusLabel = (status: string) =>
    t(`dashboard.students.statusLabels.${status.toLowerCase()}`, {
      defaultValue: status,
    });

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

  const alertList = Array.isArray(alerts) ? alerts : [];

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
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl w-full"></div>

        {/* Students List Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-8">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/4"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Responsive Dynamic Design */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white shadow-2xl">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-float"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-float animation-delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-white rounded-full opacity-50 animate-float animation-delay-2000"></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full opacity-70 animate-float animation-delay-3000"></div>
        </div>

        {/* Content - Desktop Layout */}
        <div className="hidden md:block relative z-10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold animate-fade-in">
                  {t("dashboard.header.title")}
                </h1>
              </div>
              <p className="text-purple-100 text-sm font-medium max-w-xl">
                {t("dashboard.header.subtitle")}
              </p>
            </div>

            {/* Total Students Badge - Desktop */}
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-5 py-4 border border-white/20">
                <div className="flex flex-col items-center">
                  <Users className="w-6 h-6 text-white mb-1" />
                  <p className="text-white text-3xl font-bold leading-none mb-1">
                    {stats?.totalStudents || 0}
                  </p>
                  <p className="text-purple-100 text-xs font-medium whitespace-nowrap">
                    {t("dashboard.header.totalStudents")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Mobile Layout */}
        <div className="md:hidden relative z-10 p-4">
          {/* Mobile Header with Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold animate-fade-in">
                  Dashboard
                </h1>
              </div>
              <p className="text-purple-100 text-xs font-medium">
                Monitor and manage activities
              </p>
            </div>

            {/* Mobile Total Students Badge */}
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
              <div className="flex flex-col items-center">
                <Users className="w-4 h-4 text-white mb-0.5" />
                <p className="text-white text-lg font-bold leading-none mb-0.5">
                  {stats?.totalStudents || 0}
                </p>
                <p className="text-purple-100 text-[9px] font-medium whitespace-nowrap">
                  Total Students
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
      </div>

      <div className="space-y-8">
        {/* Enhanced Students List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 sm:space-y-6 lg:space-y-0 mb-6 sm:mb-8">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {t("dashboard.students.title")}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t("dashboard.students.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64 lg:w-72">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder={t("dashboard.students.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-12 pr-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium w-full sm:w-auto"
              >
                <option value="all">{t("dashboard.students.filters.all")}</option>
                <option value="active">{t("dashboard.students.filters.active")}</option>
                <option value="pending">{t("dashboard.students.filters.pending")}</option>
                <option value="completed">{t("dashboard.students.filters.completed")}</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("dashboard.students.table.student")}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("dashboard.students.table.company")}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("dashboard.students.table.status")}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("dashboard.students.table.attendance")}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("dashboard.students.table.tasks")}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("dashboard.students.table.rating")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 px-6">
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-inner">
                          <Users className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("dashboard.students.empty.title")}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                            {t("dashboard.students.empty.description")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate("/coordinator/student-management")}
                          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                        >
                          {t("dashboard.students.empty.action")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredStudents.slice(0, 4).map((student) => (
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
                            {getStatusLabel(student.status)}
                          </span>
                        </td>
                        <td className="py-6 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${student.attendance >= 90
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
                  </>
                )}
              </tbody>
            </table>
            {filteredStudents.length > 4 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => navigate("/coordinator/student-management")}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium text-sm shadow-lg"
                >
                  Manage Students
                </button>
              </div>
            )}
          </div>

          {/* Mobile Card View - Hidden on Desktop */}
          <div className="lg:hidden space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-inner mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                </div>
                <div className="space-y-2 mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {t("dashboard.students.empty.title")}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                    {t("dashboard.students.empty.description")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/coordinator/student-management")}
                  className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs sm:text-sm font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  {t("dashboard.students.empty.action")}
                </button>
              </div>
            ) : (
              <>
                {filteredStudents.slice(0, 3).map((student) => (
                  <div
                    key={student.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                    {/* Student Header */}
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                          {student.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatStudentId(student.studentNumber)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {student.program}
                        </p>
                      </div>
                    </div>

                    {/* Company Section */}
                    <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {student.company}
                      </span>
                    </div>

                    {/* Status and Metrics */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Status</span>
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-semibold ${getStatusColor(
                            student.status
                          )}`}
                        >
                          {getStatusLabel(student.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Attendance</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${student.attendance >= 90
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : student.attendance >= 75
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                  : "bg-gradient-to-r from-red-500 to-red-600"
                                }`}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {student.attendance}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Tasks</span>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {student.tasks.completed}/{student.tasks.total}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Rating</span>
                        <div className="flex items-center space-x-1.5">
                          <Award className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-300" />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {student.evaluation}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredStudents.length > 3 && (
                  <div className="pt-2">
                    <button
                      onClick={() => navigate("/coordinator/student-management")}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium text-sm shadow-lg"
                    >
                      Manage Students
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Enhanced Performance Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {t("dashboard.performance.title")}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {t("dashboard.performance.subtitle")}
              </p>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {t("dashboard.performance.attendanceRate")}
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">
                  {stats?.attendanceRate || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 lg:h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 sm:h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats?.attendanceRate || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {t("dashboard.performance.tasksCompleted")}
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">
                  {stats?.tasksCompleted || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 lg:h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 sm:h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats?.tasksCompleted || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {t("dashboard.performance.documentApproval")}
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">
                  {(
                    (((stats?.totalStudents || 0) -
                      (stats?.documentsPending || 0)) /
                      (stats?.totalStudents || 1)) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 lg:h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 sm:h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(((stats?.totalStudents || 0) -
                      (stats?.documentsPending || 0)) /
                      (stats?.totalStudents || 1)) *
                      100
                      }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {t("dashboard.performance.averageRating")}
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">
                  {((stats?.averageRating || 0 / 5) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 lg:h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 sm:h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(stats?.averageRating || 0 / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Enhanced Alerts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {t("dashboard.alerts.title")}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {t("dashboard.alerts.subtitle")}
              </p>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {(alertList || []).slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 p-3 sm:p-4 lg:p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium whitespace-nowrap flex-shrink-0">
                    {alert.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {(!alertList || alertList.length === 0) && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center py-4 sm:py-6">
                {t("dashboard.alerts.empty")}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {t("dashboard.activities.title")}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {t("dashboard.activities.subtitle")}
              </p>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {(activities || []).slice(0, 6).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                  <div
                    className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm flex-shrink-0 ${getActivityColor(
                      activity.status
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {activity.student}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                      {activity.action}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                  {formatDateTime(activity.timestamp)}
                </span>
              </div>
            ))}
            {(!activities || activities.length === 0) && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center py-4 sm:py-6">
                {t("dashboard.activities.empty")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// MAIN COORDINATOR PORTAL
// =============================================
const CoordinatorPortal: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    data: notificationsData,
    loading: notificationsLoading,
    refresh: refreshNotifications,
  } = useOptimizedData<NotificationItem[]>(
    () => notificationService.getNotifications({ limit: 15 }),
    [],
    { ttl: 60 * 1000 }
  );
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (Array.isArray(notificationsData)) {
      setLocalNotifications(notificationsData);
    }
  }, [notificationsData]);

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

  const loadUserData = useCallback(() => {
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
      setCurrentUser({
        name: "Coordinator",
        email: "",
        initials: "CO",
      });
    }
  }, []);

  useEffect(() => {
    loadUserData();

    const handleProfileUpdated = (event: any) => {
      const { user } = event.detail || {};
      if (user?.name || user?.email) {
        const name = user.name || user.fullName || "Coordinator";
        const email = user.email || "";
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        setCurrentUser({ name, email, initials });
      }
    };

    const handleProfilePhotoUpdate = (event: any) => {
      const { photoUrl } = event.detail;
      setProfilePhoto(photoUrl);
    };

    window.addEventListener("profileUpdated", handleProfileUpdated);
    window.addEventListener("profilePhotoUpdated", handleProfilePhotoUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdated);
      window.removeEventListener(
        "profilePhotoUpdated",
        handleProfilePhotoUpdate
      );
    };
  }, [loadUserData]);

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

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest(".user-menu-dropdown")) {
        setShowUserMenu(false);
      }
      if (showNotifications && !target.closest(".notifications-dropdown")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  const navItems = [
    { id: "dashboard", label: t("dashboard.nav.dashboard"), icon: Home },
    { id: "students", label: t("dashboard.nav.students"), icon: Users },
    { id: "documents", label: t("dashboard.nav.documents"), icon: FileCheck },
    { id: "companies", label: t("dashboard.nav.companies"), icon: Building2 },
    { id: "announcements", label: t("dashboard.nav.announcements"), icon: MessageSquare },
  ];

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification.id);
        setLocalNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item
          )
        );
        refreshNotifications();
      }

      // Handle message notifications - navigate to student messages
      if (notification.title === "New Message from Student" && notification.link) {
        // Extract studentId from link like /coordinator/students?studentId=xxx
        const urlParams = new URLSearchParams(notification.link.split('?')[1] || '');
        const studentId = urlParams.get('studentId');
        if (studentId) {
          // Store studentId in sessionStorage to be picked up by CoordinatorStudentManagement
          sessionStorage.setItem('openStudentId', studentId);
          setActiveTab('students');
          setShowNotifications(false);
          return;
        }
      }

      if (notification.type === "DOCUMENT") {
        setActiveTab("documents");
        navigate("/coordinator/dashboard");
      } else if (notification.link) {
        const link = notification.link;
        if (/^https?:\/\//i.test(link)) {
          window.open(link, "_blank", "noopener,noreferrer");
        } else {
          const normalizedLink = link.startsWith("/") ? link : `/${link}`;
          if (normalizedLink.startsWith("/login")) {
            navigate("/coordinator/dashboard");
          } else if (normalizedLink.includes('/coordinator/students')) {
            // Handle coordinator students link with studentId
            const urlParams = new URLSearchParams(link.split('?')[1] || '');
            const studentId = urlParams.get('studentId');
            if (studentId) {
              sessionStorage.setItem('openStudentId', studentId);
              setActiveTab('students');
              setShowNotifications(false);
              return;
            }
            navigate(normalizedLink);
          } else {
            navigate(normalizedLink);
          }
        }
      }
    } catch (error) {
      console.error("Error handling notification interaction", error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setLocalNotifications((prev) =>
        prev.map((item) => ({ ...item, read: true }))
      );
      refreshNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  const unreadNotificationCount = localNotifications.filter(
    (notification) => !notification.read
  ).length;

  const formatDropdownTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    return formatDateTime(timestamp);
  };

  const handleLogout = () => {
    const appPrefs = localStorage.getItem("appPreferences");
    const notificationPrefs = localStorage.getItem("notificationPreferences");

    setIsAuthenticated(false);
    sessionStorage.removeItem("isAuthenticated");

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    if (notificationPrefs) {
      localStorage.setItem("notificationPreferences", notificationPrefs);
    }
    if (appPrefs) {
      localStorage.setItem("appPreferences", appPrefs);
      try {
        const parsed = JSON.parse(appPrefs);
        settingsService.applyTheme(parsed.theme as "light" | "dark" | "system");
      } catch (error) {
        console.error("Failed to re-apply theme during logout", error);
      }
    }

    setShowLogoutModal(false);
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
        return (
          <CoordinatorDashboard
            notificationsLoading={notificationsLoading}
          />
        );
      case "students":
        return <CoordinatorStudentManagement />;
      case "documents":
        return <CoordinatorDocumentsTab />;
      case "companies":
        return <CoordinatorCompanyManagement />;
      case "announcements":
        return <CoordinatorAnnouncementsTab />;
      case "settings":
        return <CoordinatorSettingsTab onProfileUpdate={loadUserData} />;
      default:
        return (
          <CoordinatorDashboard
            notificationsLoading={notificationsLoading}
          />
        );
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
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center space-x-4">
              <div className="relative notifications-dropdown">
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-72 sm:w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 flex flex-col max-h-96 sm:max-h-[28rem] md:max-h-[32rem]">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between flex-shrink-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {t("dashboard.notifications.title")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t("dashboard.notifications.subtitle")}
                        </p>
                      </div>
                      {unreadNotificationCount > 0 && (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200 ml-2 flex-shrink-0">
                          {t("dashboard.notifications.new", { count: unreadNotificationCount })}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 min-h-0">
                      {notificationsLoading ? (
                        <div className="px-4 sm:px-5 py-8 flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {t("dashboard.notifications.loading")}
                        </div>
                      ) : localNotifications.length > 0 ? (
                        localNotifications
                          .filter((notification) =>
                            [
                              "DOCUMENT",
                              "ATTENDANCE",
                              "ALERT",
                              "SYSTEM",
                              "OTHER",
                            ].includes(notification.type ?? "OTHER")
                          )
                          .map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => {
                                handleNotificationClick(notification);
                                setShowNotifications(false);
                              }}
                              className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 transition-colors ${notification.read
                                ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                                : "bg-purple-50/70 dark:bg-purple-900/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/30"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                                    {formatDropdownTimestamp(notification.createdAt)}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3">
                                {notification.message}
                              </p>
                              {notification.type && (
                                <span className="mt-2 sm:mt-3 inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  {notification.type.replace(/_/g, " ")}
                                </span>
                              )}
                            </button>
                          ))
                      ) : (
                        <div className="px-4 sm:px-5 py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {t("dashboard.notifications.empty")}
                        </div>
                      )}
                    </div>

                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={async () => {
                          await handleMarkAllNotificationsRead();
                          setShowNotifications(false);
                        }}
                        disabled={localNotifications.length === 0 || unreadNotificationCount === 0}
                        className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("dashboard.notifications.markAll")}
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("dashboard");
                          setShowNotifications(false);
                        }}
                        className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 transition-colors"
                      >
                        {t("dashboard.notifications.viewDashboard")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
                  className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 ${activeTab === item.id
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
        <div key={activeTab} className="tab-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
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
