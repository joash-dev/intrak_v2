import React, { useState, useEffect, useMemo } from "react";
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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
} from "lucide-react";
import { documentService } from "../../services/documentService";
import { formatDate, formatDateTime } from "../../services/localeService";
import toast from "react-hot-toast";
import Skeleton from "../../components/Skeleton";
import PDFViewer from "../../components/document/PDFViewer";

// ── Document type → human-readable label ──────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  RECORD_FILE: "Record File",
  APPLICATION_INTERNSHIP: "Application for Internship",
  MEDICAL_CERTIFICATE: "Medical Certificate & Psych Test",
  CERTIFICATION_UNITS: "Certification of Units Earned",
  INTERNSHIP_RESUME: "Internship Resume",
  CONSENT_FORM: "Consent Form",
  ENDORSEMENT_LETTER: "Endorsement Letter",
  ENDORSEMENT_LETTER_MULTI: "Endorsement Letter (Multiple Students)",
  INTERNSHIP_RELEASE: "Internship Release Form",
  MOA: "Memorandum of Agreement",
  INTERNSHIP_AGREEMENT: "Internship Agreement",
  TRAINING_AGREEMENT: "Training Agreement & Liability Waiver",
  INTERNSHIP_EVALUATION: "Internship Evaluation Form",
  CERTIFICATE_COMPLETION: "Certificate of Training Completion",
  NARRATIVE_REPORT: "Internship Narrative Report",
  DTR_PHOTOCOPY: "Daily Time Record Photocopy",
  TIME_FRAMES: "Internship Time Frames",
  WEEKLY_REPORTS: "Practicum/Internship Weekly Reports",
  STUDENT_FEEDBACK: "Student-Trainees Feedback Form",
  SUPERVISOR_FEEDBACK: "Training Supervisor Feedback Form",
  AGENCY_SELF_EVALUATION: "Agency Self Evaluation",
  AGENCY_STUDENT_EVALUATION: "Agency Student Evaluation",
};

const getDocTypeLabel = (type: string): string =>
  DOC_TYPE_LABELS[type] || type.replace(/_/g, " ");

// ── Document category helper ──────────────────────────────────────────
const getDocCategory = (type: string): string => {
  const pre = [
    "RECORD_FILE", "APPLICATION_INTERNSHIP", "MEDICAL_CERTIFICATE",
    "CERTIFICATION_UNITS", "INTERNSHIP_RESUME", "CONSENT_FORM",
    "ENDORSEMENT_LETTER", "INTERNSHIP_RELEASE",
  ];
  const upon = ["MOA", "INTERNSHIP_AGREEMENT", "TRAINING_AGREEMENT"];
  if (pre.includes(type)) return "Pre-Deployment";
  if (upon.includes(type)) return "Upon Approval";
  return "Post-OJT";
};

interface Document {
  id: string;
  type: string;
  filename: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED";
  uploadedAt: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  fileSize?: number;
  fileSizeMB?: string;
  student?: {
    id?: string;
    studentNumber: string;
    user: { name: string } | null;
    company?: { name: string } | null;
  };
  uploadedBy?: { name: string; email: string };
  // Computed display fields
  studentName?: string;
  studentId?: string;
  studentAvatar?: string;
  company?: string;
  documentType?: string;
  documentLabel?: string;
  category?: string;
  fileName?: string;
  fileType?: "pdf" | "doc" | "image" | "excel";
  submittedDate?: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

type SortKey = "date" | "name" | "type" | "status";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

const CoordinatorDocumentsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Data
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pagination & sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentService.getDocuments();
      const docs = response.documents || [];

      const transformed = docs.map((doc: any) => ({
        ...doc,
        studentName: doc.student?.user?.name || "Unknown Student",
        studentId: doc.student?.studentNumber || "N/A",
        studentAvatar: generateAvatar(doc.student?.user?.name || "Unknown"),
        company: doc.student?.company?.name || "No Company Assigned",
        documentType: doc.type,
        documentLabel: getDocTypeLabel(doc.type),
        category: getDocCategory(doc.type),
        fileName: doc.filename,
        fileType: getFileTypeFromFilename(doc.filename),
        submittedDate: formatDate(doc.uploadedAt || doc.createdAt),
        reviewedBy: doc.uploadedBy?.name,
        reviewedDate: doc.reviewedAt
          ? formatDateTime(doc.reviewedAt)
          : undefined,
      }));

