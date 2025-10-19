import { useState, useEffect } from "react";
import {
  FileText,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Calendar,
  Building2,
  X,
  Loader2,
} from "lucide-react";
import {
  instructorService,
  type InstructorDocument,
} from "../../services/instructorService";
import toast from "react-hot-toast";

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

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      console.log("Loading documents for instructor review...");
      const documentsData = await instructorService.getDocumentsForReview();
      setDocuments(documentsData);
      console.log("Documents loaded:", documentsData.length);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    pending: documents.filter((d) => d.status === "PENDING").length,
    approved: documents.filter((d) => d.status === "APPROVED").length,
    rejected: documents.filter((d) => d.status === "REJECTED").length,
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
      default:
        return <Clock className="w-4 h-4" />;
    }
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

    const matchesStatus = doc.status.toLowerCase() === filterStatus;
    const matchesType = !filterType || doc.documentType === filterType;
    const matchesPriority =
      !filterPriority ||
      getPriorityFromType(doc.documentType) === filterPriority;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading documents...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Document Review
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review and provide feedback on student submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pending Review Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200 dark:border-amber-800">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-400/5 dark:to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {stats.pending}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Pending Review
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Awaiting instructor feedback
              </p>
            </div>
          </div>
        </div>

        {/* Approved Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-200 dark:border-emerald-800">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-400/5 dark:to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {stats.approved}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                Approved
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Successfully reviewed documents
              </p>
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-rose-200 dark:border-rose-800">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-red-500/10 dark:from-rose-400/5 dark:to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                  {stats.rejected}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100 mb-1">
                Rejected
              </h3>
              <p className="text-sm text-rose-700 dark:text-rose-400">
                Requires revision and resubmission
              </p>
            </div>
          </div>
        </div>

        {/* Total Documents Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-200 dark:border-indigo-800">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/5 dark:to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                  {stats.total}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                Total Documents
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                All submitted documents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, document type, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium min-w-[140px]"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium min-w-[140px]"
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
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium min-w-[140px]"
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
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
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
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>{doc.company}</span>
                      </span>
                      {doc.dueDate && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Due: {new Date(doc.dueDate).toLocaleDateString()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center space-x-1 text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                    doc.status
                  )}`}
                >
                  {getStatusIcon(doc.status)}
                  <span>{doc.status.toLowerCase()}</span>
                </span>
              </div>

              {/* Document Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {doc.documentType}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(
                            getPriorityFromType(doc.documentType)
                          )}`}
                        >
                          {getPriorityFromType(doc.documentType)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
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
                    className={`border-l-4 rounded-lg p-4 mb-4 ${
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

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePreview(doc.id, doc.fileName)}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Preview</span>
                  </button>
                  <button
                    onClick={() => handleDownload(doc.id, doc.fileName)}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Download</span>
                  </button>
                </div>

                {doc.status === "PENDING" && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReview(doc, "reject")}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Reject</span>
                    </button>
                    <button
                      onClick={() => handleReview(doc, "approve")}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
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
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Document Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
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
                <FileText className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {selectedDoc.documentType}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedDoc.fileName}
              </p>
            </div>

            {/* Feedback Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {reviewAction === "approve"
                  ? "Feedback (Optional)"
                  : "Rejection Reason (Required)"}
              </label>
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
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
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

export default InstructorDocumentsTab;
