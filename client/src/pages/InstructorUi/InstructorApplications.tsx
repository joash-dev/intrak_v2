import React, { useState, useEffect, useMemo } from "react";
import {
  FileCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MapPin,
  Briefcase,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { formatStudentId } from "../../utils/formatStudentId";

interface CompanyApplication {
  id: string;
  studentId: string;
  companyId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  message?: string;
  rejectionReason?: string;
  appliedAt: string;
  reviewedAt?: string;
  student: {
    studentNumber: string;
    program: string;
    year: number;
    user: {
      name: string;
      email: string;
    };
  };
  company: {
    id: string;
    name: string;
    address: string;
    industry?: string;
    maxSlots: number;
    students: any[];
  };
  reviewer?: {
    name: string;
    email: string;
  };
}

const ITEMS_PER_PAGE = 8;

const InstructorApplications: React.FC = () => {
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] =
    useState<CompanyApplication | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/company-applications", {
        params: { status: statusFilter === "all" ? undefined : statusFilter },
      });
      setApplications(response.data.applications || []);
    } catch (error: any) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const handleApprove = (application: CompanyApplication) => {
    setSelectedApplication(application);
    setShowApproveModal(true);
  };

  const handleReject = (application: CompanyApplication) => {
    setSelectedApplication(application);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedApplication) return;
    try {
      setProcessing(true);
      await api.patch(
        `/company-applications/${selectedApplication.id}/approve`
      );
      toast.success(
        `Application approved for ${selectedApplication.student.user.name}`
      );
      setShowApproveModal(false);
      setSelectedApplication(null);
      await loadApplications();
    } catch (error: any) {
      console.error("Error approving application:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve application"
      );
    } finally {
      setProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedApplication) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      setProcessing(true);
      await api.patch(
        `/company-applications/${selectedApplication.id}/reject`,
        { rejectionReason }
      );
      toast.success(
        `Application rejected for ${selectedApplication.student.user.name}`
      );
      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectionReason("");
      await loadApplications();
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      toast.error(
        error.response?.data?.message || "Failed to reject application"
      );
    } finally {
      setProcessing(false);
    }
  };

  const getAvailableSlots = (company: any) => {
    const currentStudents = company.students?.length || 0;
    const maxSlots = company.maxSlots || 10;
    return maxSlots - currentStudents;
  };

  // Stats
  const stats = useMemo(() => {
    const pending = applications.filter((a) => a.status === "PENDING").length;
    const approved = applications.filter((a) => a.status === "APPROVED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;
    const withdrawn = applications.filter((a) => a.status === "WITHDRAWN").length;
    return { total: applications.length, pending, approved, rejected, withdrawn };
  }, [applications]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase();
      return (
        app.student.user.name.toLowerCase().includes(q) ||
        app.student.studentNumber.toLowerCase().includes(q) ||
        app.company.name.toLowerCase().includes(q)
      );
    });
  }, [applications, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      case "WITHDRAWN":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Withdrawn
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm min-h-screen dark:bg-[#19191c]">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Company Applications
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Review and approve student applications to companies
              </p>
            </div>
          </div>
          {stats.pending > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {stats.pending} pending
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FileCheck, bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-300" },
          { label: "Pending", value: stats.pending, icon: Clock, bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-300" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, bg: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600 dark:text-green-300" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, bg: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-300" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#212124] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className={`p-2 ${stat.bg} rounded-lg w-fit mb-2`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {stat.label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student name, ID, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[130px]"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white dark:bg-[#212124] rounded-xl p-10 sm:p-16 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full w-fit mx-auto mb-4">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            No applications found
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "Try adjusting your search or filter."
              : "Applications will appear here when students apply."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedApplications.map((application) => {
            const availableSlots = getAvailableSlots(application.company);

            return (
              <div
                key={application.id}
                className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-4 sm:p-5">
                  {/* Main Row: Student + Status/Actions */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Student Info */}
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {application.student.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                          {application.student.user.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center">
                            <User className="w-3 h-3 mr-0.5" />
                            {formatStudentId(application.student.studentNumber)}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {application.student.program} - Year {application.student.year}
                          </span>
                        </div>
                        <div className="flex items-center mt-0.5 sm:hidden">
                          <Mail className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {application.student.user.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {getStatusBadge(application.status)}
                    </div>
                  </div>

                  {/* Company Card */}
                  <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {application.company.name}
                          </h4>
                          {application.company.industry && (
                            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium flex-shrink-0">
                              {application.company.industry}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-start gap-1">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
                          <span className="min-w-0 break-words">{application.company.address}</span>
                        </p>
                        <div className="mt-1.5">
                          {availableSlots > 0 ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium inline-flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {availableSlots} slot{availableSlots !== 1 ? "s" : ""} available
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium inline-flex items-center">
                              <XCircle className="w-3 h-3 mr-1" />
                              No slots available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Message */}
                  {application.message && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-lg p-2.5 min-w-0 max-w-full">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-52 overflow-y-auto overscroll-contain break-words whitespace-pre-wrap">
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Message: </span>
                        {application.message}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {application.rejectionReason && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-lg p-2.5 min-w-0 max-w-full">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-40 overflow-y-auto overscroll-contain break-words whitespace-pre-wrap">
                        <span className="font-semibold text-red-700 dark:text-red-300">Rejection Reason: </span>
                        {application.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Footer: Dates + Actions */}
                  <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <span className="inline-flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Applied {formatDate(application.appliedAt)}
                      </span>
                      {application.reviewedAt && (
                        <span className="inline-flex items-center">
                          <Briefcase className="w-3 h-3 mr-1" />
                          Reviewed {formatDate(application.reviewedAt)}
                          {application.reviewer && ` by ${application.reviewer.name}`}
                        </span>
                      )}
                    </div>

                    {/* Actions for Pending */}
                    {application.status === "PENDING" && (
                      <div className="flex space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(application)}
                          disabled={availableSlots <= 0}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(application)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-[#212124] rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredApplications.length)} of {filteredApplications.length}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-1 text-xs text-gray-400">…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          page === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 max-h-[min(90vh,100%)] overflow-y-auto overscroll-contain my-auto">
            <div className="flex items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">
              Approve Application
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
              Approve{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {selectedApplication.student.user.name}
              </span>
              's application to{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {selectedApplication.company.name}
              </span>
              ?
            </p>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5 mb-5">
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong>Note:</strong> The student will be assigned to this
                company and all other pending applications will be automatically
                rejected.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedApplication(null);
                }}
                disabled={processing}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={processing}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Approve"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 max-h-[min(90vh,100%)] overflow-y-auto overscroll-contain my-auto">
            <div className="flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">
              Reject Application
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
              Reject{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {selectedApplication.student.user.name}
              </span>
              's application to{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {selectedApplication.company.name}
              </span>
            </p>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
                maxLength={4000}
                className="w-full min-h-[4.5rem] max-h-52 resize-y overflow-y-auto px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent break-words"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApplication(null);
                  setRejectionReason("");
                }}
                disabled={processing}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorApplications;
