import { useState, useEffect } from "react";
import {
  Users,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  Search,
  Eye,
  Bell,
  Menu,
  X,
  LogOut,
  Home,
  Mail,
  Calendar,
  GraduationCap,
  FileText,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { supervisorService } from "../../services/supervisorService";
import type { SupervisorStudent } from "../../services/supervisorService";
import IndustryPartnerAttendance from "./SupervisorAttendance";
import IndustryPartnerEvaluation from "./SupervisorEvaluation";
import SupervisorSettings from "./SupervisorSettings";
import { settingsService } from "../../services/settingsService";
import {
  notificationService,
  type NotificationItem,
} from "../../services/notificationService";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import api from "../../services/api";

// =============================================
// SUPERVISOR DASHBOARD OVERVIEW
// =============================================
const SupervisorOverview = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<SupervisorStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntern, setSelectedIntern] = useState<SupervisorStudent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const students = await supervisorService.getMyStudents();
      setInterns(students);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError(err.response?.data?.message || "Failed to load students");
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalInterns: interns.length,
    activeInterns: interns.filter((i) => i.status === "active").length,
    pendingApprovals: interns.reduce(
      (sum, i) => sum + (i.pendingApprovals || 0),
      0
    ),
    avgAttendance:
      interns.length > 0
        ? (
          interns.reduce((sum, i) => sum + i.attendanceRate, 0) /
          interns.length
        ).toFixed(1)
        : "0.0",
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      },
      needs_attention: {
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      },
      completed: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      },
    };
    const badge = badges[status as keyof typeof badges] || badges.active;
    return (
      <span
        className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${badge.className}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || intern.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Banner Skeleton */}
        <div className="h-48 bg-gray-200 dark:bg-[#212124] rounded-2xl w-full"></div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-gray-200 dark:bg-[#212124] rounded-xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-[#212124] rounded-xl"></div>
        </div>

        {/* List Item Skeleton (Circle + Lines) */}
        <div className="bg-white dark:bg-[#212124] p-6 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-[#212124] rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-[#212124] rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-5/6"></div>
          </div>
        </div>

        {/* List Item Skeleton (Rectangle + Lines) */}
        <div className="bg-white dark:bg-[#212124] p-6 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 h-32 bg-gray-200 dark:bg-[#212124] rounded-lg"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-[#212124] rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const supervisorName = user?.name || "Supervisor";
  const companyName =
    user?.companyName ||
    user?.company ||
    user?.company?.name ||
    "Company";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gradient Header - Responsive Dynamic Design */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white shadow-2xl">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 md:w-96 h-64 md:h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-float"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-float animation-delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-white rounded-full opacity-50 animate-float animation-delay-2000"></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full opacity-70 animate-float animation-delay-3000"></div>
        </div>

        {/* Content - Desktop Layout */}
        <div className="hidden md:block relative z-10 p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2 animate-fade-in">
                Welcome back, {supervisorName}!
              </h1>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 w-fit">
                  <Users className="w-4 h-4 opacity-90" />
                  <p className="text-sm font-medium opacity-90">Company: {companyName}</p>
                </div>
              </div>
              <p className="mt-3 text-sm opacity-80 max-w-md">
                Supervisor Dashboard - Monitor and manage your interns
              </p>
            </div>

            {/* Decorative Icon */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <Activity className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Mobile Layout */}
        <div className="md:hidden relative z-10 p-4">
          {/* Mobile Header with Icon */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-1 leading-tight animate-fade-in">
                Welcome back!
              </h1>
              <p className="text-lg font-semibold opacity-95">
                {supervisorName.split(' ')[0]}
              </p>
            </div>

            {/* Mobile Icon */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg"></div>
                <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <Activity className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Info Cards - Stacked */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <Users className="w-4 h-4 opacity-90 flex-shrink-0" />
              <p className="text-xs font-medium opacity-90 truncate">{companyName}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-xs opacity-75">Monitor and manage your interns</p>
            </div>
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Interns */}
        <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
              Total Interns
            </p>
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            {stats.totalInterns}
          </p>
          <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
            {stats.activeInterns} active
          </span>
        </div>

        {/* Active Interns */}
        <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
              Active Interns
            </p>
            <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            {stats.activeInterns}
          </p>
          <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
            Active interns
          </span>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
              Pending Approvals
            </p>
            <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            {stats.pendingApprovals}
          </p>
          <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            {stats.pendingApprovals} pending
          </span>
        </div>

        {/* Avg Attendance */}
        <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
              Avg Attendance
            </p>
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            {stats.avgAttendance}%
          </p>
          <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
            Average rate
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#19191c] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search interns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="needs_attention">Needs Attention</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-200 rounded-lg px-4 py-3">
          <p>{error}</p>
        </div>
      )}

      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredInterns.length} of {interns.length} interns
      </p>

      {/* Interns Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {filteredInterns.map((intern) => (
          <div
            key={intern.id}
            className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-2.5 sm:mb-3 lg:mb-4">
              <div className="flex items-start space-x-2.5 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm lg:text-base flex-shrink-0">
                  {intern.name
                    .split(" ")
                    .map((namePart: string) => namePart[0] ?? "")
                    .join("")
                    .substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate mb-0.5">
                    {intern.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {intern.studentNumber} • {intern.program}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-1.5 sm:ml-2">
                {getStatusBadge(intern.status)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:gap-4 mt-2.5 sm:mt-3 lg:mt-4">
              <div className="bg-gray-50 dark:bg-[#212124] rounded-md sm:rounded-lg p-2 sm:p-2.5 lg:p-3">
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Attendance
                </p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                  {intern.attendanceRate}%
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-[#212124] rounded-md sm:rounded-lg p-2 sm:p-2.5 lg:p-3">
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Hours
                </p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                  {intern.completedHours}/{intern.totalHours}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-[#212124] rounded-md sm:rounded-lg p-2 sm:p-2.5 lg:p-3">
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Rating
                </p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                  {intern.lastEvaluation
                    ? intern.lastEvaluation.overallRating.toFixed(1)
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2.5 sm:mt-3 lg:mt-4 pt-2.5 sm:pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700 gap-2">
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-gray-500 dark:text-gray-400">
                Last activity: {intern.lastActivity || "Recently"}
              </span>
              <button
                onClick={() => {
                  setSelectedIntern(intern);
                  setShowDetailsModal(true);
                }}
                className="flex items-center justify-center sm:justify-start space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-1.5 text-[10px] sm:text-xs lg:text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md sm:rounded-lg transition-colors w-full sm:w-auto"
              >
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredInterns.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-white dark:bg-[#19191c] rounded-lg sm:rounded-xl">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No interns found</p>
        </div>
      )}

      {/* Intern Details Modal */}
      {showDetailsModal && selectedIntern && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white dark:bg-[#19191c] rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                  {selectedIntern.name
                    .split(" ")
                    .map((namePart: string) => namePart[0] ?? "")
                    .join("")
                    .substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {selectedIntern.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {selectedIntern.studentNumber} • {selectedIntern.program}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {/* Status Badge */}
              <div className="mb-4 sm:mb-6">
                {getStatusBadge(selectedIntern.status)}
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      Attendance
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedIntern.attendanceRate}%
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      Hours
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedIntern.completedHours}/{selectedIntern.totalHours}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedIntern.totalHours > 0
                      ? `${Math.round((selectedIntern.completedHours / selectedIntern.totalHours) * 100)}% completed`
                      : "0% completed"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      Rating
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedIntern.lastEvaluation
                      ? selectedIntern.lastEvaluation.overallRating.toFixed(1)
                      : "N/A"}
                  </p>
                  {selectedIntern.lastEvaluation && (
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last: {new Date(selectedIntern.lastEvaluation.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Academic Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Program</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {selectedIntern.program}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Year & Section</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        Year {selectedIntern.year} • {selectedIntern.section}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {selectedIntern.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internship Details */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Internship Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {selectedIntern.startDate
                          ? new Date(selectedIntern.startDate).toLocaleDateString()
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">End Date</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {selectedIntern.endDate
                          ? new Date(selectedIntern.endDate).toLocaleDateString()
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                  {selectedIntern.tasksCompleted !== undefined && selectedIntern.totalTasks !== undefined && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Tasks</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {selectedIntern.tasksCompleted}/{selectedIntern.totalTasks} completed
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Last Activity</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {selectedIntern.lastActivity || "Recently"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================
// MAIN SUPERVISOR DASHBOARD
// =============================================
const SupervisorDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  useEffect(() => {
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
        console.log("No profile photo found");
        setCurrentUser({
          name: "Supervisor",
          email: "supervisor@company.com",
          initials: "SU",
        });
      }
    };
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
      } catch {}
    };
    window.addEventListener("userUpdated", handleUserUpdated as EventListener);
    window.addEventListener("profileUpdated", handleUserUpdated as EventListener);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated as EventListener);
      window.removeEventListener("profileUpdated", handleUserUpdated as EventListener);
    };
  }, [currentUser]);

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
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setShowLogoutModal(false);
      toast.success("Logged out successfully");
      window.location.replace("/login");
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification.id);
        setLocalNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      }
      setActiveTab("overview");
      setShowNotifications(false);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
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

  const unreadNotificationCount = localNotifications.filter((n) => !n.read).length;

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "evaluations", label: "Evaluations", icon: Award },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <SupervisorOverview />;
      case "attendance":
        return <IndustryPartnerAttendance />;
      case "evaluations":
        return <IndustryPartnerEvaluation />;
      case "settings":
        return <SupervisorSettings />;
      case "notifications":
  return (
          <div className="p-6">
            <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      Notifications
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      View all your notifications
                    </p>
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      disabled={unreadNotificationCount === 0}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notificationsLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-4">Loading notifications...</p>
                  </div>
                ) : localNotifications.length > 0 ? (
                  localNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
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
                              {formatDropdownTimestamp(notification.createdAt)}
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
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-300">No notifications</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return <SupervisorOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#19191c] font-outfit">
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
                        {unreadNotificationCount > 0 ? `${unreadNotificationCount} new` : "No new notifications"}
                      </p>
                    </div>
                    {unreadNotificationCount > 0 && (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 ml-2 flex-shrink-0">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 min-h-0">
                    {notificationsLoading ? (
                      <div className="px-4 sm:px-5 py-8 flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                        Loading...
                      </div>
                    ) : localNotifications.length > 0 ? (
                      localNotifications.slice(0, 5).map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            handleNotificationClick(notification);
                            setShowNotifications(false);
                          }}
                          className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 transition-colors ${
                            notification.read
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
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3">
                            {notification.message}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 sm:px-5 py-8 text-center">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                          No notifications
                        </p>
                      </div>
                    )}
                  </div>

                  {localNotifications.length > 5 && (
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                      <button
                        onClick={() => {
                          setActiveTab("notifications");
                          setShowNotifications(false);
                          if (window.innerWidth < 1024) {
                            setSidebarOpen(false);
                          }
                        }}
                        className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-colors"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <button
              onClick={() => {
                setActiveTab("settings");
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
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
                <p className="text-xs text-gray-500">Supervisor Portal</p>
              </div>
            </div>
            {/* Collapsed view - only on desktop when collapsed */}
            {!sidebarExpanded && (
              <div className="hidden lg:flex flex-col items-center space-y-2">
            <button
                  onClick={() => setSidebarExpanded(!sidebarExpanded)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Toggle menu"
            >
                  <Menu className="w-5 h-5" />
            </button>
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
                        <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                          {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                        </span>
                      )}
                      {!sidebarExpanded && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Profile Section */}
          <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${sidebarExpanded ? "" : "lg:px-2"}`}>
            <button
              onClick={() => {
                setActiveTab("settings");
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors`}
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
                    {currentUser?.initials || "SU"}
                            </span>
                          )}
                        </div>
              {sidebarExpanded && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentUser?.name || "Supervisor"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser?.email || "supervisor@company.com"}
                          </p>
                        </div>
              )}
            </button>
                    </div>

          {/* Logout Button */}
          <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${sidebarExpanded ? "" : "lg:px-2"}`}>
                      <button
              onClick={() => setShowLogoutModal(true)}
              className={`w-full flex items-center ${sidebarExpanded ? "space-x-3 px-3 py-2.5" : "lg:justify-center lg:px-2 lg:py-3 space-x-3 px-3 py-2.5"} text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarExpanded && (
                <span className="font-medium text-sm text-left">Logout</span>
              )}
                      </button>
                    </div>
                  </div>
      </aside>

      {/* Main Content */}
      <main className={`p-6 pt-24 lg:pt-6 transition-all duration-300 relative ${sidebarOpen ? "z-10 lg:z-auto" : "z-auto"} ${sidebarOpen ? (sidebarExpanded ? "lg:ml-80" : "lg:ml-28") : "lg:ml-4"}`}>
          <div key={activeTab} className="tab-fade-in">
            {renderContent()}
          </div>
        </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ marginTop: 0 }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default SupervisorDashboard;
