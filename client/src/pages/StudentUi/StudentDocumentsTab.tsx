import React, { useState, useEffect, useMemo } from "react";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  X,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { documentService } from "../../services/documentService";
import type { Document, DocumentStats } from "../../services/documentService";
import DocumentFeedbackPanel from "../../components/document/DocumentFeedbackPanel";

// Remove duplicate interface since we're importing it from service

interface StudentDocumentsTabProps {
  onDocumentsChange?: () => void;
}

const StudentDocumentsTab: React.FC<StudentDocumentsTabProps> = ({
  onDocumentsChange,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<string>(
    "APPLICATION_INTERNSHIP"
  );
  const [selectedCategory, setSelectedCategory] =
    useState<string>("PRE_DEPLOYMENT");

  const documentTypes = [
    // I. PRE-DEPLOYMENT Requirements
    {
      value: "RECORD_FILE",
      label: "Record File",
      required: true,
      category: "PRE_DEPLOYMENT",
    },
    {
      value: "APPLICATION_INTERNSHIP",
      label: "Application for Internship (Form FM-AA-INT-01)",
      required: true,
      category: "PRE_DEPLOYMENT",
    },
    {
      value: "MEDICAL_CERTIFICATE",
      label: "Medical Certificate and Psychological Test",
      required: true,
      category: "PRE_DEPLOYMENT",
    },
    {
      value: "CERTIFICATION_UNITS",
      label:
        "Certification of Units Earned for Practicum/Internship (Form FM-AA-INT-02)",
      required: true,
      category: "PRE_DEPLOYMENT",
    },
    {
      value: "INTERNSHIP_RESUME",
      label: "Internship Resume (Form FM-AA-INT-09)",
      required: true,
      category: "PRE_DEPLOYMENT",
    },
    {
      value: "CONSENT_FORM",
      label: "Consent Form (Form FM-AA-INT-03)",
      required: true,
      category: "PRE_DEPLOYMENT",
    },
    {
      value: "ENDORSEMENT_LETTER",
      label: "Endorsement Letter (Form FM-AA-INT-05)",
      required: true,
      category: "PRE_DEPLOYMENT",
    },
    {
      value: "INTERNSHIP_RELEASE",
      label: "Internship Release Form (Form FM-AA-INT-12)",
      required: true,
      category: "PRE_DEPLOYMENT",
    },
    {
      value: "TIME_FRAMES",
      label: "Internship Time Frames (Form FM-AA-INT-14)",
      required: true,
      category: "PRE_DEPLOYMENT",
    },

    // II. UPON APPROVAL OF COMPANY
    {
      value: "INTERNSHIP_AGREEMENT",
      label: "Memorandum / Internship Agreement (Form FM-AA-INT-10)",
      required: true,
      category: "UPON_APPROVAL",
    },
    {
      value: "TRAINING_AGREEMENT",
      label: "Training Agreement and Liability Waiver Form (Form FM-AA-INT-15)",
      required: false,
      category: "UPON_APPROVAL",
    },

    // III. POST-OJT Requirements
    {
      value: "INTERNSHIP_EVALUATION",
      label: "Internship Evaluation Form (Form FM-AA-INT-11)",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "CERTIFICATE_COMPLETION",
      label: "Certificate of Training Completion [from the HTE/Agency]",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "INTERNSHIP_NARRATIVE_REPORT",
      label: "Internship Narrative Report [by the Student-Intern]",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "DTR_PHOTOCOPY",
      label: "Photocopy of Daily Time Record",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "WEEKLY_REPORTS",
      label: "Practicum/Internship Weekly Reports (Form FM-AA-INT-16)",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "STUDENT_FEEDBACK",
      label: "Student-Trainees Feedback Form[s] (Form FM-AA-INT-17)",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "SUPERVISOR_FEEDBACK",
      label: "Training Supervisor's Feedback Form[s] (Form FM-AA-INT-18)",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "AGENCY_SELF_EVALUATION",
      label:
        "Evaluation Instrument of PSU Partner Agencies (Self Ratee) (Form FM-AA-INT-19b)",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "AGENCY_STUDENT_EVALUATION",
      label:
        "Evaluation Instrument of PSU Partner Agencies (Student) (Form FM-AA-INT-19c)",
      required: true,
      category: "POST_OJT",
    },
  ];

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Ensure document type is valid for selected category
  useEffect(() => {
    const categoryTypes = documentTypes.filter(
      (type) => type.category === selectedCategory
    );
    if (
      categoryTypes.length > 0 &&
      !categoryTypes.some((type) => type.value === selectedType)
    ) {
      setSelectedType(categoryTypes[0].value);
    }
  }, [selectedCategory, selectedType]);

  // Refresh documents when tab becomes active (optional)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDocuments();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await documentService.getStudentDocuments();
      setDocuments(docs);
      // Notify parent component about document changes
      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (err: any) {
      console.error("Error loading documents:", err);

      // Provide more specific error messages
      if (err.response?.status === 401) {
        setError("Authentication required. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Access denied. You don't have permission to view documents.");
      } else if (err.response?.status === 404) {
        setError("Student record not found. Please contact support.");
      } else if (err.response?.data?.message) {
        setError(`Error: ${err.response.data.message}`);
      } else {
        setError("Failed to load documents. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const stats: DocumentStats = useMemo(() => {
    return documentService.calculateStats(documents);
  }, [documents]);

  const filteredDocs = useMemo(() => {
    if (!documents || !Array.isArray(documents)) {
      return [];
    }

    return documents.filter((doc) => {
      const matchesStatus =
        filterStatus === "ALL" || doc.status === filterStatus;
      const matchesSearch =
        searchQuery === "" ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.filename?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "all" ||
        documentService.getDocumentCategory(doc.type) === filterCategory;
      return matchesStatus && matchesSearch && matchesCategory;
    });
  }, [documents, filterStatus, searchQuery, filterCategory]);

  // Group documents by category
  const groupedDocs = useMemo(() => {
    return filteredDocs.reduce((acc, doc) => {
      const category = documentService.getDocumentCategory(doc.type);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
  }, [filteredDocs]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file
    if (!documentService.isValidFileType(file)) {
      alert("Invalid file type. Please upload PDF, JPG, or PNG files only.");
      return;
    }

    if (!documentService.isValidFileSize(file)) {
      alert("File size too large. Please upload files smaller than 10MB.");
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await documentService.uploadDocument({
        file: selectedFile,
        type: selectedType,
      });

      setUploadProgress(100);

      // Reload documents
      await loadDocuments();

      // Reset form
      setSelectedFile(null);
      setSelectedType("APPLICATION_INTERNSHIP");
      setSelectedCategory("PRE_DEPLOYMENT");
      setUploadModalOpen(false);
      setUploadProgress(0);

      clearInterval(progressInterval);
    } catch (err: any) {
      alert(err.response?.data?.message || "Upload failed. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleView = (doc: Document) => {
    setSelectedDoc(doc);
    setViewModalOpen(true);
  };

  const handleDelete = async (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await documentService.deleteDocument(docId);
        await loadDocuments(); // Reload documents
      } catch (err: any) {
        alert(
          err.response?.data?.message || "Delete failed. Please try again."
        );
        console.error("Delete error:", err);
      }
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(
        err.response?.data?.message || "Download failed. Please try again."
      );
      console.error("Download error:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "RESUBMISSION_REQUESTED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "PENDING":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "RESUBMISSION_REQUESTED":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading documents...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={loadDocuments}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Document Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload and manage your OJT documents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Documents
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.approved}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pending}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rejected
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.rejected}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 min-w-[140px]"
              >
                {documentService.getCategoryOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 min-w-[140px]"
              >
                <option value="ALL">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Documents by Category */}
      {Object.keys(groupedDocs).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No documents found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery || filterStatus !== "ALL" || filterCategory !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Upload your first document to get started"}
            </p>
            {!searchQuery &&
              filterStatus === "ALL" &&
              filterCategory === "all" && (
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </button>
              )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocs).map(([category, categoryDocs]) => (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      category === "PRE_DEPLOYMENT"
                        ? "bg-blue-100 dark:bg-blue-900/20"
                        : category === "UPON_APPROVAL"
                        ? "bg-yellow-100 dark:bg-yellow-900/20"
                        : "bg-green-100 dark:bg-green-900/20"
                    }`}
                  >
                    <FileText
                      className={`w-5 h-5 ${
                        category === "PRE_DEPLOYMENT"
                          ? "text-blue-600 dark:text-blue-400"
                          : category === "UPON_APPROVAL"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {documentService.getCategoryDisplay(category)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {categoryDocs.length} document
                      {categoryDocs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Table for this Category */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Document Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categoryDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {doc.filename || (
                              <em className="text-gray-400">Not uploaded</em>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.status)}
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                doc.status
                              )}`}
                            >
                              {doc.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          {doc.remarks && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {doc.remarks}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {doc.fileSize || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {doc.filename && (
                              <>
                                <button
                                  onClick={() => handleView(doc)}
                                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 p-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownload(doc)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {doc.status === "REJECTED" && (
                              <button
                                className="text-green-600 hover:text-green-900 dark:text-green-400 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Re-upload"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            {doc.status === "PENDING" && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Upload Document
              </h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    // Reset document type when category changes
                    const categoryTypes = documentTypes.filter(
                      (type) => type.category === e.target.value
                    );
                    if (categoryTypes.length > 0) {
                      setSelectedType(categoryTypes[0].value);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {documentService
                    .getCategoryOptions()
                    .filter((option) => option.value !== "all")
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Type{" "}
                  <span className="text-xs text-gray-500">
                    (filtered by category)
                  </span>
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={
                    documentTypes.filter(
                      (type) => type.category === selectedCategory
                    ).length === 0
                  }
                >
                  {documentTypes.filter(
                    (type) => type.category === selectedCategory
                  ).length > 0 ? (
                    documentTypes
                      .filter((type) => type.category === selectedCategory)
                      .map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label} {type.required && "*"}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>
                      No document types available for this category
                    </option>
                  )}
                </select>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {selectedFile ? (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Selected: {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Size: {documentService.formatFileSize(selectedFile.size)}
                    </p>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="mt-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop your file here, or
                    </p>
                    <label className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer">
                      <span>Browse Files</span>
                      <input
                        type="file"
                        onChange={handleFileInput}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Supported formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>

              {uploading && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Uploading...
                    </span>
                    <span className="text-purple-600 font-medium">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Document Details
              </h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Document Type
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDoc.type.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedDoc.status
                    )}`}
                  >
                    {selectedDoc.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Filename
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDoc.filename}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    File Size
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDoc.fileSize}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Uploaded
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDoc.uploadedAt
                      ? new Date(selectedDoc.uploadedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Reviewed
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDoc.reviewedAt
                      ? new Date(selectedDoc.reviewedAt).toLocaleString()
                      : "Not reviewed"}
                  </p>
                </div>
              </div>

              {selectedDoc.remarks && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                    Reviewer Remarks:
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {selectedDoc.remarks}
                  </p>
                </div>
              )}

              <DocumentFeedbackPanel
                documentId={selectedDoc.id}
                allowFeedback
                defaultType="STUDENT_RESPONSE"
                typeOptions={["STUDENT_RESPONSE", "COMMENT"]}
                allowTypeSelection
                showRequiresActionToggle={false}
                submitLabel="Send response"
                messagePlaceholder="Reply to the reviewer or ask for clarification..."
              />

              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-gray-50 dark:bg-gray-700 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Document preview will be displayed here
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  PDF/Image viewer coming soon
                </p>
              </div>

              <button
                onClick={() => selectedDoc && handleDownload(selectedDoc)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDocumentsTab;
