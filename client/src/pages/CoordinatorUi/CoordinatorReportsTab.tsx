import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Download,
  Search,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { reportService } from "../../services/reportService";
import type {
  ComplianceReportItem,
  ComplianceReportResponse,
} from "../../services/reportService";
import { companyService, type Company } from "../../services/companyService";

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

  const filteredItems = useMemo(() => {
    if (!report) return [];

    return report.items.filter((item) => {
      const matchesSearch =
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.companyName || "Not Assigned")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const atRisk =
        item.totalHours > 0 &&
        item.completedHours / item.totalHours < 0.5 &&
        item.documentsApproved < item.documentsSubmitted;

      return matchesSearch && (!showOnlyAtRisk || atRisk);
    });
  }, [report, searchQuery, showOnlyAtRisk]);

  const summary = useMemo(() => {
    if (!report) {
      return {
        totalStudents: 0,
        averageProgress: 0,
        totalApprovedDocuments: 0,
        totalCompletedHours: 0,
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

    return {
      totalStudents,
      averageProgress:
        totalStudents > 0 ? Number((totalProgress / totalStudents).toFixed(1)) : 0,
      totalApprovedDocuments,
      totalCompletedHours,
    };
  }, [report]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded-full">
              Students
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {summary.totalStudents}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Students in report
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 px-2 py-1 rounded-full">
              Progress
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {summary.averageProgress}%
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Average completion rate
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/40 px-2 py-1 rounded-full">
              Documents
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {summary.totalApprovedDocuments}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Approved documents
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-300" />
            </div>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded-full">
              Hours
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {summary.totalCompletedHours}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hours completed across cohort
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Compliance Overview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review student compliance across partner companies and export the
              results for documentation.
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Preparing..." : "Download Excel"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              disabled={companyLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, student number, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="md:col-span-1 flex items-end">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showOnlyAtRisk}
                onChange={(e) => setShowOnlyAtRisk(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span>
                Show only students at risk (slow progress & pending docs)
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Student Compliance Breakdown
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Filter and review compliance metrics for each intern.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Fetching compliance data...
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
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents (Approved/Total)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluations
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No students match the current filters.
                    </td>
                  </tr>
                )}
                {filteredItems.map((item: ComplianceReportItem) => {
                  const progressColor =
                    item.progress >= 75
                      ? "text-green-600 dark:text-green-300"
                      : item.progress >= 50
                      ? "text-amber-600 dark:text-amber-300"
                      : "text-red-600 dark:text-red-300";

                  const documentsBadgeColor =
                    item.documentsApproved === item.documentsSubmitted
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";

                  return (
                    <tr key={`${item.studentNumber}-${item.studentName}`}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="font-semibold">{item.studentName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.studentNumber} • {item.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.companyName || "Not Assigned"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.completedHours} / {item.totalHours}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${progressColor}`}>
                          {item.progress}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${documentsBadgeColor}`}
                        >
                          {item.documentsApproved}/{item.documentsSubmitted}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.evaluationsCompleted}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.averageRating ?? "—"}
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
              Compliance Tracking Tips
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Use this report to identify students who need assistance with
              document submission or internship hours completion.
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Filter by company to review a specific partner’s interns.</li>
              <li>• “At risk” highlights students with low progress and incomplete documents.</li>
              <li>• Export the report after every review meeting for documentation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorReportsTab;

