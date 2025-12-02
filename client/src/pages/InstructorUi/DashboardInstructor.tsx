import React, { useState, useEffect, Suspense } from "react";
import {
  Users,
  Clock,
  Award,
  FileText,
  TrendingUp,
  CheckCircle,
  Building2,
  Search,
  Eye,
  Activity,
  Bell,
  Download,
  Menu,
  X,
  LogOut,
  Home,
  FileCheck,
  Calendar,
  Upload,
  ClipboardList,
  Megaphone,
  CalendarDays,
  Trash2,
  BarChart3,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
// Lazy load tab components
const InstructorDocumentsTab = React.lazy(() => import("./InstructorDocuments"));
const InstructorMonitoringTab = React.lazy(() => import("./InstructorStudent"));
const DocumentChecklistTab = React.lazy(() => import("./InstructorDocumentChecklist"));
const InstructorStudentManagement = React.lazy(() => import("./InstructorStudentManagement"));
const InstructorTemplateManagement = React.lazy(() => import("./InstructorTemplateManagement"));
const InstructorSettings = React.lazy(() => import("./InstructorSettings"));
const InstructorApplications = React.lazy(() => import("./InstructorApplications"));
const InstructorReportsTab = React.lazy(() => import("./InstructorReportsTab"));
import {
  instructorService,
  type InstructorStudent,
  type InstructorActivity,
} from "../../services/instructorService";
//import { type Announcement } from "../../services/announcementService";
import { settingsService } from "../../services/settingsService";
import {
  notificationService,
  type NotificationItem,
} from "../../services/notificationService";
import { type Announcement } from "../../services/announcementService";
import toast from "react-hot-toast";

// =============================================
// INSTRUCTOR DASHBOARD COMPONENT
// =============================================
interface InstructorDashboardProps {
  setActiveTab: (tab: string) => void;
  notifications: NotificationItem[];
  notificationsLoading: boolean;
}

const InstructorDashboard = ({
  setActiveTab,
  notifications,
  notificationsLoading,
}: InstructorDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] =
    useState<InstructorStudent | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Optimized data fetching with caching
  const { data: studentsData, loading: studentsLoading } = useOptimizedData(
    () => instructorService.getAssignedStudents(),
    [],
    { ttl: 60 * 1000 } // 1 minute cache to avoid flicker but keep data fresh
  );

  const { data: statsData, loading: statsLoading } = useOptimizedData(
    () => instructorService.getDashboardStats(),
    [],
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const { data: activitiesData, loading: activitiesLoading } = useOptimizedData(
    () => instructorService.getRecentActivities(),
    [],
    { ttl: 60 * 1000 } // 1 minute cache
  );

  const { data: announcementsData, loading: announcementsLoading } =
    useOptimizedData<Announcement[]>(
      () => instructorService.getAnnouncements(),
      [],
      { ttl: 2 * 60 * 1000 }
    );

  const students = studentsData || [];
  const stats =
    statsData ||
    {
      totalStudents: 0,
      activeStudents: 0,
      atRiskStudents: 0,
      completedStudents: 0,
      avgAttendance: 0,
      avgRating: 0,
      documentsPending: 0,
      evaluationsPending: 0,
    };
  const activities = activitiesData || [];
  const announcements = announcementsData || [];
  const latestAnnouncements = announcements.slice(0, 3);

  const loading =
    studentsLoading ||
    statsLoading ||
    activitiesLoading ||
    announcementsLoading ||
    notificationsLoading;

  const handleAnnouncementClick = async (announcementId: string) => {
    try {
      await instructorService.trackAnnouncementView(announcementId);
    } catch (error) {
      console.warn("Failed to track announcement view", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      warning:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      at_risk: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors.active;
  };

  const handleViewStudentDetails = (student: InstructorStudent) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "submission":
        return <FileText className="w-4 h-4" />;
      case "attendance":
        return <Clock className="w-4 h-4" />;
      case "task":
        return <CheckCircle className="w-4 h-4" />;
      case "evaluation":
        return <Award className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "submission":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "attendance":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "task":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "evaluation":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const notificationActivities: InstructorActivity[] = notifications.map(
    (notification) => {
      let type: InstructorActivity["type"] = "task";
      if (notification.type === "DOCUMENT") {
        type = "submission";
      } else if (notification.type === "ATTENDANCE") {
        type = "attendance";
      }

      return {
        id: `notification-${notification.id}`,
        studentName: notification.title,
        action: notification.message,
        type,
        timestamp: notification.createdAt,
      };
    }
  );

  const activityFeed = [...activities, ...notificationActivities]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);

  const compactActivityFeed = activityFeed.slice(0, 5);

  useEffect(() => {
    if (notifications) {
      // setLocalNotifications(notifications); // This line is removed as per the edit hint
    }
  }, [notifications]);

  // Show loading state
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl w-full"></div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students List Skeleton */}
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl"></div>

          {/* Recent Activity Skeleton */}
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section - Responsive Dynamic Design */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white shadow-2xl">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-float"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-float animation-delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-white rounded-full opacity-50 animate-float animation-delay-2000"></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full opacity-70 animate-float animation-delay-3000"></div>
        </div>

        {/* Content - Desktop Layout */}
        <div className="hidden md:block relative z-10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold animate-fade-in">
                  Dashboard Overview
                </h1>
              </div>
              <p className="text-blue-100 text-sm font-medium max-w-xl">
                Monitor and evaluate BS Computer Engineering students
              </p>
            </div>

            {/* Total Students Badge - Desktop */}
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-5 py-4 border border-white/20">
                <div className="flex flex-col items-center">
                  <Users className="w-6 h-6 text-white mb-1" />
                  <p className="text-white text-3xl font-bold leading-none mb-1">
                    {stats.totalStudents}
                  </p>
                  <p className="text-blue-100 text-xs font-medium whitespace-nowrap">
                    Total Students
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Mobile Layout */}
        <div className="md:hidden relative z-10 p-4">
          {/* Mobile Header with Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold animate-fade-in">
                  Dashboard
                </h1>
              </div>
              <p className="text-blue-100 text-xs font-medium">
                Monitor and evaluate students
              </p>
            </div>

            {/* Mobile Total Students Badge */}
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
              <div className="flex flex-col items-center">
                <Users className="w-4 h-4 text-white mb-0.5" />
                <p className="text-white text-lg font-bold leading-none mb-0.5">
                  {stats.totalStudents}
                </p>
                <p className="text-blue-100 text-[9px] font-medium whitespace-nowrap">
                  Total Students
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
      </div>

      {/* Stats Cards - Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Students Card */}
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">
                Active Students
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.activeStudents}
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm">
                Currently Active
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Average Attendance Card */}
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">
                Avg Attendance
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.avgAttendance}%
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                of 100%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">
                Avg Rating
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                {stats.avgRating > 0 ? "out of 5.0" : "0 evaluations"}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* At Risk Students Card */}
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">
                At Risk
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.atRiskStudents}
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm">
                On track
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile Stacked View */}
      <div className="md:hidden space-y-3">
        {/* Active Students Card */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">
                  Active Students
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {stats.activeStudents}
                </p>
                <p className="text-green-600 dark:text-green-400 text-xs">
                  Currently Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Attendance Card */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">
                  Avg Attendance
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {stats.avgAttendance}%
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  of 100%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">
                  Avg Rating
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                  {stats.avgRating > 0 ? "out of 5.0" : "0 evaluations"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* At Risk Students Card */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">
                  At Risk
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {stats.atRiskStudents}
                </p>
                <p className="text-green-600 dark:text-green-400 text-xs">
                  On track
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 sm:space-y-4 md:space-y-0 mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Student Management
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Track progress and review assigned students
                </p>
              </div>
              <div className="flex flex-col md:flex-row space-y-2 sm:space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full md:w-auto md:min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="warning">Warning</option>
                  <option value="at_risk">At Risk</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {filteredStudents.length > 0 ? (
                filteredStudents.slice(0, 3).map((student) => (
                  <div
                    key={student.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200 bg-white dark:bg-[#212124]"
                  >
                    {/* Student Header - Mobile Optimized */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                            {student.avatar}
                          </div>
                          <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                              {student.name}
                            </h3>
                            <span
                              className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-full font-semibold flex-shrink-0 ${getStatusColor(
                                student.status
                              )}`}
                            >
                              {student.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                            {student.studentId} • {student.program}
                          </p>
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                              {student.company}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics - Mobile Optimized */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <div className="rounded-lg p-2 sm:p-3 border border-blue-500 bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <p className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300">
                            Attendance
                          </p>
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-300 flex-shrink-0" />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <p className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-200">
                            {student.attendanceRate}%
                          </p>
                          <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-1 sm:h-1.5">
                            <div
                              className="bg-blue-600 dark:bg-blue-400 h-1 sm:h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${student.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg p-2 sm:p-3 border border-green-500 bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <p className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-300">
                            Hours Progress
                          </p>
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-300 flex-shrink-0" />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <p className="text-sm sm:text-base font-bold text-green-700 dark:text-green-200">
                            {student.hoursCompleted}/{student.requiredHours}
                          </p>
                          <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-1 sm:h-1.5">
                            <div
                              className="bg-green-600 dark:bg-green-400 h-1 sm:h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${student.requiredHours
                                  ? (student.hoursCompleted /
                                    student.requiredHours) *
                                  100
                                  : 0
                                  }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg p-2 sm:p-3 border border-amber-500 bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <p className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-300">
                            Performance
                          </p>
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-300 flex-shrink-0" />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <p className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-200">
                            {student.lastEvaluation
                              ? student.lastEvaluation.toFixed(1)
                              : "N/A"}
                          </p>
                          <div className="flex items-center space-x-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Award
                                key={star}
                                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${student.lastEvaluation &&
                                  star <= Math.round(student.lastEvaluation)
                                  ? "text-amber-600 dark:text-amber-300 fill-current"
                                  : "text-amber-200 dark:text-amber-900"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Last activity: {student.lastActivity}
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewStudentDetails(student)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    No Students Assigned
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    You don't have any students assigned to you yet. Students will appear here once they are added to the system and assigned to your supervision.
                  </p>
                  <button
                    onClick={() => setActiveTab("students")}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Manage Students
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setActiveTab("students")}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                {filteredStudents.length > 3
                  ? "View More Students"
                  : filteredStudents.length > 0
                    ? "Manage Students"
                    : "Add Students"}
                <Users className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-white" />
                </span>
                <span>Announcements</span>
              </h3>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                {announcements.length} total
              </span>
            </div>

            <div className="space-y-3">
              {latestAnnouncements.length > 0 ? (
                latestAnnouncements.map((announcement) => (
                  <button
                    key={announcement.id}
                    onClick={() => handleAnnouncementClick(announcement.id)}
                    className="w-full text-left rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 px-4 py-3 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {announcement.message || announcement.content}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-700 dark:text-amber-200">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>
                            {announcement.createdDate
                              ? new Date(announcement.createdDate).toLocaleDateString()
                              : new Date(announcement.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                        {announcement.type && (
                          <span className="text-[11px] uppercase tracking-wide font-semibold text-amber-600 dark:text-amber-300">
                            {announcement.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                  <Megaphone className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  No announcements yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab("documents")}
                className="w-full flex items-center space-x-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200 border border-green-200 dark:border-green-700 group"
              >
                <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block text-green-900 dark:text-green-100">
                    Review Documents
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-300">
                    Check submitted files
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("applications")}
                className="w-full flex items-center space-x-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 border border-blue-200 dark:border-blue-700 group"
              >
                <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block text-blue-900 dark:text-blue-100">
                    Company Applications
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-300">
                    Approve or reject placements
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className="w-full flex items-center space-x-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 border border-blue-200 dark:border-blue-700 group"
              >
                <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block text-blue-900 dark:text-blue-100">
                    Document Templates
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-300">
                    Manage templates
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("checklist")}
                className="w-full flex items-center space-x-4 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200 border border-indigo-200 dark:border-indigo-700 group"
              >
                <div className="p-2 bg-indigo-500 rounded-lg group-hover:bg-indigo-600 transition-colors">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block text-indigo-900 dark:text-indigo-100">
                    Document Checklist
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-300">
                    Track completion status
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  const reportData = {
                    students: students ? students.length : 0,
                    activeStudents: stats.activeStudents,
                    avgAttendance: stats.avgAttendance,
                    avgRating: stats.avgRating,
                    atRiskStudents: stats.atRiskStudents,
                    generatedAt: new Date().toISOString(),
                  };

                  const dataStr = JSON.stringify(reportData, null, 2);
                  const dataBlob = new Blob([dataStr], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `instructor-report-${new Date().toISOString().split("T")[0]
                    }.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full flex items-center space-x-4 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-200 border border-orange-200 dark:border-orange-700 group"
              >
                <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block text-orange-900 dark:text-orange-100">
                    Generate Report
                  </span>
                  <span className="text-xs text-orange-600 dark:text-orange-300">
                    Export student data
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activities (Compact) */}
          <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </span>
                <span>Recent Activities</span>
              </h3>
              <button
                onClick={() => setActiveTab("monitoring")}
                className="text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {compactActivityFeed.length > 0 ? (
                compactActivityFeed.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {activity.studentName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {activity.action}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                  No recent activity yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div
          className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
          onClick={() => setShowStudentModal(false)}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            margin: "0",
          }}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 relative animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              margin: "20px",
            }}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Student Details
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Student Header */}
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {selectedStudent.avatar}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${selectedStudent.status === "completed"
                      ? "bg-green-500"
                      : selectedStudent.status === "at_risk"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                      }`}
                  ></div>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedStudent.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {selectedStudent.studentId} • {selectedStudent.program}
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedStudent.company}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        selectedStudent.status
                      )}`}
                    >
                      {selectedStudent.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Attendance Rate
                    </h5>
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {selectedStudent.attendanceRate}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${selectedStudent.attendanceRate >= 90
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : selectedStudent.attendanceRate >= 75
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                          }`}
                        style={{ width: `${selectedStudent.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-green-700 dark:text-green-300">
                      Hours Completed
                    </h5>
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {selectedStudent.hoursCompleted}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        / {selectedStudent.requiredHours}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (selectedStudent.hoursCompleted /
                              selectedStudent.requiredHours) *
                            100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-[#212124] rounded-xl p-6">
                  <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Academic Information
                  </h6>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Student ID:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.studentId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Program:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.program}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Year & Section:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.year} - {selectedStudent.section}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#212124] rounded-xl p-6">
                  <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Internship Details
                  </h6>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Company:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.company}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Supervisor:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.supervisor}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Start Date:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.startDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        End Date:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.endDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gray-50 dark:bg-[#212124] rounded-xl p-6">
                <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Performance Metrics
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {selectedStudent.lastEvaluation}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Last Evaluation Score
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {selectedStudent.attendanceRate}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Attendance Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {selectedStudent.lastActivity}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Last Activity
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setActiveTab("documents");
                    setShowStudentModal(false);
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Documents</span>
                </button>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================
// MAIN INSTRUCTOR PORTAL
// =============================================
const InstructorPortal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Open by default on desktop (lg breakpoint is 1024px)
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    // Expanded by default on desktop
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
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
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    initials: string;
  } | null>(null);

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

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = sessionStorage.getItem("isAuthenticated");
      if (!isLoggedIn) {
        setIsAuthenticated(false);
      }
    };
    sessionStorage.setItem("isAuthenticated", "true");
    checkAuth();
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint

      // On desktop, keep sidebar open and expanded by default
      if (!mobile) {
        setSidebarOpen(true);
        setSidebarExpanded(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Check on mount
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Load current user data and profile photo
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user data from localStorage
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
            : "IN";

          setCurrentUser({
            name: user.name || "Instructor",
            email: user.email || "instructor@university.edu",
            initials: initials,
          });
        }

        // Load profile photo
        const photoUrl = await settingsService.getProfilePhoto();
        if (photoUrl) {
          setProfilePhoto(photoUrl);
        }
      } catch (error) {
        console.log("No profile photo found");
        // Set default user data if localStorage fails
        setCurrentUser({
          name: "Instructor",
          email: "instructor@university.edu",
          initials: "IN",
        });
      }
    };

    if (isAuthenticated) {
      loadUserData();
    }

    // Listen for profile photo updates from settings
    const handleProfilePhotoUpdate = (event: CustomEvent) => {
      setProfilePhoto(event.detail.photoUrl);
    };

    window.addEventListener(
      "profilePhotoUpdated",
      handleProfilePhotoUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "profilePhotoUpdated",
        handleProfilePhotoUpdate as EventListener
      );
    };
  }, [isAuthenticated]);

  // React to profile/name/email updates broadcasted from Settings without reload
  useEffect(() => {
    const handleUserUpdated = (event: any) => {
      try {
        const { name, email } = event.detail || {};
        const initials = (name || currentUser?.name || "IN")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2);
        setCurrentUser((prev) => ({
          name: name ?? prev?.name ?? "Instructor",
          email: email ?? prev?.email ?? "instructor@university.edu",
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

  // Close notifications when clicking outside
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

  useEffect(() => {
    if (notificationsData) {
      setLocalNotifications(notificationsData);
    }
  }, [notificationsData]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("isAuthenticated");
    // Preserve theme preference across logout
    const preservedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    localStorage.clear();
    if (preservedTheme) {
      localStorage.setItem("theme", preservedTheme);
      // Apply theme immediately
      const root = document.documentElement;
      if (preservedTheme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", preservedTheme === "dark");
      }
    }
    setShowLogoutModal(false);
    window.location.replace("/login");
  };

  // Check auth before rendering
  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  const unreadNotificationCount = localNotifications.filter((n) => !n.read).length;

  const navItems = [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      description: "Overview of your assigned students"
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      description: "View all notifications"
    },
    {
      id: "documents",
      icon: FileCheck,
      label: "Document Review"
    },
    {
      id: "applications",
      icon: Building2,
      label: "Company Applications",
      description: "Approve student company requests"
    },
    {
      id: "templates",
      icon: Upload,
      label: "Document Templates",
      description: "Manage document templates"
    },
    {
      id: "checklist",
      icon: ClipboardList,
      label: "Document Checklist",
      description: "Track document completion status"
    },
    {
      id: "monitoring",
      icon: TrendingUp,
      label: "Student Monitoring",
      description: "Monitor student progress"
    },
    {
      id: "students",
      icon: Users,
      label: "Student Management",
      description: "Manage assigned students"
    },
    {
      id: "reports",
      icon: BarChart3,
      label: "Reports",
      description: "View and export attendance reports"
    },
  ];

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        setLocalNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item
          )
        );
        refreshNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read', error);
      }
    }

    // Handle message notifications - navigate to student messages
    if (notification.title === "New Message from Student" && notification.link) {
      const urlParams = new URLSearchParams(notification.link.split('?')[1] || '');
      const studentId = urlParams.get('studentId');
      if (studentId) {
        sessionStorage.setItem('openStudentId', studentId);
        setActiveTab('students');
        return;
      }
    }

    if (notification.link) {
      if (/^https?:\/\//i.test(notification.link)) {
        window.open(notification.link, '_blank');
      } else {
        const link = notification.link;
        if (link.includes('/instructor/students')) {
          const urlParams = new URLSearchParams(link.split('?')[1] || '');
          const studentId = urlParams.get('studentId');
          if (studentId) {
            sessionStorage.setItem('openStudentId', studentId);
            setActiveTab('students');
            return;
          }
        }
      }
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
      console.error('Failed to mark notifications as read', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the notification click
    try {
      await notificationService.deleteNotification(notificationId);
      setLocalNotifications((prev) =>
        prev.filter((item) => item.id !== notificationId)
      );
      refreshNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification', error);
      toast.error('Failed to delete notification');
    }
  };

  const formatDropdownTimestamp = (dateString: string) => {
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

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <InstructorDashboard
            setActiveTab={setActiveTab}
            notifications={localNotifications}
            notificationsLoading={notificationsLoading}
          />
        );
      case "notifications":
        return (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white dark:bg-[#212124] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Notifications
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                    View and manage all your notifications
                  </p>
                </div>
                {unreadNotificationCount > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                    {unreadNotificationCount} unread
                  </span>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#212124] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              {notificationsLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    Loading notifications...
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
                        <div
                          key={notification.id}
                          className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read
                              ? "bg-blue-50/50 dark:bg-blue-900/10"
                              : ""
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <button
                              onClick={() => handleNotificationClick(notification)}
                              className="flex-1 min-w-0 text-left"
                            >
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
                                  {formatDropdownTimestamp(notification.createdAt)}
                                </span>
                                {notification.type && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-[#212124] dark:text-gray-300">
                                    {notification.type.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                            </button>
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-300">
                    No notifications
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case "applications":
        return <InstructorApplications />;
      case "documents":
        return <InstructorDocumentsTab />;
      case "templates":
        return <InstructorTemplateManagement />;
      case "checklist":
        return <DocumentChecklistTab />;
      case "monitoring":
        return <InstructorMonitoringTab />;
      case "students":
        return <InstructorStudentManagement />;
      case "reports":
        return <InstructorReportsTab />;
      case "settings":
        return <InstructorSettings />;
      default:
        return (
          <InstructorDashboard
            setActiveTab={setActiveTab}
            notifications={localNotifications}
            notificationsLoading={notificationsLoading}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#19191c] font-outfit text-sm md:text-base">
      {/* Floating Top Bar - Mobile Only */}
      <header className={`fixed top-4 left-4 right-4 lg:hidden bg-white dark:bg-[#212124] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${sidebarOpen ? "z-30" : "z-50"}`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center space-x-3">
            <button
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
                        Notifications
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                        View all notifications
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
                          <div
                            key={notification.id}
                            className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 transition-colors ${notification.read
                              ? "bg-white dark:bg-[#212124] hover:bg-gray-50 dark:hover:bg-gray-700"
                              : "bg-blue-50/70 dark:bg-blue-900/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                              <button
                                onClick={() => {
                                  handleNotificationClick(notification);
                                  setShowNotifications(false);
                                }}
                                className="flex-1 min-w-0 text-left"
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
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id, e);
                                  setShowNotifications(false);
                                }}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                title="Delete notification"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="px-4 sm:px-5 py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                        No notifications
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
                      Mark all as read
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("notifications");
                        setShowNotifications(false);
                      }}
                      className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-colors"
                    >
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <button
              onClick={() => {
                setActiveTab("settings");
                setSidebarOpen(false);
              }}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {currentUser?.initials || "IN"}
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
                    // On desktop, toggle expanded/collapsed
                    setSidebarExpanded(!sidebarExpanded);
                  } else {
                    // On mobile, toggle open/closed
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
                <p className="text-xs text-gray-500">Instructor Portal</p>
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
                  onClick={() => {
                    setActiveTab(item.id);
                    // Close sidebar on mobile only
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`relative w-full flex items-center transition-all duration-200 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} ${activeTab === item.id
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
                        <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      {!sidebarExpanded && (
                        <span className="absolute top-1 right-1 lg:block hidden w-2 h-2 bg-blue-500 rounded-full"></span>
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
              onClick={() => {
                setActiveTab("settings");
                // Close sidebar on mobile only
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} ${activeTab === "settings"
                ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/50 dark:to-blue-800/30 dark:text-blue-300 rounded-lg"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                }`}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {currentUser?.initials || "IN"}
                  </span>
                )}
              </div>
              <div className={`flex-1 text-left min-w-0 ${sidebarExpanded ? "" : "lg:hidden"}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {currentUser?.name || "Instructor"}
                </p>
                <p className="text-xs text-gray-500 truncate">Instructor</p>
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
        <div key={activeTab} className="tab-fade-in">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            {renderContent()}
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
    </div>
  );
};

export default InstructorPortal;