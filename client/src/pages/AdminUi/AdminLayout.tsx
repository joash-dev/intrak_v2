import { useState, useEffect, Suspense } from "react";
import {
  Home,
  Users,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { settingsService } from "../../services/settingsService";
import api from "../../services/api";
import SafeImage from "../../components/SafeImage";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => window.innerWidth >= 1024);

  // User & Auth State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; initials: string } | null>(null);

  // Determine active tab based on current path
  const getActiveTab = (path: string) => {
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/settings")) return "settings";
    return "dashboard"; // Default to dashboard/overview
  };

  const activeTab = getActiveTab(location.pathname);

  // --- Effects ---

  // Auth Check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const userString = localStorage.getItem("user");

      if (!token || !userString) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const user = JSON.parse(userString);
        if (user.role?.toLowerCase() !== "admin") {
          setIsAuthenticated(false);
          return;
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  // Responsive Sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
        setSidebarExpanded(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load User Data and Theme
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          const initials = (user.name || "Admin").split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
          setCurrentUser({
            name: user.name || "Admin",
            email: user.email || "admin@intrak.com",
            initials,
          });
        }
        const photoUrl = await settingsService.getProfilePhoto();
        if (photoUrl) setProfilePhoto(photoUrl);
      } catch (error) {
        console.error("Error loading user data", error);
      }
    };
    
    // Load and apply theme
    const appPrefs = settingsService.loadAppPreferences();
    const savedTheme = appPrefs.theme === 'auto' ? 'system' : (appPrefs.theme as 'light' | 'dark' | 'system') || 'system';
    settingsService.applyTheme(savedTheme === 'system' ? 'auto' : savedTheme);
    
    loadUserData();
  }, []);

  // --- Handlers ---

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setShowLogoutModal(false);
      window.location.replace("/login");
    }
  };

  // Navigation Items
  const navItems = [
    { id: "dashboard", icon: Home, label: "Overview", path: "/admin/dashboard" },
    { id: "users", icon: Users, label: "User Management", path: "/admin/users" },
    { id: "settings", icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#19191c] font-outfit text-sm md:text-base">
      {/* Mobile Header */}
      <header className={`fixed top-4 left-4 right-4 lg:hidden bg-white dark:bg-[#19191c] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${sidebarOpen ? "z-30" : "z-50"}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <img src="/logo_intrak_only-nbg.png" alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => navigate("/admin/settings")} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                {profilePhoto ? (
                  <SafeImage
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    fallback={<span className="text-white font-semibold text-sm">{currentUser?.initials}</span>}
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">{currentUser?.initials}</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-[50] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 lg:top-4 lg:bottom-4 lg:left-4 z-[60] bg-white dark:bg-[#19191c] lg:rounded-2xl lg:shadow-2xl border-r lg:border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-72 ${sidebarExpanded ? "lg:w-72" : "lg:w-20"}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`flex items-center ${sidebarExpanded ? "justify-between" : "justify-center"} p-4 border-b border-gray-200 dark:border-gray-700`}>
            <div className={`flex items-center space-x-3 ${sidebarExpanded ? "" : "lg:hidden"}`}>
              <button onClick={() => window.innerWidth >= 1024 ? setSidebarExpanded(!sidebarExpanded) : setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <img src="/logo_intrak_only-nbg.png" alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-b from-purple-400 to-purple-800 bg-clip-text text-transparent">INTRAK</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Portal</p>
              </div>
            </div>
            {!sidebarExpanded && (
              <div className="hidden lg:flex flex-col items-center space-y-2">
                <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Menu className="w-5 h-5" /></button>
                <img src="/logo_intrak_only-nbg.png" alt="Logo" className="w-12 h-12 rounded-full object-cover" />
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-admin-purple">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`relative w-full flex items-center transition-all duration-200 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} ${activeTab === item.id ? "bg-purple-600 text-white rounded-lg" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={`font-medium text-sm ${sidebarExpanded ? "" : "lg:hidden"}`}>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Profile & Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <button onClick={() => navigate("/admin/settings")} className={`w-full flex items-center ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg`}>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {profilePhoto ? (
                  <SafeImage
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    fallback={<span className="text-white font-semibold text-sm">{currentUser?.initials}</span>}
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">{currentUser?.initials}</span>
                )}
              </div>
              <div className={`flex-1 text-left min-w-0 ${sidebarExpanded ? "" : "lg:hidden"}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Administrator</p>
              </div>
            </button>
            <button onClick={() => setShowLogoutModal(true)} className={`w-full flex items-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-2 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"}`}>
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={`font-medium text-sm ${sidebarExpanded ? "" : "lg:hidden"}`}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`p-6 pt-24 lg:pt-6 transition-all duration-300 relative ${sidebarOpen ? "z-10 lg:z-auto" : "z-auto"} ${sidebarOpen ? (sidebarExpanded ? "lg:ml-80" : "lg:ml-28") : "lg:ml-4"}`}>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
          <Outlet />
        </Suspense>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#19191c] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-center mb-2 text-gray-900 dark:text-white">Confirm Logout</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Are you sure you want to log out?</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={handleLogout} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;

