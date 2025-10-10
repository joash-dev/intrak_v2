import { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  User,
  Building2,
  FileCheck,
  AlertCircle,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

const ViewDocuments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const students = [
    { id: "1", name: "Maria Santos", studentId: "2021-001" },
    { id: "2", name: "Juan Dela Cruz", studentId: "2021-002" },
    { id: "3", name: "Ana Reyes", studentId: "2021-003" },
  ];

  const documents = [
    {
      id: "1",
      studentId: "2021-001",
      studentName: "Maria Santos",
      avatar: "MS",
      title: "Weekly Progress Report - Week 8",
      type: "report",
      status: "submitted",
      submittedDate: "2024-10-05",
      submittedTime: "2:30 PM",
      fileSize: "2.4 MB",
      fileType: "PDF",
      description:
        "Weekly progress report covering tasks completed and challenges faced.",
      requiresApproval: false,
    },
    {
      id: "2",
      studentId: "2021-001",
      studentName: "Maria Santos",
      avatar: "MS",
      title: "Project Documentation - Phase 1",
      type: "documentation",
      status: "submitted",
      submittedDate: "2024-10-03",
      submittedTime: "10:15 AM",
      fileSize: "5.8 MB",
      fileType: "PDF",
      description: "Complete documentation for project phase 1 implementation.",
      requiresApproval: false,
    },
    {
      id: "3",
      studentId: "2021-002",
      studentName: "Juan Dela Cruz",
      avatar: "JD",
      title: "Daily Time Record - September 2024",
      type: "timesheet",
      status: "submitted",
      submittedDate: "2024-10-01",
      submittedTime: "4:45 PM",
      fileSize: "1.2 MB",
      fileType: "PDF",
      description: "Complete daily time record for the month of September.",
      requiresApproval: false,
    },
    {
      id: "4",
      studentId: "2021-003",
      studentName: "Ana Reyes",
      avatar: "AR",
      title: "Internship Completion Certificate Request",
      type: "certificate",
      status: "submitted",
      submittedDate: "2024-09-28",
      submittedTime: "9:00 AM",
      fileSize: "892 KB",
      fileType: "PDF",
      description: "Request form for internship completion certificate.",
      requiresApproval: false,
    },
    {
      id: "5",
      studentId: "2021-002",
      studentName: "Juan Dela Cruz",
      avatar: "JD",
      title: "Technical Skills Assessment Report",
      type: "report",
      status: "submitted",
      submittedDate: "2024-09-25",
      submittedTime: "3:20 PM",
      fileSize: "3.1 MB",
      fileType: "PDF",
      description:
        "Self-assessment report on technical skills gained during internship.",
      requiresApproval: false,
    },
    {
      id: "6",
      studentId: "2021-003",
      studentName: "Ana Reyes",
      avatar: "AR",
      title: "Mid-term Evaluation Form",
      type: "evaluation",
      status: "submitted",
      submittedDate: "2024-09-20",
      submittedTime: "11:30 AM",
      fileSize: "1.5 MB",
      fileType: "PDF",
      description: "Completed mid-term self-evaluation form.",
      requiresApproval: false,
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      submitted:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      approved:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    };
    return colors[status] || colors["submitted"];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileCheck className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "report":
        return "📊";
      case "documentation":
        return "📝";
      case "timesheet":
        return "⏰";
      case "certificate":
        return "🎓";
      case "evaluation":
        return "⭐";
      default:
        return "📄";
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      report: "Progress Report",
      documentation: "Documentation",
      timesheet: "Time Record",
      certificate: "Certificate",
      evaluation: "Evaluation",
      other: "Other",
    };
    return labels[type] || "Document";
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    const matchesStudent =
      selectedStudent === "all" || doc.studentId === selectedStudent;
    return matchesSearch && matchesType && matchesStatus && matchesStudent;
  });

  const stats = {
    totalDocuments: documents.length,
    submitted: documents.filter((d) => d.status === "submitted").length,
    approved: documents.filter((d) => d.status === "approved").length,
    pending: documents.filter((d) => d.status === "pending").length,
  };

  const handleDownload = (doc) => {
    alert(`Downloading: ${doc.title}\nFile: ${doc.fileType} (${doc.fileSize})`);
  };

  const handlePreview = (doc) => {
    setSelectedDocument(doc);
    setShowPreview(true);
  };

  const handleDownloadAll = () => {
    const count = filteredDocuments.length;
    alert(`Preparing to download ${count} document(s) as ZIP file...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Intern Documents
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and download documents submitted by interns
            </p>
          </div>
          <button
            onClick={handleDownloadAll}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download All</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Documents
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.totalDocuments}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Submitted
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {stats.submitted}
                </p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-600 opacity-50" />
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
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {stats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.studentId}>
                  {student.name}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="report">Progress Reports</option>
              <option value="documentation">Documentation</option>
              <option value="timesheet">Time Records</option>
              <option value="certificate">Certificates</option>
              <option value="evaluation">Evaluations</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents ({filteredDocuments.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      {getTypeIcon(doc.type)}
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                            {doc.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {doc.description}
                          </p>
                        </div>
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                            {doc.avatar}
                          </div>
                          <span>{doc.studentName}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {doc.submittedDate} at {doc.submittedTime}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>
                            {doc.fileType} • {doc.fileSize}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center space-x-1 text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {getStatusIcon(doc.status)}
                          <span className="capitalize">{doc.status}</span>
                        </span>

                        <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                          {getTypeLabel(doc.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No documents found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>

        {/* Document Preview Modal */}
        {showPreview && selectedDocument && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-2xl">
                      {getTypeIcon(selectedDocument.type)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {selectedDocument.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                            {selectedDocument.avatar}
                          </div>
                          <span>{selectedDocument.studentName}</span>
                        </div>
                        <span>•</span>
                        <span>{selectedDocument.submittedDate}</span>
                        <span>•</span>
                        <span>
                          {selectedDocument.fileType} •{" "}
                          {selectedDocument.fileSize}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedDocument.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Document Type
                    </h4>
                    <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {getTypeLabel(selectedDocument.type)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </h4>
                    <span
                      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        selectedDocument.status
                      )}`}
                    >
                      {getStatusIcon(selectedDocument.status)}
                      <span className="capitalize">
                        {selectedDocument.status}
                      </span>
                    </span>
                  </div>

                  {/* Preview Placeholder */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      Document Preview
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Preview functionality will be available here
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDocuments;
