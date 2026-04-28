import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Download,
  Eye,
  AlertCircle,
  LayoutGrid,
  List,
  Loader2,
  Printer,
} from "lucide-react";
// api import removed (unused)
import { PDFDocument } from "pdf-lib";
import {
  instructorService,
  requestInstructorNavBadgesRefresh,
  type InstructorStudent,
  type InstructorDocument,
} from "../../services/instructorService";
import toast from "react-hot-toast";
import { documentService } from "../../services/documentService";
import PDFViewer from "../../components/document/PDFViewer";
import { devLog } from "../../utils/devLog";
import {
  instructorNavCountsDocumentReview,
} from "../../utils/instructorNavAttention";

// --- Types ---

interface DocumentRequirement {
  id: string;
  name: string;
  category: "pre-deployment" | "upon-approval" | "post-ojt";
  required: boolean;
  type: string; // The 'type' field used in the document object (e.g., 'application_form')
}

// --- Constants ---

const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  // PRE-DEPLOYMENT
  { id: "record-file", name: "Record File", category: "pre-deployment", required: true, type: "RECORD_FILE" },
  { id: "application-form", name: "Application for Internship (Form FM-AA-INT-01)", category: "pre-deployment", required: true, type: "APPLICATION_INTERNSHIP" },
  { id: "medical-certificate", name: "Medical Certificate and Psychological Test", category: "pre-deployment", required: true, type: "MEDICAL_CERTIFICATE" },
  { id: "units-certification", name: "Certification of Units Earned (Form FM-AA-INT-02)", category: "pre-deployment", required: true, type: "CERTIFICATION_UNITS" },
  { id: "internship-resume", name: "Internship Resume (Form FM-AA-INT-09)", category: "pre-deployment", required: true, type: "INTERNSHIP_RESUME" },
  { id: "consent-form", name: "Consent Form (Form FM-AA-INT-03)", category: "pre-deployment", required: true, type: "CONSENT_FORM" },
  { id: "endorsement-letter", name: "Endorsement Letter (Form FM-AA-INT-05)", category: "pre-deployment", required: true, type: "ENDORSEMENT_LETTER" },
  { id: "release-form", name: "Internship Release Form (Form FM-AA-INT-12)", category: "pre-deployment", required: true, type: "INTERNSHIP_RELEASE" },

  // UPON APPROVAL
  { id: "moa", name: "Memorandum of Agreement (MOA) (Form FM-AA-INT-10)", category: "upon-approval", required: true, type: "MOA" },
  { id: "internship-agreement", name: "Internship Agreement (Form FM-AA-INT-10)", category: "upon-approval", required: true, type: "INTERNSHIP_AGREEMENT" },
  { id: "training-agreement", name: "Training Agreement and Liability Waiver (Form FM-AA-INT-15)", category: "upon-approval", required: false, type: "TRAINING_AGREEMENT" },

  // POST-OJT
  { id: "internship-evaluation", name: "Internship Evaluation Form (Form FM-AA-INT-11)", category: "post-ojt", required: true, type: "INTERNSHIP_EVALUATION" },
  { id: "completion-certificate", name: "Certificate of Training Completion", category: "post-ojt", required: true, type: "CERTIFICATE_COMPLETION" },
  { id: "final-report", name: "Internship Narrative Report", category: "post-ojt", required: true, type: "NARRATIVE_REPORT" },
  { id: "daily-time-record", name: "Photocopy of Daily Time Record", category: "post-ojt", required: true, type: "DTR_PHOTOCOPY" },
  { id: "time-frames", name: "Internship Time Frames (Form FM-AA-INT-14)", category: "post-ojt", required: true, type: "TIME_FRAMES" },
  { id: "weekly-reports", name: "Practicum/Internship Weekly Reports (Form FM-AA-INT-16)", category: "post-ojt", required: true, type: "WEEKLY_REPORTS" },
  { id: "student-feedback", name: "Student-Trainees Feedback Form (Form FM-AA-INT-17)", category: "post-ojt", required: true, type: "STUDENT_FEEDBACK" },
  { id: "supervisor-evaluation", name: "Training Supervisor's Feedback Form (Form FM-AA-INT-18)", category: "post-ojt", required: true, type: "SUPERVISOR_FEEDBACK" },
  { id: "agency-self-evaluation", name: "Evaluation Instrument of PSU Partner Agencies (Self Ratee) (Form FM-AA-INT-19b)", category: "post-ojt", required: true, type: "AGENCY_SELF_EVALUATION" },
  { id: "agency-student-evaluation", name: "Evaluation Instrument of PSU Partner Agencies (Student) (Form FM-AA-INT-19c)", category: "post-ojt", required: true, type: "AGENCY_STUDENT_EVALUATION" },
];