      setDocuments(transformed);
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError(err.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────
  const generateAvatar = (name: string): string =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const getFileTypeFromFilename = (
    filename: string
  ): "pdf" | "doc" | "image" | "excel" => {
    const ext = filename?.split(".").pop()?.toLowerCase();
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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "—";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      pending: documents.filter(
        (d) =>
          d.status === "PENDING" || d.status === "RESUBMISSION_REQUESTED"
      ).length,
      approved: documents.filter((d) => d.status === "APPROVED").length,
      rejected: documents.filter((d) => d.status === "REJECTED").length,
      total: documents.length,
    }),
    [documents]
  );

  // ── Status helpers ────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      RESUBMISSION_REQUESTED:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return map[status] || map.PENDING;
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "Pending",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      RESUBMISSION_REQUESTED: "Resubmission",
    };
    return map[status] || status;
  };

  const getFileIcon = (fileType: string) => {
    const colors: Record<string, string> = {
      pdf: "text-red-500",
      doc: "text-blue-500",
      image: "text-purple-500",
      excel: "text-green-500",
    };
    return (
      <FileText
        className={`w-4 h-4 sm:w-5 sm:h-5 ${colors[fileType] || "text-gray-500"}`}
      />
    );
  };

  // ── Filter, sort, paginate ────────────────────────────────────────
  const filteredDocuments = useMemo(() => {
    let result = documents.filter((doc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (doc.studentName || "").toLowerCase().includes(q) ||
        (doc.documentLabel || "").toLowerCase().includes(q) ||
        (doc.fileName || doc.filename || "").toLowerCase().includes(q) ||
        (doc.company || "").toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "pending" &&
          (doc.status === "PENDING" ||
            doc.status === "RESUBMISSION_REQUESTED")) ||
        (filterStatus === "approved" && doc.status === "APPROVED") ||
        (filterStatus === "rejected" && doc.status === "REJECTED");

      const matchesType =
        filterType === "all" || doc.type === filterType;

      const matchesStudent =
        filterStudent === "all" || doc.studentName === filterStudent;

      return matchesSearch && matchesStatus && matchesType && matchesStudent;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp =
            new Date(a.uploadedAt || 0).getTime() -
            new Date(b.uploadedAt || 0).getTime();
          break;
        case "name":
          cmp = (a.studentName || "").localeCompare(b.studentName || "");
          break;
        case "type":
          cmp = (a.documentLabel || "").localeCompare(b.documentLabel || "");
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [documents, searchQuery, filterStatus, filterType, filterStudent, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE));
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterType, filterStudent, sortKey, sortDir]);

  const documentTypes = useMemo(
    () => [...new Set(documents.map((d) => d.type))],
    [documents]
  );

  const studentNames = useMemo(
    () =>
      [...new Set(documents.map((d) => d.studentName || "Unknown Student"))].sort(),
    [documents]
  );

  // ── Toggle sort ───────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // ── Actions ───────────────────────────────────────────────────────
  const handleReview = (doc: Document) => {
    setSelectedDoc(doc);
    setShowReviewModal(true);
    setRemarks("");
  };

  const submitReview = async () => {
    if (!selectedDoc) return;
    try {
      setSubmitting(true);
      await documentService.approveDocument(selectedDoc.id, remarks);
      toast.success("Document approved successfully");
      await fetchDocuments();
      setShowReviewModal(false);
      setSelectedDoc(null);
      setRemarks("");
    } catch (err: any) {
      console.error("Error reviewing document:", err);
      toast.error(err.message || "Failed to review document");
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
      toast.success("Download started");
    } catch (err: any) {
      console.error("Error downloading document:", err);
      toast.error(err.message || "Failed to download document");
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
      toast.error(err.message || "Failed to preview document");
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(null);
    setPreviewLoading(false);
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <Skeleton className="w-9 h-9 rounded-lg mb-3" />
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center space-x-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            Review Documents
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Review and approve student document submissions
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200 font-medium">
              Error loading documents
            </span>
          </div>
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={fetchDocuments}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                Review Documents
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Review and approve student document submissions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {stats.pending > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {stats.pending} pending
              </span>
            )}
            <button
              onClick={fetchDocuments}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Cards (Soft Pastel) ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Pending Review",
            value: stats.pending,
            icon: Clock,
            bg: "bg-amber-100 dark:bg-amber-900/30",
            iconColor: "text-amber-600 dark:text-amber-300",
          },
          {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle,
            bg: "bg-green-100 dark:bg-green-900/30",
            iconColor: "text-green-600 dark:text-green-300",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: XCircle,
            bg: "bg-red-100 dark:bg-red-900/30",
            iconColor: "text-red-600 dark:text-red-300",
          },
          {
            label: "Total Documents",
            value: stats.total,
            icon: FileCheck,
            bg: "bg-purple-100 dark:bg-purple-900/30",
            iconColor: "text-purple-600 dark:text-purple-300",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-[#212124] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className={`p-2 ${card.bg} rounded-lg w-fit mb-2`}>
              <card.icon
                className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`}
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {card.label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Search, Filters & Sort ──────────────────────────────── */}
      <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search student, document, company…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
          >
            <option value="all">All Types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {getDocTypeLabel(type)}
              </option>
            ))}
          </select>

          {/* Student filter */}
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
          >
            <option value="all">All Students</option>
            {studentNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort chips */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Sort by:
          </span>
          {(
            [
              { key: "date" as SortKey, label: "Date" },
              { key: "name" as SortKey, label: "Student" },
              { key: "type" as SortKey, label: "Type" },
              { key: "status" as SortKey, label: "Status" },
            ] as const
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                sortKey === s.key
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {s.label}
              {sortKey === s.key && (
                <ArrowUpDown className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Documents List ──────────────────────────────────────── */}
      <div className="space-y-3">
        {paginatedDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
          >

            <div className="p-4 sm:p-5">
              {/* Top row: student info + status badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                    {doc.studentAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                        {doc.studentName}
                      </h3>
                      <span className="text-[10px] sm:text-xs text-gray-400">
                        {doc.studentId}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[160px]">
                          {doc.company}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {doc.submittedDate}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium flex-shrink-0 ml-2 ${getStatusColor(
                    doc.status
                  )}`}
                >
                  {getStatusLabel(doc.status)}
                </span>
              </div>

              {/* Document info card */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getFileIcon(doc.fileType || "pdf")}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.documentLabel}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                        {doc.fileName}{" "}
                        {doc.fileSize
                          ? `• ${formatFileSize(doc.fileSize)}`
                          : doc.fileSizeMB
                          ? `• ${doc.fileSizeMB}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {doc.category}
                  </span>
                </div>
              </div>

              {/* Review remarks (if reviewed) */}
              {(doc.status === "APPROVED" || doc.status === "REJECTED") &&
                doc.remarks && (
                  <div
                    className={`rounded-lg border p-3 mb-3 ${
                      doc.status === "APPROVED"
                        ? "border-green-200 bg-green-50/80 dark:border-green-700/60 dark:bg-green-900/20"
                        : "border-red-200 bg-red-50/80 dark:border-red-700/60 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {doc.status === "APPROVED" ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">
                          Review Remarks
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {doc.remarks}
                        </p>
                        {(doc.reviewedBy || doc.reviewedDate) && (
                          <p className="text-[10px] text-gray-500 mt-1.5">
                            {doc.reviewedBy && (
                              <span>By {doc.reviewedBy}</span>
                            )}
                            {doc.reviewedBy && doc.reviewedDate && " • "}
                            {doc.reviewedDate && (
                              <span>{doc.reviewedDate}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-100 dark:border-gray-700 gap-2 sm:gap-0">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePreview(doc)}
                    disabled={previewLoading && previewDoc?.id === doc.id}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-xs sm:text-sm disabled:opacity-50"
                  >
                    {previewLoading && previewDoc?.id === doc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs sm:text-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>

                {(doc.status === "PENDING" ||
                  doc.status === "RESUBMISSION_REQUESTED") && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReview(doc)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium text-xs sm:text-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty State ─────────────────────────────────────────── */}
      {filteredDocuments.length === 0 && (
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-10 sm:p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <FileCheck className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
            No documents found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {searchQuery || filterStatus !== "all" || filterType !== "all"
              ? "Try adjusting your search or filters"
              : "Student documents will appear here once submitted"}
          </p>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────── */}
      {filteredDocuments.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#212124] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>
            –
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredDocuments.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {filteredDocuments.length}
            </span>{" "}
            documents
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 1
              )
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push("ellipsis");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "ellipsis" ? (
                  <span
                    key={`e-${idx}`}
                    className="px-1 text-gray-400 text-xs"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      currentPage === p
                        ? "bg-purple-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Review Modal ────────────────────────────────────────── */}
      {showReviewModal && selectedDoc && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
          style={{ margin: 0 }}
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Approve Document
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Document summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-5">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                  {selectedDoc.studentAvatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedDoc.studentName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedDoc.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getFileIcon(selectedDoc.fileType || "pdf")}
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedDoc.documentLabel}
                </p>
              </div>
            </div>

            {/* Remarks */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any additional comments…"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting}
                className="px-5 py-2 rounded-xl font-medium text-sm transition-colors flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ───────────────────────────────────────── */}
      {previewDoc && previewUrl && (
        <div
          className="fixed inset-0 bg-black/75 z-[70] flex items-center justify-center p-3 sm:p-4"
          style={{ margin: 0 }}
          onClick={closePreview}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                  {previewDoc.studentAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                    {previewDoc.studentName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {previewDoc.documentLabel} •{" "}
                    {previewDoc.fileName || previewDoc.filename}
                  </p>
                </div>
              </div>
              <button
                onClick={closePreview}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 min-h-0 overflow-auto bg-gray-100 dark:bg-gray-900">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Loading document…
                    </p>
                  </div>
                </div>
              ) : previewDoc.fileType === "pdf" ||
                previewDoc.filename?.endsWith(".pdf") ? (
                <PDFViewer url={previewUrl} />
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
