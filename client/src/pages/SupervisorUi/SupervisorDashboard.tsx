import { useState } from "react";
import {
  Users,
  Clock,
  Award,
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
import IndustryPartnerAttendance from "./SupervisorAttendance";
import IndustryPartnerEvaluation from "./SupervisorEvaluation";
import IndustryPartnerDocuments from "./SupervisorDocuments";
// =============================================
// INDUSTRY PARTNER DASHBOARD COMPONENT
// =============================================
const PartnerDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const interns = [
    {
      id: "1",
      studentId: "2021-001",
      name: "Maria Santos",
      avatar: "MS",
      program: "BS Computer Science",
      university: "Tech University",
      supervisor: "You",
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
      pendingApprovals: 2,
    },
    {
      id: "2",
      studentId: "2021-002",
      name: "Juan Dela Cruz",
      avatar: "JD",
      program: "BS Information Technology",
      university: "Tech University",
      supervisor: "You",
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
      pendingApprovals: 1,
    },
    {
      id: "3",
      studentId: "2021-003",
      name: "Ana Reyes",
      avatar: "AR",
      program: "BS Computer Engineering",
      university: "Tech University",
      supervisor: "You",
      startDate: "2024-08-15",
      endDate: "2024-12-15",
      attendanceRate: 88,
      hoursCompleted: 312,
      requiredHours: 400,
      tasksCompleted: 12,
      totalTasks: 16,
      lastEvaluation: 4.0,
      status: "needs_attention",
      lastActivity: "1 day ago",
      pendingApprovals: 3,
    },
  ];

  const recentActivities = [
    {
      id: "1",
      internName: "Maria Santos",
      action: "Checked in",
      type: "attendance",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      internName: "Juan Dela Cruz",
      action: "Submitted report",
      type: "document",
      timestamp: "3 hours ago",
    },
    {
      id: "3",
      internName: "Ana Reyes",
      action: "Completed task",
      type: "task",
      timestamp: "5 hours ago",
    },
  ];

  const stats = {
    totalInterns: interns.length,
    activeInterns: interns.filter((i) => i.status === "active").length,
    pendingApprovals: interns.reduce((sum, i) => sum + i.pendingApprovals, 0),
    avgAttendance: (
      interns.reduce((sum, i) => sum + i.attendanceRate, 0) / interns.length
    ).toFixed(1),
    avgRating: (
      interns.reduce((sum, i) => sum + (i.lastEvaluation || 0), 0) /
      interns.length
    ).toFixed(1),
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      needs_attention:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    };
    return colors[status] || colors["active"];
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "attendance":
        return <Clock className="w-4 h-4" />;
      case "document":
        return <FileCheck className="w-4 h-4" />;
      case "task":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    const colors = {
      attendance:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      document: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      task: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    };
    return colors[type] || colors["task"];
  };

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.program.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || intern.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor and manage your interns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Interns
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.totalInterns}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Interns
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.activeInterns}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.pendingApprovals}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Attendance
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.avgAttendance}%
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Rating
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {stats.avgRating}
              </p>
            </div>
            <Award className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Alert */}
      {stats.pendingApprovals > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm">
                Pending Approvals
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You have {stats.pendingApprovals} attendance logs and documents
                waiting for your approval.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interns List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Interns
              </h2>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search interns..."
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
                  <option value="needs_attention">Needs Attention</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredInterns.map((intern) => (
                <div
                  key={intern.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {intern.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {intern.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {intern.studentId} • {intern.program}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {intern.university}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                          intern.status
                        )}`}
                      >
                        {intern.status.replace("_", " ")}
                      </span>
                      {intern.pendingApprovals > 0 && (
                        <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full font-medium">
                          {intern.pendingApprovals} pending
                        </span>
                      )}
                    </div>
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
                              intern.attendanceRate >= 90
                                ? "bg-green-500"
                                : intern.attendanceRate >= 75
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${intern.attendanceRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {intern.attendanceRate}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Hours
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {intern.hoursCompleted}/{intern.requiredHours}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Rating
                      </p>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {intern.lastEvaluation
                            ? intern.lastEvaluation.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500">
                      Last activity: {intern.lastActivity}
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
                      {activity.internName}
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
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Verify Attendance</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">Submit Evaluation</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Download Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// MAIN INDUSTRY PARTNER PORTAL
// =============================================
const IndustryPartnerPortal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "attendance", label: "Attendance Check", icon: Clock },
    { id: "evaluations", label: "Evaluations", icon: Award },
    { id: "documents", label: "View Documents", icon: FileCheck },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <PartnerDashboard />;
      case "attendance":
        return <IndustryPartnerAttendance />;
      case "evaluations":
        return <IndustryPartnerEvaluation />;
      case "documents":
        return <IndustryPartnerDocuments />;
      default:
        return <PartnerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    OJT Portal
                  </h2>
                  <p className="text-xs text-gray-500">Industry Partner</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  TC
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    TechCorp Inc.
                  </p>
                  <p className="text-xs text-gray-500">Supervisor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  OJT Portal
                </h2>
                <p className="text-xs text-gray-500">Industry Partner</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

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

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                TC
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  TechCorp Inc.
                </p>
                <p className="text-xs text-gray-500">Supervisor</p>
              </div>
            </div>
            <button className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="lg:ml-64 p-6 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default IndustryPartnerPortal;
