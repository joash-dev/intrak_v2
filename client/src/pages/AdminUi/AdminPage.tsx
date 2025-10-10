import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  FileText,
  Activity,
  //TrendingUp,
  AlertTriangle,
  //CheckCircle,
  Clock,
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  Shield,
  BarChart3,
  UserCog,
  Bell,
  Download,
  Eye,
} from "lucide-react";
import AdminUserManagement from "./AdminUserManagement";
import AdminCompanyManagement from "./AdminCompanyManagement";
// Mock API Data
const mockAdminData = {
  admin: {
    id: "1",
    name: "Admin User",
    email: "admin@intrak.com",
    role: "SUPER_ADMIN",
  },
  stats: {
    totalStudents: 245,
    activeInternships: 198,
    totalCompanies: 42,
    totalCoordinators: 8,
    totalInstructors: 15,
    pendingDocuments: 37,
    pendingAttendance: 23,
    systemUptime: "99.9%",
  },
  recentActivities: [
    {
      id: "1",
      type: "USER_CREATED",
      description: "New student registered: Juan Dela Cruz",
      timestamp: "2024-10-06 14:30",
      user: "Coordinator",
    },
    {
      id: "2",
      type: "DOCUMENT_APPROVED",
      description: "MOA approved for Maria Santos",
      timestamp: "2024-10-06 13:45",
      user: "Coordinator",
    },
    {
      id: "3",
      type: "COMPANY_ADDED",
      description: "New company added: Tech Solutions Inc.",
      timestamp: "2024-10-06 11:20",
      user: "Admin",
    },
    {
      id: "4",
      type: "ATTENDANCE_VERIFIED",
      description: "Attendance log verified for 15 students",
      timestamp: "2024-10-06 10:15",
      user: "Industry Partner",
    },
    {
      id: "5",
      type: "SYSTEM_UPDATE",
      description: "System backup completed successfully",
      timestamp: "2024-10-06 09:00",
      user: "System",
    },
  ],
  studentsByProgram: [
    { program: "Computer Engineering", count: 89, active: 72 },
    { program: "Electrical Engineering", count: 65, active: 53 },
    { program: "Mechanical Engineering", count: 54, active: 42 },
    { program: "Civil Engineering", count: 37, active: 31 },
  ],
  companyStats: [
    { name: "Tech Innovations Inc.", students: 23, status: "active" },
    { name: "Digital Solutions Corp.", students: 18, status: "active" },
    { name: "Engineering Works Ltd.", students: 15, status: "active" },
    { name: "Smart Systems Co.", students: 12, status: "active" },
    { name: "Future Tech Labs", students: 10, status: "active" },
  ],
  alerts: [
    {
      id: "1",
      type: "warning",
      title: "Pending Document Reviews",
      message: "37 documents awaiting coordinator approval",
      priority: "high",
    },
    {
      id: "2",
      type: "info",
      title: "System Maintenance",
      message: "Scheduled maintenance on Oct 15, 2024 at 2:00 AM",
      priority: "medium",
    },
    {
      id: "3",
      type: "warning",
      title: "Incomplete Profiles",
      message: "12 students have incomplete profile information",
      priority: "medium",
    },
  ],
  recentDocuments: [
    { type: "MOA", count: 15, pending: 5 },
    { type: "DTR", count: 89, pending: 12 },
    { type: "Evaluation Forms", count: 45, pending: 8 },
    { type: "Application Letters", count: 23, pending: 7 },
  ],
};

// Overview Component
const AdminOverviewTab = ({ data }: { data: typeof mockAdminData }) => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {data.admin.name}!
        </h2>
        <p className="opacity-90">
          System Administrator Dashboard - Monitor and manage the entire INTRAK
          system
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.stats.totalStudents}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {data.stats.activeInternships} active
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Companies
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.stats.totalCompanies}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Industry partners
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending Reviews
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.stats.pendingDocuments}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Needs attention
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                System Uptime
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.stats.systemUptime}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Excellent
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Coordinators
            </h3>
            <UserCog className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.stats.totalCoordinators}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Instructors
            </h3>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.stats.totalInstructors}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Attendance
            </h3>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.stats.pendingAttendance}
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            System Alerts
          </h3>
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === "warning"
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {alert.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      alert.priority === "high"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {alert.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students and Companies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Program */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Students by Program
          </h3>
          <div className="space-y-4">
            {data.studentsByProgram.map((program, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {program.program}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {program.active}/{program.count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{
                      width: `${(program.active / program.count) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center justify-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>View All Students</span>
          </button>
        </div>

        {/* Top Companies */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-purple-600" />
            Top Partner Companies
          </h3>
          <div className="space-y-3">
            {data.companyStats.map((company, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {company.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {company.students} students
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {company.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center justify-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Manage Companies</span>
          </button>
        </div>
      </div>

      {/* Documents Overview and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-green-600" />
            Document Statistics
          </h3>
          <div className="space-y-3">
            {data.recentDocuments.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {doc.type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total: {doc.count}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-orange-600">
                    {doc.pending} pending
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {doc.count - doc.pending} approved
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {data.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
            View Audit Logs
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-center transition-colors">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Add User
            </p>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-center transition-colors">
            <Building2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Add Company
            </p>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-center transition-colors">
            <Download className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Export Data
            </p>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg text-center transition-colors">
            <Settings className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Settings
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const [data] = useState(mockAdminData);
  const [activeTab, setActiveTab] = useState("overview");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    const preventBackButton = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", preventBackButton);
    return () => {
      window.removeEventListener("popstate", preventBackButton);
    };
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLogoutModal(false);
    window.location.replace("/login");
  };

  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  const navItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "users", label: "User Management", icon: Users },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "audit", label: "Audit Logs", icon: Activity },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverviewTab data={data} />;
      case "users":
        return <AdminUserManagement />;
      case "companies":
        return <AdminCompanyManagement />;
      case "settings":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold">System Settings</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Coming in Phase 5.4
            </p>
          </div>
        );
      case "audit":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold">Audit Logs</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Coming in Phase 5.5
            </p>
          </div>
        );
      default:
        return <AdminOverviewTab data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:relative lg:flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  INTRAK
                </h2>
                <p className="text-xs text-gray-500">Admin Portal</p>
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
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Admin Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.admin.name}
                </p>
                <p className="text-xs text-gray-500">{data.admin.role}</p>
              </div>
            </div>
            <button
              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
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
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
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
              Are you sure you want to log out from the admin portal? You will
              need to sign in again to access the system.
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

export default AdminDashboard;
