import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { reportService } from "../../services/reportService";
import type {
  AttendanceReportLog,
  AttendanceReportResponse,
} from "../../services/reportService";

type DatePreset = "all" | "current_month" | "last_month" | "last_quarter";

const presetToRange = (preset: DatePreset): { from?: string; to?: string } => {
  const now = new Date();

  switch (preset) {
    case "current_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString().split("T")[0] };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: start.toISOString().split("T")[0],
        to: end.toISOString().split("T")[0],
      };
    }
    case "last_quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const startQuarter = quarter - 1 < 0 ? 3 : quarter - 1;
      const yearAdjustment = quarter - 1 < 0 ? -1 : 0;
      const start = new Date(
        now.getFullYear() + yearAdjustment,
        startQuarter * 3,
        1
      );
      const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
      return {
        from: start.toISOString().split("T")[0],
        to: end.toISOString().split("T")[0],
      };
    }
    case "all":
    default:
      return {};
  }
};

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const StudentReportsTab: React.FC = () => {
  const [report, setReport] = useState<AttendanceReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("current_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const activeRange = useMemo(() => {
    if (customFrom || customTo) {
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
    }
    return presetToRange(datePreset);
  }, [customFrom, customTo, datePreset]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.fetchAttendanceReport(activeRange);
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
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset]);

  const handleApplyCustomRange = async () => {
    if (customFrom && customTo && customFrom > customTo) {
      toast.error('"From" date must be before "To" date.');
      return;
    }
    await loadReport();
  };

  const handleDownload = async (format: "pdf" | "excel") => {
    setDownloading(format);
    try {
      await reportService.downloadAttendanceReport(activeRange, format);
      toast.success(
        `Attendance report downloaded as ${format.toUpperCase()} successfully.`
      );
    } catch (err: any) {
      console.error("Failed to download attendance report:", err);
      const message =
        err?.response?.data?.message || "Failed to download attendance report";
      toast.error(message);
    } finally {
      setDownloading(null);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!report) return [];
    if (!searchQuery) return report.logs;

    const lower = searchQuery.toLowerCase();
    return report.logs.filter((log) => {
      const dateMatch = new Date(log.date)
        .toLocaleDateString()
        .toLowerCase()
        .includes(lower);
      const remarksMatch = (log.remarks || "").toLowerCase().includes(lower);
      const methodMatch = (log.verificationMethod || "")
        .toLowerCase()
        .includes(lower);
      return dateMatch || remarksMatch || methodMatch;
    });
  }, [report, searchQuery]);

  const summaryCards = useMemo(() => {
    if (!report) {
      return [
        {
          label: "Total Attendance Logs",
          value: "—",
          sublabel: "Logs recorded",
          color: "border-blue-500",
        },
        {
          label: "Verified Logs",
          value: "—",
          sublabel: "Approved by coordinator",
          color: "border-green-500",
        },
        {
          label: "Total Hours Completed",
          value: "—",
          sublabel: "Hours in selected range",
          color: "border-purple-500",
        },
        {
          label: "Average Hours / Day",
          value: "—",
          sublabel: "Based on verified logs",
          color: "border-amber-500",
        },
      ];
    }

    return [
      {
        label: "Total Attendance Logs",
        value: report.summary.totalLogs.toString(),
        sublabel: "Logs recorded",
        color: "border-blue-500",
      },
      {
        label: "Verified Logs",
        value: report.summary.verifiedLogs.toString(),
        sublabel: "Approved by coordinator",
        color: "border-green-500",
      },
      {
        label: "Total Hours Completed",
        value: report.summary.totalHours.toFixed(2),
        sublabel: "Hours in selected range",
        color: "border-purple-500",
      },
      {
        label: "Average Hours / Day",
        value: report.summary.averageHoursPerDay.toFixed(2),
        sublabel: "Based on verified logs",
        color: "border-amber-500",
      },
    ];
  }, [report]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 ${card.color}`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {card.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.sublabel}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Attendance Report
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download attendance summary or review detailed logs for the
              selected period.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleDownload("pdf")}
              disabled={downloading === "pdf" || loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{downloading === "pdf" ? "Preparing..." : "Download PDF"}</span>
            </button>
            <button
              onClick={() => handleDownload("excel")}
              disabled={downloading === "excel" || loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {downloading === "excel" ? "Preparing..." : "Download Excel"}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preset Range
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Time</option>
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_quarter">Last Quarter</option>
            </select>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom From
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom To
              </label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleApplyCustomRange}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Apply Custom Range
              </button>
              <button
                onClick={() => {
                  setCustomFrom("");
                  setCustomTo("");
                  setDatePreset("current_month");
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  Viewing{" "}
                  {activeRange.from
                    ? `from ${new Date(activeRange.from).toLocaleDateString()}`
                    : "from the start"}{" "}
                  {activeRange.to
                    ? `to ${new Date(activeRange.to).toLocaleDateString()}`
                    : "to present"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detailed Attendance Logs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Filter and review all entries included in the generated report.
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by date, method, or remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading attendance logs...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 dark:text-red-400">
            {error}
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
                    Duration (hrs)
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
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No attendance logs matched your filters.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log: AttendanceReportLog) => {
                  const durationHours = (log.durationMinutes / 60).toFixed(2);
                  const verifiedLabel = log.verified ? "Verified" : "Pending";
                  const statusStyles = log.verified
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
                  return (
                    <tr key={`${log.date}-${log.timeIn}-${log.timeOut}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(log.timeIn)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(log.timeOut)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {durationHours}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          <Clock className="w-3 h-3 mr-1" />
                          {(log.verificationMethod || "Manual")
                            .toString()
                            .replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusStyles}`}>
                          {verifiedLabel}
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

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Report Tips
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              The attendance report captures every log recorded in the system.
              Use the PDF format for official submissions and the Excel format
              for deeper analysis.
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Adjust the date range to match required reporting periods.</li>
              <li>• Verified logs indicate coordinator approval.</li>
              <li>• Include additional remarks when logging attendance for clarity.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportsTab;
