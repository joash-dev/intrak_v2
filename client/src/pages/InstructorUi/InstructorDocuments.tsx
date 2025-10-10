import { useState } from "react";
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
} from "lucide-react";

interface Document {
  id: string;
  studentName: string;
  studentId: string;
  studentAvatar: string;
  company: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  submittedDate: string;
  dueDate: string;
  status: "pending" | "approved" | "rejected";
  description: string;
  remarks?: string | null;
  reviewedDate?: string;
}

const InstructorDocumentsTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [feedback, setFeedback] = useState("");

  const documents: Document[] = [
    {
      id: "1",
      studentName: "Maria Santos",
      studentId: "2021-001",
      studentAvatar: "MS",
      company: "TechCorp Inc.",
      documentType: "Weekly Report",
      fileName: "Weekly_Report_Week10.pdf",
      fileSize: "2.4 MB",
      submittedDate: "2024-10-04 09:30 AM",
      dueDate: "2024-10-04",
      status: "pending",
      description:
        "Weekly progress report covering tasks completed from Sept 27 - Oct 3, 2024",
      remarks: null,
    },
    {
      id: "2",
      studentName: "Juan Dela Cruz",
      studentId: "2021-002",
      studentAvatar: "JD",
      company: "InnovateLab",
      documentType: "Monthly Timesheet",
      fileName: "Timesheet_September_2024.xlsx",
      fileSize: "156 KB",
      submittedDate: "2024-10-03 02:15 PM",
      dueDate: "2024-10-05",
      status: "pending",
      description: "Monthly timesheet for September 2024 with daily hour logs",
    },
    {
      id: "3",
      studentName: "Ana Reyes",
      studentId: "2021-003",
      studentAvatar: "AR",
      company: "DataSystems Corp",
      documentType: "Accomplishment Report",
      fileName: "Accomplishment_Report_Q3.pdf",
      fileSize: "3.1 MB",
      submittedDate: "2024-10-02 11:45 AM",
      dueDate: "2024-10-01",
      status: "pending",
      description: "Quarterly accomplishment report with project deliverables",
    },
    {
      id: "4",
      studentName: "Carlos Martinez",
      studentId: "2021-004",
      studentAvatar: "CM",
      company: "CloudTech Solutions",
      documentType: "Weekly Report",
      fileName: "Weekly_Report_Week9.pdf",
      fileSize: "1.8 MB",
      submittedDate: "2024-10-01 04:20 PM",
      dueDate: "2024-09-30",
      status: "approved",
      description: "Weekly progress report for Week 9",
      remarks:
        "Excellent work! Your documentation is thorough and well-organized.",
      reviewedDate: "2024-10-02 09:00 AM",
    },
    {
      id: "5",
      studentName: "Sofia Garcia",
      studentId: "2021-005",
      studentAvatar: "SG",
      company: "WebDev Studio",
      documentType: "Final Report",
      fileName: "Final_Internship_Report.pdf",
      fileSize: "5.2 MB",
      submittedDate: "2024-09-28 03:00 PM",
      dueDate: "2024-09-30",
      status: "approved",
      description:
        "Comprehensive final internship report with all deliverables",
      remarks: "Outstanding work throughout your internship. Well done!",
      reviewedDate: "2024-09-29 10:30 AM",
    },
  ];

  const stats = {
    pending: documents.filter((d) => d.status === "pending").length,
    approved: documents.filter((d) => d.status === "approved").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
    total: documents.length,
  };

  const documentTypes = [...new Set(documents.map((d) => d.documentType))];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      approved:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleReview = (doc: Document, action: "approve" | "reject") => {
    setSelectedDoc(doc);
    setReviewAction(action);
    setShowReviewModal(true);
    setFeedback("");
  };

  const submitReview = () => {
    if (!selectedDoc) return;

    if (reviewAction === "reject" && !feedback.trim()) {
      alert("Please provide feedback for rejection");
      return;
    }

    alert(
      `Document ${reviewAction}d!\nDocument: ${
        selectedDoc.fileName
      }\nFeedback: ${feedback || "No feedback provided"}`
    );
    setShowReviewModal(false);
    setSelectedDoc(null);
    setReviewAction(null);
    setFeedback("");
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    const matchesType = filterType === "all" || doc.documentType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Document Review
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and provide feedback on student submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-red-500">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
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
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, document type, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                  className={`inline-flex items-center space-x-1 text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                    doc.status
                  )}`}
                >
                  {getStatusIcon(doc.status)}
                  <span>{doc.status}</span>
                </span>
              </div>

              {/* Document Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
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
              {(doc.status === "approved" || doc.status === "rejected") &&
                doc.remarks && (
                  <div
                    className={`border-l-4 rounded-lg p-4 mb-4 ${
                      doc.status === "approved"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-red-500 bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {doc.status === "approved" ? (
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
                  <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Preview</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Download</span>
                  </button>
                </div>

                {doc.status === "pending" && (
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
                disabled={reviewAction === "reject" && !feedback.trim()}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  reviewAction === "approve"
                    ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
                    : "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
                } disabled:cursor-not-allowed`}
              >
                {reviewAction === "approve" ? (
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
