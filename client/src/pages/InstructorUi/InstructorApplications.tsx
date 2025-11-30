import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

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
        {
          rejectionReason,
        }
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

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student.studentNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      app.company.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>

        {/* Filters Skeleton */}
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>

        {/* Applications List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm md:text-base min-h-screen dark:bg-[#19191c]">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Company Applications
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Review and approve student applications to companies
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs md:text-sm">
            <FileCheck className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {applications.filter((a) => a.status === "PENDING").length}{" "}
              pending applications
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student name, ID, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white dark:bg-[#212124] rounded-xl p-8 sm:p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <FileCheck className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              No applications found
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View - Hidden on Mobile */}
            <div className="hidden lg:block space-y-4">
              {filteredApplications.map((application) => {
                const availableSlots = getAvailableSlots(application.company);

                return (
                  <div
                    key={application.id}
                    className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Student Info */}
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {application.student.user.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {application.student.user.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <span className="inline-flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {application.student.studentNumber}
                              </span>
                              <span>•</span>
                              <span>
                                {application.student.program} - Year{" "}
                                {application.student.year}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {application.student.user.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Company Info */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                          <div className="flex items-start space-x-3">
                            <Building2 className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {application.company.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {application.company.address}
                              </p>
                              {application.company.industry && (
                                <span className="inline-block mt-1 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                  {application.company.industry}
                                </span>
                              )}
                              <div className="mt-2 text-sm">
                                {availableSlots > 0 ? (
                                  <span className="text-green-600 dark:text-green-400 font-semibold">
                                    ✓ {availableSlots} slot
                                    {availableSlots !== 1 ? "s" : ""} available
                                  </span>
                                ) : (
                                  <span className="text-red-600 dark:text-red-400 font-semibold">
                                    ✗ No slots available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Application Message */}
                        {application.message && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong className="text-blue-900 dark:text-blue-200">
                                Message:
                              </strong>{" "}
                              {application.message}
                            </p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {application.rejectionReason && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong className="text-red-900 dark:text-red-200">
                                Rejection Reason:
                              </strong>{" "}
                              {application.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Applied:{" "}
                            {new Date(application.appliedAt).toLocaleString()}
                          </span>
                          {application.reviewedAt && (
                            <>
                              <span>•</span>
                              <span>
                                Reviewed:{" "}
                                {new Date(application.reviewedAt).toLocaleString()}
                              </span>
                            </>
                          )}
                          {application.reviewer && (
                            <>
                              <span>•</span>
                              <span>By: {application.reviewer.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col items-end space-y-2">
                        {application.status === "PENDING" && (
                          <>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(application)}
                                disabled={availableSlots <= 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                              >
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(application)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                              >
                                <XCircle className="w-4 h-4 inline mr-1" />
                                Reject
                              </button>
                            </div>
                          </>
                        )}
                        {application.status === "APPROVED" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </span>
                        )}
                        {application.status === "REJECTED" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </span>
                        )}
                        {application.status === "WITHDRAWN" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-[#212124]/20 dark:text-gray-400">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Withdrawn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Card View - Hidden on Desktop */}
            <div className="lg:hidden space-y-3">
              {filteredApplications.map((application) => {
                const availableSlots = getAvailableSlots(application.company);

                return (
                  <div
                    key={application.id}
                    className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700"
                  >
                    {/* Student Header with Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {application.student.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {application.student.user.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {application.student.studentNumber}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {application.student.program}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Year {application.student.year}
                          </p>
                          <div className="flex items-center mt-1">
                            <Mail className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {application.student.user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <div className="flex-shrink-0 ml-2">
                        {application.status === "PENDING" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        )}
                        {application.status === "APPROVED" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </span>
                        )}
                        {application.status === "REJECTED" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </span>
                        )}
                        {application.status === "WITHDRAWN" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-[#212124]/30 dark:text-gray-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Withdrawn
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Company Info Card */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                      <div className="flex items-start space-x-2">
                        <Building2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                            {application.company.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {application.company.address}
                          </p>
                          <div className="mt-1.5">
                            {availableSlots > 0 ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-semibold inline-flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {availableSlots} slot{availableSlots !== 1 ? "s" : ""} available
                              </span>
                            ) : (
                              <span className="text-xs text-red-600 dark:text-red-400 font-semibold inline-flex items-center">
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
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 mb-3">
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          <strong className="text-blue-900 dark:text-blue-200">Message:</strong>{" "}
                          {application.message}
                        </p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {application.rejectionReason && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 mb-3">
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          <strong className="text-red-900 dark:text-red-200">Rejection Reason:</strong>{" "}
                          {application.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Dates Section */}
                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        <span>Applied: {new Date(application.appliedAt).toLocaleString()}</span>
                      </div>
                      {application.reviewedAt && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1.5 flex-shrink-0" />
                          <span>Reviewed: {new Date(application.reviewedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {application.reviewer && (
                        <div className="flex items-center">
                          <span>By: {application.reviewer.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Pending Status */}
                    {application.status === "PENDING" && (
                      <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleApprove(application)}
                          disabled={availableSlots <= 0}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center justify-center"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(application)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium flex items-center justify-center"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Approve Application
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to approve{" "}
              <span className="font-semibold">
                {selectedApplication.student.user.name}
              </span>
              's application to{" "}
              <span className="font-semibold">
                {selectedApplication.company.name}
              </span>
              ?
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
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
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Approve Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Reject Application
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Rejecting{" "}
              <span className="font-semibold">
                {selectedApplication.student.user.name}
              </span>
              's application to{" "}
              <span className="font-semibold">
                {selectedApplication.company.name}
              </span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Reject Application"
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
