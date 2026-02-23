import React, { useState, useEffect } from "react";
import { Bell, Activity, Loader2 } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { notificationService, type NotificationItem } from "../../services/notificationService";
import toast from "react-hot-toast";

const StudentNotifications = () => {
    const navigate = useNavigate();
    const {
        notifications: contextNotifications,
        setLocalNotifications: setParentNotifications
    } = useOutletContext<{
        notifications: NotificationItem[],
        setLocalNotifications?: React.Dispatch<React.SetStateAction<NotificationItem[]>>
    }>() || { notifications: [] };
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (contextNotifications && contextNotifications.length > 0) {
            setNotifications(contextNotifications);
        } else {
            fetchNotifications();
        }
    }, [contextNotifications]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const items = await notificationService.getNotifications({ limit: 50 });
            setNotifications(Array.isArray(items) ? items : []);
        } catch (error) {
            console.error("Failed to load notifications", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
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

    const handleNotificationClick = async (notification: NotificationItem) => {
        if (!notification.read) {
            try {
                await notificationService.markAsRead(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                // Also update parent state
                if (setParentNotifications) {
                    setParentNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                }
            } catch (e) {
                console.error(e);
            }
        }

        if (notification.link) {
            if (notification.link.startsWith("http")) {
                window.open(notification.link, "_blank");
            } else {
                // Translate generic links to student-specific routes
                let link = notification.link;
                if (link.startsWith("/documents")) {
                    link = "/student/documents";
                }
                navigate(link);
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                            {unreadCount > 0 ? `${unreadCount} new notifications` : "No new notifications"}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${notification.read
                                    ? "bg-white dark:bg-[#212124] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    : "bg-blue-50/70 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Activity className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-500 dark:text-gray-300">No notifications</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentNotifications;
