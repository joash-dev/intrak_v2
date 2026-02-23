import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Download,
  Search,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { reportService } from "../../services/reportService";
import type {
  AttendanceReportResponse,
  AttendanceReportLog,
} from "../../services/reportService";
import { instructorService, type InstructorStudent } from "../../services/instructorService";

// ── Date Preset Helpers ──────────────────────────────────────────────
type DatePreset = "all" | "today" | "this_week" | "this_month" | "last_30" | "custom";

const getDateRange = (preset: DatePreset): { from: string; to: string } => {
  const today = new Date();
  const toStr = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { from: toStr(today), to: toStr(today) };
    case "this_week": {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return { from: toStr(start), to: toStr(today) };
    }
    case "this_month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toStr(start), to: toStr(today) };
    }
    case "last_30": {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return { from: toStr(start), to: toStr(today) };
    }
    default:
      return { from: "", to: "" };
  }
};

// ── Progress Bar Component ───────────────────────────────────────────
const ProgressBar: React.FC<{
  current: number;
  total: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}> = ({ current, total, size = "md", showLabel = true }) => {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const barH = size === "sm" ? "h-2" : "h-3";

  let color = "bg-blue-500";
  if (pct >= 100) color = "bg-green-500";
  else if (pct >= 75) color = "bg-blue-500";
  else if (pct >= 50) color = "bg-amber-500";
  else color = "bg-red-500";

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${barH} overflow-hidden`}>
        <div
          className={`${color} ${barH} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {current.toFixed(1)} / {total} hrs ({pct.toFixed(1)}%)
        </p>
      )}
    </div>
  );
};

// ── Status Badge Component ───────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    at_risk: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  };

  const labels: Record<string, string> = {
    active: "Active",
    warning: "Warning",
    at_risk: "At Risk",
    completed: "Completed",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
};

// ── Pagination Constants ─────────────────────────────────────────────
const LOGS_PER_PAGE = 15;

