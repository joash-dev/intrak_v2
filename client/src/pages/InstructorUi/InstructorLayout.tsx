import { useState, useEffect, Suspense } from "react";
import {
    Users,
    Building2,
    Bell,
    Menu,
    LogOut,
    Home,
    FileCheck,
    BarChart3,
    Loader2,
    FileUp,
    MessageCircle,
} from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { settingsService } from "../../services/settingsService";
import { notificationService, type NotificationItem } from "../../services/notificationService";
import { useWalkthrough } from "../../hooks/useWalkthrough";

const InstructorLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Sidebar State
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [sidebarExpanded, setSidebarExpanded] = useState(() => window.innerWidth >= 1024);

    // User & Auth State
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [photoLoading, setPhotoLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ name: string; email: string; initials: string } | null>(null);

    // Notifications State
    const { data: notificationsData } = useOptimizedData<NotificationItem[]>(
        () => notificationService.getNotifications({ limit: 15 }),
        [],
        { ttl: 60 * 1000 }
    );
    const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);

    // Determine active tab based on current path
    const getActiveTab = (path: string) => {
        if (path.includes("/instructor/students")) return "students";
        if (path.includes("/instructor/documents")) return "documents";
        if (path.includes("/instructor/applications")) return "applications";
        if (path.includes("/instructor/company-proposals")) return "company-proposals";
        if (path.includes("/instructor/messages")) return "messages";
        if (path.includes("/instructor/reports")) return "reports";
        if (path.includes("/instructor/settings")) return "settings";
        if (path.includes("/instructor/notifications")) return "notifications";
        return "dashboard"; // Default to dashboard/overview
    };

    const activeTab = getActiveTab(location.pathname);

    // --- Effects ---

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) setIsAuthenticated(false);
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

    // Load User Data
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userData = localStorage.getItem("user");
                if (userData) {
                    const user = JSON.parse(userData);
                    const initials = (user.name || "Instructor").split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
                    setCurrentUser({
                        name: user.name || "Instructor",
                        email: user.email || "instructor@university.edu",
                        initials,
                    });
                }
                const photoUrl = await settingsService.getProfilePhoto();
                if (photoUrl) setProfilePhoto(photoUrl);
            } catch (error) {
                console.error("Error loading user data", error);
            } finally {
                setPhotoLoading(false);
            }
        };
        loadUserData();

        const handleProfileUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.user) {
                const user = customEvent.detail.user;
                const initials = (user.name || "Instructor")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2);

                setCurrentUser({
                    name: user.name || "Instructor",
                    email: user.email || "instructor@university.edu",
                    initials,
                });
            } else {
                // Fallback: reload from localStorage if no detail provided
                loadUserData();
            }
        };

        window.addEventListener("profileUpdated", handleProfileUpdate);

        return () => {
            window.removeEventListener("profileUpdated", handleProfileUpdate);
        };
    }, []);

    // Walkthrough
    const { startWalkthrough } = useWalkthrough('instructor');
    useEffect(() => {
        startWalkthrough();
    }, []);

    // Sync Notifications
    useEffect(() => {
        if (notificationsData) setLocalNotifications(notificationsData);
    }, [notificationsData]);

    // Real-time-ish notifications: poll periodically and refresh on tab focus.
    useEffect(() => {
        let mounted = true;

        const refreshNotifications = async () => {
            try {
                const fresh = await notificationService.getNotifications({ limit: 15 });
                if (mounted) setLocalNotifications(fresh);
            } catch (error) {
                console.error("Failed to refresh notifications", error);
            }
        };

        const intervalId = window.setInterval(refreshNotifications, 5000);
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refreshNotifications();
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            mounted = false;
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);

    // --- Handlers ---

    const handleLogout = async () => {
        if (loggingOut) return; // Prevent double-click
        setLoggingOut(true);
        setIsAuthenticated(false);
        sessionStorage.removeItem("isAuthenticated");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setShowLogoutModal(false);
        window.location.replace("/login");
    };

    const unreadCount = localNotifications.filter(n => !n.read).length;

    // Navigation Items
    const navItems = [
        { id: "dashboard", icon: Home, label: "Dashboard", path: "/instructor/dashboard" },
        { id: "notifications", icon: Bell, label: "Notifications", path: "/instructor/notifications" },
        { id: "documents", icon: FileCheck, label: "Student Documents", path: "/instructor/documents" },
        { id: "applications", icon: Building2, label: "Company Applications", path: "/instructor/applications" },
        { id: "company-proposals", icon: FileUp, label: "Company Proposals", path: "/instructor/company-proposals" },
        { id: "students", icon: Users, label: "Students", path: "/instructor/students" },
        { id: "messages", icon: MessageCircle, label: "Messages", path: "/instructor/messages" },
        { id: "reports", icon: BarChart3, label: "Reports", path: "/instructor/reports" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#19191c] font-outfit text-sm md:text-base">
            {/* Mobile Header */}
            <header className={`fixed top-4 left-4 right-4 lg:hidden bg-white dark:bg-[#212124] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${sidebarOpen ? "z-30" : "z-50"}`}>
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-3">
                        <button id="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Toggle sidebar">
                            <Menu className="w-5 h-5" />
                        </button>
                        <img src="/just_logo.png" alt="INTRAK Logo" className="w-10 h-10 rounded-lg object-cover" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => navigate("/instructor/notifications")} className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="View notifications">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>}
                        </button>
                        <button onClick={() => navigate("/instructor/settings")} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="User profile">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                {photoLoading ? (
                                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                                ) : profilePhoto ? <img src={profilePhoto} alt="User Profile" className="w-full h-full object-cover" /> : <span className="text-white font-semibold text-sm">{currentUser?.initials}</span>}
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-[50] lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside id="tour-sidebar" className={`fixed inset-y-0 left-0 lg:top-4 lg:bottom-4 lg:left-4 z-[60] bg-white dark:bg-[#212124] lg:rounded-2xl lg:shadow-2xl border-r lg:border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-72 ${sidebarExpanded ? "lg:w-72" : "lg:w-20"}`}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className={`flex items-center ${sidebarExpanded ? "justify-between" : "justify-center"} p-4 border-b border-gray-200 dark:border-gray-700`}>
                        <div className={`flex items-center space-x-3 ${sidebarExpanded ? "" : "lg:hidden"}`}>
                            <button onClick={() => window.innerWidth >= 1024 ? setSidebarExpanded(!sidebarExpanded) : setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Toggle sidebar">
                                <Menu className="w-5 h-5" />
                            </button>
                            <img src="/just_logo.png" alt="INTRAK Logo" className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                                <h2 className="text-lg font-bold bg-gradient-to-b from-blue-400 to-blue-800 bg-clip-text text-transparent">INTRAK</h2>
                                <p className="text-xs text-gray-500">Instructor Portal</p>
                            </div>
                        </div>
                        {!sidebarExpanded && (
                            <div className="hidden lg:flex flex-col items-center space-y-2">
                                <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Expand sidebar"><Menu className="w-5 h-5" /></button>
                                <img src="/just_logo.png" alt="INTRAK Logo" className="w-12 h-12 rounded-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-hidden">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                id={`tour-nav-${item.id}`}
                                onClick={() => {
                                    navigate(item.path);
                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                }}
                                className={`relative w-full flex items-center transition-all duration-200 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} ${activeTab === item.id ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"}`}
                                aria-label={item.label}
                                title={!sidebarExpanded ? item.label : undefined}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className={`font-medium text-sm ${sidebarExpanded ? "" : "lg:hidden"}`}>{item.label}</span>
                                {item.id === "notifications" && unreadCount > 0 && (
                                    <span className={`w-2 h-2 bg-blue-500 rounded-full ${sidebarExpanded ? "ml-auto" : "absolute top-1 right-1 lg:block hidden"}`}></span>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Profile & Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <button id="tour-user-menu" onClick={() => navigate("/instructor/settings")} className={`w-full flex items-center ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg`} aria-label="User profile" title={!sidebarExpanded ? "User Profile" : undefined}>
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                {photoLoading ? (
                                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                                ) : profilePhoto ? <img src={profilePhoto} alt="User Profile" className="w-full h-full object-cover" /> : <span className="text-white font-semibold text-sm">{currentUser?.initials}</span>}
                            </div>
                            <div className={`flex-1 text-left min-w-0 ${sidebarExpanded ? "" : "lg:hidden"}`}>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
                                <p className="text-xs text-gray-500 truncate">Instructor</p>
                            </div>
                        </button>
                        <button onClick={() => setShowLogoutModal(true)} className={`w-full flex items-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-2 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"}`} aria-label="Logout" title={!sidebarExpanded ? "Logout" : undefined}>
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className={`font-medium text-sm ${sidebarExpanded ? "" : "lg:hidden"}`}>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`p-6 pt-24 lg:pt-6 transition-all duration-300 relative ${sidebarOpen ? "z-10 lg:z-auto" : "z-auto"} ${sidebarOpen ? (sidebarExpanded ? "lg:ml-80" : "lg:ml-28") : "lg:ml-4"}`}>
                <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
                    {/* Pass notifications and refresh function to children */}
                    <Outlet context={{
                        notifications: localNotifications,
                        refreshNotifications: async () => {
                            const fresh = await notificationService.getNotifications({ limit: 15 });
                            setLocalNotifications(fresh);
                        },
                        setLocalNotifications
                    }} />
                </Suspense>
            </main>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-semibold text-center mb-2 text-gray-900 dark:text-white">Confirm Logout</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Are you sure you want to log out?</p>
                        <div className="flex space-x-3">
                            <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">Cancel</button>
                            <button onClick={handleLogout} disabled={loggingOut} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                                {loggingOut ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Logging out...</span>
                                    </>
                                ) : (
                                    <span>Logout</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorLayout;
