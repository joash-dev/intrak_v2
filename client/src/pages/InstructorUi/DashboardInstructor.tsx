import { useState, useEffect } from "react";
import {
  Users,
  Clock,
  Award,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Building2,
  Search,
  Eye,
  Activity,
  Bell,
  Download,
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  FileCheck,
} from "lucide-react";
import InstructorDocumentsTab from "./InstructorDocuments";
import InstructorMonitoringTab from "./InstructorStudent";
import InstructorEvaluationsTab from "./InstructorEvaluation";

// =============================================
// INSTRUCTOR DASHBOARD COMPONENT
// =============================================
const InstructorDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const students = [
    {
      id: "1",
      studentId: "2021-001",
      name: "Maria Santos",
      avatar: "MS",
      program: "BS Computer Science",
      company: "TechCorp Inc.",
      supervisor: "Engr. Juan Dela Cruz",
      startDate: "2024-08-15",
      endDate: "2024-12-15",
      attendanceRate: 96,
      hoursCompleted: 352,
      requiredHours: 400,
      tasksCompleted: 18,
      totalTasks: 20,
      lastEvaluation: 4.5,
      status: "active",
      lastActivity: "2 hours ago",
    },
    {
      id: "2",
      studentId: "2021-002",
      name: "Juan Dela Cruz",
      avatar: "JD",
      program: "BS Information Technology",
      company: "InnovateLab",
      supervisor: "Ms. Ana Reyes",
      startDate: "2024-08-15",
      endDate: "2024-12-15",
      attendanceRate: 92,
      hoursCompleted: 328,
      requiredHours: 400,
      tasksCompleted: 15,
      totalTasks: 18,
      lastEvaluation: 4.2,
      status: "active",
      lastActivity: "5 hours ago",
    },
    {
      id: "3",
      studentId: "2021-003",
      name: "Ana Reyes",
      avatar: "AR",
      program: "BS Computer Engineering",
      company: "DataSystems Corp",
      supervisor: "Engr. Carlos Martinez",
      startDate: "2024-08-15",
      endDate: "2024-12-15",
      attendanceRate: 88,
      hoursCompleted: 312,
      requiredHours: 400,
      tasksCompleted: 12,
      totalTasks: 16,
      lastEvaluation: 4.0,
      status: "at_risk",
      lastActivity: "1 day ago",
    },
  ];

  const recentActivities = [
    {
      id: "1",
      studentName: "Maria Santos",
      action: "Submitted Weekly Report",
      type: "submission",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      studentName: "Juan Dela Cruz",
      action: "Checked in at InnovateLab",
      type: "attendance",
      timestamp: "3 hours ago",
    },
    {
      id: "3",
      studentName: "Ana Reyes",
      action: "Completed Task: Database Design",
      type: "task",
      timestamp: "5 hours ago",
    },
  ];

  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter((s) => s.status === "active").length,
    atRiskStudents: students.filter((s) => s.status === "at_risk").length,
    completedStudents: students.filter((s) => s.status === "completed").length,
    avgAttendance: (
      students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length
    ).toFixed(1),
    avgRating:
      students
        .filter((s) => s.lastEvaluation)
        .reduce((sum, s) => sum + (s.lastEvaluation || 0), 0) /
      students.filter((s) => s.lastEvaluation).length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      at_risk: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors.active;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "submission":
        return <FileText className="w-4 h-4" />;
      case "attendance":
        return <Clock className="w-4 h-4" />;
      case "task":
        return <CheckCircle className="w-4 h-4" />;
      case "evaluation":
        return <Award className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "submission":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "attendance":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "task":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "evaluation":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor and evaluate your assigned students
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.totalStudents}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.activeStudents} currently active
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Attendance
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.avgAttendance}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Across all students</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Rating
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.avgRating.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Out of 5.0</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                At Risk
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats.atRiskStudents}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Needs attention</p>
        </div>
      </div>

      {/* Alert */}
      {stats.atRiskStudents > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm">
                Students Need Attention
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {stats.atRiskStudents} student(s) have low attendance or
                performance. Please review and provide guidance.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Students
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
                  <option value="at_risk">At Risk</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {student.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {student.studentId} • {student.program}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {student.company}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Attendance
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              student.attendanceRate >= 90
                                ? "bg-green-500"
                                : student.attendanceRate >= 75
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {student.attendanceRate}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Hours
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {student.hoursCompleted}/{student.requiredHours}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Rating
                      </p>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {student.lastEvaluation
                            ? student.lastEvaluation.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500">
                      Last activity: {student.lastActivity}
                    </span>
                    <button className="flex items-center space-x-2 px-3 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              Recent Activities
            </h3>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div
                    className={`p-2 rounded-lg ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.studentName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">Submit Evaluation</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Review Documents</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// MAIN INSTRUCTOR PORTAL
// =============================================
const InstructorPortal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Prevent back button after logout
  useEffect(() => {
    const preventBackButton = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", preventBackButton);
    return () => {
      window.removeEventListener("popstate", preventBackButton);
    };
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = sessionStorage.getItem("isAuthenticated");
      if (!isLoggedIn) {
        setIsAuthenticated(false);
      }
    };
    sessionStorage.setItem("isAuthenticated", "true");
    checkAuth();
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("isAuthenticated");
    localStorage.clear();
    setShowLogoutModal(false);
    window.location.replace("/login");
  };

  // Check auth before rendering
  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "documents", label: "Document Review", icon: FileCheck },
    { id: "monitoring", label: "Student Monitoring", icon: TrendingUp },
    { id: "evaluations", label: "Evaluations", icon: Award },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <InstructorDashboard />;
      case "documents":
        return <InstructorDocumentsTab />;
      case "monitoring":
        return <InstructorMonitoringTab />;
      case "evaluations":
        return <InstructorEvaluationsTab />;
      default:
        return <InstructorDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    OJT Portal
                  </h2>
                  <p className="text-xs text-gray-500">Instructor</p>
                </div>
              </div>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  PG
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Prof. Garcia
                  </p>
                  <p className="text-xs text-gray-500">Instructor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  OJT Portal
                </h2>
                <p className="text-xs text-gray-500">Instructor Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
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
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                PG
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Prof. Garcia
                </p>
                <p className="text-xs text-gray-500">Instructor</p>
              </div>
            </div>
            <button className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
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

      {/* Content Area */}
      <main className="p-6">{renderContent()}</main>

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

export default InstructorPortal;
