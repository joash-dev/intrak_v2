import React, { useState, useEffect, Suspense } from "react";
import {
    Clock,
    Award,
    Bell,
    Menu,
    LogOut,
    Home,
    Loader2,
    MessageSquare,
} from "lucide-react";
import { useNavigate, useLocation, Outlet, useOutletContext } from "react-router-dom";
import { settingsService } from "../../services/settingsService";
import {
    notificationService,
    type NotificationItem,
} from "../../services/notificationService";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import api from "../../services/api";
import { useWalkthrough } from "../../hooks/useWalkthrough";
import { devLog } from "../../utils/devLog";
import SafeImage from "../../components/SafeImage";

// Define the context type for shared data
type SupervisorContextType = {
    currentUser: {
        name: string;
        email: string;
        initials: string;
    } | null;
    refreshNotifications: () => void;
    refreshUserData: () => void;
};

const SupervisorLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth >= 1024;
        }
        return false;
    });
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth >= 1024;
        }
        return false;
    });
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [photoLoading, setPhotoLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [currentUser, setCurrentUser] = useState<{
        name: string;
        email: string;
        initials: string;
    } | null>(null);

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

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            if (!mobile) {
                setSidebarOpen(true);
                setSidebarExpanded(true);
            } else {
                setSidebarOpen(false);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const loadUserData = async () => {
        try {
            const userData = localStorage.getItem("user");
            if (userData) {
                const user = JSON.parse(userData);
                const initials = user.name
                    ? user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)
                    : "SU";
                setCurrentUser({
                    name: user.name || "Supervisor",
                    email: user.email || "supervisor@company.com",
                    initials: initials,
                });
            }
            const photoUrl = await settingsService.getProfilePhoto();
            if (photoUrl) {
                setProfilePhoto(photoUrl);
            }
        } catch (error) {
            devLog.log("No profile photo found");
        } finally {
            setPhotoLoading(false);
        }
    };

    useEffect(() => {
        loadUserData();

        const handleProfilePhotoUpdate = (event: CustomEvent) => {
            setProfilePhoto(event.detail.photoUrl);
        };
        window.addEventListener("profilePhotoUpdated", handleProfilePhotoUpdate as EventListener);
        return () => {
            window.removeEventListener("profilePhotoUpdated", handleProfilePhotoUpdate as EventListener);
        };
    }, []);

    useEffect(() => {
        const handleUserUpdated = (event: any) => {
            try {
                const { name, email } = event.detail || {};
                const initials = (name || currentUser?.name || "SU")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2);
                setCurrentUser((prev) => ({
                    name: name ?? prev?.name ?? "Supervisor",
                    email: email ?? prev?.email ?? "supervisor@company.com",
                    initials,
                }));
            } catch { }
        };
        window.addEventListener("userUpdated", handleUserUpdated as EventListener);
        window.addEventListener("profileUpdated", handleUserUpdated as EventListener);
        return () => {
            window.removeEventListener("userUpdated", handleUserUpdated as EventListener);
            window.removeEventListener("profileUpdated", handleUserUpdated as EventListener);
        };
    }, [currentUser]);

    // Walkthrough
    const { startWalkthrough } = useWalkthrough('supervisor');
    useEffect(() => {
        startWalkthrough();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (showNotifications && !target.closest(".notifications-dropdown")) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showNotifications]);

    useEffect(() => {
        if (notificationsData) {
            setLocalNotifications(notificationsData);
        }
    }, [notificationsData]);

    const handleLogout = async () => {
        if (loggingOut) return; // Prevent double-click
        setLoggingOut(true);
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                await api.post("/auth/logout", { refreshToken });
            }
        } catch (error) {
            devLog.error("Logout API call failed:", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("isAuthenticated");
            window.location.href = "/login";
        }
    };

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

            if (notification.type === "DOCUMENT") {
                // Documents tab is intentionally not available for supervisors.
                navigate("/industry-partner/dashboard");
            } else if (notification.link) {
                navigate(notification.link);
            }
            setShowNotifications(false);
        } catch (error) {
            devLog.error("Error handling notification interaction", error);
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
            devLog.error("Failed to mark all notifications as read", error);
        }
    };

    const unreadNotificationCount = localNotifications.filter(
        (notification) => !notification.read
    ).length;

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: Home, path: "/industry-partner/dashboard" },
        { id: "announcements", label: "Announcements", icon: MessageSquare, path: "/industry-partner/announcements" },
        { id: "attendance", label: "Attendance", icon: Clock, path: "/industry-partner/attendance" },
        { id: "evaluations", label: "Evaluations", icon: Award, path: "/industry-partner/evaluations" },
        { id: "notifications", label: "Notifications", icon: Bell, path: "/industry-partner/notifications" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#19191c] font-outfit">
            {/* Floating Top Bar - Mobile Only */}
            <header className={`fixed top-4 left-4 right-4 lg:hidden bg-white dark:bg-[#212124] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${sidebarOpen ? "z-30" : "z-50"}`}>
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center space-x-3">
                        <button
                            id="mobile-menu-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <img
                            src="/logo_intrak_only-nbg.png"
                            alt="INTRAK Logo"
                            className="w-10 h-10 rounded-lg object-cover"
                        />
                    </div>

                    {/* Right: Notifications + Profile */}
                    <div className="flex items-center space-x-2">
                        {/* Notifications */}
                        <div className="relative notifications-dropdown">
                            <button
                                onClick={() => setShowNotifications((prev) => !prev)}
                                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#212124] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 flex flex-col max-h-96 sm:max-h-[28rem]">
                                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between flex-shrink-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Notifications
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                                                Stay updated with latest activities
                                            </p>
                                        </div>
                                        {unreadNotificationCount > 0 && (
                                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 ml-2 flex-shrink-0">
                                                {unreadNotificationCount} new
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 min-h-0">
                                        {notificationsLoading ? (
                                            <div className="px-4 sm:px-5 py-8 flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                                Loading notifications...
                                            </div>
                                        ) : localNotifications.length > 0 ? (
                                            localNotifications.map((notification) => (
                                                <button
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 transition-colors ${notification.read
                                                        ? "bg-white dark:bg-[#212124] hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        : "bg-blue-50/70 dark:bg-blue-900/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300 mt-0.5 sm:mt-1">
                                                                {new Date(notification.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        {!notification.read && (
                                                            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3">
                                                        {notification.message}
                                                    </p>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 sm:px-5 py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                                No notifications yet
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
                                            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#212124] dark:text-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Mark all read
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate("/industry-partner/notifications");
                                                setShowNotifications(false);
                                            }}
                                            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-colors"
                                        >
                                            View All
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <button
                            onClick={() => {
                                navigate("/industry-partner/settings");
                                setSidebarOpen(false);
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                {photoLoading ? (
                                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                                ) : profilePhoto ? (
                                    <SafeImage
                                        src={profilePhoto}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        fallback={
                                            <span className="text-white font-semibold text-sm">
                                                {currentUser?.initials || "SU"}
                                            </span>
                                        }
                                    />
                                ) : (
                                    <span className="text-white font-semibold text-sm">
                                        {currentUser?.initials || "SU"}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Sidebar Overlay - Show when sidebar is open on mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[50] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Floating Sidebar Menu */}
            <aside
                id="tour-sidebar"
                className={`fixed inset-y-0 left-0 lg:top-4 lg:bottom-4 lg:left-4 z-[60] bg-white dark:bg-[#212124] lg:rounded-2xl lg:shadow-2xl border-r lg:border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-72 ${sidebarExpanded ? "lg:w-72" : "lg:w-20"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header with Logo and Hamburger */}
                    <div className={`flex items-center ${sidebarExpanded ? "justify-between" : "justify-center"} p-4 ${sidebarExpanded ? "" : "lg:px-2"} border-b border-gray-200 dark:border-gray-700`}>
                        {/* Expanded view - always on mobile, conditional on desktop */}
                        <div className={`flex items-center space-x-3 ${sidebarExpanded ? "" : "lg:hidden"}`}>
                            {/* Hamburger Icon */}
                            <button
                                onClick={() => {
                                    if (window.innerWidth >= 1024) {
                                        setSidebarExpanded(!sidebarExpanded);
                                    } else {
                                        setSidebarOpen(!sidebarOpen);
                                    }
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                aria-label="Toggle menu"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            {/* Logo */}
                            <img
                                src="/logo_intrak_only-nbg.png"
                                alt="INTRAK Logo"
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                            {/* Branding Text */}
                            <div>
                                <h2 className="text-lg font-bold bg-gradient-to-b from-blue-400 to-blue-800 bg-clip-text text-transparent">
                                    INTRAK
                                </h2>
                                <p className="text-xs text-gray-500">Supervisor Portal</p>
                            </div>
                        </div>
                        {/* Collapsed view - only on desktop when collapsed */}
                        {!sidebarExpanded && (
                            <div className="hidden lg:flex flex-col items-center space-y-2">
                                {/* Hamburger Icon */}
                                <button
                                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    aria-label="Toggle menu"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                {/* Logo */}
                                <img
                                    src="/logo_intrak_only-nbg.png"
                                    alt="INTRAK Logo"
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            </div>
                        )}
                    </div>

                    {/* Navigation Links */}
                    <nav className={`flex-1 space-y-2 overflow-y-auto p-4 ${sidebarExpanded ? "lg:p-4" : "lg:p-2"} scrollbar-hidden`}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isNotifications = item.id === "notifications";
                            return (
                                <button
                                    key={item.id}
                                    id={`tour-nav-${item.id}`}
                                    onClick={() => {
                                        navigate(item.path);
                                        if (window.innerWidth < 1024) {
                                            setSidebarOpen(false);
                                        }
                                    }}
                                    className={`relative w-full flex items-center transition-all duration-200 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} ${isActive(item.path)
                                        ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/50 dark:to-blue-800/30 dark:text-blue-300 rounded-lg"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        }`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className={`font-medium text-sm text-left ${sidebarExpanded ? "" : "lg:hidden"}`}>{item.label}</span>
                                    {/* Unread notification badge (same dot style as header bell) */}
                                    {isNotifications && unreadNotificationCount > 0 && (
                                        <span
                                            className={`w-2 h-2 shrink-0 rounded-full bg-purple-500 ${sidebarExpanded ? "ml-auto" : "ml-auto lg:absolute lg:top-1 lg:right-1 lg:ml-0"}`}
                                            aria-hidden
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Profile Section */}
                    <div className={`border-t border-gray-200 dark:border-gray-700 p-4 ${sidebarExpanded ? "lg:p-4" : "lg:p-2"}`}>
                        <button
                            id="tour-user-menu"
                            onClick={() => {
                                navigate("/industry-partner/settings");
                                if (window.innerWidth < 1024) {
                                    setSidebarOpen(false);
                                }
                            }}
                            className={`w-full flex items-center transition-all duration-200 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} ${isActive("/industry-partner/settings")
                                ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/50 dark:to-blue-800/30 dark:text-blue-300 rounded-lg"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                }`}
                        >
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                {photoLoading ? (
                                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                                ) : profilePhoto ? (
                                    <SafeImage
                                        src={profilePhoto}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        fallback={
                                            <span className="text-white font-semibold text-sm">
                                                {currentUser?.initials || "SU"}
                                            </span>
                                        }
                                    />
                                ) : (
                                    <span className="text-white font-semibold text-sm">
                                        {currentUser?.initials || "SU"}
                                    </span>
                                )}
                            </div>
                            <div className={`flex-1 text-left min-w-0 ${sidebarExpanded ? "" : "lg:hidden"}`}>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {currentUser?.name || "Supervisor"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">Supervisor</p>
                            </div>
                        </button>
                    </div>

                    {/* Logout Button at Bottom */}
                    <div className={`border-t border-gray-200 dark:border-gray-700 p-4 ${sidebarExpanded ? "lg:p-4" : "lg:p-2"}`}>
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className={`w-full flex items-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"}`}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className={`font-medium text-sm text-left ${sidebarExpanded ? "" : "lg:hidden"}`}>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className={`p-6 pt-24 lg:pt-6 transition-all duration-300 relative ${sidebarOpen ? "z-10 lg:z-auto" : "z-auto"} ${sidebarOpen ? (sidebarExpanded ? "lg:ml-80" : "lg:ml-28") : "lg:ml-4"}`}>
                <div className="tab-fade-in">
                    <Suspense fallback={
                        <div className="flex items-center justify-center min-h-[50vh]">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    }>
                        <Outlet context={{ currentUser, refreshNotifications, refreshUserData: loadUserData } satisfies SupervisorContextType} />
                    </Suspense>
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
                    <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
                            <LogOut className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                            Confirm Logout
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
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
                                disabled={loggingOut}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
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

export default SupervisorLayout;
export function useSupervisorContext() {
    return useOutletContext<SupervisorContextType>();
}
