import { useState, useEffect, useRef } from "react";
import {
  Users,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  Search,
  Eye,
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  FileCheck,
  Loader2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { supervisorService } from "../../services/supervisorService";
import type { SupervisorStudent } from "../../services/supervisorService";
import IndustryPartnerAttendance from "./SupervisorAttendance";
import IndustryPartnerEvaluation from "./SupervisorEvaluation";
import IndustryPartnerDocuments from "./SupervisorDocuments";
import SupervisorSettings from "./SupervisorSettings";
import { settingsService } from "../../services/settingsService";
import api from "../../services/api";

// =============================================
// SUPERVISOR DASHBOARD OVERVIEW
// =============================================
const SupervisorOverview = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<SupervisorStudent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const students = await supervisorService.getMyStudents();
      setInterns(students);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError(err.response?.data?.message || "Failed to load students");
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalInterns: interns.length,
    activeInterns: interns.filter((i) => i.status === "active").length,
    pendingApprovals: interns.reduce(
      (sum, i) => sum + (i.pendingApprovals || 0),
      0
    ),
    avgAttendance:
      interns.length > 0
        ? (
            interns.reduce((sum, i) => sum + i.attendanceRate, 0) /
      interns.length
          ).toFixed(1)
        : "0.0",
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      },
      needs_attention: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      },
      completed: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      },
    };
    const badge = badges[status as keyof typeof badges] || badges.active;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || intern.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const supervisorName = user?.name || "Supervisor";
  const companyName = user?.company || "Company";

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {supervisorName}!
        </h1>
        <p className="text-blue-100 text-lg mb-1">Company: {companyName}</p>
        <p className="text-blue-100">
          Supervisor Dashboard - Monitor and manage your interns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Interns
              </p>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.totalInterns}
              </p>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {stats.activeInterns} active
          </span>
        </div>

        {/* Active Interns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
                Active Interns
              </p>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.activeInterns}
              </p>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Active interns
          </span>
            </div>

        {/* Pending */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Pending Approvals
            </p>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.pendingApprovals}
              </p>
          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            {stats.pendingApprovals} pending
          </span>
        </div>

        {/* Avg Attendance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
                Avg Attendance
              </p>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.avgAttendance}%
          </p>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Average rate
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-200 rounded-lg px-4 py-3">
          <p>{error}</p>
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredInterns.length} of {interns.length} interns
      </p>

      {/* Interns Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredInterns.map((intern) => (
                <div
                  key={intern.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {intern.name
                    .split(" ")
                    .map((namePart: string) => namePart[0] ?? "")
                    .join("")
                    .substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {intern.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                    {intern.studentNumber} • {intern.program}
                        </p>
                      </div>
                    </div>
              {getStatusBadge(intern.status)}
                  </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Attendance
                      </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {intern.attendanceRate}%
                </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Hours
                      </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {intern.completedHours}/{intern.totalHours}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Rating
                      </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {intern.lastEvaluation
                    ? intern.lastEvaluation.overallRating.toFixed(1)
                            : "N/A"}
                </p>
                    </div>
                  </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500">
                Last activity: {intern.lastActivity || "Recently"}
                    </span>
                    <button className="flex items-center space-x-2 px-3 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">View Details</span>
                    </button>
                  </div>
                </div>
              ))}
        </div>

      {filteredInterns.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No interns found</p>
                  </div>
      )}
    </div>
  );
};

// =============================================
// MAIN SUPERVISOR DASHBOARD
// =============================================
const SupervisorDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const companyName = user?.name || "Supervisor";
  const companyEmail = user?.email || "";

  useEffect(() => {
    loadProfilePhoto();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadProfilePhoto = async () => {
    try {
      const photo = await settingsService.getProfilePhoto();
      setProfilePhoto(photo);
    } catch (error) {
      console.log("No profile photo found");
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setShowLogoutModal(false);
      toast.success("Logged out successfully");
      window.location.replace("/login");
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "evaluations", label: "Evaluations", icon: Award },
    { id: "documents", label: "Documents", icon: FileCheck },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <SupervisorOverview />;
      case "attendance":
        return <IndustryPartnerAttendance />;
      case "evaluations":
        return <IndustryPartnerEvaluation />;
      case "documents":
        return <IndustryPartnerDocuments />;
      case "settings":
        return <SupervisorSettings />;
      default:
        return <SupervisorOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex h-screen overflow-hidden font-outfit">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:relative lg:flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
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
                <p className="text-xs text-gray-500">Supervisor Portal</p>
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
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative user-menu-dropdown" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
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
                            <span className="text-white font-semibold">
                              {companyName
                                .split(" ")
                                .map((namePart: string) => namePart[0] ?? "")
                                .join("")
                                .substring(0, 2)}
                            </span>
                          )}
              </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {companyName}
                          </p>
                          <p className="text-sm text-gray-500">Supervisor</p>
                          <p className="text-xs text-gray-400">
                            {companyEmail}
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
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 lg:hidden"
          style={{ margin: "0" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default SupervisorDashboard;
