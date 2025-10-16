import { useState, useEffect } from "react";
import {
  Users,
  Clock,
  Award,
  FileText,
  TrendingUp,
  AlertCircle,
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
  Settings,
  Home,
  FileCheck,
  Loader2,
  Calendar,
  Upload,
  ClipboardList,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import InstructorDocumentsTab from "./InstructorDocuments";
import InstructorMonitoringTab from "./InstructorStudent";
import InstructorEvaluationsTab from "./InstructorEvaluation";
import DocumentChecklistTab from "./InstructorDocumentChecklist";
import InstructorAttendanceVerification from "./InstructorAttendanceVerification";
import InstructorStudentManagement from "./InstructorStudentManagement";
import InstructorTemplateManagement from "./InstructorTemplateManagement";
import InstructorSettings from "./InstructorSettings";
import {
  instructorService,
  type InstructorStudent,
} from "../../services/instructorService";
import { type Announcement } from "../../services/announcementService";
import { settingsService } from "../../services/settingsService";

// =============================================
// INSTRUCTOR DASHBOARD COMPONENT
// =============================================
interface InstructorDashboardProps {
  setActiveTab: (tab: string) => void;
  announcements?: Announcement[];
  onTrackAnnouncementView?: (id: string) => void;
}

const InstructorDashboard = ({
  setActiveTab,
  announcements = [],
  onTrackAnnouncementView,
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
    { ttl: 3 * 60 * 1000 } // 3 minutes cache
  );

  const { data: statsData, loading: statsLoading } = useOptimizedData(
    () => instructorService.getDashboardStats(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const { data: activitiesData, loading: activitiesLoading } = useOptimizedData(
    () => instructorService.getRecentActivities(),
    [],
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const { data: alertsData, loading: alertsLoading } = useOptimizedData(
    () => instructorService.getAlerts(),
    [],
    { ttl: 1 * 60 * 1000 } // 1 minute cache
  );

  // Provide safe defaults
  const students = studentsData || [];
  const stats = statsData || {
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
  const alerts = alertsData || [];

  const loading =
    studentsLoading || statsLoading || activitiesLoading || alertsLoading;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
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
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "evaluation":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const filteredStudents = (students || []).filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
            </div>
            <p className="text-purple-100 text-sm font-medium max-w-xl">
              Monitor and evaluate BS Computer Engineering students
            </p>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-purple-100 text-xs font-medium mt-1">
                Total Assigned
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.totalStudents}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Students Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
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
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Average Attendance Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
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

      {/* At Risk Students Alert */}
      {stats.atRiskStudents > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm">
                BSCOE Students Need Attention
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {stats.atRiskStudents} BSCOE student(s) have low attendance or
                performance. Please review and provide guidance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-lg p-4 ${
                alert.type === "error"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                  : alert.type === "warning"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                  : alert.type === "info"
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                  : "bg-green-50 dark:bg-green-900/20 border-green-500"
              }`}
            >
              <div className="flex items-start space-x-3">
                <AlertCircle
                  className={`w-5 h-5 mt-0.5 ${
                    alert.type === "error"
                      ? "text-red-600"
                      : alert.type === "warning"
                      ? "text-yellow-600"
                      : alert.type === "info"
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                />
                <div className="flex-1">
                  <h4
                    className={`font-semibold text-sm ${
                      alert.type === "error"
                        ? "text-red-900 dark:text-red-100"
                        : alert.type === "warning"
                        ? "text-yellow-900 dark:text-yellow-100"
                        : alert.type === "info"
                        ? "text-blue-900 dark:text-blue-100"
                        : "text-green-900 dark:text-green-100"
                    }`}
                  >
                    {alert.title}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      alert.type === "error"
                        ? "text-red-700 dark:text-red-300"
                        : alert.type === "warning"
                        ? "text-yellow-700 dark:text-yellow-300"
                        : alert.type === "info"
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-green-700 dark:text-green-300"
                    }`}
                  >
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {alert.timestamp}
                    {alert.studentId && ` • Student: ${alert.studentId}`}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    alert.priority === "high"
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      : alert.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {alert.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Announcements */}
      {announcements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-orange-600" />
            Recent Announcements
          </h3>
          <div className="space-y-3">
            {announcements.slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                onClick={() => {
                  // Track view when announcement is clicked
                  if (onTrackAnnouncementView) {
                    onTrackAnnouncementView(announcement.id);
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {announcement.title}
                      </p>
                      {announcement.type === "urgent" && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs font-medium rounded-full">
                          URGENT
                        </span>
                      )}
                      {announcement.type === "warning" && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs font-medium rounded-full">
                          WARNING
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {announcement.content}
                    </p>
                    {announcement.createdBy && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        By {announcement.createdBy.name} (
                        {announcement.createdBy.role})
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {announcements.length > 3 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium">
                View All Announcements ({announcements.length})
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Student Management
                </h2>
              </div>
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-w-[120px] text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="at_risk">At Risk</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {student.avatar}
                          </div>
                          <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-yellow-500 rounded-full border border-white dark:border-gray-800"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {student.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {student.studentId} • {student.program}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {student.company}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                          student.status
                        )}`}
                      >
                        {student.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white text-sm font-medium">
                            Attendance
                          </p>
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-white text-lg font-bold">
                            {student.attendanceRate}%
                          </p>
                          <div className="w-full bg-blue-500 rounded-full h-1.5">
                            <div
                              className="bg-white h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${student.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white text-sm font-medium">
                            Hours Progress
                          </p>
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-white text-lg font-bold">
                            {student.hoursCompleted}/{student.requiredHours}
                          </p>
                          <div className="w-full bg-green-500 rounded-full h-1.5">
                            <div
                              className="bg-white h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${
                                  (student.hoursCompleted /
                                    student.requiredHours) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white text-sm font-medium">
                            Performance
                          </p>
                          <Award className="w-4 h-4 text-white" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-white text-lg font-bold">
                            {student.lastEvaluation
                              ? student.lastEvaluation.toFixed(1)
                              : "N/A"}
                          </p>
                          <div className="flex items-center space-x-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Award
                                key={star}
                                className={`w-3 h-3 ${
                                  student.lastEvaluation &&
                                  star <= Math.round(student.lastEvaluation)
                                    ? "text-white"
                                    : "text-white/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Last activity: {student.lastActivity}
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewStudentDetails(student)}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    No Students Assigned
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    You don't have any students assigned to you yet. Students
                    will appear here once they are added to the system and
                    assigned to your supervision.
                  </p>
                  <button
                    onClick={() => setActiveTab("students")}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Manage Students
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mr-3 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  Recent Activities
                </h3>
              </div>

              <div className="space-y-3">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Left accent line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-500 rounded-l-lg"></div>

                      <div className="flex items-start space-x-3 ml-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(
                            activity.type
                          )}`}
                        >
                          {getActivityIcon(activity.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {activity.studentName}
                            </p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {new Date(activity.timestamp).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {activity.action}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              {new Date(
                                activity.timestamp
                              ).toLocaleDateString()}
                            </span>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      No Recent Activities
                    </h4>
                    <p className="text-sm max-w-xs mx-auto">
                      Student activities and system events will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-300" />
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
                onClick={() => setActiveTab("templates")}
                className="w-full flex items-center space-x-4 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200 border border-purple-200 dark:border-purple-700 group"
              >
                <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block text-purple-900 dark:text-purple-100">
                    Document Templates
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-300">
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
                onClick={() => setActiveTab("evaluations")}
                className="w-full flex items-center space-x-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 border border-blue-200 dark:border-blue-700 group"
              >
                <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block text-blue-900 dark:text-blue-100">
                    Submit Evaluation
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-300">
                    Rate student performance
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  // Generate report functionality
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
                  link.download = `instructor-report-${
                    new Date().toISOString().split("T")[0]
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
        </div>
      </div>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div
          className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowStudentModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 relative z-[100000] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Student Details
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Header */}
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {selectedStudent.avatar}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 ${
                      selectedStudent.status === "completed"
                        ? "bg-green-500"
                        : selectedStudent.status === "at_risk"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  ></div>
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedStudent.name}
                  </h4>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      Attendance Rate
                    </h5>
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {selectedStudent.attendanceRate}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          selectedStudent.attendanceRate >= 90
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

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold text-green-700 dark:text-green-300">
                      Hours Completed
                    </h5>
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {selectedStudent.hoursCompleted}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        / {selectedStudent.requiredHours}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
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

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                      Tasks Completed
                    </h5>
                    <Award className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                        {selectedStudent.tasksCompleted}
                      </span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        / {selectedStudent.totalTasks}
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (selectedStudent.tasksCompleted /
                              selectedStudent.totalTasks) *
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
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
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

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
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
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
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
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
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
                  onClick={() => {
                    setActiveTab("evaluations");
                    setShowStudentModal(false);
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
                >
                  <Award className="w-4 h-4" />
                  <span>Evaluate Student</span>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    initials: string;
  } | null>(null);

  // Fetch announcements for the entire portal
  const { data: announcements } = useOptimizedData(
    () => instructorService.getAnnouncements(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  // Ensure announcements is always an array
  const safeAnnouncements = announcements || [];

  // Handle announcement view tracking
  const handleTrackAnnouncementView = async (announcementId: string) => {
    try {
      await instructorService.trackAnnouncementView(announcementId);
    } catch (error) {
      console.warn("Failed to track announcement view:", error);
    }
  };

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
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);

      // On desktop, keep sidebar open by default
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
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

  // Close user menu and notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (showUserMenu && !target.closest(".user-menu-dropdown")) {
        setShowUserMenu(false);
      }

      if (showNotifications && !target.closest(".notifications-dropdown")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("isAuthenticated");
    localStorage.clear();
    setShowLogoutModal(false);
    window.location.replace("/login");
  };

  // Check auth before rendering
  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "documents", label: "Document Review", icon: FileCheck },
    { id: "templates", label: "Document Templates", icon: Upload },
    { id: "checklist", label: "Document Checklist", icon: ClipboardList },
    { id: "monitoring", label: "Student Monitoring", icon: TrendingUp },
    { id: "attendance", label: "Attendance Verification", icon: Clock },
    { id: "students", label: "Student Management", icon: Users },
    { id: "evaluations", label: "Evaluations", icon: Award },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <InstructorDashboard
            setActiveTab={setActiveTab}
            announcements={safeAnnouncements}
            onTrackAnnouncementView={handleTrackAnnouncementView}
          />
        );
      case "documents":
        return <InstructorDocumentsTab />;
      case "templates":
        return <InstructorTemplateManagement />;
      case "checklist":
        return <DocumentChecklistTab />;
      case "monitoring":
        return <InstructorMonitoringTab />;
      case "attendance":
        return <InstructorAttendanceVerification />;
      case "students":
        return <InstructorStudentManagement />;
      case "evaluations":
        return <InstructorEvaluationsTab />;
      case "settings":
        return <InstructorSettings onBack={() => setActiveTab("dashboard")} />;
      default:
        return <InstructorDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    OJT Portal
                  </h2>
                  <p className="text-xs text-gray-500">Instructor</p>
                </div>
              </div>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center space-x-4">
              <div className="relative notifications-dropdown">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {safeAnnouncements.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {safeAnnouncements.length} new announcements
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {safeAnnouncements.length > 0 ? (
                        safeAnnouncements.slice(0, 5).map((announcement) => (
                          <div
                            key={announcement.id}
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            onClick={() => {
                              handleTrackAnnouncementView(announcement.id);
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 ${
                                    announcement.type === "urgent"
                                      ? "bg-red-500"
                                      : announcement.type === "warning"
                                      ? "bg-yellow-500"
                                      : "bg-blue-500"
                                  }`}
                                ></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {announcement.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {announcement.content}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {new Date(
                                    announcement.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No notifications
                          </p>
                        </div>
                      )}
                    </div>
                    {safeAnnouncements.length > 5 && (
                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium w-full text-left">
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar Dropdown */}
              <div className="relative user-menu-dropdown">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
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
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentUser?.name || "Instructor"}
                    </p>
                    <p className="text-xs text-gray-500">Instructor</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
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
                              {currentUser?.initials || "IN"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {currentUser?.name || "Instructor"}
                          </p>
                          <p className="text-sm text-gray-500">Instructor</p>
                          <p className="text-xs text-gray-400">
                            {currentUser?.email || "instructor@university.edu"}
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
                        onClick={() => setShowLogoutModal(true)}
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
        </div>
      </header>

      {/* Sidebar Overlay - Only show on mobile */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : isMobile
            ? "-translate-x-full"
            : "translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  OJT Portal
                </h2>
                <p className="text-xs text-gray-500">Instructor Dashboard</p>
              </div>
            </div>
            {/* Only show close button on mobile */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            )}
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
                    // Only close sidebar on mobile
                    if (isMobile) {
                      setSidebarOpen(false);
                    }
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

      {/* Content Area */}
      <main
        className={`p-6 transition-all duration-300 ${
          sidebarOpen && !isMobile ? "ml-72" : "ml-0"
        }`}
      >
        {renderContent()}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
    </div>
  );
};

export default InstructorPortal;
