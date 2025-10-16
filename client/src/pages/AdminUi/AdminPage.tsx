import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  FileText,
  Activity,
  AlertTriangle,
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  Shield,
  Bell,
  Loader2,
  Calendar,
  User,
} from "lucide-react";
import AdminUserManagement from "./AdminUserManagement";
import AdminSettings from "./AdminSettings";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import {
  adminService,
  type AdminStats,
  type AdminActivity,
  type AdminAlert,
  type StudentsByProgram,
  type CompanyStats,
  type DocumentStats,
} from "../../services/adminService";
import api from "../../services/api";
import { settingsService } from "../../services/settingsService";

// Admin Data Interface
interface AdminData {
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  stats: AdminStats;
  recentActivities: AdminActivity[];
  studentsByProgram: StudentsByProgram[];
  companyStats: CompanyStats[];
  alerts: AdminAlert[];
  recentDocuments: DocumentStats[];
}

// Overview Component
const AdminOverviewTab = ({ data }: { data: AdminData }) => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {data.admin.name}!
        </h2>
        <p className="text-sm opacity-80">Admin ID: ADMIN-001</p>
        <p className="opacity-90">
          System Administrator Dashboard - Monitor and manage the entire INTRAK
          system
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.stats.totalStudents}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {data.stats.activeStudents} active
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Companies
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.stats.totalCompanies}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Industry partners
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Documents
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                0
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                0 pending
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Industry Partners
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.stats.totalIndustryPartners}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Active partners
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {alert.createdAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-green-600" />
          Recent Activities
        </h3>
        <div className="space-y-3">
          {data.recentActivities.length > 0 ? (
            data.recentActivities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user} • {activity.timestamp}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                  {activity.type}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Optimized data fetching with caching
  const { data: stats, loading: statsLoading } = useOptimizedData(
    () => adminService.getDashboardStats(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const { data: activities, loading: activitiesLoading } = useOptimizedData(
    () => adminService.getRecentActivities(),
    [],
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const { data: alerts, loading: alertsLoading } = useOptimizedData(
    () => adminService.getSystemAlerts(),
    [],
    { ttl: 1 * 60 * 1000 } // 1 minute cache
  );

  const { data: studentsByProgram } = useOptimizedData(
    () => adminService.getStudentsByProgram(),
    [],
    { ttl: 10 * 60 * 1000 } // 10 minutes cache
  );

  const { data: companyStats } = useOptimizedData(
    () => adminService.getCompanyStats(),
    [],
    { ttl: 10 * 60 * 1000 } // 10 minutes cache
  );

  const { data: documentStats } = useOptimizedData(
    () => adminService.getDocumentStats(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const { data: announcements } = useOptimizedData(
    () => adminService.getAnnouncements(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  // Ensure data is always available
  const safeStats = stats || {
    totalStudents: 0,
    activeStudents: 0,
    totalCompanies: 0,
    totalCoordinators: 0,
    totalInstructors: 0,
    totalIndustryPartners: 0,
    pendingAttendance: 0,
    pendingDocuments: 0,
    systemUptime: "99.9%",
    recentRegistrations: 0,
    monthlyActiveUsers: 0,
  };

  const safeActivities = activities || [];
  const safeAlerts = alerts || [];
  const safeStudentsByProgram = studentsByProgram || [];
  const safeCompanyStats = companyStats || [];
  const safeDocumentStats = documentStats || [];
  const safeAnnouncements = announcements || [];

  const loading = statsLoading || activitiesLoading || alertsLoading;

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const userString = localStorage.getItem("user");

      if (!token || !userString) {
        setIsAuthenticated(false);
        return;
      }

      // Parse user and check if it's an admin
      try {
        const user = JSON.parse(userString);
        if (user.role?.toLowerCase() !== "admin") {
          setIsAuthenticated(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setIsAuthenticated(false);
        return;
      }
    };

    checkAuth();

    // Load saved theme preferences
    const appPrefs = settingsService.loadAppPreferences();
    settingsService.applyTheme(appPrefs.theme);

    // Load saved profile photo from server
    const loadProfilePhoto = async () => {
      try {
        const serverPhoto = await settingsService.getProfilePhoto();
        if (serverPhoto) {
          setProfilePhoto(serverPhoto);
        }
      } catch (error) {
        console.error("Error loading profile photo:", error);
      }
    };
    loadProfilePhoto();
  }, []);

  // Close user menu and notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (showUserMenu && !target.closest(".user-menu-dropdown")) {
        setShowUserMenu(false);
      }

      if (showNotifications && !target.closest(".notification-dropdown")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  const handleLogout = async () => {
    try {
      // Call logout API to invalidate refresh token
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear all auth data
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setShowLogoutModal(false);
      window.location.replace("/login");
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const getNotificationCount = () => {
    return safeAnnouncements.length;
  };

  // Check auth before rendering
  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "users", label: "User Management", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    const adminData: AdminData = {
      admin: {
        id: "ADMIN-001",
        name: "Admin User",
        email: "admin@intrak.com",
        role: "admin",
      },
      stats: safeStats,
      recentActivities: safeActivities,
      studentsByProgram: safeStudentsByProgram,
      companyStats: safeCompanyStats,
      alerts: safeAlerts,
      recentDocuments: safeDocumentStats,
    };

    switch (activeTab) {
      case "overview":
        return <AdminOverviewTab data={adminData} />;
      case "users":
        return <AdminUserManagement />;
      case "settings":
        return <AdminSettings onBack={() => setActiveTab("overview")} />;
      default:
        return <AdminOverviewTab data={adminData} />;
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
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

          {/* Navigation Links */}
          <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
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
              <div className="relative notification-dropdown">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {getNotificationCount() > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-y-auto notification-scrollbar animate-in slide-in-from-top-2 duration-200">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Notifications
                          </h3>
                        </div>
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                          {getNotificationCount()} announcement
                          {getNotificationCount() !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="p-3">
                      {safeAnnouncements.length > 0 ? (
                        <div className="space-y-3">
                          {safeAnnouncements.map((announcement) => (
                            <div
                              key={announcement.id}
                              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                    {announcement.title}
                                  </h4>
                                </div>
                              </div>
                              <p
                                className="text-sm text-gray-600 dark:text-gray-400 mb-3 overflow-hidden leading-relaxed"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {announcement.content}
                              </p>
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(
                                  announcement.createdAt
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">
                            No announcements available
                          </p>
                          <p className="text-sm opacity-75">
                            Check back later for updates
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative user-menu-dropdown">
                <button
                  onClick={toggleUserMenu}
                  className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-purple-300 dark:hover:ring-purple-600 transition-all"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  )}
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                          {profilePhoto ? (
                            <img
                              src={profilePhoto}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold">AU</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Admin User
                          </p>
                          <p className="text-sm text-gray-500">Administrator</p>
                          <p className="text-xs text-gray-400">
                            admin@intrak.com
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
                        onClick={() => {
                          setShowLogoutModal(true);
                          setShowUserMenu(false);
                        }}
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

export default AdminDashboard;