// ═════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════
const InstructorReportsTab: React.FC = () => {
  // ── State ────────────────────────────────────────────────────────
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [overviewSearch, setOverviewSearch] = useState("");

  // Detail view
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [report, setReport] = useState<AttendanceReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [logSearch, setLogSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ── Load Students ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setStudentLoading(true);
      try {
        const data = await instructorService.getAssignedStudents();
        setStudents(data);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load students.");
      } finally {
        setStudentLoading(false);
      }
    };
    load();
  }, []);

  // ── Date preset handler ──────────────────────────────────────────
  const handlePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const range = getDateRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  };

  // ── Load Report ──────────────────────────────────────────────────
  const loadReport = async (studentId: string, from?: string, to?: string) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const params: any = { studentId };
      if (from) params.from = from;
      if (to) params.to = to;
      const data = await reportService.fetchAttendanceReport(params);
      setReport(data);
      setCurrentPage(1);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to load report";
      setReportError(message);
      toast.error(message);
    } finally {
      setReportLoading(false);
    }
  };

  // Reload report when date changes
  useEffect(() => {
    if (selectedStudentId) {
      loadReport(selectedStudentId, dateFrom || undefined, dateTo || undefined);
    }
  }, [selectedStudentId, dateFrom, dateTo]);

  // ── Select Student (enter detail view) ───────────────────────────
  const handleViewReport = (studentId: string) => {
    setSelectedStudentId(studentId);
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
    setLogSearch("");
    setCurrentPage(1);
  };

  const handleBackToOverview = () => {
    setSelectedStudentId(null);
    setReport(null);
    setReportError(null);
  };

  // ── Downloads ────────────────────────────────────────────────────
  const handleDownload = async (format: "pdf" | "excel") => {
    if (!selectedStudentId) return;
    setDownloading(true);
    try {
      const params: any = { studentId: selectedStudentId };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      await reportService.downloadAttendanceReport(params, format);
      toast.success(`Report downloaded as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // ── Computed values ──────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!overviewSearch.trim()) return students;
    const q = overviewSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q)
    );
  }, [students, overviewSearch]);

  const overviewStats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === "active").length;
    const warning = students.filter((s) => s.status === "warning").length;
    const atRisk = students.filter((s) => s.status === "at_risk").length;
    const completed = students.filter((s) => s.status === "completed").length;
    const avgProgress =
      total > 0
        ? students.reduce((sum, s) => sum + (s.requiredHours > 0 ? (s.hoursCompleted / s.requiredHours) * 100 : 0), 0) / total
        : 0;
    return { total, active, warning, atRisk, completed, avgProgress };
  }, [students]);

  const filteredLogs = useMemo(() => {
    if (!report) return [];
    if (!logSearch.trim()) return report.logs;
    const q = logSearch.toLowerCase();
    return report.logs.filter((log) => {
      const dateStr = new Date(log.date).toLocaleDateString();
      const method = log.verificationMethod || "";
      return dateStr.includes(q) || method.toLowerCase().includes(q);
    });
  }, [report, logSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // ═══════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════
  if (selectedStudentId) {
    return (
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToOverview}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedStudent?.name || "Student"} — Attendance Report
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedStudent?.studentId} • {selectedStudent?.company || "No company"} • {selectedStudent?.program}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload("pdf")}
                disabled={downloading || reportLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => handleDownload("excel")}
                disabled={downloading || reportLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Date Presets */}
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Period:</span>
            {([
              ["all", "All Time"],
              ["today", "Today"],
              ["this_week", "This Week"],
              ["this_month", "This Month"],
              ["last_30", "Last 30 Days"],
              ["custom", "Custom"],
            ] as [DatePreset, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  datePreset === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {label}
              </button>
            ))}

            {datePreset === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-sm text-gray-900 dark:text-white"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-sm text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Hours Progress */}
          <div className="bg-white dark:bg-[#212124] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                Hours
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {report?.summary.totalHours.toFixed(1) || "0.0"}
            </h3>
            <ProgressBar
              current={report?.summary.totalHours || 0}
              total={report?.student.totalHoursRequired || selectedStudent?.requiredHours || 240}
              size="sm"
            />
          </div>

          {/* Verified */}
          <div className="bg-white dark:bg-[#212124] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {report?.summary.verifiedLogs || 0}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Verified logs</p>
          </div>

          {/* Pending */}
          <div className="bg-white dark:bg-[#212124] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {report?.summary.pendingLogs || 0}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending verification</p>
          </div>

          {/* Avg Hours/Day */}
          <div className="bg-white dark:bg-[#212124] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {report?.summary.averageHoursPerDay.toFixed(1) || "0.0"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg hrs/day</p>
          </div>
        </div>

        {/* Attendance Logs Table */}
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Logs
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) => { setLogSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2a2a2d] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {reportLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : reportError ? (
            <div className="p-12 text-center text-red-600 dark:text-red-400">{reportError}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      {["Date", "Time In", "Time Out", "Duration", "Method", "Status", "Remarks"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          No attendance logs found for the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((log: AttendanceReportLog, idx: number) => {
                        const hrs = (log.durationMinutes || 0) / 60;
                        const isIncomplete = log.timeIn && !log.timeOut;
                        const isShortDay = hrs > 0 && hrs < 4;

                        return (
                          <tr
                            key={idx}
                            className={
                              isIncomplete
                                ? "bg-red-50/50 dark:bg-red-900/10"
                                : isShortDay
                                ? "bg-amber-50/50 dark:bg-amber-900/10"
                                : ""
                            }
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {new Date(log.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {log.timeIn ? new Date(log.timeIn).toLocaleTimeString() : "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {log.timeOut ? (
                                new Date(log.timeOut).toLocaleTimeString()
                              ) : isIncomplete ? (
                                <span className="text-red-500 text-xs font-medium flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Missing
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className={`px-4 py-3 text-sm ${isShortDay ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                              {hrs.toFixed(1)} hrs
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {log.verificationMethod || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  log.verified
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                                }`}
                              >
                                {log.verified ? "Verified" : "Pending"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                              {log.remarks || "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * LOGS_PER_PAGE + 1}–{Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            page === currentPage
                              ? "bg-blue-600 text-white"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // OVERVIEW VIEW (default)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-5 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Monitor student attendance progress and generate reports
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Students", value: overviewStats.total, icon: Users, color: "blue" },
          { label: "Active", value: overviewStats.active, icon: CheckCircle, color: "green" },
          { label: "Warning", value: overviewStats.warning, icon: AlertCircle, color: "amber" },
          { label: "At Risk", value: overviewStats.atRisk, icon: AlertTriangle, color: "red" },
          { label: "Completed", value: overviewStats.completed, icon: Calendar, color: "blue" },
          { label: "Avg Progress", value: `${overviewStats.avgProgress.toFixed(0)}%`, icon: TrendingUp, color: "purple" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#212124] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg w-fit mb-2`}>
              <stat.icon className={`w-4 h-4 text-${stat.color}-600 dark:text-${stat.color}-300`} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Student Overview Table */}
      <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Student Progress Overview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click "View Report" to see detailed attendance for a student
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={overviewSearch}
              onChange={(e) => setOverviewSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2a2a2d] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {studentLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400">
              {overviewSearch ? "No students match your search." : "No assigned students found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  {["Student", "Company", "Hours Progress", "Attendance", "Status", "Last Activity", ""].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student) => {
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                            {student.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{student.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{student.company}</td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <ProgressBar
                          current={student.hoursCompleted}
                          total={student.requiredHours}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {student.attendanceRate > 0 ? `${student.attendanceRate.toFixed(0)}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {student.lastActivity}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewReport(student.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorReportsTab;
