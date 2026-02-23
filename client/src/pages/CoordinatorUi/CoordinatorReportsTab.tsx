import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  RefreshCw,
  Search,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import { reportService } from "../../services/reportService";
import type {
  ComplianceReportItem,
  ComplianceReportResponse,
} from "../../services/reportService";
import { companyService, type Company } from "../../services/companyService";
import { formatStudentId } from "../../utils/formatStudentId";

const ITEMS_PER_PAGE = 10;

type SortKey =
  | "studentName"
  | "companyName"
  | "completedHours"
  | "progress"
  | "documentsApproved"
  | "evaluationsCompleted"
  | "averageRating";

const isAtRisk = (item: ComplianceReportItem) =>
  item.totalHours > 0 &&
  item.completedHours / item.totalHours < 0.5 &&
  item.documentsApproved < item.documentsSubmitted;

const CoordinatorReportsTab: React.FC = () => {
  const [report, setReport] = useState<ComplianceReportResponse | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("studentName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const loadCompanies = async () => {
      setCompanyLoading(true);
      try {
        const data = await companyService.getAllCompanies();
        setCompanies(data);
      } catch (err: any) {
        console.error("Failed to fetch companies:", err);
        toast.error(
          err?.message || "Failed to load companies for filtering options."
        );
      } finally {
        setCompanyLoading(false);
      }
    };
    loadCompanies();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.fetchComplianceReport({
        companyId: selectedCompanyId !== "all" ? selectedCompanyId : undefined,
      });
      setReport(data);
    } catch (err: any) {
      console.error("Failed to fetch compliance report:", err);
      const message =
        err?.response?.data?.message || "Failed to load compliance report";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await reportService.downloadComplianceReport({
        companyId: selectedCompanyId !== "all" ? selectedCompanyId : undefined,
      });
      toast.success("Compliance report downloaded successfully.");
    } catch (err: any) {
      console.error("Failed to download compliance report:", err);
      const message =
        err?.response?.data?.message || "Failed to download compliance report";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!report) return [];
    return report.items.filter((item) => {
      const matchesSearch =
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.companyName || "Not Assigned")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesSearch && (!showOnlyAtRisk || isAtRisk(item));
    });
  }, [report, searchQuery, showOnlyAtRisk]);

  // Sorted items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];
      if (sortKey === "companyName") {
        aVal = aVal || "zzz"; // push "Not Assigned" to bottom
        bVal = bVal || "zzz";
      }
      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      aVal = aVal ?? 0;
      bVal = bVal ?? 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [filteredItems, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page on filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showOnlyAtRisk, selectedCompanyId, sortKey, sortDir]);

  // Summary stats
  const summary = useMemo(() => {
    if (!report) {
      return {
        totalStudents: 0,
        averageProgress: 0,
        totalApprovedDocuments: 0,
        totalCompletedHours: 0,
        atRiskCount: 0,
      };
    }
    const totalStudents = report.items.length;
    const totalProgress = report.items.reduce(
      (sum, item) => sum + (item.progress || 0),
      0
    );
    const totalApprovedDocuments = report.items.reduce(
      (sum, item) => sum + item.documentsApproved,
      0
    );
    const totalCompletedHours = report.items.reduce(
      (sum, item) => sum + item.completedHours,
      0
    );
    const atRiskCount = report.items.filter(isAtRisk).length;

    return {
      totalStudents,
      averageProgress:
        totalStudents > 0
          ? Number((totalProgress / totalStudents).toFixed(1))
          : 0,
      totalApprovedDocuments,
      totalCompletedHours,
      atRiskCount,
    };
  }, [report]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column)
      return <ChevronDown className="w-3 h-3 text-gray-300 dark:text-gray-600" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressTextColor = (progress: number) => {
    if (progress >= 75) return "text-green-600 dark:text-green-400";
    if (progress >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Stats cards
  const statsCards = [
    {
      label: "Students in Report",
      value: summary.totalStudents,
      icon: Users,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      badge: "Students",
      badgeBg: "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40",
    },
    {
      label: "Average Progress",
      value: `${summary.averageProgress}%`,
      icon: BarChart3,
      iconBg: "bg-purple-100 dark:bg-purple-900/40",
      iconColor: "text-purple-600 dark:text-purple-400",
      badge: "Progress",
      badgeBg:
        "text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40",
    },
    {
      label: "Approved Documents",
      value: summary.totalApprovedDocuments,
      icon: CheckCircle,
      iconBg: "bg-green-100 dark:bg-green-900/40",
      iconColor: "text-green-600 dark:text-green-400",
      badge: "Documents",
      badgeBg:
        "text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/40",
    },
    {
      label: "Hours Completed",
      value: summary.totalCompletedHours,
      icon: Clock,
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      badge: "Hours",
      badgeBg:
        "text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40",
    },
    {
      label: "At Risk Students",
      value: summary.atRiskCount,
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      badge: "At Risk",
      badgeBg: "text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Compliance Reports
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Monitor student compliance and generate reports
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadReport}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Refresh report"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline text-gray-700 dark:text-gray-300">Refresh</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Preparing..." : "Download Excel"}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-[#212124] p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${card.badgeBg}`}
              >
                {card.badge}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-0.5">
              {card.value}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compliance Overview
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {filteredItems.length} student{filteredItems.length !== 1 ? "s" : ""} match current filters
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Company
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              disabled={companyLoading}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, student number, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:col-span-4 flex items-end pb-0.5">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyAtRisk}
                onChange={(e) => setShowOnlyAtRisk(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="text-xs sm:text-sm">
                Show only at-risk students
                {summary.atRiskCount > 0 && (
                  <span className="ml-1 text-xs text-red-600 dark:text-red-400 font-medium">
                    ({summary.atRiskCount})
                  </span>
                )}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Student Compliance Breakdown
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Click column headers to sort
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fetching compliance data...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadReport}
              className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    {[
                      { key: "studentName" as SortKey, label: "Student" },
                      { key: "companyName" as SortKey, label: "Company" },
                      { key: "completedHours" as SortKey, label: "Hours" },
                      { key: "progress" as SortKey, label: "Progress" },
                      { key: "documentsApproved" as SortKey, label: "Documents" },
                      { key: "evaluationsCompleted" as SortKey, label: "Evaluations" },
                      { key: "averageRating" as SortKey, label: "Rating" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{col.label}</span>
                          <SortIcon column={col.key} />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No students match the current filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => {
                      const atRiskStatus = isAtRisk(item);
                      const docsBadgeColor =
                        item.documentsApproved === item.documentsSubmitted
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";

                      return (
                        <tr
                          key={`${item.studentNumber}-${item.studentName}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.studentName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatStudentId(item.studentNumber)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {item.companyName || "Not Assigned"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                            {item.completedHours} / {item.totalHours}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all ${getProgressColor(item.progress)}`}
                                  style={{ width: `${Math.min(item.progress, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${getProgressTextColor(item.progress)}`}>
                                {item.progress}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${docsBadgeColor}`}
                            >
                              {item.documentsApproved}/{item.documentsSubmitted}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                            {item.evaluationsCompleted}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                            {item.averageRating != null
                              ? item.averageRating.toFixed(1)
                              : "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            {atRiskStatus ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                <AlertTriangle className="w-3 h-3" />
                                <span>At Risk</span>
                              </span>
                            ) : item.progress >= 75 ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                <CheckCircle className="w-3 h-3" />
                                <span>On Track</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                                <Clock className="w-3 h-3" />
                                <span>In Progress</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-3 sm:p-4 space-y-3">
              {paginatedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No students match the current filters.
                  </p>
                </div>
              ) : (
                paginatedItems.map((item) => {
                  const atRiskStatus = isAtRisk(item);
                  return (
                    <div
                      key={`m-${item.studentNumber}`}
                      className={`rounded-xl border p-4 ${
                        atRiskStatus
                          ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                          : "border-gray-100 dark:border-gray-700"
                      }`}
                    >
                      {/* Student header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.studentName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatStudentId(item.studentNumber)}
                          </p>
                        </div>
                        {atRiskStatus ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>At Risk</span>
                          </span>
                        ) : item.progress >= 75 ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <CheckCircle className="w-3 h-3" />
                            <span>On Track</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                            <Clock className="w-3 h-3" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </div>

                      {/* Company */}
                      <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {item.companyName || "Not Assigned"}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                          <span className={`text-xs font-semibold ${getProgressTextColor(item.progress)}`}>
                            {item.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressColor(item.progress)}`}
                            style={{ width: `${Math.min(item.progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Hours</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {item.completedHours}/{item.totalHours}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Documents</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {item.documentsApproved}/{item.documentsSubmitted}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Evaluations</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {item.evaluationsCompleted}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Rating</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {item.averageRating != null
                              ? item.averageRating.toFixed(1)
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing{" "}
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length)}{" "}
                  of {sortedItems.length}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoordinatorReportsTab;
