import React, { useState, useEffect } from "react";
import { Bell, Trash2, Check, Clock, AlertCircle, FileText, Info } from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { notificationService, type NotificationItem } from "../../services/notificationService";
import toast from "react-hot-toast";

const InstructorNotifications = () => {
    const navigate = useNavigate();
    const {
        notifications: contextNotifications,
        setLocalNotifications: setParentNotifications
    } = useOutletContext<{
        notifications: NotificationItem[],
        refreshNotifications?: () => Promise<void>,
        setLocalNotifications?: React.Dispatch<React.SetStateAction<NotificationItem[]>>
    }>() || { notifications: [] };
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize with context notifications if available, otherwise fetch
        if (contextNotifications && contextNotifications.length > 0) {
            setNotifications(contextNotifications);
        } else {
            fetchNotifications();
        }
    }, [contextNotifications]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications({ limit: 50 });
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            // Also update parent state
            if (setParentNotifications) {
                setParentNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }
            toast.success("Marked as read");
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            // Also update parent state so it persists when navigating
            if (setParentNotifications) {
                setParentNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const handleNotificationClick = async (notification: NotificationItem) => {
        if (!notification.read) {
            await handleMarkAsRead(notification.id);
        }

        // Handle message notifications - navigate to student management and open chat
        if (notification.title === "New Message from Student" && notification.link) {
            const urlParams = new URLSearchParams(notification.link.split('?')[1] || '');
            const studentId = urlParams.get('studentId');
            if (studentId) {
                sessionStorage.setItem('openStudentId', studentId);
                navigate('/instructor/students');
                return;
            }
        }

        if (notification.link) {
            if (notification.link.startsWith("http")) {
                window.open(notification.link, "_blank");
            } else {
                // Check if link contains studentId parameter
                const urlParams = new URLSearchParams(notification.link.split('?')[1] || '');
                const studentId = urlParams.get('studentId');
                if (studentId && notification.link.includes('/instructor/students')) {
                    sessionStorage.setItem('openStudentId', studentId);
                    navigate('/instructor/students');
                    return;
                }
                navigate(notification.link);
            }
        } else if (notification.type === "DOCUMENT") {
            navigate("/instructor/documents");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "DOCUMENT": return <FileText className="w-5 h-5 text-blue-500" />;
            case "ATTENDANCE": return <Clock className="w-5 h-5 text-green-500" />;
            case "ALERT": return <AlertCircle className="w-5 h-5 text-red-500" />;
            case "SYSTEM": return <Info className="w-5 h-5 text-gray-500" />;
            default: return <Bell className="w-5 h-5 text-blue-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bell className="w-6 h-6 text-blue-600" />
                            Notifications
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Stay updated with student activities and system alerts
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Mark all as read
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading && notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading notifications...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notification.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-full flex-shrink-0 ${!notification.read ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-800"
                                        }`}>
                                        {getIcon(notification.type || "OTHER")}
                                    </div>
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className={`text-sm font-semibold ${!notification.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-sm mt-1 ${!notification.read ? "text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"
                                            }`}>
                                            {notification.message}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(notification.id);
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                                title="Mark as read"
                                            >
                                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(notification.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            No notifications
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            You're all caught up! Check back later for updates.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructorNotifications;
