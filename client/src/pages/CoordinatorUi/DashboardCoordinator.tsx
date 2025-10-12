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
  LogOut,
  Settings,
  Home,
  MessageSquare,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

import CoordinatorDocumentsTab from "./CoordinatorDocumentsTab";
import CoordinatorReportsTab from "./CoordinatorReportsTab";
import CoordinatorAnnouncementsTab from "./CoordinatorAnnouncement";
import CoordinatorSettingsTab from "./CoordinatorSettings";
import {
  coordinatorService,
  type CoordinatorStats,
  type CoordinatorStudent,
  type CoordinatorActivity,
  type CoordinatorAlert,
} from "../../services/coordinatorService";
import toast from "react-hot-toast";

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
  const [selectedPeriod, setSelectedPeriod] = useState("this_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CoordinatorStats>({
    totalStudents: 0,
    activeInterns: 0,
    pendingApprovals: 0,
    completedInternships: 0,
    attendanceRate: 0,
    documentsPending: 0,
    tasksCompleted: 0,
    averageRating: 0,
    trends: { students: 0, attendance: 0, documents: 0, ratings: 0 },
  });

  const [students, setStudents] = useState<CoordinatorStudent[]>([]);
  const [activities, setActivities] = useState<CoordinatorActivity[]>([]);
  const [alerts, setAlerts] = useState<CoordinatorAlert[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [studentsData, statsData, activitiesData, alertsData] =
        await Promise.allSettled([
          coordinatorService.getAllStudents(),
          coordinatorService.getDashboardStats(),
          coordinatorService.getRecentActivities(),
          coordinatorService.getAlerts(),
        ]);

      // Set students data
      if (studentsData.status === "fulfilled") {
        setStudents(studentsData.value);
      }

      // Set stats data
      if (statsData.status === "fulfilled") {
        setStats(statsData.value);
      } else if (studentsData.status === "fulfilled") {
        // Calculate stats from students if API fails
        const calculatedStats = coordinatorService.calculateStatsFromStudents(
          studentsData.value
        );
        setStats(calculatedStats);
      }

      // Set activities data
      if (activitiesData.status === "fulfilled") {
        setActivities(activitiesData.value);
      }

      // Set alerts data
      if (alertsData.status === "fulfilled") {
        setAlerts(alertsData.value);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

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

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-600" />
    );
  };

  const filteredStudents = students.filter((student) => {
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage all internship activities
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
        >
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="this_semester">This Semester</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            {getTrendIcon(stats.trends.students)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Students
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalStudents}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            <span className="text-green-600 font-medium">
              +{stats.trends.students}
            </span>{" "}
            from last month
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            {getTrendIcon(stats.trends.attendance)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active Interns
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.activeInterns}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Attendance:{" "}
            <span className="text-green-600 font-medium">
              {stats.attendanceRate}%
            </span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FileCheck className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            {getTrendIcon(stats.trends.documents)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pending Approvals
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.pendingApprovals}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.documentsPending} documents need review
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            {getTrendIcon(stats.trends.ratings)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Average Rating
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.averageRating}
          </p>
          <p className="text-xs text-gray-500 mt-2">Out of 5.0 stars</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-purple-600" />
            Recent Alerts
          </h2>
          <button className="text-sm text-purple-600 hover:text-purple-700">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-lg p-4 ${getAlertColor(
                alert.type
              )}`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {alert.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {alert.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            Recent Activities
          </h2>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${getActivityColor(
                      activity.status
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.student}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.action}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getActivityColor(
                      activity.status
                    )}`}
                  >
                    {activity.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Performance Overview
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Attendance Rate
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.attendanceRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${stats.attendanceRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Tasks Completed
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.tasksCompleted}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${stats.tasksCompleted}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Document Approval
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(
                    ((stats.totalStudents - stats.documentsPending) /
                      stats.totalStudents) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{
                    width: `${
                      ((stats.totalStudents - stats.documentsPending) /
                        stats.totalStudents) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Average Rating
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((stats.averageRating / 5) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full"
                  style={{ width: `${(stats.averageRating / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Student Management
          </h2>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Student
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Company
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Attendance
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tasks
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {student.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatStudentId(student.studentNumber)} •{" "}
                          {student.program}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {student.company}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            student.attendance >= 90
                              ? "bg-green-500"
                              : student.attendance >= 75
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${student.attendance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.attendance}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {student.tasks.completed}/{student.tasks.total}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
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

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "documents", label: "Review Documents", icon: FileCheck },
    { id: "reports", label: "Reports", icon: FileSpreadsheet },
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
      case "documents":
        return <CoordinatorDocumentsTab />;
      case "reports":
        return <CoordinatorReportsTab />;
      case "announcements":
        return <CoordinatorAnnouncementsTab />;
      case "settings":
        return <CoordinatorSettingsTab />;
      default:
        return <CoordinatorDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  OJT Portal
                </h2>
                <p className="text-xs text-gray-500">Coordinator</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                DC
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Dr. Cruz
                </p>
                <p className="text-xs text-gray-500">Coordinator</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("settings")}
              className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
            <button
              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4 ml-auto">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                DC
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
