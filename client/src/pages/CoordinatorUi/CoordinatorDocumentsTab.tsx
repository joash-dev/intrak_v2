import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Calendar,
  Building2,
  FileText,
  Loader2,
  MessageSquare,
} from "lucide-react";
// Import document service
import { documentService } from "../../services/documentService";
import DocumentFeedbackPanel from "../../components/document/DocumentFeedbackPanel";
import { formatDate, formatDateTime } from "../../services/localeService";
import { aiService } from "../../services/aiService";
import AIGenerateButton from "../../components/ai/AIGenerateButton";
import toast from "react-hot-toast";
import Skeleton from "../../components/Skeleton";

interface Document {
  id: string;
  type: string;
  filename: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED";
  uploadedAt: string | null;
  reviewedAt: string | null;
  remarks: string | null;
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
  const [feedbackDoc, setFeedbackDoc] = useState<Document | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // State for API data
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
          ? formatDateTime(doc.uploadedAt)
          : "Not available",
        dueDate: "Not Set", // This would need to be added to the API
        priority: getPriorityFromType(doc.type),
        description: `${doc.type} submitted by student`,
        reviewedBy: doc.uploadedBy?.name,
        reviewedDate: doc.reviewedAt
          ? formatDateTime(doc.reviewedAt)
          : "Pending",
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
    pending: documents.filter(
      (d) => d.status === "PENDING" || d.status === "RESUBMISSION_REQUESTED"
    ).length,
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
      RESUBMISSION_REQUESTED:
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

