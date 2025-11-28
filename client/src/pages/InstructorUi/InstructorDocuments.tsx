import { useState, useEffect } from "react";
import {
  FileText,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Calendar,
  Building2,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import {
  instructorService,
  type InstructorDocument,
} from "../../services/instructorService";
import toast from "react-hot-toast";
import DocumentFeedbackPanel from "../../components/document/DocumentFeedbackPanel";
import { aiService } from "../../services/aiService";
import AIGenerateButton from "../../components/ai/AIGenerateButton";

const InstructorDocumentsTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<InstructorDocument | null>(
    null
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [feedback, setFeedback] = useState("");
  const [documents, setDocuments] = useState<InstructorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackDoc, setFeedbackDoc] = useState<InstructorDocument | null>(
    null
  );
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const formatStudentNumber = (value?: string | null) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const upper = trimmed.toUpperCase();
    if (/^\d{2}-UR-\d{4}$/.test(upper)) {
      return upper;
    }
    if (/^\d{2}UR\d{4}$/.test(upper)) {
      return `${upper.slice(0, 2)}-UR-${upper.slice(4)}`;
    }
    const digits = upper.replace(/[^0-9]/g, "");
    if (digits.length === 6) {
      return `${digits.slice(0, 2)}-UR-${digits.slice(2)}`;
    }
    if (digits.length >= 4) {
      return `${digits.slice(0, 2)}-UR-${digits.slice(-4)}`;
    }
    return upper;
  };

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const documentsData = await instructorService.getDocumentsForReview();
      setDocuments(documentsData);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    pending: documents.filter(
      (d) => d.status === "PENDING"
    ).length,
    approved: documents.filter((d) => d.status === "APPROVED").length,
    rejected: documents.filter((d) => d.status === "REJECTED" || d.status === "RESUBMISSION_REQUESTED").length,
    total: documents.length,
  };

  const documentTypes = [...new Set(documents.map((d) => d.documentType))];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      APPROVED:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      RESUBMISSION_REQUESTED:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      case "RESUBMISSION_REQUESTED":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Display rule: treat RESUBMISSION_REQUESTED as "REJECTED" in UI filters
  const getUiStatus = (status: string): "PENDING" | "APPROVED" | "REJECTED" => {
    if (status === "RESUBMISSION_REQUESTED") return "REJECTED";
    return (status as any) || "PENDING";
  };

  const getPriorityFromType = (type: string): "high" | "medium" | "low" => {
    const highPriority = ["final_report", "accomplishment_report"];
    const mediumPriority = ["weekly_report", "monthly_timesheet"];

    if (highPriority.some((t) => type.toLowerCase().includes(t))) return "high";
    if (mediumPriority.some((t) => type.toLowerCase().includes(t)))
      return "medium";
    return "low";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "text-red-600 bg-red-50 dark:bg-red-900/20",
      medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
      low: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    };
    return colors[priority] || colors.medium;
  };

  const handleReview = (
    doc: InstructorDocument,
    action: "approve" | "reject"
  ) => {
    setSelectedDoc(doc);
    setReviewAction(action);
    setShowReviewModal(true);
    setFeedback("");
  };

  const openFeedbackModal = (doc: InstructorDocument) => {
    setFeedbackDoc(doc);
    setShowFeedbackModal(true);
  };

  const submitReview = async () => {
    if (!selectedDoc) return;

    if (reviewAction === "reject" && !feedback.trim()) {
      toast.error("Please provide feedback for rejection");
      return;
    }

    try {
      setSubmitting(true);

      let success = false;
      if (reviewAction === "approve") {
        success = await instructorService.approveDocument(
          selectedDoc.id,
          feedback
        );
      } else {
        success = await instructorService.rejectDocument(
          selectedDoc.id,
          feedback
        );
      }

      if (success) {
        toast.success(`Document ${reviewAction}d successfully!`);
        // Reload documents to get updated data
        await loadDocuments();
      } else {
        toast.error(`Failed to ${reviewAction} document`);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(`Failed to ${reviewAction} document`);
    } finally {
      setSubmitting(false);
      setShowReviewModal(false);
      setSelectedDoc(null);
      setReviewAction(null);
      setFeedback("");
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const blob = await instructorService.downloadDocument(documentId);
      if (blob) {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Document downloaded successfully");
      } else {
        toast.error("Failed to download document");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handlePreview = async (documentId: string, fileName: string) => {
    try {
      const blob = await instructorService.downloadDocument(documentId);
      if (blob) {
        // Create preview URL
        const url = window.URL.createObjectURL(blob);

        // Check if it's a PDF file
        if (fileName.toLowerCase().endsWith(".pdf")) {
          // Open PDF in new tab
          window.open(url, "_blank");
        } else {
          // For other file types, download them
          toast.success(
            "Preview not available for this file type. Downloading instead."
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Clean up URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        toast.error("Failed to preview document");
      }
    } catch (error) {
      console.error("Error previewing document:", error);
      toast.error("Failed to preview document");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    const normalizedStatus = doc.status.toLowerCase();

    // Map statuses to filter buckets (separate resubmission)
    const bucket =
      normalizedStatus === "resubmission_requested"
        ? "resubmission"
        : normalizedStatus;

    const matchesStatus =
      filterStatus === "pending"
        ? bucket === "pending"
        : filterStatus === "approved"
          ? bucket === "approved"
          : filterStatus === "rejected"
            ? bucket === "rejected"
            : filterStatus === "resubmission"
              ? bucket === "resubmission"
              : bucket === filterStatus;
    const matchesType = !filterType || doc.documentType === filterType;
    const matchesPriority =
      !filterPriority ||
      getPriorityFromType(doc.documentType) === filterPriority;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  // Collapse older entries with preference: APPROVED > PENDING > REJECTED/RESUBMISSION
  const visibleDocuments = (() => {
    const approvedKeys = new Set<string>();
    const pendingKeys = new Set<string>();
    for (const d of filteredDocuments) {
      const key = `${d.studentId}::${d.documentType}`;
      if (d.status === "APPROVED") approvedKeys.add(key);
      if (d.status === "PENDING") pendingKeys.add(key);
    }

    const map = new Map<string, any>();
    for (const d of filteredDocuments) {
      const key = `${d.studentId}::${d.documentType}`;

      // If approved exists for key, ignore everything else
      if (approvedKeys.has(key) && d.status !== "APPROVED") continue;
      // If pending exists for key, ignore rejected/resubmission
      if (pendingKeys.has(key) && d.status !== "PENDING") continue;

      const existing = map.get(key);
      if (!existing) {
        map.set(key, d);
        continue;
      }
      const timeExisting = new Date(existing.submittedDate || 0).getTime();
      const timeCurrent = new Date(d.submittedDate || 0).getTime();
      if (timeCurrent > timeExisting) {
        map.set(key, d);
      }
    }

    // If current filter is 'rejected', show only rejected (not resubmission)
    if (filterStatus === "rejected") {
      return Array.from(map.values()).filter(
        (d) => d.status === "REJECTED"
      );
    }
    // If current filter is 'resubmission', show only resubmission entries
    if (filterStatus === "resubmission") {
      return Array.from(map.values()).filter(
        (d) => d.status === "RESUBMISSION_REQUESTED"
      );
    }
    return Array.from(map.values());
  })();

  // Show loading state
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>

        {/* Documents List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Document Review
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Review and provide feedback on student submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-4 gap-6">
        {/* Pending Review Card (dashboard-style) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">Pending Review</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.pending}</p>
              <p className="text-amber-600 dark:text-amber-400 text-sm">Awaiting instructor feedback</p>
            </div>
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">Approved</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.approved}</p>
              <p className="text-green-600 dark:text-green-400 text-sm">Successfully reviewed documents</p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">Rejected</h3>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{stats.rejected}</p>
              <p className="text-red-600 dark:text-red-400 text-sm">Requires revision and resubmission</p>
            </div>
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Documents Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">Total Documents</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total}</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm">All submitted documents</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile Stacked View */}
      <div className="md:hidden space-y-3">
        {/* Pending Review Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">Pending Review</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stats.pending}</p>
              <p className="text-amber-600 dark:text-amber-400 text-xs">Awaiting instructor feedback</p>
            </div>
            <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">Approved</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-0.5">{stats.approved}</p>
              <p className="text-green-600 dark:text-green-400 text-xs">Successfully reviewed documents</p>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">Rejected</h3>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-0.5">{stats.rejected}</p>
              <p className="text-red-600 dark:text-red-400 text-xs">Requires revision and resubmission</p>
            </div>
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Total Documents Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">Total Documents</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stats.total}</p>
              <p className="text-blue-600 dark:text-blue-400 text-xs">All submitted documents</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by student name, document type, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium w-full sm:w-auto sm:min-w-[140px]"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="resubmission">Resubmission</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium w-full sm:w-auto sm:min-w-[140px]"
            >
              <option value="">All Types</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium w-full sm:w-auto sm:min-w-[140px]"
            >
              <option value="">All Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {visibleDocuments.map((doc) => {
          const formattedStudentId = formatStudentNumber(doc.studentId);
          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div className="p-4 sm:p-6">
                {/* Header - Mobile Optimized */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                      {doc.studentAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {doc.studentName}
                          </h3>
                          {formattedStudentId && (
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              ({formattedStudentId})
                            </p>
                          )}
                        </div>
                        {(() => {
                          const uiStatus = getUiStatus(doc.status);
                          const visualStatus =
                            doc.status === "RESUBMISSION_REQUESTED"
                              ? "RESUBMISSION_REQUESTED"
                              : uiStatus;
                          const label =
                            doc.status === "RESUBMISSION_REQUESTED"
                              ? "RESUBMISSION"
                              : uiStatus.toUpperCase();
                          return (
                            <span
                              className={`inline-flex items-center space-x-1 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-full font-medium flex-shrink-0 ${getStatusColor(
                                visualStatus as any
                              )}`}
                            >
                              {getStatusIcon(visualStatus as any)}
                              <span>{label}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{doc.company}</span>
                        {doc.dueDate && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:flex items-center space-x-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>
                                Due: {new Date(doc.dueDate).toLocaleDateString()}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Info - Mobile Optimized */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                    <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <p className="font-semibold sm:font-medium text-gray-900 dark:text-white text-xs sm:text-sm uppercase sm:normal-case truncate">
                            {doc.documentType}
                          </p>
                          <span
                            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium w-fit ${getPriorityColor(
                              getPriorityFromType(doc.documentType)
                            )}`}
                          >
                            {getPriorityFromType(doc.documentType).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                          <span className="truncate">{doc.fileName}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{doc.fileSize}</span>
                        </div>
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
                {(getUiStatus(doc.status) === "APPROVED" || getUiStatus(doc.status) === "REJECTED") &&
                  doc.remarks && (
                    <div
                      className={`rounded-lg p-4 mb-4 ${getUiStatus(doc.status) === "APPROVED"
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-red-50 dark:bg-red-900/20"
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        {getUiStatus(doc.status) === "APPROVED" ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Your Feedback
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {doc.remarks}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Reviewed on {doc.reviewedDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between sm:justify-start space-x-2 sm:space-x-2">
                    <button
                      onClick={() => handlePreview(doc.id, doc.fileName)}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleDownload(doc.id, doc.fileName)}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => openFeedbackModal(doc)}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Feedback</span>
                    </button>
                  </div>

                  {doc.status === "PENDING" && (
                    <div className="flex items-center space-x-2 sm:space-x-2">
                      <button
                        onClick={() => handleReview(doc, "reject")}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors font-medium"
                      >
                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleReview(doc, "approve")}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
                      >
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Approve</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {reviewAction === "approve"
                    ? "Approve Document"
                    : "Reject Document"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Review the submission details before continuing.
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 space-y-5">
              {/* Document Summary */}
              <div className="bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {selectedDoc.studentAvatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedDoc.studentName}
                    </p>
                    {formatStudentNumber(selectedDoc.studentId) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {formatStudentNumber(selectedDoc.studentId)}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedDoc.company}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
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
                className="p-0 border border-gray-100 dark:border-gray-700 rounded-lg"
                allowFeedback={false}
                hideHeader
                compact
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2">
                  <span className="font-medium text-gray-800 dark:text-white">Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                      selectedDoc.status.toUpperCase()
                    )}`}
                  >
                    {getStatusIcon(selectedDoc.status.toUpperCase())}
                    <span>{selectedDoc.status.replace(/_/g, " ").toLowerCase()}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2">
                  <span className="font-medium text-gray-800 dark:text-white">Submitted:</span>
                  <span>{selectedDoc.submittedDate}</span>
                </div>
                {selectedDoc.reviewedDate && (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2">
                    <span className="font-medium text-gray-800 dark:text-white">Last Reviewed:</span>
                    <span>{selectedDoc.reviewedDate}</span>
                  </div>
                )}
              </div>

              {/* Feedback Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {reviewAction === "approve"
                      ? "Feedback (Optional)"
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
                        setFeedback(generatedText);
                        toast.success('Feedback generated successfully');
                      }}
                      size="sm"
                      variant="outline"
                    />
                  )}
                </div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    reviewAction === "approve"
                      ? "Add feedback or comments..."
                      : "Please explain why this document is being rejected..."
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={
                    (reviewAction === "reject" && !feedback.trim()) || submitting
                  }
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${reviewAction === "approve"
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
        </div>
      )}

      {showFeedbackModal && feedbackDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
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
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <DocumentFeedbackPanel
                documentId={feedbackDoc.id}
                allowFeedback
                onFeedbackAdded={() => {
                  loadDocuments();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDocumentsTab;
