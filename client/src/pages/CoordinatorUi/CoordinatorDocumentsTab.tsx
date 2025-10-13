import React, { useState, useEffect } from "react";
import {
  FileCheck,
  FileX,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  Paperclip,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
} from "lucide-react";
import { documentService } from "../../services/documentService";
import { coordinatorService } from "../../services/coordinatorService";

interface Document {
  id: string;
  type: string;
  filename: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  uploadedAt: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  fileSize?: number;
  fileSizeMB?: string;
  student?: {
    studentNumber: string;
    user: {
      name: string;
    };
  };
  uploadedBy?: {
    name: string;
    email: string;
  };
  // Additional fields for display
  studentName?: string;
  studentId?: string;
  studentAvatar?: string;
  company?: string;
  documentType?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: "pdf" | "doc" | "image" | "excel";
  submittedDate?: string;
  dueDate?: string;
  priority?: "high" | "medium" | "low";
  description?: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

const CoordinatorDocumentsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [remarks, setRemarks] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // State for API data
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch documents using the document service
      const response = await documentService.getDocuments();
      const documentsData = response.documents || [];

      // Transform API data to match our display format
      const transformedDocuments = documentsData.map((doc: any) => ({
        ...doc,
        studentName: doc.student?.user?.name || "Unknown Student",
        studentId: doc.student?.studentNumber || "N/A",
        studentAvatar: generateAvatar(doc.student?.user?.name || "Unknown"),
        company: "Company Not Available", // This would need to come from student data
        documentType: doc.type,
        fileName: doc.filename,
        fileSize: doc.fileSizeMB || "Unknown",
        fileType: getFileTypeFromFilename(doc.filename),
        submittedDate: doc.uploadedAt
          ? new Date(doc.uploadedAt).toLocaleString()
          : "Unknown",
        dueDate: "Not Set", // This would need to be added to the API
        priority: getPriorityFromType(doc.type),
        description: `${doc.type} submitted by student`,
        reviewedBy: doc.uploadedBy?.name,
        reviewedDate: doc.reviewedAt
          ? new Date(doc.reviewedAt).toLocaleString()
          : undefined,
      }));

      setDocuments(transformedDocuments);
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError(err.message || "Failed to fetch documents");
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

  const getFileTypeFromFilename = (
    filename: string
  ): "pdf" | "doc" | "image" | "excel" => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "pdf";
      case "doc":
      case "docx":
        return "doc";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "image";
      case "xlsx":
      case "xls":
        return "excel";
      default:
        return "pdf";
    }
  };

  const getPriorityFromType = (type: string): "high" | "medium" | "low" => {
    const highPriority = [
      "Weekly Report",
      "Accomplishment Report",
      "Medical Certificate",
    ];
    const mediumPriority = ["Timesheet", "Leave Request"];

    if (highPriority.some((t) => type.includes(t))) return "high";
    if (mediumPriority.some((t) => type.includes(t))) return "medium";
    return "low";
  };

  const stats = {
    pending: documents.filter((d) => d.status === "PENDING").length,
    approved: documents.filter((d) => d.status === "APPROVED").length,
    rejected: documents.filter((d) => d.status === "REJECTED").length,
    total: documents.length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      APPROVED:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      approved:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      resubmission_required:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    };
    return colors[status] || colors.PENDING;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "text-red-600 bg-red-50 dark:bg-red-900/20",
      medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
      low: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    };
    return colors[priority] || colors.medium;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-600" />;
      case "excel":
        return <FileText className="w-5 h-5 text-green-600" />;
      case "doc":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "image":
        return <FileText className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleReview = (doc: Document, action: "approve" | "reject") => {
    setSelectedDoc(doc);
    setReviewAction(action);
    setShowReviewModal(true);
    setRemarks("");
  };

  const submitReview = async () => {
    if (!selectedDoc || !reviewAction) return;

    try {
      setSubmitting(true);

      // Call the appropriate API endpoint based on action
      if (reviewAction === "approve") {
        await documentService.approveDocument(selectedDoc.id, remarks);
      } else {
        await documentService.rejectDocument(selectedDoc.id, remarks);
      }

      // Refresh the documents list
      await fetchDocuments();

      // Close modal and reset state
      setShowReviewModal(false);
      setSelectedDoc(null);
      setReviewAction(null);
      setRemarks("");
    } catch (err: any) {
      console.error("Error reviewing document:", err);
      setError(err.message || "Failed to review document");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error downloading document:", err);
      setError(err.message || "Failed to download document");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      (doc.studentName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (doc.documentType || doc.type || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (doc.fileName || doc.filename || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && doc.status === "PENDING") ||
      (filterStatus === "approved" && doc.status === "APPROVED") ||
      (filterStatus === "rejected" && doc.status === "REJECTED");

    const matchesType =
      filterType === "all" || (doc.documentType || doc.type) === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const documentTypes = [
    ...new Set(documents.map((d) => d.documentType || d.type)),
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading documents...
          </span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Review Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve student document submissions
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200 font-medium">
              Error loading documents
            </span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
          <button
            onClick={fetchDocuments}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Review Documents
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and approve student document submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending Review
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Approved
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.approved}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rejected
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats.rejected}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Documents
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileCheck className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, document type, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {doc.studentAvatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {doc.studentName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({doc.studentId})
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                          doc.priority
                        )}`}
                      >
                        {doc.priority} priority
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>{doc.company}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Due: {new Date(doc.dueDate).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                    doc.status
                  )}`}
                >
                  {doc.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Document Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getFileIcon(doc.fileType)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {doc.documentType}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {doc.fileName} • {doc.fileSize}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {doc.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {doc.submittedDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review Info (if reviewed) */}
              {(doc.status === "APPROVED" || doc.status === "REJECTED") &&
                doc.remarks && (
                  <div
                    className={`border-l-4 rounded-xl p-4 mb-4 ${
                      doc.status === "APPROVED"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-red-500 bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {doc.status === "APPROVED" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          Review Remarks
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {doc.remarks}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Reviewed by: {doc.reviewedBy}</span>
                          <span>•</span>
                          <span>{doc.reviewedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Preview</span>
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Download</span>
                  </button>
                </div>

                {doc.status === "PENDING" && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReview(doc, "reject")}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-xl transition-colors font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Reject</span>
                    </button>
                    <button
                      onClick={() => handleReview(doc, "approve")}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-xl transition-colors font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Approve</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No documents found
          </p>
          <p className="text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {reviewAction === "approve"
                  ? "Approve Document"
                  : "Reject Document"}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Document Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {selectedDoc.studentAvatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedDoc.studentName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDoc.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                {getFileIcon(selectedDoc.fileType)}
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {selectedDoc.documentType}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedDoc.fileName}
              </p>
            </div>

            {/* Remarks Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {reviewAction === "approve"
                  ? "Approval Comments (Optional)"
                  : "Rejection Reason (Required)"}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  reviewAction === "approve"
                    ? "Add any additional comments..."
                    : "Please provide a reason for rejection..."
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={
                  submitting || (reviewAction === "reject" && !remarks.trim())
                }
                className={`px-6 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2 ${
                  reviewAction === "approve"
                    ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
                    : "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
                } disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : reviewAction === "approve" ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Document</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Reject Document</span>
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

export default CoordinatorDocumentsTab;
