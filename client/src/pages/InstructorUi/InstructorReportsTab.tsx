import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Download,
  Search,
  Users,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { reportService } from "../../services/reportService";
import type {
  AttendanceReportResponse,
  AttendanceReportLog,
} from "../../services/reportService";
import { instructorService, type InstructorStudent } from "../../services/instructorService";

const InstructorReportsTab: React.FC = () => {
  const [report, setReport] = useState<AttendanceReportResponse | null>(null);
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      setStudentLoading(true);
      try {
        const data = await instructorService.getAssignedStudents();
        setStudents(data);
        if (data.length > 0 && !selectedStudentId) {
          setSelectedStudentId(data[0].id);
        }
      } catch (err: any) {
        console.error("Failed to fetch students:", err);
        toast.error(err?.message || "Failed to load assigned students.");
      } finally {
        setStudentLoading(false);
      }
    };

    loadStudents();
  }, []);

  const loadReport = async () => {
    if (!selectedStudentId) {
      setError("Please select a student");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params: any = {
        studentId: selectedStudentId,
      };

      if (dateFrom) {
        params.from = dateFrom;
      }
      if (dateTo) {
        params.to = dateTo;
      }

      const data = await reportService.fetchAttendanceReport(params);
      setReport(data);
    } catch (err: any) {
      console.error("Failed to fetch attendance report:", err);
      const message =
        err?.response?.data?.message || "Failed to load attendance report";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId, dateFrom, dateTo]);

  const handleDownloadPDF = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }

    setDownloading(true);
    try {
      const params: any = {
        studentId: selectedStudentId,
      };

      if (dateFrom) {
        params.from = dateFrom;
      }
      if (dateTo) {
        params.to = dateTo;
      }

      await reportService.downloadAttendanceReport(params, "pdf");
      toast.success("Attendance report downloaded successfully.");
    } catch (err: any) {
      console.error("Failed to download attendance report:", err);
      const message =
        err?.response?.data?.message || "Failed to download attendance report";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }

    setDownloading(true);
    try {
      const params: any = {
        studentId: selectedStudentId,
      };

      if (dateFrom) {
        params.from = dateFrom;
      }
      if (dateTo) {
        params.to = dateTo;
      }

      await reportService.downloadAttendanceReport(params, "excel");
      toast.success("Attendance report downloaded successfully.");
    } catch (err: any) {
      console.error("Failed to download attendance report:", err);
      const message =
        err?.response?.data?.message || "Failed to download attendance report";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!report) return [];

    return report.logs.filter((log) => {
      const dateStr = new Date(log.date).toLocaleDateString();
      const timeInStr = log.timeIn
        ? new Date(log.timeIn).toLocaleTimeString()
        : "";
      const timeOutStr = log.timeOut
        ? new Date(log.timeOut).toLocaleTimeString()
        : "";
      const methodStr = log.verificationMethod || "";

      const searchLower = searchQuery.toLowerCase();
      return (
        dateStr.toLowerCase().includes(searchLower) ||
        timeInStr.toLowerCase().includes(searchLower) ||
        timeOutStr.toLowerCase().includes(searchLower) ||
        methodStr.toLowerCase().includes(searchLower)
      );
    });
  }, [report, searchQuery]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-3 sm:gap-0">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Attendance Reports
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
              View and export attendance reports for your assigned students
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#212124] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded-full">
              Total Hours
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {report?.summary.totalHours.toFixed(1) || "0.0"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {report?.student.totalHoursRequired || 0} hours required
          </p>
        </div>

        <div className="bg-white dark:bg-[#212124] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/40 px-2 py-1 rounded-full">
              Verified
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {report?.summary.verifiedLogs || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Verified attendance logs
          </p>
        </div>

        <div className="bg-white dark:bg-[#212124] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-300" />
            </div>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded-full">
              Pending
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {report?.summary.pendingLogs || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pending verification
          </p>
        </div>

        <div className="bg-white dark:bg-[#212124] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 px-2 py-1 rounded-full">
              Average
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {report?.summary.averageHoursPerDay.toFixed(1) || "0.0"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hours per day
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Attendance Report
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and export attendance reports for your assigned students.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading || loading || !selectedStudentId}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Preparing..." : "Download PDF"}</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={downloading || loading || !selectedStudentId}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Preparing..." : "Download Excel"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={studentLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                  {student.studentNumber ? ` (${student.studentNumber})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Logs
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Student Info */}
      {selectedStudent && (
        <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedStudent.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedStudent.studentNumber} • {selectedStudent.email}
              </p>
              {selectedStudent.company && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Company: {selectedStudent.company}
                </p>
              )}
              {selectedStudent.startDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start Date: {new Date(selectedStudent.startDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Logs Table */}
      <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Attendance Logs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Fetching attendance data...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : !selectedStudentId ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Please select a student to view attendance report.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time In
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#212124] divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No attendance logs found for the selected criteria.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log: AttendanceReportLog, index: number) => {
                  const durationHours = (log.durationMinutes || 0) / 60;
                  const statusColor = log.verified
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";

                  return (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.timeIn
                          ? new Date(log.timeIn).toLocaleTimeString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.timeOut
                          ? new Date(log.timeOut).toLocaleTimeString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {durationHours.toFixed(1)} hrs
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.verificationMethod || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
                        >
                          {log.verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.remarks || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Attendance Report Information
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Use this report to track student attendance, verify logs, and export
              data for documentation purposes.
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Select a student and date range to filter attendance logs.</li>
              <li>• Only verified logs count toward completed hours.</li>
              <li>• Export reports in PDF or Excel format for official documentation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorReportsTab;