const STUDENTS_PER_PAGE = 10;

const InstructorDocumentsTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // --- State ---
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedStudent, setSelectedStudent] = useState<InstructorStudent | null>(null);

  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [documents, setDocuments] = useState<InstructorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Review Modal State
  const [selectedDoc, setSelectedDoc] = useState<InstructorDocument | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [printingAll, setPrintingAll] = useState(false);
  const [pulseStudentIds, setPulseStudentIds] = useState<Set<string>>(() => new Set());
  const [pulseDocIds, setPulseDocIds] = useState<Set<string>>(() => new Set());

  // --- Effects ---

  useEffect(() => {
    loadData();
  }, []);

  const docParam = searchParams.get("doc");

  useEffect(() => {
    if (!docParam || loading) return;
    const match = documents.find((d) => d.id === docParam);
    if (!match) {
      setSearchParams((p) => {
        p.delete("doc");
        return p;
      }, { replace: true });
      return;
    }
    const student = students.find((s) => s.id === match.studentId);
    if (!student) return;
    if (selectedStudent?.id !== student.id) {
      setSelectedStudent(student);
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const el = document.querySelector(`[data-intrak-doc-id="${docParam}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        setPulseDocIds(new Set([docParam]));
        window.setTimeout(() => setPulseDocIds(new Set()), 1600);
        setSearchParams((p) => {
          p.delete("doc");
          return p;
        }, { replace: true });
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [docParam, loading, documents, students, selectedStudent, setSearchParams]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // --- Data Loading ---

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, documentsData] = await Promise.all([
        instructorService.getAssignedStudents(),
        instructorService.getDocumentsForReview(), // This fetches all documents for assigned students
      ]);
      setStudents(studentsData);
      devLog.log('Fetched Documents:', documentsData);
      setDocuments(documentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
      requestInstructorNavBadgesRefresh();
    }
  };

  // Pulse students once when they newly have pending/resubmission docs.
  useEffect(() => {
    const key = (id: string) => `intrak:seen-attn:instructor:doc-student:${id}`;
    const studentsWithAttention = students
      .map((s) => s.id)
      .filter((studentId) =>
        getStudentDocuments(studentId).some((d) => instructorNavCountsDocumentReview(d.status)),
      );
    const newly = studentsWithAttention.filter((id) => {
      try {
        return sessionStorage.getItem(key(id)) !== "1";
      } catch {
        return false;
      }
    });
    if (newly.length === 0) return;
    for (const id of newly) {
      try {
        sessionStorage.setItem(key(id), "1");
      } catch {
        /* ignore */
      }
    }
    setPulseStudentIds(new Set(newly));
    const t = window.setTimeout(() => setPulseStudentIds(new Set()), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, documents]);

  // Pulse individual doc requirements once when they newly require review.
  useEffect(() => {
    const key = (id: string) => `intrak:seen-attn:instructor:doc:${id}`;
    const actionable = documents.filter((d) => instructorNavCountsDocumentReview(d.status));
    const newly = actionable
      .map((d) => d.id)
      .filter((id) => {
        try {
          return sessionStorage.getItem(key(id)) !== "1";
        } catch {
          return false;
        }
      });
    if (newly.length === 0) return;
    for (const id of newly) {
      try {
        sessionStorage.setItem(key(id), "1");
      } catch {
        /* ignore */
      }
    }
    setPulseDocIds(new Set(newly));
    const t = window.setTimeout(() => setPulseDocIds(new Set()), 1000);
    return () => window.clearTimeout(t);
  }, [documents]);

  // --- Helpers ---

  const getStudentDocuments = (studentId: string) => {
    const result = documents.filter(d => d.studentId === studentId);
    return result;
  };

  const getStudentProgress = (studentId: string) => {
    const studentDocs = getStudentDocuments(studentId);
    // UI requirement: show progress as x/20 (approved required documents out of 20 total items).
    const totalRequired = 20;

    // Count required documents that are approved (exclude optional rows so approved/total stay aligned)
    const approvedCount = DOCUMENT_REQUIREMENTS.filter(req => {
      if (!req.required) return false;
      let doc = studentDocs.find(d => d.documentType === req.type);
      if (!doc && req.type === 'ENDORSEMENT_LETTER') {
        doc = studentDocs.find(d => d.documentType === 'ENDORSEMENT_LETTER_MULTI');
      }
      return doc?.status === "APPROVED";
    }).length;

    const pendingCount = studentDocs.filter(d => d.status === "PENDING").length;

    return {
      approved: approvedCount,
      total: totalRequired,
      percentage: Math.round((approvedCount / totalRequired) * 100),
      pending: pendingCount
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "PENDING": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "REJECTED": return "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "RESUBMISSION_REQUESTED": return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      default: return "text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <CheckCircle className="w-4 h-4" />;
      case "PENDING": return <Clock className="w-4 h-4" />;
      case "REJECTED": return <XCircle className="w-4 h-4" />;
      case "RESUBMISSION_REQUESTED": return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDocumentType = (type: string): string => {
    // Convert snake_case or UPPER_SNAKE_CASE to Title Case
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // --- Handlers ---

  const loadDocumentPreview = async (doc: InstructorDocument) => {
    try {
      const blob = await instructorService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url); // Note: Cleanup of old URL is handled by useEffect
      setPreviewType(blob.type);
      setSelectedDoc(doc);
      return true;
    } catch (error: unknown) {
      console.error("Error loading preview:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load document preview");
      return false;
    }
  };

  const handleReview = async (doc: InstructorDocument) => {
    const success = await loadDocumentPreview(doc);
    if (success) {
      setShowReviewModal(true);
    } else {
      toast.error("Failed to load document preview");
    }
  };

  const handleReviewAction = async (action: 'approve' | 'request_changes') => {
    if (!selectedDoc) return;

    if (action === 'request_changes' && !reviewRemarks.trim()) {
      toast.error('Please provide a reason for requesting changes');
      return;
    }

    try {
      setIsSubmittingReview(true);

      // Store current student ID before selectedDoc might change
      const currentStudentId = selectedDoc.studentId;

      if (action === 'approve') {
        await documentService.approveDocument(selectedDoc.id, reviewRemarks || undefined);
        toast.success("Document approved successfully ✓");
      } else if (action === 'request_changes') {
        await documentService.addDocumentFeedback(selectedDoc.id, {
          message: reviewRemarks,
          type: 'REQUEST_CHANGES',
          requiresAction: true
        });
        toast.success("Changes requested");
      }

      // Refresh documents list to get updated status from server
      const updatedDocs = await instructorService.getDocumentsForReview();
      setDocuments(updatedDocs);
      requestInstructorNavBadgesRefresh();

      // --- AUTO-ADVANCE LOGIC ---
      // Find the next pending document
      // Priority 1: Next pending document for the SAME student
      // Priority 2: Next pending document for ANY student
      const nextDoc = updatedDocs.find(d =>
        d.status === 'PENDING' &&
        d.studentId === currentStudentId &&
        d.id !== selectedDoc.id
      ) || updatedDocs.find(d =>
        d.status === 'PENDING' &&
        d.id !== selectedDoc.id
      );

      // Clear remarks
      setReviewRemarks("");

      if (nextDoc) {
        if (nextDoc.studentId !== currentStudentId) {
          toast(`Now reviewing: ${nextDoc.studentName} (${nextDoc.studentNumber})`);
        } else {
          toast("Opening next document...");
        }
        // Load the next document immediately
        const success = await loadDocumentPreview(nextDoc);
        if (!success) {
          toast.error("Failed to load next document");
          // Fallback: If load fails, maybe close modal or let user choose
        }
      } else {
        toast.success("All pending documents reviewed!", { duration: 3000 });
        // Close modal after a brief delay
        setTimeout(() => {
          setShowReviewModal(false);
          setSelectedDoc(null);
          setPreviewUrl(null);
        }, 1500);
      }

    } catch (error: any) {
      console.error("Error submitting review:", error);
      let errorMessage = "Failed to submit review. Please try again.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownload = async (doc: InstructorDocument) => {
    try {
      const blob = await instructorService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to download document");
    }
  };

  const handlePrint = async (doc: InstructorDocument) => {
    try {
      const blob = await instructorService.downloadDocument(doc.id);

      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Please allow pop-ups to print documents");
        window.URL.revokeObjectURL(url);
        return;
      }

      if (blob.type === 'application/pdf') {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>Print - ${doc.fileName}</title></head>
          <body style="margin:0;padding:0;">
            <iframe src="${url}" style="width:100%;height:100vh;border:none;" onload="setTimeout(()=>{this.contentWindow.print();},500)"></iframe>
          </body>
          </html>
        `);
      } else if (blob.type.startsWith('image/')) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print - ${doc.fileName}</title>
            <style>
              @media print { body { margin: 0; } img { max-width: 100%; height: auto; } }
              body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
              img { max-width: 90vw; max-height: 90vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${url}" onload="setTimeout(()=>window.print(),300)" />
          </body>
          </html>
        `);
      } else {
        // For other file types, just open the file
        printWindow.location.href = url;
      }
      printWindow.document.close();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to print document");
    }
  };

  const handlePrintAll = async (studentId: string) => {
    const studentDocs = getStudentDocuments(studentId);
    const approvedOrPendingDocs = studentDocs.filter(d => d.status === 'APPROVED' || d.status === 'PENDING');

    if (approvedOrPendingDocs.length === 0) {
      toast.error("No documents to print");
      return;
    }

    setPrintingAll(true);
    toast(`Merging ${approvedOrPendingDocs.length} document(s) into one PDF...`, { icon: '🖨️' });

    try {
      // Fetch all document blobs in parallel
      const blobResults = await Promise.all(
        approvedOrPendingDocs.map(async (doc) => {
          try {
            const blob = await instructorService.downloadDocument(doc.id);
            return { doc, blob };
          } catch {
            return { doc, blob: null as Blob | null };
          }
        })
      );

      const validResults = blobResults.filter((r): r is { doc: InstructorDocument; blob: Blob } => r.blob !== null);

      if (validResults.length === 0) {
        toast.error("Failed to load any documents");
        return;
      }

      // Merge all PDFs into one using pdf-lib
      const mergedPdf = await PDFDocument.create();

      for (const { doc, blob } of validResults) {
        if (!blob) continue;

        try {
          const arrayBuffer = await blob.arrayBuffer();

          if (blob.type === 'application/pdf') {
            const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
          } else if (blob.type.startsWith('image/')) {
            // Convert image to a PDF page
            let img;
            if (blob.type === 'image/png') {
              img = await mergedPdf.embedPng(arrayBuffer);
            } else {
              img = await mergedPdf.embedJpg(arrayBuffer);
            }
            const page = mergedPdf.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          }
        } catch (err) {
          console.warn(`Skipped "${doc.fileName}" — could not merge:`, err);
        }
      }

      if (mergedPdf.getPageCount() === 0) {
        toast.error("Could not merge any documents");
        return;
      }

      // Save merged PDF and open for printing
      const mergedBytes = await mergedPdf.save();
      const mergedBlob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const mergedUrl = URL.createObjectURL(mergedBlob);

      const printWindow = window.open(mergedUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => printWindow.print(), 700);
        });
      } else {
        toast.error("Please allow pop-ups to print");
      }

      toast.success(`${mergedPdf.getPageCount()} pages ready to print`);
    } catch (error) {
      console.error("Print all error:", error);
      toast.error("Failed to prepare documents for printing");
    } finally {
      setPrintingAll(false);
    }
  };

  // --- Renderers ---

  const renderStudentList = () => {
    // Empty state when no students are assigned
    if (students.length === 0) {
      return (
        <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No Students Assigned
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            You don't have any students assigned to you yet. Students will appear here once they are assigned by a coordinator.
          </p>
        </div>
      );
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredStudents = students.filter((s) => {
      // Match student identity fields
      const matchesStudent =
        s.name.toLowerCase().includes(normalizedQuery) ||
        s.studentNumber.toLowerCase().includes(normalizedQuery);

      if (matchesStudent || !normalizedQuery) return true;

      // Match student's submitted documents (filename/type)
      const studentDocs = getStudentDocuments(s.id);
      return studentDocs.some((d) => {
        const fileName = (d.fileName || "").toLowerCase();
        const documentTypeRaw = (d.documentType || "").toLowerCase();
        const documentTypeLabel = formatDocumentType(d.documentType || "")
          .toLowerCase();
        return (
          fileName.includes(normalizedQuery) ||
          documentTypeRaw.includes(normalizedQuery) ||
          documentTypeLabel.includes(normalizedQuery)
        );
      });
    });

    if (filteredStudents.length === 0) {
      return (
        <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-10 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No matching students
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try a student name, student number, file name, or document type.
          </p>
        </div>
      );
    }

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * STUDENTS_PER_PAGE;
    const end = start + STUDENTS_PER_PAGE;
    const paginatedStudents = filteredStudents.slice(start, end);

    const renderPagination = () => (
      <div className="mt-4 sm:mt-6 flex items-center justify-between">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Showing {start + 1}-{Math.min(end, filteredStudents.length)} of {filteredStudents.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );

    if (viewMode === "grid") {
      return (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {paginatedStudents.map(student => {
              const progress = getStudentProgress(student.id);
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={[
                    "bg-white dark:bg-[#212124] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group touch-manipulation",
                    pulseStudentIds.has(student.id) ? "animate-attention-once" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base sm:text-lg flex-shrink-0">
                        {student.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {student.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.studentNumber}</p>
                      </div>
                    </div>
                    {progress.pending > 0 && (
                      <span className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold animate-pulse flex-shrink-0 ml-2">
                        {progress.pending}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-900 dark:text-white">{progress.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{progress.approved}/{progress.total} Requirements</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {renderPagination()}
        </div>
      );
    }

    return (
      <div>
        <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Progress</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedStudents.map(student => {
                  const progress = getStudentProgress(student.id);
                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={[
                        "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors touch-manipulation",
                        pulseStudentIds.has(student.id) ? "animate-attention-once" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {student.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.studentNumber}</div>
                            <div className="md:hidden mt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{progress.percentage}%</span>
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${progress.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                        <div className="w-full max-w-xs">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500 dark:text-gray-400">{progress.percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        {progress.pending > 0 ? (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            {progress.pending} Pending
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">All caught up</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right hidden sm:table-cell">
                        <ChevronRight className="w-5 h-5 text-gray-400 inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {renderPagination()}
      </div>
    );
  };

  const renderStudentDetail = () => {
    if (!selectedStudent) return null;

    const studentDocs = getStudentDocuments(selectedStudent.id);
    const progress = getStudentProgress(selectedStudent.id);

    const categories = [
      { id: "pre-deployment", label: "Pre-Deployment Requirements", color: "blue" },
      { id: "upon-approval", label: "Upon Approval Requirements", color: "yellow" },
      { id: "post-ojt", label: "Post-OJT Requirements", color: "green" },
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Student Header */}
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                aria-label="Back to student list"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
                {selectedStudent.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{selectedStudent.name}</h2>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  <span>{selectedStudent.studentNumber}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="truncate">{selectedStudent.program}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="truncate">{selectedStudent.company}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-xl">
                <div className="text-center px-2 sm:px-4 border-r border-gray-200 dark:border-gray-700">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{progress.percentage}%</div>
                  <div className="text-xs text-gray-500">Completion</div>
                </div>
                <div className="text-center px-2 sm:px-4 border-r border-gray-200 dark:border-gray-700">
                  <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{progress.approved}</div>
                  <div className="text-xs text-gray-500">Approved</div>
                </div>
                <div className="text-center px-2 sm:px-4">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{progress.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
              <button
                onClick={() => handlePrintAll(selectedStudent.id)}
                disabled={printingAll}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Print all submitted documents"
              >
                {printingAll ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Printer className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Print All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Requirements List */}
        <div className="space-y-6">
          {categories.map(category => {
            const categoryReqs = DOCUMENT_REQUIREMENTS.filter(r => r.category === category.id);
            if (categoryReqs.length === 0) return null;

            return (
              <div key={category.id} className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className={`px-6 py-4 bg-${category.color}-50 dark:bg-${category.color}-900/10 border-b border-${category.color}-100 dark:border-${category.color}-900/20`}>
                  <h3 className={`text-lg font-semibold text-${category.color}-900 dark:text-${category.color}-100`}>
                    {category.label}
                  </h3>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {categoryReqs.map(req => {
                    // Find the latest document for this requirement
                    const doc = studentDocs
                      .filter(d => {
                        let match = d.documentType === req.type;
                        // Also match ENDORSEMENT_LETTER_MULTI for ENDORSEMENT_LETTER requirement
                        if (!match && req.type === 'ENDORSEMENT_LETTER') {
                          match = d.documentType === 'ENDORSEMENT_LETTER_MULTI';
                        }
                        return match;
                      })
                      .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())[0];

                    const status = doc ? doc.status : "MISSING";

                    return (
                      <div
                        key={req.id}
                        {...(doc ? { "data-intrak-doc-id": doc.id } : {})}
                        className={[
                          "p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                          doc && pulseDocIds.has(doc.id) ? "animate-attention-once" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${status === "MISSING"
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                              : getStatusColor(status)
                              }`}>
                              {status === "MISSING" ? <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : getStatusIcon(status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{req.name}</h4>
                              {doc ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1 truncate">
                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{doc.fileName}</span>
                                  </span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="whitespace-nowrap">Submitted {doc.submittedDate}</span>
                                </div>
                              ) : (
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Not submitted yet</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                            {doc ? (
                              <>
                                <button
                                  onClick={() => handlePrint(doc)}
                                  className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors touch-manipulation"
                                  title="Print"
                                  aria-label="Print document"
                                >
                                  <Printer className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDownload(doc)}
                                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                                  title="Download"
                                  aria-label="Download document"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                                {status === "PENDING" ? (
                                  <button
                                    onClick={() => handleReview(doc)}
                                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 text-sm touch-manipulation"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span className="hidden xs:inline">Review</span>
                                    <span className="xs:hidden">View</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReview(doc)}
                                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm touch-manipulation"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>View</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Main Render ---

  return (
    <div className="space-y-6 min-h-screen dark:bg-[#19191c]">
      {/* Top Navigation Bar */}
      {!selectedStudent && (
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Student Documents</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track and review student submissions</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <div className="relative sm:hidden flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students or documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Desktop Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students or documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        selectedStudent ? renderStudentDetail() : renderStudentList()
      )}

      {/* Review Modal */}
      {showReviewModal && selectedDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" style={{ marginTop: "0px" }}>
          <div className="bg-white dark:bg-[#19191c] rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-[90vh] sm:max-w-6xl flex flex-col overflow-hidden border-0 sm:border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#19191c]">
              {/* Mobile Layout */}
              <div className="flex flex-col sm:hidden gap-4">
                {/* Top Row - Title and Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight flex-1">
                      {formatDocumentType(selectedDoc.documentType)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handlePrint(selectedDoc)}
                      className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                      title="Print"
                      aria-label="Print document"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(selectedDoc)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                      title="Download"
                      aria-label="Download document"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedDoc(null);
                        setPreviewUrl(null);
                        setReviewRemarks("");
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                      aria-label="Close modal"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Student indicator */}
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
                    Reviewing:{" "}
                    <span className="font-semibold">
                      {selectedDoc.studentName} ({selectedDoc.studentNumber})
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 ${selectedDoc.status === 'APPROVED'
                    ? 'bg-green-600 dark:bg-green-700 text-white'
                    : selectedDoc.status === 'REJECTED'
                      ? 'bg-red-600 dark:bg-red-700 text-white'
                      : selectedDoc.status === 'PENDING'
                        ? 'bg-yellow-500 dark:bg-yellow-600 text-white'
                        : 'bg-orange-500 dark:bg-orange-600 text-white'
                    }`}>
                    {getStatusIcon(selectedDoc.status)}
                    <span>{selectedDoc.status.replace(/_/g, ' ')}</span>
                  </span>
                </div>
              </div>

              {/* Desktop Layout - Original Design */}
              <div className="hidden sm:flex items-start justify-between gap-4">
                {/* Left Section - Document Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Document Icon */}
                  <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    {/* Document Title */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                      {formatDocumentType(selectedDoc.documentType)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 truncate">
                      Reviewing:{" "}
                      <span className="font-semibold">
                        {selectedDoc.studentName} ({selectedDoc.studentNumber})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Section - Status and Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Status Badge */}
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold flex-shrink-0 ${selectedDoc.status === 'APPROVED'
                    ? 'bg-green-600 dark:bg-green-700 text-white'
                    : selectedDoc.status === 'REJECTED'
                      ? 'bg-red-600 dark:bg-red-700 text-white'
                      : selectedDoc.status === 'PENDING'
                        ? 'bg-yellow-500 dark:bg-yellow-600 text-white'
                        : 'bg-orange-500 dark:bg-orange-600 text-white'
                    }`}>
                    {getStatusIcon(selectedDoc.status)}
                    <span>{selectedDoc.status.replace(/_/g, ' ')}</span>
                  </span>

                  {/* Action Icons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePrint(selectedDoc)}
                      className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                      title="Print document"
                      aria-label="Print document"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(selectedDoc)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      title="Download document"
                      aria-label="Download document"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedDoc(null);
                        setPreviewUrl(null);
                        setReviewRemarks("");
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      aria-label="Close modal"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-[#0f0f11]">
              {/* Document Preview Area */}
              <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
                {/* Document Preview Toolbar */}
                {previewUrl && (
                  <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">{selectedDoc.fileName}</span>
                      <span className="text-gray-400">•</span>
                      <span>{selectedDoc.fileSize}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(selectedDoc)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                        title="Download"
                        aria-label="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Document Content */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex items-center justify-center min-h-0">
                  {previewUrl ? (
                    previewType?.includes("image") ? (
                      <img
                        src={previewUrl}
                        alt="Document"
                        className="max-w-full max-h-full object-contain shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                      />
                    ) : (
                      previewType === "application/pdf" ? (
                        <div className="w-full h-full min-h-[400px]">
                          <PDFViewer url={previewUrl} />
                        </div>
                      ) : (
                        <iframe
                          src={previewUrl}
                          className="w-full h-full min-h-[400px] sm:min-h-0 rounded-lg shadow-lg bg-white border border-gray-200 dark:border-gray-700"
                          title="Document Preview"
                        />
                      )
                    )
                  ) : (
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Loading preview...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Actions - Bottom Bar */}
              {selectedDoc.status === 'PENDING' && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#19191c] px-4 py-3">
                  <div className="flex items-center gap-3 max-w-4xl mx-auto">
                    <textarea
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      placeholder="Add remarks (required when requesting changes)..."
                      className="flex-1 p-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={1}
                    />
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleReviewAction('approve')}
                        disabled={isSubmittingReview}
                        className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                      >
                        {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewAction('request_changes')}
                        disabled={isSubmittingReview}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                      >
                        {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                        Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedDoc.status !== 'PENDING' && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#19191c] px-4 py-3">
                  <div className={`p-3 rounded-lg text-center font-medium max-w-md mx-auto ${selectedDoc.status === 'APPROVED' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                    selectedDoc.status === 'REJECTED' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
                      'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    }`}>
                    Document {selectedDoc.status === 'APPROVED' ? 'Approved' : selectedDoc.status === 'REJECTED' ? 'Rejected' : 'Changes Requested'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDocumentsTab;