  const openFeedbackModal = (doc: Document) => {
    setFeedbackDoc(doc);
    setShowFeedbackModal(true);
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

  const handlePreview = async (doc: Document) => {
    try {
      setPreviewLoading(true);
      setPreviewDoc(doc);
      const blob = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      console.error("Error previewing document:", err);
      setError(err.message || "Failed to preview document");
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewDoc(null);
    setPreviewLoading(false);
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
      (filterStatus === "pending" && doc.status === "RESUBMISSION_REQUESTED") ||
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
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="space-y-3">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Documents List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
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
      <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            Review Documents
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
            Review and approve student document submissions
          </p>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-x-2">
          <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{stats.total} documents</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Desktop View - Hidden on Mobile */}
        <div className="hidden md:block relative overflow-hidden rounded-2xl bg-white dark:bg-[#212124] border border-yellow-100 dark:border-yellow-800 shadow-sm">
          <div className="relative p-5 space-y-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Pending Review
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:block relative overflow-hidden rounded-2xl bg-white dark:bg-[#212124] border border-green-100 dark:border-green-900 shadow-sm">
          <div className="relative p-5 space-y-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Approved
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:block relative overflow-hidden rounded-2xl bg-white dark:bg-[#212124] border border-red-100 dark:border-red-900 shadow-sm">
          <div className="relative p-5 space-y-3">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Rejected
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:block relative overflow-hidden rounded-2xl bg-white dark:bg-[#212124] border border-purple-100 dark:border-purple-900 shadow-sm">
          <div className="relative p-5 space-y-3">
            <FileCheck className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total Documents
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile View - Hidden on Desktop */}
        <div className="md:hidden space-y-3">
          {/* Pending Review Card */}
          <div className="rounded-xl bg-white dark:bg-[#212124] border border-yellow-500 dark:border-yellow-600 shadow-sm">
            <div className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-1">
                  Pending Review
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          {/* Approved Card */}
          <div className="rounded-xl bg-white dark:bg-[#212124] border border-green-500 dark:border-green-600 shadow-sm">
            <div className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-1">
                  Approved
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.approved}
                </p>
              </div>
            </div>
          </div>

          {/* Rejected Card */}
          <div className="rounded-xl bg-white dark:bg-[#212124] border border-red-500 dark:border-red-600 shadow-sm">
            <div className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-1">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </div>

          {/* Total Documents Card */}
          <div className="rounded-xl bg-white dark:bg-[#212124] border border-purple-500 dark:border-purple-600 shadow-sm">
            <div className="p-4 flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-1">
                  Total Documents
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by student name, document type, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
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
            className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
          >
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                    {doc.studentAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {doc.studentName}
                      </h3>
                      <span className="text-xs sm:text-sm text-gray-500">
                        ({doc.studentId})
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full ${getPriorityColor(
                          doc.priority || "medium"
                        )}`}
                      >
                        {doc.priority || "medium"} priority
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{doc.company}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>
                          Due: {doc.dueDate ? formatDate(doc.dueDate) : "Not Set"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${getStatusColor(
                    doc.status
                  )}`}
                >
                  {doc.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Document Info */}
              <div className="bg-gray-50 dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4 sm:[&_svg]:w-5 sm:[&_svg]:h-5">
                      {getFileIcon(doc.fileType || "pdf")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                        {doc.documentType}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1 break-all">
                        {doc.fileName} • {doc.fileSizeMB}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                        {doc.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-[10px] sm:text-xs text-gray-500">Submitted</p>
                    <p className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white">
                      {doc.submittedDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review Info (if reviewed) */}
              {(doc.status === "APPROVED" || doc.status === "REJECTED") &&
                doc.remarks && (
                  <div
                    className={`rounded-lg sm:rounded-2xl border p-3 sm:p-4 mb-3 sm:mb-4 ${doc.status === "APPROVED"
                        ? "border-green-200 bg-green-50/80 dark:border-green-700/60 dark:bg-green-900/20"
                        : "border-red-200 bg-red-50/80 dark:border-red-700/60 dark:bg-red-900/20"
                      }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {doc.status === "APPROVED" ? (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          Review Remarks
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {doc.remarks}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 mt-2 text-[10px] sm:text-xs text-gray-500">
                          <span>Reviewed by: {doc.reviewedBy}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{doc.reviewedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <button
                    onClick={() => handlePreview(doc)}
                    disabled={previewLoading}
                    className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {previewLoading && previewDoc?.id === doc.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => openFeedbackModal(doc)}
                    className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Feedback</span>
                  </button>
                </div>

                {doc.status === "PENDING" && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReview(doc, "reject")}
                      className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg sm:rounded-xl transition-colors font-medium text-xs sm:text-sm"
                    >
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleReview(doc, "approve")}
                      className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg sm:rounded-xl transition-colors font-medium text-xs sm:text-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
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
            <div className="bg-gray-50 dark:bg-[#212124] rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
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
                {getFileIcon(selectedDoc.fileType || "pdf")}
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {selectedDoc.documentType}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedDoc.fileName}
              </p>
            </div>

            <DocumentFeedbackPanel
              documentId={selectedDoc.id}
              className="mb-6"
              allowFeedback={false}
              hideHeader
              compact
            />

            {/* Remarks Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {reviewAction === "approve"
                    ? "Approval Comments (Optional)"
                    : "Rejection Reason (Required)"}
                </label>
                {selectedDoc && reviewAction && (
                  <AIGenerateButton
                    onGenerate={async () => {
                      return aiService.generateDocumentFeedback({
                        documentId: selectedDoc.id,
                        action: reviewAction,
                      });
                    }}
                    onSuccess={(generatedText) => {
                      setRemarks(generatedText);
                      toast.success('Feedback generated successfully');
                    }}
                    size="sm"
                    variant="outline"
                  />
                )}
              </div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  reviewAction === "approve"
                    ? "Add any additional comments..."
                    : "Please provide a reason for rejection..."
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
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
                className={`px-6 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2 ${reviewAction === "approve"
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

      {showFeedbackModal && feedbackDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {feedbackDoc.studentAvatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Feedback for {feedbackDoc.studentName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {feedbackDoc.documentType} • {feedbackDoc.fileName}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackDoc(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <DocumentFeedbackPanel
                documentId={feedbackDoc.id}
                allowFeedback
                onFeedbackAdded={() => {
                  fetchDocuments();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[70] flex items-center justify-center p-3 sm:p-4"
          style={{ margin: "0" }}
          onClick={closePreview}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                  {previewDoc.studentAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
                    {previewDoc.studentName}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {previewDoc.documentType} • {previewDoc.fileName || previewDoc.filename}
                  </p>
                </div>
              </div>
              <button
                onClick={closePreview}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title="Close Preview"
              >
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Loading document...
                    </p>
                  </div>
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={`Preview of ${previewDoc.fileName || previewDoc.filename}`}
                  style={{ minHeight: "500px" }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorDocumentsTab;
