import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Search,
  Building2,
  Users,
  Loader2,
} from "lucide-react";
import { attendanceService } from "../../services/attendanceService";
import toast from "react-hot-toast";

interface AttendanceLog {
  id: string;
  studentId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  durationMinutes: number;
  verified: boolean;
  verificationMethod: "QR" | "GPS" | "MANUAL";
  verificationMetadata?: any;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    studentNumber: string;
    user: {
      name: string;
    };
  };
  // Additional fields for display
  studentName?: string;
  studentAvatar?: string;
  company?: string;
  checkIn?: string;
  checkOut?: string | null;
  totalHours?: number;
  status?: "present" | "late" | "absent" | "half_day" | "pending";
  verificationType?: "qr" | "gps" | "manual";
  location?: string;
  verifiedBy?: string;
  verifiedDate?: string;
}

const InstructorAttendanceVerification: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVerified] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [remarks, setRemarks] = useState("");

  // State for API data
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch attendance data on component mount and when date changes
  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch attendance logs for assigned students (instructor view)
      const response = await attendanceService.getCoordinatorAttendanceLogs(
        selectedDate
      );
      const logsData = response.logs || [];

      // Transform API data to match our display format
      const transformedLogs = logsData.map((log: any) => ({
        ...log,
        studentName: log.student?.user?.name || "Unknown Student",
        studentId: log.student?.studentNumber || "N/A",
        studentAvatar: generateAvatar(log.student?.user?.name || "Unknown"),
        company: "Company Not Available", // This would need to come from student data
        checkIn: log.timeIn
          ? attendanceService.formatTime(log.timeIn)
          : "Not checked in",
        checkOut: log.timeOut
          ? attendanceService.formatTime(log.timeOut)
          : null,
        totalHours: log.durationMinutes / 60,
        status: getAttendanceStatus(log),
        verificationType: log.verificationMethod?.toLowerCase() || "manual",
        location:
          log.verificationMetadata?.location || "Location not available",
        verifiedBy: "System", // This would need to come from verification data
        verifiedDate: log.verified
          ? new Date(log.updatedAt).toLocaleString()
          : undefined,
      }));

      // If no data is found, show empty state instead of error
      if (transformedLogs.length === 0) {
        console.log("No attendance data found for the selected date");
        setAttendanceLogs([]);
      } else {
        setAttendanceLogs(transformedLogs);
      }
    } catch (err: any) {
      console.error("Error fetching attendance data:", err);
      setError(err.message || "Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const generateAvatar = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getAttendanceStatus = (
    log: any
  ): "present" | "late" | "absent" | "half_day" | "pending" => {
    if (!log.timeIn) return "absent";
    if (!log.timeOut) return "pending";

    const checkInTime = new Date(log.timeIn);
    const expectedCheckIn = new Date(checkInTime);
    expectedCheckIn.setHours(8, 0, 0, 0); // Expected 8:00 AM

    if (checkInTime > expectedCheckIn) return "late";
    if (log.durationMinutes < 240) return "half_day"; // Less than 4 hours
    return "present";
  };

  const stats = {
    totalStudents: attendanceLogs.length,
    present: attendanceLogs.filter((log) => log.status === "present").length,
    late: attendanceLogs.filter((log) => log.status === "late").length,
    absent: attendanceLogs.filter((log) => log.status === "absent").length,
    pendingVerification: attendanceLogs.filter((log) => !log.verified).length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      absent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      half_day:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      pending: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    };
    return colors[status] || colors.pending;
  };

  const getVerificationBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      qr: {
        label: "QR Code",
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      },
      gps: {
        label: "GPS",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      },
      manual: {
        label: "Manual",
        color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      },
    };
    return badges[type] || badges.manual;
  };

  const handleVerify = (log: AttendanceLog, action: "approve" | "reject") => {
    setSelectedLog(log);
    setVerifyAction(action);
    setShowVerifyModal(true);
    setRemarks("");
  };

  const submitVerification = async () => {
    if (!selectedLog || !verifyAction) return;

    try {
      setSubmitting(true);

      // Call the attendance verification API
      await attendanceService.verifyAttendance(
        selectedLog.id,
        verifyAction === "approve",
        remarks
      );

      toast.success(
        `Attendance ${
          verifyAction === "approve" ? "verified" : "rejected"
        } successfully`
      );

      // Refresh the attendance data
      await fetchAttendanceData();

      // Close modal and reset state
      setShowVerifyModal(false);
      setSelectedLog(null);
      setVerifyAction(null);
      setRemarks("");
    } catch (err: any) {
      console.error("Error verifying attendance:", err);
      toast.error(err.message || "Failed to verify attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = attendanceLogs.filter((log) => {
    const matchesSearch =
      (log.studentName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (log.studentId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.company || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    const matchesVerified =
      filterVerified === "all" ||
      (filterVerified === "verified" && log.verified) ||
      (filterVerified === "pending" && !log.verified);

    return matchesSearch && matchesStatus && matchesVerified;
  });

  // Show loading state
  if (loading && attendanceLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading attendance data...
          </span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && attendanceLogs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Verify Attendance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and verify student attendance records
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200 font-medium">
              Error loading attendance data
            </span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
          <button
            onClick={fetchAttendanceData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Verify Attendance
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review and verify student attendance records for your assigned
                students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalStudents}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Present
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.present}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.late}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.absent}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.pendingVerification}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
          />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student name, ID, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-w-[140px] text-sm"
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>

      {filteredLogs.length === 0 && !loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No attendance records found
          </p>
          <p className="text-sm text-gray-500">
            No students have logged attendance for{" "}
            {new Date(selectedDate).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {log.studentAvatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {log.studentName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({log.studentId || "N/A"})
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>{log.company}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                    log.status || "pending"
                  )}`}
                >
                  {(log.status || "pending").replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Check In
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {log.checkIn}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Check Out
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {log.checkOut || "Not yet"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Total Hours
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {(log.totalHours || 0) > 0 ? `${log.totalHours} hrs` : "-"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Verification
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      getVerificationBadge(log.verificationType || "manual")
                        .color
                    }`}
                  >
                    {
                      getVerificationBadge(log.verificationType || "manual")
                        .label
                    }
                  </span>
                </div>
              </div>

              {!log.verified && (
                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleVerify(log, "reject")}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 rounded-lg transition-colors font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Reject</span>
                  </button>
                  <button
                    onClick={() => handleVerify(log, "approve")}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Verify</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showVerifyModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {verifyAction === "approve"
                ? "Verify Attendance"
                : "Reject Attendance"}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedLog.studentName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedLog.company}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {verifyAction === "approve"
                  ? "Notes (Optional)"
                  : "Reason (Required)"}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitVerification}
                disabled={submitting}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  verifyAction === "approve"
                    ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
                    : "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
                } disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : verifyAction === "approve" ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorAttendanceVerification;
