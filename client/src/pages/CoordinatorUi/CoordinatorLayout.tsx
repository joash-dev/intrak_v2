import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useNavigate, useLocation, Outlet, useOutletContext } from "react-router-dom";
import {
    Users,
    FileCheck,
    Building2,
    BarChart3,
    Bell,
    Menu,
    LogOut,
    Home,
    MessageSquare,
    Loader2,
} from "lucide-react";
import { settingsService } from "../../services/settingsService";
import { notificationService, type NotificationItem } from "../../services/notificationService";
import { useTranslation } from "react-i18next";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { formatDateTime } from "../../services/localeService";
import { useWalkthrough } from "../../hooks/useWalkthrough";
import { devLog } from "../../utils/devLog";
// Define the context type for shared data
type CoordinatorContextType = {
    currentUser: {
        name: string;
        email: string;
        initials: string;
    } | null;
    refreshNotifications: () => void;
    refreshUserData: () => void;
};

const CoordinatorLayout: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Sidebar state
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

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [photoLoading, setPhotoLoading] = useState(true);

    // Notifications data
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

    useEffect(() => {
        if (Array.isArray(notificationsData)) {
            setLocalNotifications(notificationsData);
        }
    }, [notificationsData]);

    // Current user state
    const [currentUser, setCurrentUser] = useState<{
        name: string;
        email: string;
        initials: string;
    } | null>(null);

    // Load user data
    const loadUserData = useCallback(async () => {
        try {
            setPhotoLoading(true);
            const userData = localStorage.getItem("user");
            if (userData) {
                const user = JSON.parse(userData);
                const name = user.name || user.fullName || "Coordinator";
                const email = user.email || "";
                const initials = name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                setCurrentUser({
                    name,
                    email,
                    initials,
                });
            }

            try {
                const serverPhoto = await settingsService.getProfilePhoto();
                if (serverPhoto) {
                    setProfilePhoto(serverPhoto);
                }
            } catch (error) {
                devLog.log("No profile photo found");
            }
        } catch (error) {
            devLog.error("Error loading user data:", error);
            setCurrentUser({
                name: "Coordinator",
                email: "",
                initials: "CO",
            });
        } finally {
            setPhotoLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUserData();

        const handleProfileUpdated = (event: any) => {
            const { user } = event.detail || {};
            if (user?.name || user?.email) {
                const name = user.name || user.fullName || "Coordinator";
                const email = user.email || "";
                const initials = name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                setCurrentUser({ name, email, initials });
            }
        };

        const handleProfilePhotoUpdate = (event: any) => {
            const { photoUrl } = event.detail;
            setProfilePhoto(photoUrl);
        };

        window.addEventListener("profileUpdated", handleProfileUpdated);
        window.addEventListener("profilePhotoUpdated", handleProfilePhotoUpdate);

        return () => {
            window.removeEventListener("profileUpdated", handleProfileUpdated);
            window.removeEventListener("profilePhotoUpdated", handleProfilePhotoUpdate);
        };
    }, [loadUserData]);

    // Walkthrough
    const { startWalkthrough } = useWalkthrough('coordinator');
    useEffect(() => {
        startWalkthrough();
    }, []);

    // Handle sidebar state on window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
                setSidebarExpanded(true);
            } else {
                setSidebarOpen(false);
                setSidebarExpanded(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (showNotifications && !target.closest(".notifications-dropdown")) {
                setShowNotifications(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotifications]);

    const navItems = [
        { id: "dashboard", label: t("dashboard.nav.dashboard"), icon: Home, path: "/coordinator/dashboard" },
        { id: "students", label: t("dashboard.nav.students"), icon: Users, path: "/coordinator/students" },
        { id: "documents", label: t("dashboard.nav.documents"), icon: FileCheck, path: "/coordinator/documents" },
        { id: "companies", label: t("dashboard.nav.companies"), icon: Building2, path: "/coordinator/companies" },
        { id: "announcements", label: t("dashboard.nav.announcements"), icon: MessageSquare, path: "/coordinator/announcements" },
        { id: "reports", label: "Reports", icon: BarChart3, path: "/coordinator/reports" },
        { id: "notifications", label: "Notifications", icon: Bell, path: "/coordinator/notifications" },
    ];

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

            // Handle message notifications
            if (notification.title === "New Message from Student" && notification.link) {
                const urlParams = new URLSearchParams(notification.link.split('?')[1] || '');
                const studentId = urlParams.get('studentId');
                if (studentId) {
                    sessionStorage.setItem('openStudentId', studentId);
                    navigate('/coordinator/students');
                    setShowNotifications(false);
                    return;
                }
            }

            if (notification.type === "DOCUMENT") {
                navigate("/coordinator/documents");
            } else if (notification.link) {
                const link = notification.link;
                if (/^https?:\/\//i.test(link)) {
                    window.open(link, "_blank", "noopener,noreferrer");
                } else {
                    const normalizedLink = link.startsWith("/") ? link : `/${link}`;
                    if (normalizedLink.startsWith("/login")) {
                        navigate("/coordinator/dashboard");
                    } else if (normalizedLink.includes('/coordinator/students')) {
                        const urlParams = new URLSearchParams(link.split('?')[1] || '');
                        const studentId = urlParams.get('studentId');
                        if (studentId) {
                            sessionStorage.setItem('openStudentId', studentId);
                            navigate('/coordinator/students');
                            setShowNotifications(false);
                            return;
                        }
                        navigate(normalizedLink);
                    } else {
                        navigate(normalizedLink);
                    }
                }
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

    const formatDropdownTimestamp = (timestamp: string) => {
        if (!timestamp) return "";
        return formatDateTime(timestamp);
    };

    const handleLogout = async () => {
        if (loggingOut) return; // Prevent double-click
        setLoggingOut(true);

        const appPrefs = localStorage.getItem("appPreferences");
        const notificationPrefs = localStorage.getItem("notificationPreferences");

        sessionStorage.removeItem("isAuthenticated");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        if (notificationPrefs) {
            localStorage.setItem("notificationPreferences", notificationPrefs);
        }
        if (appPrefs) {
            localStorage.setItem("appPreferences", appPrefs);
            try {
                const parsed = JSON.parse(appPrefs);
                settingsService.applyTheme(parsed.theme as "light" | "dark" | "system");
            } catch (error) {
                devLog.error("Failed to re-apply theme during logout", error);
            }
        }

        setShowLogoutModal(false);
        window.location.replace("/login");
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

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
                            src="/just_logo.png"
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
                                                {t("dashboard.notifications.title")}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                                                {t("dashboard.notifications.subtitle")}
                                            </p>
                                        </div>
                                        {unreadNotificationCount > 0 && (
                                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 ml-2 flex-shrink-0">
                                                {t("dashboard.notifications.new", { count: unreadNotificationCount })}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 min-h-0">
                                        {notificationsLoading ? (
                                            <div className="px-4 sm:px-5 py-8 flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                                {t("dashboard.notifications.loading")}
                                            </div>
                                        ) : localNotifications.length > 0 ? (
                                            localNotifications
                                                .filter((notification) =>
                                                    [
                                                        "DOCUMENT",
                                                        "ATTENDANCE",
                                                        "ALERT",
                                                        "SYSTEM",
                                                        "OTHER",
                                                    ].includes(notification.type ?? "OTHER")
                                                )
                                                .map((notification) => (
                                                    <button
                                                        key={notification.id}
                                                        onClick={() => {
                                                            handleNotificationClick(notification);
                                                        }}
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
                                                                    {formatDropdownTimestamp(notification.createdAt)}
                                                                </p>
                                                            </div>
                                                            {!notification.read && (
                                                                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3">
                                                            {notification.message}
                                                        </p>
                                                        {notification.type && (
                                                            <span className="mt-2 sm:mt-3 inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-600 dark:bg-[#212124] dark:text-gray-300">
                                                                {notification.type.replace(/_/g, " ")}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))
                                        ) : (
                                            <div className="px-4 sm:px-5 py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                                {t("dashboard.notifications.empty")}
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
                                            {t("dashboard.notifications.markAll")}
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate("/coordinator/notifications");
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
                                navigate("/coordinator/settings");
                                setSidebarOpen(false);
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                {photoLoading ? (
                                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                                ) : profilePhoto ? (
                                    <img
                                        src={profilePhoto}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white font-semibold text-sm">
                                        {currentUser?.initials || "CO"}
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
                                src="/just_logo.png"
                                alt="INTRAK Logo"
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                            {/* Branding Text */}
                            <div>
                                <h2 className="text-lg font-bold bg-gradient-to-b from-blue-400 to-blue-800 bg-clip-text text-transparent">
                                    INTRAK
                                </h2>
                                <p className="text-xs text-gray-500">Coordinator Portal</p>
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
                                    src="/just_logo.png"
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
                                    {/* Unread notification badge */}
                                    {isNotifications && unreadNotificationCount > 0 && (
                                        <>
                                            {sidebarExpanded && (
                                                <span className="ml-auto w-2 h-2 bg-purple-500 rounded-full"></span>
                                            )}
                                            {!sidebarExpanded && (
                                                <span className="absolute top-1 right-1 lg:block hidden w-2 h-2 bg-purple-500 rounded-full"></span>
                                            )}
                                        </>
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
                                navigate("/coordinator/settings");
                                if (window.innerWidth < 1024) {
                                    setSidebarOpen(false);
                                }
                            }}
                            className={`w-full flex items-center transition-all duration-200 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} ${isActive("/coordinator/settings")
                                ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/50 dark:to-blue-800/30 dark:text-blue-300 rounded-lg"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                }`}
                        >
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                {photoLoading ? (
                                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                                ) : profilePhoto ? (
                                    <img
                                        src={profilePhoto}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white font-semibold text-sm">
                                        {currentUser?.initials || "CO"}
                                    </span>
                                )}
                            </div>
                            <div className={`flex-1 text-left min-w-0 ${sidebarExpanded ? "" : "lg:hidden"}`}>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {currentUser?.name || "Coordinator"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">Coordinator</p>
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
                        <Outlet context={{ currentUser, refreshNotifications, refreshUserData: loadUserData } satisfies CoordinatorContextType} />
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

export default CoordinatorLayout;
export function useCoordinatorContext() {
    return useOutletContext<CoordinatorContextType>();
}
