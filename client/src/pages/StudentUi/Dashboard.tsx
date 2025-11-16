import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Clock,
  Star,
  TrendingUp,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  User,
  Building2,
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  Calendar,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudentDocumentsTab from "./StudentDocumentsTab";
import StudentTemplates from "./StudentTemplates";
import StudentAttendanceTab from "./StudentAttendance";
import StudentEvaluationsTab from "./StudentEvaluation";
import StudentReportsTab from "./StudentReport";
import StudentCompanySelection from "./StudentCompanySelection";
import Setting from "./Settings";
import { dashboardService } from "../../services/dashboardService";
import type { DashboardData } from "../../services/dashboardService";
import { documentService } from "../../services/documentService";
import { settingsService } from "../../services/settingsService";
import {
  notificationService,
  type NotificationItem,
} from "../../services/notificationService";
import api from "../../services/api";
import toast from "react-hot-toast";

// Default data structure for loading states
const defaultDashboardData: DashboardData = {
  student: {
    id: "",
    name: "",
    email: "",
    studentNumber: "",
    program: "",
    year: 0,
    section: "",
    company: "",
    supervisor: "",
    totalHours: 0,
    completedHours: 0,
  },
  documents: [],
  attendance: [],
  evaluations: [],
  announcements: [],
};

// Utility function to format student ID
const formatStudentId = (studentNumber: string) => {
  // If already in correct format, return as is
  if (/^\d{2}-[A-Z]{2}-\d{4}$/.test(studentNumber)) {
    return studentNumber;
  }

  // If it's in format like "2021-12345", convert to "21-UR-1234"
  if (/^\d{4}-\d{5}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4); // Get last 2 digits of year
    const number = studentNumber.substring(5, 9); // Get first 4 digits of the number part
    return `${year}-UR-${number}`;
  }

  // If it's in format like "2021-1234", convert to "21-UR-1234"
  if (/^\d{4}-\d{4}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4); // Get last 2 digits of year
    const number = studentNumber.substring(5); // Get the number part
    return `${year}-UR-${number}`;
  }

  // Default fallback
  return studentNumber || "22-UR-0592";
};

