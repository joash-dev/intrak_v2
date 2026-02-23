import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  Trash2,
  ChevronDown,
  Clock,
  Zap,
  Loader2,
  Lock,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { documentService } from "../../services/documentService";
import type { Document, DocumentStats } from "../../services/documentService";
import { templateService } from "../../services/templateService";
import type { DocumentTemplate } from "../../services/templateService";
import Skeleton from "../../components/Skeleton";
import { toast } from "react-hot-toast";
import PDFViewer from "../../components/document/PDFViewer";

const StudentDocumentsTab: React.FC = () => {
  const { refreshStudentData } = useOutletContext<{ refreshStudentData: () => void }>() || { refreshStudentData: () => { } };
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [reuploadingDoc, setReuploadingDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // For upload modal
  const [selectedType, setSelectedType] = useState<string>("");
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  // Expanded categories state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    PRE_DEPLOYMENT: true,
    UPON_APPROVAL: true,
    POST_OJT: true,
  });

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewFileUrl) {
        URL.revokeObjectURL(previewFileUrl);
      }
    };
  }, [previewFileUrl]);

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
      label: "Certification of Units Earned (Form FM-AA-INT-02)",
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

    // II. UPON APPROVAL OF COMPANY
    {
      value: "MOA",
      label: "Memorandum of Agreement (MOA) (Form FM-AA-INT-10)",
      required: true,
      category: "UPON_APPROVAL",
    },
    {
      value: "INTERNSHIP_AGREEMENT",
      label: "Internship Agreement (Form FM-AA-INT-10)",
      required: true,
      category: "UPON_APPROVAL",
    },
    {
      value: "TRAINING_AGREEMENT",
      label: "Training Agreement and Liability Waiver (Form FM-AA-INT-15)",
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
      label: "Certificate of Training Completion",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "NARRATIVE_REPORT",
      label: "Internship Narrative Report",
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
      value: "TIME_FRAMES",
      label: "Internship Time Frames (Form FM-AA-INT-14)",
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
      label: "Student-Trainees Feedback Form (Form FM-AA-INT-17)",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "SUPERVISOR_FEEDBACK",
      label: "Training Supervisor's Feedback Form (Form FM-AA-INT-18)",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "AGENCY_SELF_EVALUATION",
      label: "Evaluation Instrument of PSU Partner Agencies (Self Ratee) (Form FM-AA-INT-19b)",
      required: true,
      category: "POST_OJT",
    },
    {
      value: "AGENCY_STUDENT_EVALUATION",
      label: "Evaluation Instrument of PSU Partner Agencies (Student) (Form FM-AA-INT-19c)",
      required: true,
      category: "POST_OJT",
    },
  ];

  // Load documents and templates on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [docs, fetchedTemplates] = await Promise.all([
        documentService.getStudentDocuments(),
        templateService.getTemplates(undefined, true)
      ]);

      setDocuments(docs);
      setTemplates(fetchedTemplates);

      // Notify parent component about document changes
      refreshStudentData();
    } catch (err: any) {
      console.error("Error loading data:", err);
      if (err.response?.status === 401) {
        toast.error("Authentication required. Please log in again.");
      } else {
        toast.error("Failed to load documents. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Split documents: pending acceptance (for this student) vs. waiting for others vs. active
  const pendingSharedDocs = useMemo(() =>
    documents.filter(d => d.sharedStatus === 'PENDING_ACCEPTANCE'), [documents]);
  const waitingForAcceptanceDocs = useMemo(() =>
    documents.filter(d => d.sharedStatus === 'WAITING_FOR_ACCEPTANCE'), [documents]);
  const activeDocs = useMemo(() =>
    documents.filter(d => d.sharedStatus !== 'PENDING_ACCEPTANCE' && d.sharedStatus !== 'WAITING_FOR_ACCEPTANCE'), [documents]);

  const stats: DocumentStats = useMemo(() => {
    return documentService.calculateStats(activeDocs);
  }, [activeDocs]);

  // Accept/Decline shared document handlers
  const [processingSharedId, setProcessingSharedId] = useState<string | null>(null);

  const handleAcceptShared = async (docId: string) => {
    try {
      setProcessingSharedId(docId);
      const result = await documentService.acceptSharedDocument(docId);
      if (result?.pdfGenerated) {
        toast.success('All students accepted! PDF has been generated.', { duration: 5000 });
      } else {
        toast.success('Endorsement letter accepted! Waiting for other students.');
      }
      await loadData();
    } catch (err) {
      console.error('Error accepting shared document:', err);
      toast.error('Failed to accept document');
    } finally {
      setProcessingSharedId(null);
    }
  };

  const handleDeclineShared = async (docId: string) => {
    if (!window.confirm('Are you sure you want to decline this endorsement letter? It will be removed from your documents.')) return;
    try {
      setProcessingSharedId(docId);
      await documentService.declineSharedDocument(docId);
      toast.success('Endorsement letter declined');
      await loadData();
    } catch (err) {
      console.error('Error declining shared document:', err);
      toast.error('Failed to decline document');
    } finally {
      setProcessingSharedId(null);
    }
  };

  // Check if all required pre-deployment documents are approved
  // Helper: find a document matching a requirement type (only active/accepted docs)
  // Handles ENDORSEMENT_LETTER matching both ENDORSEMENT_LETTER and ENDORSEMENT_LETTER_MULTI
  const findDocForType = (docType: string) => {
    if (docType === 'ENDORSEMENT_LETTER') {
      return activeDocs.find(d => d.type === 'ENDORSEMENT_LETTER' || d.type === 'ENDORSEMENT_LETTER_MULTI');
    }
    return activeDocs.find(d => d.type === docType);
  };

  const preDeploymentComplete = useMemo(() => {
    const preDeploymentReqs = documentTypes.filter(
      dt => dt.category === "PRE_DEPLOYMENT" && dt.required
    );
    return preDeploymentReqs.every(req => {
      const doc = findDocForType(req.value);
      return doc?.status === "APPROVED";
    });
  }, [documents]);

  // Check if a category is locked (can't submit yet)
  const isCategoryLocked = (category: string): boolean => {
    if (category === "PRE_DEPLOYMENT") return false;
    // UPON_APPROVAL and POST_OJT require all pre-deployment to be completed
    return !preDeploymentComplete;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleFile = async (file: File) => {
    // Validate file type - PDF only
    if (file.type !== 'application/pdf') {
      toast.error("Invalid file type. Please upload PDF files only.");
      return;
    }

    // Validate file extension as well
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Invalid file type. Please upload PDF files only.");
      return;
    }

    if (!documentService.isValidFileSize(file)) {
      toast.error("File size too large. Please upload files smaller than 10MB.");
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);

    // Create preview URL for PDF
    const url = URL.createObjectURL(file);
    setPreviewFileUrl(url);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    if (previewFileUrl) {
      URL.revokeObjectURL(previewFileUrl);
    }
    setSelectedFile(null);
    setPreviewFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAutoGenerate = async (type: string) => {
    try {
      setGeneratingType(type);
      const doc = await documentService.autoGenerateDocument(type);
      toast.success("Document generated successfully!");
      await loadData(); // Refresh the documents list
      if (refreshStudentData) refreshStudentData();
    } catch (error: any) {
      console.error("Error auto-generating document:", error);
      toast.error(error?.response?.data?.message || "Failed to generate document. Please try again.");
    } finally {
      setGeneratingType(null);
    }
  };

  const handleUploadClick = (type: string) => {
    setSelectedType(type);
    setReuploadingDoc(null);
    setSelectedFile(null);
    if (previewFileUrl) {
      URL.revokeObjectURL(previewFileUrl);
    }
    setPreviewFileUrl(null);
    setIsDragging(false);
    setUploadModalOpen(true);
  };

  const handleReuploadClick = (doc: Document) => {
    setSelectedType(doc.type);
    setReuploadingDoc(doc);
    setSelectedFile(null);
    if (previewFileUrl) {
      URL.revokeObjectURL(previewFileUrl);
    }
    setPreviewFileUrl(null);
    setIsDragging(false);
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress
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
      clearInterval(progressInterval);

      toast.success("Document uploaded successfully");

      // Clean up preview URL
      if (previewFileUrl) {
        URL.revokeObjectURL(previewFileUrl);
        setPreviewFileUrl(null);
      }

      // Reload data
      await loadData();

      // If this was a re-upload, delete the previous document
      if (reuploadingDoc) {
        try {
          await documentService.deleteDocument(reuploadingDoc.id);
          await loadData();
        } catch (e) {
          console.error("Failed to delete old document after re-upload:", e);
        }
      }

      // Reset and close modal
      setSelectedFile(null);
      setUploadModalOpen(false);
      setIsDragging(false);

      // Close modal
      setUploadModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async (type: string) => {
    const template = templates.find(t => t.type === type);
    if (!template) {
      toast.error("No template available for this document type.");
      return;
    }

    try {
      await templateService.downloadTemplate(template.id, template.filename);
      toast.success("Template downloaded successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to download template");
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
        toast.success("Document deleted successfully");
        await loadData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Delete failed. Please try again.");
      }
    }
  };

  // Load preview when opening the modal
  useEffect(() => {
    const loadPreview = async () => {
      if (!viewModalOpen || !selectedDoc) return;
      try {
        const blob = await documentService.downloadDocument(selectedDoc.id);
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewType(blob.type || null);
      } catch (e) {
        setPreviewUrl(null);
        setPreviewType(null);
      }
    };
    loadPreview();
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setPreviewType(null);
    };
  }, [viewModalOpen, selectedDoc]);

  // Group requirements by category
  const groupedRequirements = useMemo(() => {
    const grouped: Record<string, typeof documentTypes> = {
      PRE_DEPLOYMENT: [],
      UPON_APPROVAL: [],
      POST_OJT: [],
    };

    documentTypes.forEach(req => {
      // Filter by search query if exists
      if (searchQuery && !req.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }
      if (grouped[req.category]) {
        grouped[req.category].push(req);
      }
    });

    return grouped;
  }, [searchQuery]);

  const getStatusBadge = (doc: Document | undefined, required: boolean) => {
    if (!doc) {
      return required ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          Missing
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          Optional
        </span>
      );
    }

    switch (doc.status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" /> Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3 mr-1" /> Needs Revision
          </span>
        );
      case "RESUBMISSION_REQUESTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            <AlertCircle className="w-3 h-3 mr-1" /> Resubmit
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-outfit">
        <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header Section */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                OJT Requirements Checklist
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your progress, download templates, and upload documents
              </p>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center space-x-6 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Completed</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Pending</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search requirements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-[#212124] text-gray-900 dark:text-white shadow-sm"
        />
      </div>

      {/* Pending Shared Endorsement Letters (from other students) */}
      {pendingSharedDocs.length > 0 && (
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-amber-200 dark:border-amber-800 overflow-hidden">
          <div className="flex items-center space-x-3 px-4 sm:px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
                Pending Endorsement Letters ({pendingSharedDocs.length})
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Another student has included you in their endorsement letter. Please review and accept or decline.
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {pendingSharedDocs.map(doc => (
              <div key={doc.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Endorsement Letter (Multiple Students)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted by <span className="font-medium text-gray-700 dark:text-gray-300">{doc.uploadedBy?.name || 'Unknown'}</span>
                      {doc.uploadedAt && <> · {doc.uploadedAt}</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleAcceptShared(doc.id)}
                    disabled={processingSharedId === doc.id}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processingSharedId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleDeclineShared(doc.id)}
                    disabled={processingSharedId === doc.id}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 transition-colors disabled:opacity-50"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submitter's Endorsement Letters Waiting for Acceptance */}
      {waitingForAcceptanceDocs.length > 0 && (
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 overflow-hidden">
          <div className="flex items-center space-x-3 px-4 sm:px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                Waiting for Student Acceptance ({waitingForAcceptanceDocs.length})
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Your multi-student endorsement letter is waiting for all included students to accept. The PDF will be generated once everyone accepts.
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {waitingForAcceptanceDocs.map(doc => (
              <div key={doc.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Endorsement Letter (Multiple Students)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted {doc.uploadedAt && <>{doc.uploadedAt}</>} · <span className="text-blue-600 dark:text-blue-400 font-medium">Awaiting student acceptance</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Waiting for acceptance
                  </span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Cancel this endorsement letter"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      <div className="space-y-6">
        {Object.entries(groupedRequirements).map(([category, requirements]) => {
          if (requirements.length === 0) return null;

          const categoryLabel =
            category === "PRE_DEPLOYMENT" ? "Pre-Deployment Requirements" :
              category === "UPON_APPROVAL" ? "Upon Approval Requirements" :
                "Post-OJT Requirements";

          const categoryStyles = {
            PRE_DEPLOYMENT: {
              button: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20",
              iconBg: "bg-blue-100 dark:bg-blue-900/30",
              iconColor: "text-blue-600 dark:text-blue-400",
              title: "text-blue-900 dark:text-blue-100"
            },
            UPON_APPROVAL: {
              button: "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20",
              iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
              iconColor: "text-yellow-600 dark:text-yellow-400",
              title: "text-yellow-900 dark:text-yellow-100"
            },
            POST_OJT: {
              button: "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20",
              iconBg: "bg-green-100 dark:bg-green-900/30",
              iconColor: "text-green-600 dark:text-green-400",
              title: "text-green-900 dark:text-green-100"
            }
          };

          const styles = categoryStyles[category as keyof typeof categoryStyles];

          const locked = isCategoryLocked(category);

          return (
            <div key={category} className={`bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${locked ? 'opacity-75' : ''}`}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full flex items-center justify-between px-4 sm:px-6 py-4 border-b transition-colors ${styles.button}`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${locked ? 'bg-gray-100 dark:bg-gray-800' : styles.iconBg}`}>
                    {locked ? (
                      <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                    <FileText className={`w-5 h-5 ${styles.iconColor}`} />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                    <h3 className={`text-base sm:text-lg font-semibold ${locked ? 'text-gray-400 dark:text-gray-500' : styles.title} truncate`}>
                      {categoryLabel}
                    </h3>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 whitespace-nowrap w-fit">
                      {requirements.length} items
                    </span>
                    {locked && (
                      <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800 whitespace-nowrap w-fit flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Complete Pre-Deployment first
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 ml-2 transition-transform duration-300 ${expandedCategories[category] ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Requirements List - Animated */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${expandedCategories[category] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
              >
                <div className="overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {requirements.map((req) => {
                      const doc = findDocForType(req.value);
                      const template = templates.find(t => t.type === req.value);
                      const isCompleted = doc?.status === "APPROVED";

                      return (
                        <div key={req.value} className={`p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isCompleted ? 'bg-green-50/30 dark:bg-green-900/5' : ''}`}>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Left: Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2 lg:mb-0">
                                <div className="flex items-start space-x-3">
                                  <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isCompleted
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-gray-300 dark:border-gray-600"
                                    }`}>
                                    {isCompleted && <CheckCircle className="w-3.5 h-3.5" />}
                                  </div>
                                  <div>
                                    <h4 className={`font-medium text-gray-900 dark:text-white ${isCompleted ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                                      {req.label}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                      {getStatusBadge(doc, req.required)}
                                      {doc && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                      )}
                                    </div>
                                    {doc?.remarks && (
                                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{doc.remarks}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-end min-w-[280px]">
                              {locked ? (
                                /* Show locked state for non-pre-deployment categories */
                                <div className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <Lock className="w-4 h-4" />
                                  Locked
                                </div>
                              ) : (
                                <>
                              {/* View Button (if uploaded) */}
                              {doc && (
                                <button
                                  onClick={() => handleView(doc)}
                                  className="inline-flex items-center justify-center h-10 px-4 min-w-[110px] text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </button>
                              )}

                              {/* Fill Up Button (for template-backed forms) */}
                              {(!doc || doc.status === "REJECTED" || doc.status === "RESUBMISSION_REQUESTED") && documentService.hasFormTemplate(req.value) && (
                                <button
                                  onClick={() => navigate(`/student/documents/form/${req.value}`)}
                                  className="inline-flex items-center justify-center h-10 px-4 min-w-[110px] text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow-md border border-transparent"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Fill Up
                                </button>
                              )}

                                  {/* Auto-Generate Button (for types like TIME_FRAMES that can be generated from existing data) */}
                                  {(!doc || doc.status === "REJECTED" || doc.status === "RESUBMISSION_REQUESTED") && documentService.canAutoGenerate(req.value) && (
                                    <button
                                      onClick={() => handleAutoGenerate(req.value)}
                                      disabled={generatingType === req.value}
                                      className="inline-flex items-center justify-center h-10 px-4 min-w-[110px] text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg shadow-sm transition-all hover:shadow-md border border-transparent"
                                    >
                                      {generatingType === req.value ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Zap className="w-4 h-4 mr-2" />
                                          Generate
                                        </>
                                      )}
                                    </button>
                                  )}

                              {/* Upload Button (for non-template types OR as fallback) */}
                                  {(!doc || doc.status === "REJECTED" || doc.status === "RESUBMISSION_REQUESTED") && !documentService.hasFormTemplate(req.value) && !documentService.canAutoGenerate(req.value) && (
                                <button
                                  onClick={() => doc ? handleReuploadClick(doc) : handleUploadClick(req.value)}
                                  className="inline-flex items-center justify-center h-10 px-4 min-w-[110px] text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow-md border border-transparent"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {doc ? "Re-upload" : "Upload"}
                                </button>
                              )}

                              {/* Delete Button (only if pending) */}
                              {doc && doc.status === "PENDING" && (
                                <button
                                  onClick={() => handleDelete(doc.id)}
                                  className="inline-flex items-center justify-center h-10 w-10 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ marginTop: "0px" }}>
          <div className={`bg-white dark:bg-[#19191c] rounded-2xl shadow-xl w-full ${previewFileUrl ? 'max-w-4xl max-h-[90vh]' : 'max-w-md'} overflow-hidden flex flex-col`}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {reuploadingDoc ? "Re-upload Document" : "Upload Document"}
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  Uploading: {documentTypes.find(t => t.value === selectedType)?.label}
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                ref={dropZoneRef}
                onClick={handleDropZoneClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : selectedFile
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  accept=".pdf,application/pdf"
                />
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-3">
                      <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="ml-2 p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove file"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Click to change file or drag and drop a new PDF
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF only (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* PDF Preview */}
              {selectedFile && previewFileUrl && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Document Preview
                    </p>
                    <button
                      onClick={() => {
                        if (previewFileUrl) {
                          URL.revokeObjectURL(previewFileUrl);
                          setPreviewFileUrl(null);
                        }
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Close preview"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-96 overflow-auto bg-white dark:bg-gray-800 p-4">
                    <iframe
                      src={previewFileUrl}
                      className="w-full h-full border-0"
                      title="PDF Preview"
                    />
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500">Uploading... {uploadProgress}%</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    if (previewFileUrl) {
                      URL.revokeObjectURL(previewFileUrl);
                      setPreviewFileUrl(null);
                    }
                    setSelectedFile(null);
                    setIsDragging(false);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile || uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
                >
                  {uploading ? "Uploading..." : "Submit Document"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ marginTop: "0px" }}>
          <div className="bg-white dark:bg-[#19191c] rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#19191c]">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {documentTypes.find(t => t.value === selectedDoc.type)?.label || selectedDoc.type}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {selectedDoc.filename}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Uploaded {selectedDoc.uploadedAt ? new Date(selectedDoc.uploadedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Document Preview Area */}
              <div className="flex-1 bg-gray-50 dark:bg-[#0f0f11] p-6 overflow-y-auto flex items-center justify-center relative">
                {previewUrl ? (
                  previewType?.includes("image") ? (
                    <img
                      src={previewUrl}
                      alt="Document"
                      className="max-w-full max-h-full object-contain shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[400px]">
                      {previewType === "application/pdf" ? (
                        <PDFViewer url={previewUrl} />
                      ) : (
                        <iframe
                          src={previewUrl}
                          className="w-full h-full rounded-lg shadow-sm bg-white border border-gray-200 dark:border-gray-700"
                          title="Document Preview"
                        />
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                      <img src="/just_logo.png" alt="Loading..." className="relative w-16 h-16 object-contain z-10" />
                    </div>
                    <p className="text-gray-500 font-medium">Loading preview...</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDocumentsTab;
