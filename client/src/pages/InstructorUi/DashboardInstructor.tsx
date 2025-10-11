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
} from "lucide-react";
import InstructorDocumentsTab from "./InstructorDocuments";
import InstructorMonitoringTab from "./InstructorStudent";
import InstructorEvaluationsTab from "./InstructorEvaluation";
import {
  instructorService,
  type InstructorStats,
  type InstructorStudent,
  type InstructorActivity,
  type InstructorAlert,
} from "../../services/instructorService";
import toast from "react-hot-toast";

// =============================================
// INSTRUCTOR DASHBOARD COMPONENT
// =============================================
interface InstructorDashboardProps {
  setActiveTab: (tab: string) => void;
}

const InstructorDashboard = ({ setActiveTab }: InstructorDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InstructorStats>({
    totalStudents: 0,
    activeStudents: 0,
    atRiskStudents: 0,
    completedStudents: 0,
    avgAttendance: 0,
    avgRating: 0,
    documentsPending: 0,
    evaluationsPending: 0,
  });
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [activities, setActivities] = useState<InstructorActivity[]>([]);
  const [alerts, setAlerts] = useState<InstructorAlert[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [studentsData, statsData, activitiesData, alertsData] =
        await Promise.allSettled([
          instructorService.getAssignedStudents(),
          instructorService.getDashboardStats(),
          instructorService.getRecentActivities(),
          instructorService.getAlerts(),
        ]);

      // Update states with fetched data or defaults
      setStudents(
        studentsData.status === "fulfilled" ? studentsData.value : []
      );
      setStats(statsData.status === "fulfilled" ? statsData.value : stats);
      setActivities(
        activitiesData.status === "fulfilled" ? activitiesData.value : []
      );
      setAlerts(alertsData.status === "fulfilled" ? alertsData.value : []);

      console.log("Instructor dashboard data loaded:", {
        students:
          studentsData.status === "fulfilled" ? studentsData.value.length : 0,
        activities:
          activitiesData.status === "fulfilled"
            ? activitiesData.value.length
            : 0,
        alerts: alertsData.status === "fulfilled" ? alertsData.value.length : 0,
      });
    } catch (error) {
      console.error("Error loading instructor dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredStudents = students.filter((student) => {
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-purple-100 text-lg">
              Monitor and evaluate BS Computer Engineering students
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-purple-100 text-sm">Total Assigned</p>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Students
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.activeStudents}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Currently Active
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Attendance
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.avgAttendance}%
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.avgAttendance}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Rating
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.avgRating.toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Award
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.avgRating)
                    ? "text-yellow-500"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-2">Out of 5.0</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                At Risk
              </p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.atRiskStudents}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              Needs Attention
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Student Management
                </h2>
              </div>
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="at_risk">At Risk</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {student.avatar}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${
                            student.status === "completed"
                              ? "bg-green-500"
                              : student.status === "at_risk"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        ></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {student.studentId} • {student.program}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {student.company}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-sm px-4 py-2 rounded-xl font-semibold shadow-sm ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          Attendance
                        </p>
                        <Clock className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {student.attendanceRate}%
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              student.attendanceRate >= 90
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : student.attendanceRate >= 75
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                : "bg-gradient-to-r from-red-500 to-red-600"
                            }`}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                          Hours Progress
                        </p>
                        <Calendar className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">
                          {student.hoursCompleted}/{student.requiredHours}
                        </p>
                        <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
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

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                          Performance
                        </p>
                        <Award className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                          {student.lastEvaluation
                            ? student.lastEvaluation.toFixed(1)
                            : "N/A"}
                        </p>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Award
                              key={star}
                              className={`w-3 h-3 ${
                                student.lastEvaluation &&
                                star <= Math.round(student.lastEvaluation)
                                  ? "text-yellow-500"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Last activity: {student.lastActivity}
                      </span>
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-600">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mr-3">
                <Activity className="w-5 h-5 text-white" />
              </div>
              Recent Activities
            </h3>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                  >
                    <div
                      className={`p-3 rounded-xl shadow-sm ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {activity.studentName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full inline-block">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No recent activities</p>
                  <p className="text-xs mt-1">
                    Student activities will appear here
                  </p>
                </div>
              )}
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
                onClick={() => {
                  // Generate report functionality
                  const reportData = {
                    students: students.length,
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
    { id: "monitoring", label: "Student Monitoring", icon: TrendingUp },
    { id: "evaluations", label: "Evaluations", icon: Award },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <InstructorDashboard setActiveTab={setActiveTab} />;
      case "documents":
        return <InstructorDocumentsTab />;
      case "monitoring":
        return <InstructorMonitoringTab />;
      case "evaluations":
        return <InstructorEvaluationsTab />;
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
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  PG
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Prof. Garcia
                  </p>
                  <p className="text-xs text-gray-500">Instructor</p>
                </div>
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
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
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                PG
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Prof. Garcia
                </p>
                <p className="text-xs text-gray-500">Instructor</p>
              </div>
            </div>
            <button className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
            <button
              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main
        className={`p-6 transition-all duration-300 ${
          sidebarOpen && !isMobile ? "ml-64" : "ml-0"
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
