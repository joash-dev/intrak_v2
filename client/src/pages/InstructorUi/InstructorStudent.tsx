import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Eye,
  TrendingUp,
  TrendingDown,
  //Clock,
  Award,
  CheckCircle,
  XCircle,
  Building2,
  Calendar,
  AlertCircle,
  BarChart3,
  Activity,
  ArrowRight,
} from "lucide-react";
import { instructorService } from "../../services/instructorService";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { calculateAttendanceTrend } from "../../utils/attendanceCalculations";
import { devLog } from "../../utils/devLog";

interface Student {
  id: string;
  studentId: string;
  name: string;
  avatar: string;
  program: string;
  company: string;
  supervisor: string;
  startDate: string;
  attendanceRate: number;
  attendanceTrend: "up" | "down" | "stable";
  hoursCompleted: number;
  requiredHours: number;
  lastEvaluation: number | null;
  recentActivities: number;
  status: "active" | "warning" | "at_risk" | "completed";
  lastActive: string;
}

interface StudentDetail {
  weeklyAttendance: { week: string; rate: number }[];
  monthlyProgress: { month: string; hours: number }[];
  evaluationHistory: { date: string; rating: number; evaluator: string }[];
}

const InstructorMonitoringTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [evaluationHistory, setEvaluationHistory] = useState<{ date: string; rating: number; evaluator: string }[]>([]);
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState<{ week: string; rate: number }[]>([]);
  const [weeklyHoursData, setWeeklyHoursData] = useState<{ label: string; hours: number }[]>([]);
  // Optimized data fetching with caching
  const { data: studentsData, loading: studentsLoading } = useOptimizedData(
    async () => {
      devLog.log("Loading students for monitoring...");

      // Fetch students from API
      const studentsData = await instructorService.getAssignedStudents();

      // Fetch attendance data for all students
      const attendanceResponse = await instructorService.getStudentAttendance();

      // Transform API data to match Student interface using consistent calculation logic
      const transformedStudents = await Promise.all(
        studentsData.map(async (student: any) => {
          // Get detailed attendance stats for this student using the same logic as attendance service
          const attendanceStats =
            await instructorService.getStudentAttendanceStats(student.id);

          // Use the calculated attendance rate from the stats
          const attendanceRate = attendanceStats.attendanceRate;
          const completedHours = attendanceStats.completedHours;

          // Use status that already follows startDate + gap rules
          const status = student.status as Student["status"];

          // Determine attendance trend using shared utility function
          const studentAttendance = attendanceResponse.filter(
            (att: any) => att.studentId === student.id && att.verified
          );
          const attendanceTrend = calculateAttendanceTrend(studentAttendance);

          return {
            id: student.id,
            studentId: student.studentId,
            name: student.name,
            avatar: student.avatar,
            program: student.program,
            company: student.company,
            supervisor: student.supervisor,
            startDate: student.startDate || '',
            attendanceRate,
            attendanceTrend,
            hoursCompleted: completedHours,
            requiredHours: student.requiredHours,
            lastEvaluation: student.lastEvaluation,
            recentActivities: attendanceStats.verifiedDays,
            status,
            lastActive: student.lastActivity,
          };
        })
      );

      devLog.log("Students loaded:", transformedStudents.length);
      return transformedStudents;
    },
    [],
    { ttl: 3 * 60 * 1000 } // 3 minutes cache
  );

  const students = studentsData || [];
  const loading = studentsLoading;

  // Weekly charts populated from logs
  const studentDetails: StudentDetail = {
    weeklyAttendance: weeklyAttendanceData,
    monthlyProgress: weeklyHoursData.map((w) => ({ month: w.label, hours: w.hours })),
    evaluationHistory,
  };

  // Load real details when opening modal
  useEffect(() => {
    const loadDetails = async () => {
      if (!showDetailModal || !selectedStudent) return;
      try {
        setDetailLoading(true);
        // Compute weekly attendance and hours from logs (last 4 weeks)
        const logs: any[] = await instructorService.getStudentAttendance(selectedStudent.id);
        const verified = (logs || []).filter((l) => l && l.verified);

        const startOfWeek = (d: Date) => {
          const date = new Date(d);
          const day = date.getDay();
          const diff = (day === 0 ? -6 : 1) - day;
          date.setDate(date.getDate() + diff);
          date.setHours(0, 0, 0, 0);
          return date;
        };

        const ranges: { start: Date; end: Date; label: string }[] = [];
        const now = new Date();
        const thisMon = startOfWeek(now);
        for (let i = 3; i >= 0; i--) {
          const start = new Date(thisMon);
          start.setDate(start.getDate() - i * 7);
          const end = new Date(start);
          end.setDate(end.getDate() + 7);
          const monthShort = start.toLocaleString(undefined, { month: "short" });
          const weekInMonth = Math.ceil(start.getDate() / 7);
          ranges.push({ start, end, label: `${monthShort} W${weekInMonth}` });
        }

        const rates: { week: string; rate: number }[] = [];
        const hours: { label: string; hours: number }[] = [];
        for (const r of ranges) {
          const daySet = new Set<string>();
          let minutes = 0;
          verified.forEach((log) => {
            const dt = new Date(log.date || log.timeIn || log.createdAt);
            if (dt >= r.start && dt < r.end) {
              const dow = dt.getDay();
              if (dow >= 1 && dow <= 5) {
                daySet.add(dt.toISOString().split("T")[0]);
              }
              minutes += Number(log.durationMinutes || 0);
            }
          });
          rates.push({ week: r.label, rate: Math.min(100, Math.round((daySet.size / 5) * 100)) });
          hours.push({ label: r.label, hours: Math.round((minutes / 60) * 10) / 10 });
        }
        setWeeklyAttendanceData(rates);
        setWeeklyHoursData(hours);
        // Evaluations
        const evals = await instructorService.getStudentEvaluationHistory(selectedStudent.id);
        const mappedEvals = (evals || []).map((e: any) => ({
          date: new Date(e.createdAt || e.date || Date.now()).toLocaleDateString(),
          rating: e.rating || 0,
          evaluator: e.evaluator?.name || e.evaluatorRole || "Evaluator",
        }));
        let finalEvals = mappedEvals.slice(0, 5);
        // Fallback: if API returns no history but we have a last rating on the card, show that
        if (finalEvals.length === 0 && (selectedStudent.lastEvaluation ?? 0) > 0) {
          finalEvals = [
            {
              date: "—",
              rating: selectedStudent.lastEvaluation as number,
              evaluator: "Last recorded rating",
            },
          ];
        }
        setEvaluationHistory(finalEvals);

      } finally {
        setDetailLoading(false);
      }
    };
    loadDetails();
  }, [showDetailModal, selectedStudent]);

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    warning: students.filter((s) => s.status === "warning").length,
    atRisk: students.filter((s) => s.status === "at_risk").length,
    completed: students.filter((s) => s.status === "completed").length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-500",
      warning:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-500",
      at_risk:
        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-500",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-500",
    };
    return colors[status] || colors.active;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>

        {/* Search/Filter Skeleton */}
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>

        {/* Students Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm md:text-base min-h-screen dark:bg-[#19191c]">
      {/* Header Section */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                Student Monitoring
              </h1>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Track detailed progress and performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#212124] rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Students
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </p>
        </div>

        <div className="bg-white dark:bg-[#212124] rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Active
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.active}
          </p>
        </div>

        <div className="bg-white dark:bg-[#212124] rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Warning
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.warning}
          </p>
        </div>

        <div className="bg-white dark:bg-[#212124] rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            At Risk
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.atRisk}
          </p>
        </div>

        <div className="bg-white dark:bg-[#212124] rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Completed
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.completed}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[140px] text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="bg-white dark:bg-[#212124] rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {student.avatar}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {student.studentId} • {student.program}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(
                    student.status
                  )}`}
                >
                  {student.status.replace("_", " ")}
                </span>
              </div>

              {/* Company Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {student.company}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 mb-1">
                  Supervisor: {student.supervisor}
                </p>
                {student.startDate && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 ml-5">
                    Start Date: {new Date(student.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Attendance
                    </p>
                    {getTrendIcon(student.attendanceTrend)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${student.attendanceRate >= 90
                          ? "bg-green-500"
                          : student.attendanceRate >= 75
                            ? "bg-yellow-500"
                            : "bg-red-500"
                          }`}
                        style={{ width: `${student.attendanceRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {student.attendanceRate}%
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Hours Progress
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(student.hoursCompleted / student.requiredHours) *
                            100
                            }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {student.hoursCompleted}/{student.requiredHours}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Last Rating
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {student.lastEvaluation
                            ? student.lastEvaluation.toFixed(1)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    {student.lastEvaluation && (
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${i < Math.round(student.lastEvaluation || 0)
                                  ? "bg-gray-600 dark:bg-gray-400"
                                  : "bg-gray-300 dark:bg-gray-600"
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          out of 5.0
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {student.recentActivities} recent activities
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Last active: {student.lastActive}
                </span>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => handleViewDetails(student)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                <Eye className="w-4 h-4" />
                <span>View Detailed Progress</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="bg-white dark:bg-[#212124] rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No students found</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
          style={{ marginTop: 0 }}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col"
            style={{
              maxHeight: "90vh",
              margin: "20px",
            }}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedStudent.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedStudent.studentId} • {selectedStudent.company}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Weekly Attendance */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Weekly Attendance
                  </h4>
                  <div className="space-y-3">
                    {studentDetails.weeklyAttendance.map((week, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">
                            {week.week}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {week.rate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${week.rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Hours */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Weekly Hours
                  </h4>
                  <div className="space-y-3">
                    {studentDetails.monthlyProgress.map((month, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">
                            {month.month}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {month.hours} hrs
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (month.hours / Math.max(1, Math.max(...studentDetails.monthlyProgress.map(m => m.hours)))) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Evaluation History */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Evaluation History
                </h4>
                <div className="space-y-2">
                  {detailLoading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading evaluations...</div>
                  )}
                  {!detailLoading && studentDetails.evaluationHistory.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No evaluation history</div>
                  )}
                  {studentDetails.evaluationHistory.map((evaluation, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white dark:bg-[#212124] rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Rating: {evaluation.rating}
                          </p>
                          <p className="text-xs text-gray-500">
                            {evaluation.evaluator}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{evaluation.date}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorMonitoringTab;
