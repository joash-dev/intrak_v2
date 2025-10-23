import { useState, useEffect } from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Eye,
  Download,
  Loader2,
  Calendar,
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import type { AttendanceLog } from "../../services/supervisorService";
import toast from "react-hot-toast";

const SupervisorAttendance = () => {
  const [activeTab, setActiveTab] = useState("logs");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);

  useEffect(() => {
    fetchAttendanceLogs();
  }, [filterStatus]);

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterStatus !== "all") {
        filters.status = filterStatus;
      }
      const fetchedLogs = await supervisorService.getAttendanceLogs(filters);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching attendance logs:", error);
      toast.error("Failed to load attendance logs");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    pending: logs.filter((log) => log.status === "pending").length,
    approved: logs.filter((log) => log.status === "approved").length,
    rejected: logs.filter((log) => log.status === "rejected").length,
    totalHoursToday: logs
      .filter((log) => {
        const today = new Date().toISOString().split("T")[0];
        return log.date.split("T")[0] === today && log.status !== "rejected";
      })
      .reduce((sum, log) => sum + log.durationMinutes / 60, 0)
      .toFixed(2),
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      approved:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors["pending"];
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (log: AttendanceLog) => {
    if (
      window.confirm(
        `Approve attendance for ${log.studentName} on ${new Date(
          log.date
        ).toLocaleDateString()}?`
      )
    ) {
      try {
        await supervisorService.approveAttendance(log.id);
        toast.success(`Attendance approved for ${log.studentName}`);
        fetchAttendanceLogs();
      } catch (error) {
        console.error("Error approving attendance:", error);
        toast.error("Failed to approve attendance");
      }
    }
  };

  const handleReject = async (log: AttendanceLog) => {
    const reason = prompt(
      `Reject attendance for ${log.studentName}?\n\nPlease provide a reason:`
    );
    if (reason && reason.trim()) {
      try {
        await supervisorService.rejectAttendance(log.id, reason);
        toast.success(`Attendance rejected for ${log.studentName}`);
        fetchAttendanceLogs();
      } catch (error) {
        console.error("Error rejecting attendance:", error);
        toast.error("Failed to reject attendance");
      }
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "--";
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading attendance logs...
          </p>
        </div>
      </div>
    );
  }

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const supervisorName = user?.name || "Supervisor";
  const companyName = user?.company || "Company";

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Attendance Management</h1>
        <p className="text-blue-100 text-lg mb-1">Company: {companyName}</p>
        <p className="text-blue-100">
          Review and verify intern attendance logs - Track time and approve
          hours
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Review */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
                Pending Review
              </p>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.pending}
              </p>
          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            {stats.pending} pending
          </span>
            </div>

        {/* Approved */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Approved</p>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.approved}
              </p>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Approved logs
          </span>
            </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Rejected</p>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.rejected}
              </p>
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            Rejected logs
          </span>
        </div>

        {/* Hours Today */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
                Hours Today
              </p>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.totalHoursToday}
          </p>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Total hours
          </span>
                </div>
              </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name or student ID..."
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
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                <button
            onClick={fetchAttendanceLogs}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
            <Download className="w-4 h-4 inline mr-2" />
            Refresh
                </button>
              </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredLogs.length} of {logs.length} logs
      </p>

              {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Time In/Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                        {log.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.studentName}
                              </p>
                              <p className="text-xs text-gray-500">
                          {log.studentNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(log.date)}
                          </p>
                    </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900 dark:text-white">
                      {formatTime(log.timeIn)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTime(log.timeOut)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(log.durationMinutes / 60).toFixed(2)}h
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {log.method}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.status === "pending" ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleApprove(log)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(log)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No attendance logs found
                  </p>
                </div>
              )}
            </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Attendance Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedLog.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedLog.studentName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedLog.studentNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedLog.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                      selectedLog.status
                    )}`}
                  >
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time In</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(selectedLog.timeIn)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time Out</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(selectedLog.timeOut)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hours Worked</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {(selectedLog.durationMinutes / 60).toFixed(2)} hours
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Method</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedLog.method}
                    </p>
                </div>
              </div>

              {selectedLog.location && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Location</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedLog.location}
                </p>
                {selectedLog.coordinates && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {selectedLog.coordinates}
                  </p>
                )}
              </div>
              )}

              {selectedLog.remarks && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Remarks</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLog.remarks}
                  </p>
                </div>
              )}

              {selectedLog.status === "pending" && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      handleApprove(selectedLog);
                      setSelectedLog(null);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedLog);
                      setSelectedLog(null);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorAttendance;
