import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { notificationService, type NotificationItem } from "../../services/notificationService";
import { formatDateTime } from "../../services/localeService";
import { useCoordinatorContext } from "./CoordinatorLayout";

const CoordinatorNotifications: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { refreshNotifications } = useCoordinatorContext();

    const {
        data: notificationsData,
        loading: notificationsLoading,
        refresh: refreshLocalNotifications,
    } = useOptimizedData<NotificationItem[]>(
        () => notificationService.getNotifications({ limit: 50 }),
        [],
        { ttl: 60 * 1000 }
    );

    const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);

    useEffect(() => {
        if (Array.isArray(notificationsData)) {
            setLocalNotifications(notificationsData);
        }
    }, [notificationsData]);

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
                refreshLocalNotifications();
            }

            // Handle message notifications - open the messages tab (preferred)
            if (notification.title === "New Message from Student" && notification.link) {
                navigate(notification.link);
                return;
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
                    } else {
                        // Translate generic document links to coordinator-specific route
                        let finalLink = normalizedLink;
                        if (normalizedLink.startsWith("/documents")) {
                            finalLink = "/coordinator/documents";
                        }
                        navigate(finalLink);
                    }
                }
            }
        } catch (error) {
            console.error("Error handling notification interaction", error);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setLocalNotifications((prev) =>
                prev.map((item) => ({ ...item, read: true }))
            );
            refreshNotifications();
            refreshLocalNotifications();
        } catch (error) {
            console.error("Failed to mark all notifications as read", error);
        }
    };

    const unreadNotificationCount = localNotifications.filter(
        (notification) => !notification.read
    ).length;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white dark:bg-[#212124] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t("dashboard.notifications.title")}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                            {t("dashboard.notifications.subtitle")}
                        </p>
                    </div>
                    {unreadNotificationCount > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                            {t("dashboard.notifications.new", { count: unreadNotificationCount })} unread
                        </span>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#212124] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                {notificationsLoading ? (
                    <div className="p-12 flex items-center justify-center">
                        <div className="text-gray-500 dark:text-gray-400">
                            {t("dashboard.notifications.loading")}
                        </div>
                    </div>
                ) : localNotifications.length > 0 ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                All Notifications
                            </h2>
                            {unreadNotificationCount > 0 && (
                                <button
                                    onClick={handleMarkAllNotificationsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {localNotifications
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
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read
                                            ? "bg-blue-50/50 dark:bg-blue-900/10"
                                            : ""
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDateTime(notification.createdAt)}
                                                    </span>
                                                    {notification.type && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-[#212124] dark:text-gray-300">
                                                            {notification.type.replace(/_/g, " ")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-300">
                            {t("dashboard.notifications.empty")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoordinatorNotifications;
