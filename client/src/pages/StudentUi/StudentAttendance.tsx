import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Loader2,
  Download,
} from "lucide-react";
import {
  attendanceService,
  type AttendanceLog,
  type AttendanceStats,
} from "../../services/attendanceService";
import toast from "react-hot-toast";

const StudentAttendanceTab: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState<string>("");
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalHours: 0,
    completedHours: 0,
    verifiedDays: 0,
    pendingDays: 0,
    avgHoursPerDay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [hasTimeInToday, setHasTimeInToday] = useState(false);
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [manualTimeIn, setManualTimeIn] = useState("");
  const [manualTimeOut, setManualTimeOut] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");

  const CalendarIcon = Calendar;

  // Fetch attendance data on component mount
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Check time-in status when manual modal opens
  useEffect(() => {
    if (showManualModal) {
      checkTimeInStatus();
    }
  }, [showManualModal, manualDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const logs = await attendanceService.getAttendanceLogs();

      // Ensure logs is always an array
      const attendanceArray = Array.isArray(logs) ? logs : [];
      setAttendanceLogs(attendanceArray);

      const calculatedStats = await attendanceService.calculateStats(
        attendanceArray
      );
      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("Failed to load attendance data");
      // Set empty array on error to prevent crashes
      setAttendanceLogs([]);
      setStats({
        totalHours: 0,
        completedHours: 0,
        verifiedDays: 0,
        pendingDays: 0,
        avgHoursPerDay: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const progress =
    stats.totalHours > 0 ? (stats.completedHours / stats.totalHours) * 100 : 0;

  const checkTimeInStatus = async () => {
    try {
      const hasTimeIn = await attendanceService.checkTimeInStatus(manualDate);
      setHasTimeInToday(hasTimeIn);
    } catch (error) {
      console.error("Error checking time-in status:", error);
    }
  };

  const handleManualLog = async (action: "time-in" | "time-out") => {
    try {
      setManualLoading(true);

      const logData: any = {
        studentId: "me", // Server will resolve this to the actual student ID
        date: manualDate,
        action,
        remarks: manualRemarks || undefined,
      };

      if (action === "time-in") {
        logData.timeIn = `${manualDate}T${manualTimeIn}:00`;
      } else {
        logData.timeOut = `${manualDate}T${manualTimeOut}:00`;
      }

      await attendanceService.logAttendance(logData);

      toast.success(
        `${action === "time-in" ? "Time-in" : "Time-out"} logged successfully`
      );
      setShowManualModal(false);
      setManualRemarks("");
      setManualTimeIn("");
      setManualTimeOut("");

      // Refresh attendance data
      await fetchAttendanceData();
    } catch (error) {
      console.error(`Error logging ${action}:`, error);
      toast.error(`Failed to log ${action}`);
    } finally {
      setManualLoading(false);
    }
  };

  const handleOpenManualModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setManualDate(today);
    setManualTimeIn("");
    setManualTimeOut("");
    setManualRemarks("");
    setShowManualModal(true);
  };

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getLogForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Ensure attendanceLogs is an array before calling find
    if (!Array.isArray(attendanceLogs)) {
      return null;
    }

    return attendanceLogs.find((log) => {
      const logDate = new Date(log.date).toISOString().split("T")[0];
      return logDate === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleGenerateQR = async () => {
    try {
      setQrLoading(true);
      const qrData = await attendanceService.generateQRCode();
      setQrCode(qrData.qrCode);
      setQrExpiresAt(qrData.expiresAt);
      setShowQRModal(true);
      toast.success("QR code generated successfully");
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  };

  const handleExportDTR = async () => {
    try {
      setExportLoading(true);
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = currentDate.getFullYear();

      await attendanceService.exportDTR({
        month: currentMonth,
        year: currentYear,
      });

      toast.success(`DTR for ${monthYear} exported successfully!`);
    } catch (error) {
      console.error("Error exporting DTR:", error);
      toast.error("Failed to export DTR. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading attendance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your daily attendance and monitor your OJT progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed Hours
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.completedHours.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {stats.totalHours.toFixed(1)} total
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verified Days
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.verifiedDays}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {attendanceLogs.length} days
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.pendingDays}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                awaiting verification
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Hours/Day
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.avgHoursPerDay.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">hours per day</p>
            </div>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Overall Progress
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.completedHours.toFixed(1)} / {stats.totalHours.toFixed(1)}{" "}
              hours completed
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-green-600">
              {progress.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={handleGenerateQR}
          disabled={qrLoading}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group disabled:opacity-50 disabled:cursor-not-allowed border border-gray-100 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {qrLoading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <QrCode className="w-6 h-6 text-white" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Generate QR
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan at company location
          </p>
        </button>

        <button
          onClick={handleOpenManualModal}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group border border-gray-100 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Manual Log
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter time manually
          </p>
        </button>

        <button
          onClick={handleExportDTR}
          disabled={exportLoading}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group disabled:opacity-50 disabled:cursor-not-allowed border border-gray-100 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {exportLoading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Download className="w-6 h-6 text-white" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Export DTR
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Download as PDF
          </p>
        </button>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group border border-gray-100 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Upload DTR
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan hardcopy sheet
          </p>
        </button>
      </div>

      {/* Attendance Records Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance Records
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Track your daily attendance and progress
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                viewMode === "calendar"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                viewMode === "list"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {monthYear}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const log = day ? getLogForDay(day) : null;
              return (
                <div
                  key={index}
                  className={`aspect-square p-2 rounded-lg text-center relative ${
                    day
                      ? log
                        ? log.verified
                          ? "bg-green-100 dark:bg-green-900 cursor-pointer hover:shadow-md"
                          : "bg-yellow-100 dark:bg-yellow-900 cursor-pointer hover:shadow-md"
                        : "bg-gray-50 dark:bg-gray-700"
                      : ""
                  }`}
                >
                  {day && (
                    <>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {day}
                      </div>
                      {log && (
                        <div className="text-xs mt-1">
                          <div className="font-semibold text-gray-700 dark:text-gray-300">
                            {attendanceService.formatDuration(
                              log.durationMinutes
                            )}
                          </div>
                          {log.verified ? (
                            <CheckCircle className="w-3 h-3 text-green-600 mx-auto mt-1" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-yellow-600 mx-auto mt-1" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-50 dark:bg-gray-700 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">No entry</span>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Time In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Time Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {attendanceLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {attendanceService.formatDate(log.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {attendanceService.formatTime(log.timeIn)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {log.timeOut ? (
                      attendanceService.formatTime(log.timeOut)
                    ) : (
                      <span className="text-blue-600">In progress</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {attendanceService.formatDuration(log.durationMinutes)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {log.verificationMethod}
                  </td>
                  <td className="px-6 py-4">
                    {log.verified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    )}
                    {log.remarks && (
                      <p className="text-xs text-gray-500 mt-1">
                        {log.remarks}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Your QR Code
            </h2>
            <div className="bg-white p-4 rounded-lg mb-4">
              <img
                src={qrCode}
                alt="QR Code"
                className="w-full max-w-xs mx-auto"
              />
            </div>
            <div className="space-y-2 text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Show this QR code to your supervisor for verification
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Valid for 5 minutes only
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Expires at:{" "}
                {qrExpiresAt
                  ? new Date(qrExpiresAt).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Upload DTR Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Upload DTR Hardcopy
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Upload scanned DTR document
                </p>
                <label className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer">
                  <span>Choose File</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  PDF, JPG, or PNG (Max 10MB)
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(false)}
                className="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Log Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Manual Attendance Log
            </h2>
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Time-in Section */}
              {!hasTimeInToday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time In
                  </label>
                  <input
                    type="time"
                    value={manualTimeIn}
                    onChange={(e) => setManualTimeIn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {/* Time-out Section */}
              {hasTimeInToday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Out
                  </label>
                  <input
                    type="time"
                    value={manualTimeOut}
                    onChange={(e) => setManualTimeOut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={manualRemarks}
                  onChange={(e) => setManualRemarks(e.target.value)}
                  placeholder="Add any remarks..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Status Indicator */}
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {hasTimeInToday
                    ? "You have already logged time-in for this date. Log time-out to complete your attendance."
                    : "Log your time-in for this date."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleManualLog(hasTimeInToday ? "time-out" : "time-in")
                  }
                  disabled={
                    manualLoading ||
                    (hasTimeInToday ? !manualTimeOut : !manualTimeIn)
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {manualLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Logging...
                    </>
                  ) : hasTimeInToday ? (
                    "Log Time Out"
                  ) : (
                    "Log Time In"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceTab;