// Overview Component
const OverviewTab = ({
  data,
  setActiveTab,
  notifications,
  notificationsLoading,
  onNotificationClick,
  onMarkAllNotificationsRead,
}: {
  data: DashboardData;
  setActiveTab: (tab: string) => void;
  notifications: NotificationItem[];
  notificationsLoading: boolean;
  onNotificationClick: (notification: NotificationItem) => void;
  onMarkAllNotificationsRead: () => Promise<void>;
}) => {
  const progress =
    data.student.totalHours && data.student.totalHours > 0
      ? ((data.student.completedHours || 0) / data.student.totalHours) * 100
      : 0;

  const documentStats = {
    total: Array.isArray(data.documents) ? data.documents.length : 0,
    approved: Array.isArray(data.documents)
      ? data.documents.filter((d) => d.status === "APPROVED").length
      : 0,
    pending: Array.isArray(data.documents)
      ? data.documents.filter((d) => d.status === "PENDING").length
      : 0,
    rejected: Array.isArray(data.documents)
      ? data.documents.filter((d) => d.status === "REJECTED").length
      : 0,
  };

  const avgRating =
    Array.isArray(data.evaluations) && data.evaluations.length > 0
      ? (
          data.evaluations.reduce((sum, e) => sum + e.rating, 0) /
          data.evaluations.length
        ).toFixed(1)
      : "N/A";

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const formatNotificationTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationAccent = (type: string) => {
    switch (type) {
      case "DOCUMENT":
        return {
          badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
          iconBg: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-200",
        };
      case "ATTENDANCE":
        return {
          badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200",
          iconBg: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-200",
        };
      default:
        return {
          badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
          iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {data.student.name}!
        </h2>
        <p className="text-sm opacity-80">
          Student ID: {formatStudentId(data.student.studentNumber)}
        </p>
        {data.student.company ? (
          <div className="flex items-center space-x-2 mt-2">
            <Building2 className="w-5 h-5 opacity-90" />
            <p className="opacity-90 font-semibold">{data.student.company}</p>
          </div>
        ) : (
          <p className="opacity-90">
            Track your internship progress and manage your requirements
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Documents
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {documentStats.approved}/{documentStats.total}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {documentStats.approved} approved
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hours Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.student.completedHours}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {data.student.totalHours} hours
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Rating
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {avgRating}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {Array.isArray(data.evaluations) ? data.evaluations.length : 0}{" "}
                evaluations
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Progress
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {progress.toFixed(0)}%
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                On track
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Center */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notification Center
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stay on top of document feedback and approvals
            </p>
          </div>
          <button
            onClick={onMarkAllNotificationsRead}
            disabled={notifications.length === 0 || unreadCount === 0}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
        </div>
        {notificationsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const { badge, iconBg } = getNotificationAccent(notification.type);
              return (
                <button
                  key={notification.id}
                  onClick={() => onNotificationClick(notification)}
                  className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
                    notification.read
                      ? "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      : "border-purple-200 dark:border-purple-700 bg-purple-50/70 dark:bg-purple-900/20 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed line-clamp-3">
                        {notification.message}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${badge}`}>
                          {notification.type.replace(/_/g, " ")}
                        </span>
                        <span>{formatNotificationTimestamp(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            <Bell className="w-6 h-6 mb-3 text-gray-400" />
            <p className="font-medium">No new notifications</p>
            <p className="text-xs mt-1">
              Once your submissions are reviewed, updates will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Internship Progress
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {data.student.completedHours} / {data.student.totalHours} hours
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${progress}%` }}
          >
            <span className="text-xs text-white font-semibold">
              {progress.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Document Status
            </h3>
            <button
              onClick={() => setActiveTab("documents")}
              className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {Array.isArray(data.documents) && data.documents.length > 0 ? (
              (() => {
                // Deduplicate by document type, prefer APPROVED then newest, and limit to 3
                const byType = new Map<string, any>();
                data.documents.forEach((d: any) => {
                  const existing = byType.get(d.type);
                  if (!existing) {
                    byType.set(d.type, d);
                    return;
                  }
                  const existingTime = new Date(existing.uploadedAt || existing.reviewedAt || 0).getTime();
                  const currentTime = new Date(d.uploadedAt || d.reviewedAt || 0).getTime();
                  const preferApproved = d.status === "APPROVED" && existing.status !== "APPROVED";
                  const isNewer = currentTime > existingTime;
                  if (preferApproved || isNewer) {
                    byType.set(d.type, d);
                  }
                });
                const limited = Array.from(byType.values()).slice(0, 4);
                return limited.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {doc.status === "APPROVED" && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {doc.status === "PENDING" && (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    {doc.status === "REJECTED" && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {doc.type}
                      </p>
                      {doc.remarks && (
                        <p className="text-xs text-red-500">{doc.remarks}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      doc.status === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : doc.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ));
              })()
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No documents uploaded yet</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setActiveTab("documents")}
            className="w-full mt-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          {/* Templates Quick Action */}
          <div className="mt-4">
            <button
              onClick={() => setActiveTab("templates")}
              className="w-full py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Templates</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Recent Attendance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Recent Attendance
            </h3>
            <div className="space-y-2">
              {Array.isArray(data.attendance) && data.attendance.length > 0 ? (
                data.attendance.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {log.timeIn
                        ? new Date(log.timeIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}{" "}
                      -{" "}
                      {log.timeOut
                        ? new Date(log.timeOut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "In Progress"}
                    </span>
                    <span className="font-medium text-purple-600">
                      {Math.round(log.durationMinutes / 60)}h
                    </span>
                    {log.verified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No attendance records found</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveTab("attendance")}
              className="w-full mt-4 py-2 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
            >
              View Full Calendar
            </button>
          </div>

          {/* Company Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-green-600" />
              Internship Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Company
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.student.company}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supervisor
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.student.supervisor}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Program
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.student.program} - Year {data.student.year} Section{" "}
                  {data.student.section}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-orange-600" />
          Recent Announcements
        </h3>
        <div className="space-y-3">
          {Array.isArray(data.announcements) &&
          data.announcements.length > 0 ? (
            data.announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {announcement.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {announcement.content}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {announcement.date}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No announcements available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>(defaultDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNoCompanyModal, setShowNoCompanyModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Prevent back button after logout
  useEffect(() => {
    const preventBackButton = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", preventBackButton);
    return () => {
      window.removeEventListener("popstate", preventBackButton);
    };
  }, []);

  // Function to refresh dashboard data
  const refreshDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const dashboardData = await dashboardService.getDashboardData();
      setData(dashboardData);

      // Show modal if student has no company
      if (!dashboardData.student.company && activeTab === "overview") {
        setShowNoCompanyModal(true);
      }

      // Also refresh profile photo from server
      try {
        const serverPhoto = await settingsService.getProfilePhoto();
        if (serverPhoto) {
          setProfilePhoto(serverPhoto);
        }
      } catch (error) {
        console.error("Error loading profile photo:", error);
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const items = await notificationService.getNotifications({ limit: 15 });
      setNotifications(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const handleInternalNavigation = useCallback(
    (rawLink: string) => {
      if (!rawLink) {
        return false;
      }

      let link = rawLink.trim();
      if (link.startsWith("/")) {
        link = link.replace(/^\/+/, "");
      }
      if (link.startsWith("student/")) {
        link = link.replace(/^student\/+/, "");
      }

      const tabMap: Record<string, string> = {
        documents: "documents",
        templates: "templates",
        companies: "companies",
        attendance: "attendance",
        evaluations: "evaluations",
        reports: "reports",
        settings: "settings",
        overview: "overview",
      };

      const matchedEntry = Object.entries(tabMap).find(([key]) =>
        link.toLowerCase().startsWith(key)
      );

      if (matchedEntry) {
        const [, tab] = matchedEntry;
        setActiveTab(tab);
        return true;
      }

      return false;
    },
    [setActiveTab]
  );

  const handleNotificationClick = useCallback(
    async (notification: NotificationItem) => {
      try {
        if (!notification.read) {
          await notificationService.markAsRead(notification.id);
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notification.id ? { ...item, read: true } : item
            )
          );
        }

        if (notification.link) {
          const link = notification.link;
          if (/^https?:\/\//i.test(link)) {
            window.open(link, "_blank", "noopener,noreferrer");
          } else {
            if (handleInternalNavigation(link)) {
              // handled by tab navigation
            } else {
              let normalizedLink = link.startsWith("/") ? link : `/${link}`;
              if (!normalizedLink.startsWith("/student")) {
                normalizedLink = `/student${normalizedLink}`;
              }
              navigate(normalizedLink.replace(/\/{2,}/g, "/"));
            }
          }
        } else {
          if (notification.type === "DOCUMENT") {
            setActiveTab("documents");
          } else if (notification.type === "ATTENDANCE") {
            setActiveTab("attendance");
          }
        }
      } catch (error) {
        console.error("Error handling notification interaction", error);
      } finally {
        setShowNotifications(false);
      }
    },
    [handleInternalNavigation, navigate]
  );

  const handleMarkAllNotificationsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  }, []);

  // Check authentication and fetch data on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const userString = localStorage.getItem("user");

      if (!token || !userString) {
        setIsAuthenticated(false);
        return;
      }

      // Parse user and check if it's a student
      try {
        const user = JSON.parse(userString);
        if (user.role?.toLowerCase() !== "student") {
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
        console.log("Initial load - Loading profile photo from server...");
        const serverPhoto = await settingsService.getProfilePhoto();
        console.log("Initial load - Server photo response:", serverPhoto);
        if (serverPhoto) {
          setProfilePhoto(serverPhoto);
          console.log("Initial load - Profile photo set to:", serverPhoto);
        } else {
          console.log("Initial load - No profile photo found");
        }
      } catch (error) {
        console.error("Initial load - Error loading profile photo:", error);
      }
    };
    loadProfilePhoto();

    if (isAuthenticated) {
      refreshDashboardData(true); // Show loading spinner for initial load
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, loadNotifications]);

  // Refresh data when returning from settings (with debouncing)
  useEffect(() => {
    if (activeTab !== "settings" && isAuthenticated) {
      // Only refresh if we haven't refreshed recently (debounce)
      const lastRefresh = localStorage.getItem("lastDashboardRefresh");
      const now = Date.now();
      const timeSinceLastRefresh = lastRefresh
        ? now - parseInt(lastRefresh)
        : Infinity;

      // Only refresh if it's been more than 30 seconds since last refresh
      if (timeSinceLastRefresh > 30000) {
        const timer = setTimeout(() => {
          refreshDashboardData(false); // Don't show loading spinner for background refresh
          localStorage.setItem("lastDashboardRefresh", now.toString());
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, isAuthenticated]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications) {
        const target = event.target as Element;
        if (!target.closest(".notification-dropdown")) {
          setShowNotifications(false);
        }
      }
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest(".user-menu-dropdown")) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

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

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read
  ).length;
  const announcementCount = Array.isArray(data.announcements)
    ? data.announcements.length
    : 0;
  const totalNotificationCount = unreadNotificationCount + announcementCount;

  const formatNotificationTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "LOW":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const refreshDocuments = async () => {
    try {
      const documents = await documentService.getStudentDocuments();
      setData((prevData) => ({
        ...prevData,
        documents: documents as DashboardData["documents"],
      }));
    } catch (err: any) {
      console.error("Error refreshing documents:", err);
      toast.error("Failed to refresh documents");
    }
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

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "templates", label: "Templates", icon: Download },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "evaluations", label: "Evaluations", icon: Star },
    { id: "reports", label: "Reports", icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            data={data}
            setActiveTab={setActiveTab}
            notifications={notifications}
            notificationsLoading={notificationsLoading}
            onNotificationClick={handleNotificationClick}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          />
        );
      case "documents":
        return <StudentDocumentsTab onDocumentsChange={refreshDocuments} />;
      case "templates":
        return <StudentTemplates />;
      case "companies":
        return (
          <StudentCompanySelection onCompanyUpdate={refreshDashboardData} />
        );
      case "attendance":
        return <StudentAttendanceTab />;
      case "evaluations":
        return <StudentEvaluationsTab />;
      case "reports":
        return <StudentReportsTab />;
      case "settings":
        return <Setting onProfileUpdate={refreshDashboardData} />;
      default:
        return (
          <OverviewTab
            data={data}
            setActiveTab={setActiveTab}
            notifications={notifications}
            notificationsLoading={notificationsLoading}
            onNotificationClick={handleNotificationClick}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          />
        );
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
                <p className="text-xs text-gray-500">Student Portal</p>
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
                  {totalNotificationCount > 0 && (
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
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                            {unreadNotificationCount} unread updates
                          </span>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full text-xs font-medium">
                            {announcementCount} announcement{announcementCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Document Updates
                          </h4>
                          <button
                            onClick={async () => {
                              await handleMarkAllNotificationsRead();
                              loadNotifications();
                            }}
                            disabled={notifications.length === 0 || unreadNotificationCount === 0}
                            className="text-xs font-semibold text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            Mark all read
                          </button>
                        </div>
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                          </div>
                        ) : notifications.length > 0 ? (
                          <div className="space-y-3">
                            {notifications.map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                                  notification.read
                                    ? "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    : "border-purple-200 dark:border-purple-700 bg-purple-50/70 dark:bg-purple-900/20 shadow"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed line-clamp-3">
                                  {notification.message}
                                </p>
                                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                                  <span>{notification.type.replace(/_/g, " ")}</span>
                                  <span>{formatNotificationTimestamp(notification.createdAt)}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                            No document updates yet.
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Announcements
                        </h4>
                        {Array.isArray(data.announcements) &&
                        data.announcements.length > 0 ? (
                          <div className="space-y-3">
                            {data.announcements.map((announcement) => (
                              <div
                                key={announcement.id}
                                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    {announcement.priority === "HIGH" && (
                                      <AlertTriangle className="w-5 h-5 text-red-500" />
                                    )}
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                      {announcement.title}
                                    </h4>
                                  </div>
                                  {announcement.priority && (
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                        announcement.priority
                                      )}`}
                                    >
                                      {announcement.priority}
                                    </span>
                                  )}
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
                                  {new Date(announcement.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                            No announcements yet.
                          </div>
                        )}
                      </div>
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
                            <span className="text-white font-semibold">
                              {data.student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {data.student.name}
                          </p>
                          <p className="text-sm text-gray-500">Student</p>
                          <p className="text-xs text-gray-400">
                            {data.student.email}
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
          className="fixed inset-0 bg-black bg-opacity-50 z-0 flex items-center justify-center p-4 lg:hidden"
          style={{ margin: "0" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
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

      {/* No Company Warning Modal */}
      {showNoCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ margin: "0" }}>
          <div className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20 rounded-2xl shadow-2xl max-w-lg w-full p-8 border-4 border-orange-400 dark:border-orange-600">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mx-auto mb-6 shadow-lg animate-bounce">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
              No Company Assignment Yet!
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center mb-6 leading-relaxed">
              You haven't been assigned to a company yet. Browse available
              companies and apply now to start your internship journey!
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>📌 Note:</strong> Your application will be reviewed by
                your instructor. Once approved, you'll be assigned to the
                company automatically!
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  setShowNoCompanyModal(false);
                  setActiveTab("companies");
                }}
                className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Browse Companies & Apply Now
              </button>
              <button
                onClick={() => setShowNoCompanyModal(false)}
                className="w-full px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                I'll Do This Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
