import { useState, useEffect, useRef, Suspense } from "react";
import {
    Home,
    FileText,
    Building2,
    Search,
    Clock,
    Star,
    Bell,
    Menu,
    LogOut,
    Loader2,
    Lock,
    MessageCircle,
    MessageSquare,
} from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { settingsService } from "../../services/settingsService";
import { notificationService, type NotificationItem } from "../../services/notificationService";
import { dashboardService } from "../../services/dashboardService";
import api from "../../services/api";
import { useWalkthrough } from "../../hooks/useWalkthrough";
import toast from "react-hot-toast";
import { useSocketContext } from "../../contexts/SocketContext";
import { SOCKET_EVENTS } from "../../services/socketService";

const StudentLayout = () => {
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
    const [companyApplications, setCompanyApplications] = useState<any[]>([]);
    const [studentCompany, setStudentCompany] = useState<string | null>(null);
    const [studentSupervisor, setStudentSupervisor] = useState<string | null>(null);

    // Notifications State (refresh pulls fresh list so socket + cache stay in sync)
    const { data: notificationsData, refresh: refreshNotifications } = useOptimizedData<NotificationItem[]>(
        () => notificationService.getNotifications({ limit: 15 }),
        [],
        { ttl: 60 * 1000 }
    );
    const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);
    const refreshNotificationsRef = useRef(refreshNotifications);
    refreshNotificationsRef.current = refreshNotifications;

    const { socket } = useSocketContext();

    const bumpNotifications = () => {
        window.dispatchEvent(new CustomEvent("intrak:notifications-refresh"));
    };

    // When returning to the tab, resync in case the socket missed updates
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState !== "visible") return;
            void refreshNotificationsRef.current?.();
            bumpNotifications();
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    // Determine active tab based on current path
    const getActiveTab = (path: string) => {
        if (path.includes("/student/announcements")) return "announcements";
        if (path.includes("/student/documents")) return "documents";
        if (path.includes("/student/messages")) return "messages";
        if (path.includes("/student/companies")) return "companies";
        if (path.includes("/student/partnership-assistance")) return "partnership-assistance";
        if (path.includes("/student/attendance")) return "attendance";
        if (path.includes("/student/evaluations")) return "evaluations";
        if (path.includes("/student/reports")) return "reports";
        if (path.includes("/student/settings")) return "settings";
        if (path.includes("/student/notifications")) return "notifications";
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
                if (user.role?.toLowerCase() !== "student") {
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

    const loadUserDataRef = useRef<() => Promise<void>>(async () => {});

    const loadUserData = async () => {
        try {
            const userData = localStorage.getItem("user");
            if (userData) {
                const user = JSON.parse(userData);
                const initials = (user.name || "Student").split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
                setCurrentUser({
                    name: user.name || "Student",
                    email: user.email || "student@university.edu",
                    initials,
                });
            }
            const photoUrl = await settingsService.getProfilePhoto();
            if (photoUrl) setProfilePhoto(photoUrl);

            // Fetch dashboard data to check company & supervisor status
            const dashboardData = await dashboardService.getDashboardData();
            setStudentCompany(dashboardData.student.company || null);
            setStudentSupervisor(dashboardData.student.supervisor || null);

            // Fetch applications
            const applicationsResponse = await api.get("/company-applications/my-applications");
            setCompanyApplications(applicationsResponse.data.applications || []);

        } catch (error) {
            console.error("Error loading user data", error);
        } finally {
            setPhotoLoading(false);
        }
    };

    loadUserDataRef.current = loadUserData;

    useEffect(() => {
        if (!socket) return;
        const onPortalSync = () => {
            void loadUserDataRef.current();
            void refreshNotificationsRef.current?.();
            bumpNotifications();
            window.dispatchEvent(new CustomEvent("intrak:student-portal-sync"));
        };
        const onNotificationNew = (payload: {
            notificationId: string;
            title: string;
            message: string;
            link?: string;
            createdAt: string;
            type?: string;
        }) => {
            setLocalNotifications((prev) => [
                {
                    id: payload.notificationId,
                    title: payload.title,
                    message: payload.message,
                    link: payload.link ?? null,
                    read: false,
                    createdAt: payload.createdAt,
                    type: (payload.type as NotificationItem["type"]) || "OTHER",
                },
                ...prev.filter((n) => n.id !== payload.notificationId),
            ]);
            void refreshNotificationsRef.current?.();
            bumpNotifications();
            toast(payload.title, { icon: "🔔", duration: 4500 });
        };
        socket.on(SOCKET_EVENTS.STUDENT_PORTAL_SYNC, onPortalSync);
        socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotificationNew);
        return () => {
            socket.off(SOCKET_EVENTS.STUDENT_PORTAL_SYNC, onPortalSync);
            socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotificationNew);
        };
    }, [socket]);

    // Load User Data & Company Status
    useEffect(() => {
        loadUserData();

        const handleUpdate = (e: any) => {
            if (e.detail?.photoUrl) {
                setProfilePhoto(e.detail.photoUrl);
            } else {
                loadUserData();
            }
        };

        window.addEventListener("profilePhotoUpdated", handleUpdate);
        return () => window.removeEventListener("profilePhotoUpdated", handleUpdate);
    }, []);

    // Walkthrough
    const { startWalkthrough } = useWalkthrough('student');
    useEffect(() => {
        startWalkthrough();
    }, []);

    const refreshStudentData = () => {
        loadUserData();
    };


    // Sync Notifications
    useEffect(() => {
        if (notificationsData) setLocalNotifications(notificationsData);
    }, [notificationsData]);

    // --- Handlers ---

    const handleLogout = async () => {
        if (loggingOut) return; // Prevent double-click
        setLoggingOut(true);
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

    const unreadCount = localNotifications.filter(n => !n.read).length;

    // Check if Find Company should be disabled
    const isFindCompanyDisabled = !!studentCompany || companyApplications.some(
        (app) => app.status === "PENDING" || app.status === "APPROVED"
    );

    // Attendance & Evaluations require a company AND supervisor assignment
    const isAttendanceDisabled = !studentCompany || !studentSupervisor;

    // Navigation Items
    const navItems = [
        { id: "dashboard", icon: Home, label: "Overview", path: "/student/dashboard" },
        { id: "announcements", icon: MessageSquare, label: "Announcements", path: "/student/announcements" },
        { id: "documents", icon: FileText, label: "Documents", path: "/student/documents" },
        { id: "messages", icon: MessageCircle, label: "Messages", path: "/student/messages" },
        { id: "companies", icon: Building2, label: "Companies", path: "/student/companies" },
        { id: "partnership-assistance", icon: Search, label: "Find Company", path: "/student/partnership-assistance", disabled: isFindCompanyDisabled, disabledTitle: "You already have a company or a pending application" },
        { id: "attendance", icon: Clock, label: "Attendance", path: "/student/attendance", disabled: isAttendanceDisabled, disabledTitle: "You need a company and supervisor assignment before accessing attendance" },
        { id: "evaluations", icon: Star, label: "Evaluations", path: "/student/evaluations", disabled: isAttendanceDisabled, disabledTitle: "You need a company and supervisor assignment before accessing evaluations" },
        { id: "notifications", icon: Bell, label: "Notifications", path: "/student/notifications" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#19191c] font-outfit text-sm md:text-base">
            {/* Mobile Header */}
            <header className={`fixed top-4 left-4 right-4 lg:hidden bg-white dark:bg-[#212124] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${sidebarOpen ? "z-30" : "z-50"}`}>
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-3">
                        <button id="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <Menu className="w-5 h-5" />
                        </button>
                        <img src="/just_logo.png" alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => navigate("/student/notifications")} className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>}
                        </button>
                        <button onClick={() => navigate("/student/settings")} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                {photoLoading ? (
                                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                                ) : profilePhoto ? <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-white font-semibold text-sm">{currentUser?.initials}</span>}
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
                            <button onClick={() => window.innerWidth >= 1024 ? setSidebarExpanded(!sidebarExpanded) : setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <Menu className="w-5 h-5" />
                            </button>
                            <img src="/just_logo.png" alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                                <h2 className="text-lg font-bold bg-gradient-to-b from-blue-400 to-blue-800 bg-clip-text text-transparent">INTRAK</h2>
                                <p className="text-xs text-gray-500">Student Portal</p>
                            </div>
                        </div>
                        {!sidebarExpanded && (
                            <div className="hidden lg:flex flex-col items-center space-y-2">
                                <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Menu className="w-5 h-5" /></button>
                                <img src="/just_logo.png" alt="Logo" className="w-12 h-12 rounded-full object-cover" />
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
                                    if (item.disabled) {
                                        toast(item.disabledTitle || "This feature is currently locked.", { icon: "🔒" });
                                        return;
                                    }
                                    navigate(item.path);
                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                }}
                                title={item.disabled ? (item.disabledTitle || "") : ""}
                                className={`relative w-full flex items-center transition-all duration-200 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} ${item.disabled ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600" : activeTab === item.id ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"}`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className={`font-medium text-sm ${sidebarExpanded ? "" : "lg:hidden"}`}>{item.label}</span>
                                {item.disabled && sidebarExpanded && (
                                    <Lock className="w-3.5 h-3.5 ml-auto text-gray-400 dark:text-gray-600 flex-shrink-0" />
                                )}
                                {item.id === "notifications" && unreadCount > 0 && (
                                    <span
                                        className={`w-2 h-2 shrink-0 rounded-full bg-purple-500 ${sidebarExpanded ? "ml-auto" : "ml-auto lg:absolute lg:top-1 lg:right-1 lg:ml-0"}`}
                                        aria-hidden
                                    />
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Profile & Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <button id="tour-user-menu" onClick={() => navigate("/student/settings")} className={`w-full flex items-center ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg`}>
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                {photoLoading ? (
                                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                                ) : profilePhoto ? <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-white font-semibold text-sm">{currentUser?.initials}</span>}
                            </div>
                            <div className={`flex-1 text-left min-w-0 ${sidebarExpanded ? "" : "lg:hidden"}`}>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
                                <p className="text-xs text-gray-500 truncate">Student</p>
                            </div>
                        </button>
                        <button onClick={() => setShowLogoutModal(true)} className={`w-full flex items-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-2 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"}`}>
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className={`font-medium text-sm ${sidebarExpanded ? "" : "lg:hidden"}`}>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`p-6 pt-24 lg:pt-6 transition-all duration-300 relative ${sidebarOpen ? "z-10 lg:z-auto" : "z-auto"} ${sidebarOpen ? (sidebarExpanded ? "lg:ml-80" : "lg:ml-28") : "lg:ml-4"}`}>
                <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
                    <Outlet context={{ notifications: localNotifications, setLocalNotifications, studentCompany, studentSupervisor, companyApplications, refreshStudentData }} />
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

export default StudentLayout;
