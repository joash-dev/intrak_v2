import { useState } from "react";
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

interface Student {
  id: string;
  studentId: string;
  name: string;
  avatar: string;
  program: string;
  company: string;
  supervisor: string;
  attendanceRate: number;
  attendanceTrend: "up" | "down" | "stable";
  hoursCompleted: number;
  requiredHours: number;
  tasksCompleted: number;
  totalTasks: number;
  lastEvaluation: number | null;
  recentActivities: number;
  status: "excellent" | "good" | "needs_attention" | "critical";
  lastActive: string;
}

interface StudentDetail {
  weeklyAttendance: { week: string; rate: number }[];
  monthlyProgress: { month: string; hours: number }[];
  taskHistory: { task: string; date: string; status: string }[];
  evaluationHistory: { date: string; rating: number; evaluator: string }[];
}

const InstructorMonitoringTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const students: Student[] = [
    {
      id: "1",
      studentId: "2021-001",
      name: "Maria Santos",
      avatar: "MS",
      program: "BS Computer Science",
      company: "TechCorp Inc.",
      supervisor: "Engr. Juan Dela Cruz",
      attendanceRate: 96,
      attendanceTrend: "up",
      hoursCompleted: 352,
      requiredHours: 400,
      tasksCompleted: 18,
      totalTasks: 20,
      lastEvaluation: 4.5,
      recentActivities: 8,
      status: "excellent",
      lastActive: "2 hours ago",
    },
    {
      id: "2",
      studentId: "2021-002",
      name: "Juan Dela Cruz",
      avatar: "JD",
      program: "BS Information Technology",
      company: "InnovateLab",
      supervisor: "Ms. Ana Reyes",
      attendanceRate: 92,
      attendanceTrend: "stable",
      hoursCompleted: 328,
      requiredHours: 400,
      tasksCompleted: 15,
      totalTasks: 18,
      lastEvaluation: 4.2,
      recentActivities: 5,
      status: "good",
      lastActive: "5 hours ago",
    },
    {
      id: "3",
      studentId: "2021-003",
      name: "Ana Reyes",
      avatar: "AR",
      program: "BS Computer Engineering",
      company: "DataSystems Corp",
      supervisor: "Engr. Carlos Martinez",
      attendanceRate: 88,
      attendanceTrend: "down",
      hoursCompleted: 312,
      requiredHours: 400,
      tasksCompleted: 12,
      totalTasks: 16,
      lastEvaluation: 4.0,
      recentActivities: 3,
      status: "needs_attention",
      lastActive: "1 day ago",
    },
    {
      id: "4",
      studentId: "2021-004",
      name: "Carlos Martinez",
      avatar: "CM",
      program: "BS Computer Science",
      company: "CloudTech Solutions",
      supervisor: "Mr. Pedro Santos",
      attendanceRate: 98,
      attendanceTrend: "up",
      hoursCompleted: 368,
      requiredHours: 400,
      tasksCompleted: 20,
      totalTasks: 20,
      lastEvaluation: 4.8,
      recentActivities: 12,
      status: "excellent",
      lastActive: "30 mins ago",
    },
  ];

  const studentDetails: StudentDetail = {
    weeklyAttendance: [
      { week: "Week 1", rate: 100 },
      { week: "Week 2", rate: 95 },
      { week: "Week 3", rate: 98 },
      { week: "Week 4", rate: 92 },
    ],
    monthlyProgress: [
      { month: "Aug", hours: 88 },
      { month: "Sep", hours: 92 },
      { month: "Oct", hours: 85 },
    ],
    taskHistory: [
      { task: "Database Design", date: "2024-10-01", status: "completed" },
      { task: "API Integration", date: "2024-09-28", status: "completed" },
      { task: "Frontend Development", date: "2024-09-25", status: "completed" },
    ],
    evaluationHistory: [
      { date: "2024-09-15", rating: 4.5, evaluator: "Industry Partner" },
      { date: "2024-08-30", rating: 4.3, evaluator: "Coordinator" },
    ],
  };

  const stats = {
    total: students.length,
    excellent: students.filter((s) => s.status === "excellent").length,
    good: students.filter((s) => s.status === "good").length,
    needsAttention: students.filter((s) => s.status === "needs_attention")
      .length,
    critical: students.filter((s) => s.status === "critical").length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      excellent:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-500",
      good: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-500",
      needs_attention:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-500",
      critical:
        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-500",
    };
    return colors[status] || colors.good;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Student Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track detailed progress and performance metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.total}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Excellent
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.excellent}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Good</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.good}
              </p>
            </div>
            <Award className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Needs Attention
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.needsAttention}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Critical
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats.critical}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="needs_attention">Needs Attention</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border-l-4 ${getStatusColor(
              student.status
            )} transition-all hover:shadow-md`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {student.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {student.studentId}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {student.program}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                    student.status
                  )}`}
                >
                  {student.status.replace("_", " ")}
                </span>
              </div>

              {/* Company Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {student.company}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                  Supervisor: {student.supervisor}
                </p>
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
                        className={`h-2 rounded-full ${
                          student.attendanceRate >= 90
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
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (student.hoursCompleted / student.requiredHours) *
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

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Tasks
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {student.tasksCompleted}/{student.totalTasks}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(
                        (student.tasksCompleted / student.totalTasks) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Last Rating
                  </p>
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {student.lastEvaluation
                        ? student.lastEvaluation.toFixed(1)
                        : "N/A"}
                    </span>
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
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium"
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No students found</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {selectedStudent.avatar}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedStudent.studentId} • {selectedStudent.company}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Weekly Attendance */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
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

              {/* Monthly Progress */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Monthly Hours
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
                          style={{ width: `${(month.hours / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Task History */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Recent Tasks
              </h4>
              <div className="space-y-2">
                {studentDetails.taskHistory.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.task}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">{task.date}</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation History */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-600" />
                Evaluation History
              </h4>
              <div className="space-y-2">
                {studentDetails.evaluationHistory.map((evaluation, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
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
      )}
    </div>
  );
};

export default InstructorMonitoringTab;
