import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import type { StudentDocument } from "../../services/supervisorService";
import toast from "react-hot-toast";

const SupervisorDocuments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<StudentDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const fetchedDocs = await supervisorService.getStudentDocuments();
      setDocuments(fetchedDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: documents.length,
    pending: documents.filter((doc) => doc.status === "PENDING").length,
    approved: documents.filter((doc) => doc.status === "APPROVED").length,
    rejected: documents.filter((doc) => doc.status === "REJECTED").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      APPROVED:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors["PENDING"];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDownload = async (doc: StudentDocument) => {
    try {
      await supervisorService.downloadDocument(doc.id);
      toast.success(`Downloading ${doc.filename}`);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get unique document types
  const documentTypes = Array.from(new Set(documents.map((doc) => doc.type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading documents...
          </p>
        </div>
      </div>
    );
  }

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const supervisorName = user?.name || "Supervisor";
  const companyName = user?.company || "Company";

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Student Documents</h1>
        <p className="text-blue-100 text-lg mb-1">Company: {companyName}</p>
        <p className="text-blue-100">
          View and download intern documents - Manage student submissions
        </p>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Documents
            </p>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.total}
          </p>
          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            Total documents
          </span>
              </div>

        {/* Pending Review */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Pending Review
            </p>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.pending}
          </p>
          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            {stats.pending} pending
          </span>
              </div>

        {/* Approved */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Approved</p>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.approved}
                </p>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Approved docs
          </span>
              </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Rejected</p>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.rejected}
          </p>
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            Rejected docs
          </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredDocuments.length} of {documents.length} documents
      </p>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  {getStatusIcon(doc.status)}
                    </div>
                        <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {doc.filename}
                          </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {doc.studentName}
                          </p>
                        </div>
                      </div>
                        <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                            doc.status
                          )}`}
                        >
                {doc.status}
                        </span>
                      </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {doc.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Uploaded</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(doc.uploadedAt)}
                </p>
                    </div>
                  </div>

            {doc.remarks && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Remarks</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {doc.remarks}
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
                    <button
                onClick={() => setSelectedDocument(doc)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                <Eye className="w-4 h-4" />
                <span className="text-sm">View Details</span>
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                    >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
                    </button>
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No documents found</p>
            </div>
          )}

      {/* Document Detail Modal */}
      {selectedDocument && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            style={{ margin: "0" }}
          onClick={() => setSelectedDocument(null)}
          >
            <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Document Details
                      </h3>
                  <button
                onClick={() => setSelectedDocument(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                <XCircle className="w-5 h-5" />
                  </button>
                </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedDocument.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
              </div>
                  <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDocument.studentName}
                    </h4>
                  <p className="text-sm text-gray-500">Student</p>
                </div>
                  </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                  <p className="text-sm text-gray-500 mb-1">Filename</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedDocument.filename}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                        selectedDocument.status
                      )}`}
                    >
                        {selectedDocument.status}
                      </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedDocument.type}
                  </p>
                  </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">MIME Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedDocument.mimeType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Uploaded Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedDocument.uploadedAt)}
                    </p>
                  </div>
                </div>

              {selectedDocument.remarks && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Remarks</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedDocument.remarks}
                  </p>
              </div>
              )}

              <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
  );
};

export default SupervisorDocuments;
