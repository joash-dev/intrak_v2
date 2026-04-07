import { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  XCircle,
  Search,
  FileCheck,
  Briefcase,
  Eye,
  Download,
  FileText,
  AlertCircle,
  FileUp,
  PlusCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { useOutletContext, Link, useSearchParams } from "react-router-dom";
import { documentService } from "../../services/documentService";
import type { Document as AppDocument } from "../../services/documentService";
import { companyProposalService, type CompanyProposal } from "../../services/companyProposalService";
import toast from "react-hot-toast";
import { formatDateMMDDYYYY } from "../../utils/formatDate";

interface PartnershipDocument {
  id: string;
  type: string;
  name: string;
  formNumber: string;
  description: string;
  required: boolean;
  document?: AppDocument | null;
  uploading?: boolean;
}

const StudentCompanyPartnershipAssistance = () => {
  const { studentCompany, companyApplications } = useOutletContext<{
    studentCompany: string | null;
    companyApplications: any[];
  }>() || { studentCompany: null, companyApplications: [] };

  const hasCompanyOrApplication = () => {
    if (studentCompany) return true;
    return companyApplications.some(
      (app) => app.status === "PENDING" || app.status === "APPROVED"
    );
  };

  if (hasCompanyOrApplication()) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            You already have a company assigned or a pending application. Please check the <Link to="/student/companies" className="underline font-semibold">Companies</Link> tab for more information.
          </p>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(true);
  const [showStepsModal, setShowStepsModal] = useState(false);

  // Pre-deployment required documents (uploaded in Documents tab)
  const [preDeploymentDocuments, setPreDeploymentDocuments] = useState<PartnershipDocument[]>([
    {
      id: "application-internship",
      type: "APPLICATION_INTERNSHIP",
      name: "Application for Internship",
      formNumber: "Form FM-AA-INT-01",
      description: "Application form for internship program",
      required: true,
    },
    {
      id: "medical-certificate",
      type: "MEDICAL_CERTIFICATE",
      name: "Medical Certificate and Psychological Test from any government physician",
      formNumber: "From any government physician",
      description: "Medical certificate and psychological test results from any government physician",
      required: true,
    },
    {
      id: "certification-units",
      type: "CERTIFICATION_UNITS",
      name: "Certification of Units Earned",
      formNumber: "Form FM-AA-INT-02",
      description: "Certification of units earned for practicum/internship",
      required: true,
    },
    {
      id: "internship-resume",
      type: "INTERNSHIP_RESUME",
      name: "Internship Resume",
      formNumber: "Form FM-AA-INT-09",
      description: "Resume specifically formatted for internship applications",
      required: true,
    },
    {
      id: "consent-form",
      type: "CONSENT_FORM",
      name: "Consent Form",
      formNumber: "Form FM-AA-INT-03",
      description: "Consent form for internship participation",
      required: true,
    },
    {
      id: "endorsement-letter",
      type: "ENDORSEMENT_LETTER",
      name: "Endorsement Letter",
      formNumber: "Form FM-AA-INT-05",
      description: "Official endorsement letter from the university",
      required: true,
    },
    {
      id: "internship-release",
      type: "INTERNSHIP_RELEASE",
      name: "Internship Release Form",
      formNumber: "Form FM-AA-INT-12",
      description: "Form authorizing the student for internship",
      required: true,
    },
  ]);

  const [previewDoc, setPreviewDoc] = useState<AppDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [proposals, setProposals] = useState<CompanyProposal[]>([]);
  const [proposalForm, setProposalForm] = useState({
    companyName: "",
    companyYears: "",
    assignedDepartment: "",
    assignedRole: "",
    hasPsuMoa: "",
    address: "",
    contactPerson: "",
    contactEmail: "",
    contactNumber: "",
    industry: "",
    remarks: "",
  });
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [uploadingProposalId, setUploadingProposalId] = useState<string | null>(null);
  const [proposalUploadProgress, setProposalUploadProgress] = useState(0);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [attachmentToRemove, setAttachmentToRemove] = useState<{
    attachmentId: string;
    filename: string;
  } | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<CompanyProposal | null>(null);
  const [resubmittingProposalId, setResubmittingProposalId] = useState<string | null>(null);
  const [submittingDraftProposalId, setSubmittingDraftProposalId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const highlightProposalId = searchParams.get("proposal");

  useEffect(() => {
    if (!highlightProposalId || proposals.length === 0) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`company-proposal-${highlightProposalId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-blue-500", "ring-offset-2", "dark:ring-offset-[#212124]");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-blue-500", "ring-offset-2", "dark:ring-offset-[#212124]");
        }, 3500);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [highlightProposalId, proposals]);

  useEffect(() => {
    loadData();

    const pollInterval = setInterval(() => {
      void loadPartnershipDocuments();
      void loadCompanyProposals();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadPartnershipDocuments();
      await loadCompanyProposals();
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load partnership assistance data");
    } finally {
      setLoading(false);
    }
  };

  const loadPartnershipDocuments = async () => {
    try {
      // Get all student documents
      const documents = await documentService.getStudentDocuments();

      // Map documents to pre-deployment document types (only show documents uploaded in Documents tab)
      setPreDeploymentDocuments(prev => prev.map(doc => {
        let uploadedDoc = documents.find(d => d.type === doc.type);
        // Also match ENDORSEMENT_LETTER_MULTI for ENDORSEMENT_LETTER
        if (!uploadedDoc && doc.type === 'ENDORSEMENT_LETTER') {
          uploadedDoc = documents.find(d => d.type === 'ENDORSEMENT_LETTER_MULTI');
        }
        return {
          ...doc,
          document: uploadedDoc || null,
        };
      }));
    } catch (error: any) {
      console.error("Error loading pre-deployment documents:", error);
    }
  };

  const loadCompanyProposals = async () => {
    try {
      const proposalData = await companyProposalService.getMyProposals();
      setProposals(proposalData);
    } catch (error: any) {
      console.error("Error loading company proposals:", error);
    }
  };

  const handleCreateProposal = async () => {
    if (!proposalForm.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!proposalForm.companyYears.trim()) {
      toast.error("Years of company is required");
      return;
    }

    const parsedYears = Number(proposalForm.companyYears);
    if (!Number.isInteger(parsedYears) || parsedYears < 0) {
      toast.error("Years of company must be a whole number starting from 0");
      return;
    }

    if (!proposalForm.assignedDepartment.trim()) {
      toast.error("Department assigned is required");
      return;
    }

    if (!proposalForm.assignedRole.trim()) {
      toast.error("Role assigned is required");
      return;
    }

    if (!proposalForm.hasPsuMoa) {
      toast.error("Please select PSU MOA status");
      return;
    }

    try {
      setCreatingProposal(true);
      await companyProposalService.createProposal({
        companyName: proposalForm.companyName.trim(),
        companyYears: parsedYears,
        assignedDepartment: proposalForm.assignedDepartment.trim(),
        assignedRole: proposalForm.assignedRole.trim(),
        hasPsuMoa: proposalForm.hasPsuMoa === "yes",
        address: proposalForm.address.trim() || undefined,
        contactPerson: proposalForm.contactPerson.trim() || undefined,
        contactEmail: proposalForm.contactEmail.trim() || undefined,
        contactNumber: proposalForm.contactNumber.trim() || undefined,
        industry: proposalForm.industry.trim() || undefined,
        remarks: proposalForm.remarks.trim() || undefined,
      });

      toast.success("Draft saved. Submit when ready; add files if your instructor requests them.");
      setProposalForm({
        companyName: "",
        companyYears: "",
        assignedDepartment: "",
        assignedRole: "",
        hasPsuMoa: "",
        address: "",
        contactPerson: "",
        contactEmail: "",
        contactNumber: "",
        industry: "",
        remarks: "",
      });
      await loadCompanyProposals();
    } catch (error: any) {
      console.error("Error creating proposal:", error);
      toast.error(error.response?.data?.message || "Failed to submit proposal");
    } finally {
      setCreatingProposal(false);
    }
  };

  const handleUploadProposalFile = async (proposalId: string, file: File | null) => {
    if (!file) return;
    try {
      setUploadingProposalId(proposalId);
      setProposalUploadProgress(0);
      await companyProposalService.uploadAttachment(proposalId, file, "STUDENT_PROPOSAL", {
        onUploadProgress: (pct) => setProposalUploadProgress(pct),
      });
      toast.success("Proposal file uploaded");
      await loadCompanyProposals();
    } catch (error: any) {
      console.error("Error uploading proposal file:", error);
      toast.error(error.response?.data?.message || "Failed to upload file");
    } finally {
      setUploadingProposalId(null);
      setProposalUploadProgress(0);
    }
  };

  const handleSubmitDraftToInstructor = async (proposal: CompanyProposal) => {
    try {
      setSubmittingDraftProposalId(proposal.id);
      await companyProposalService.submitDraftToInstructor(proposal.id);
      toast.success("Submitted to your instructor");
      await loadCompanyProposals();
    } catch (error: any) {
      console.error("Error submitting draft:", error);
      toast.error(error.response?.data?.message || "Failed to submit");
    } finally {
      setSubmittingDraftProposalId(null);
    }
  };

  const handleResubmitProposal = async (proposal: CompanyProposal) => {
    try {
      setResubmittingProposalId(proposal.id);
      await companyProposalService.studentResubmit(proposal.id);
      toast.success("Resubmitted for instructor review");
      await loadCompanyProposals();
    } catch (error: any) {
      console.error("Error resubmitting proposal:", error);
      toast.error(error.response?.data?.message || "Failed to resubmit");
    } finally {
      setResubmittingProposalId(null);
    }
  };

  const handlePreviewProposalAttachment = async (attachmentId: string, filename: string) => {
    try {
      const blob = await companyProposalService.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
    } catch (error: any) {
      console.error("Error previewing proposal attachment:", error);
      toast.error(`Failed to preview ${filename}`);
    }
  };

  const confirmRemoveAttachment = async () => {
    if (!attachmentToRemove) return;
    const { attachmentId } = attachmentToRemove;
    try {
      setDeletingAttachmentId(attachmentId);
      await companyProposalService.deleteAttachment(attachmentId);
      toast.success("File removed");
      setAttachmentToRemove(null);
      await loadCompanyProposals();
    } catch (error: any) {
      console.error("Error deleting proposal attachment:", error);
      toast.error(error.response?.data?.message || "Failed to remove file");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handleDownloadProposalAttachment = async (attachmentId: string, filename: string) => {
    try {
      const blob = await companyProposalService.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading proposal attachment:", error);
      toast.error(`Failed to download ${filename}`);
    }
  };

  const requestDeleteProposal = (proposal: CompanyProposal) => {
    const deletableStatuses = ["DRAFT", "RETURNED_BY_INSTRUCTOR", "REJECTED_BY_INSTRUCTOR"];

    if (!deletableStatuses.includes(proposal.status)) {
      toast.error("This proposal can no longer be deleted.");
      return;
    }

    setProposalToDelete(proposal);
  };

  const confirmDeleteProposal = async () => {
    if (!proposalToDelete) return;
    try {
      await companyProposalService.deleteProposal(proposalToDelete.id);
      toast.success("Proposal deleted");
      setProposalToDelete(null);
      await loadCompanyProposals();
    } catch (error: any) {
      console.error("Error deleting proposal:", error);
      toast.error(error.response?.data?.message || "Failed to delete proposal");
    }
  };

  const handlePreview = async (document: AppDocument) => {
    try {
      setPreviewDoc(document);
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error: any) {
      console.error("Error previewing document:", error);
      toast.error("Failed to preview document");
    }
  };

  const handleDownload = async (document: AppDocument) => {
    try {
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Document downloaded");
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Partnership Assistance</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Submit a company proposal, upload supporting files, and track each approval stage.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 min-w-0">
          <div className="bg-white dark:bg-[#212124] rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company Proposals</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Submit a proposed company, upload supporting file(s), and track each approval stage.
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">New Proposal</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={proposalForm.companyName}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="Company name *"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
            <input
              value={proposalForm.industry}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, industry: e.target.value }))}
              placeholder="Industry"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
            <input
              type="number"
              min={0}
              value={proposalForm.companyYears}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, companyYears: e.target.value }))}
              placeholder="Years of company *"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
            <input
              value={proposalForm.assignedDepartment}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, assignedDepartment: e.target.value }))}
              placeholder="Department assigned *"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
            <input
              value={proposalForm.assignedRole}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, assignedRole: e.target.value }))}
              placeholder="Role assigned *"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
            <select
              value={proposalForm.hasPsuMoa}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, hasPsuMoa: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">PSU MOA status *</option>
              <option value="yes">Agency has MOA with PSU</option>
              <option value="no">Agency has no MOA yet</option>
            </select>
            <input
              value={proposalForm.address}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Address"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
            <input
              value={proposalForm.contactPerson}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
              placeholder="Contact person"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
            <input
              value={proposalForm.contactEmail}
              onChange={(e) => setProposalForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="Contact email"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
            <input
              value={proposalForm.contactNumber}
              onChange={(e) => {
                const rawValue = e.target.value;
                setProposalForm((prev) => ({ ...prev, contactNumber: rawValue }));
              }}
              placeholder="Contact number"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
            />
          </div>
          <textarea
            value={proposalForm.remarks}
            onChange={(e) => setProposalForm((prev) => ({ ...prev, remarks: e.target.value }))}
            placeholder="Remarks (optional)"
            rows={2}
            className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212124] text-sm"
          />
          <button
            onClick={handleCreateProposal}
            disabled={creatingProposal}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            {creatingProposal ? "Saving…" : "Save draft"}
          </button>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-base font-semibold text-gray-900 dark:text-white">My Proposals</p>
            <span className="text-sm px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#19191c] text-gray-600 dark:text-gray-300">
              {proposals.length} total
            </span>
          </div>
          {proposals.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No proposals yet.</p>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => {
                const canStudentUpload =
                  proposal.status === "DRAFT" || proposal.status === "RETURNED_BY_INSTRUCTOR";
                const canStudentDelete =
                  proposal.status === "DRAFT" ||
                  proposal.status === "RETURNED_BY_INSTRUCTOR" ||
                  proposal.status === "REJECTED_BY_INSTRUCTOR";
                const submittedToInstructor = proposal.status === "SUBMITTED_TO_INSTRUCTOR";
                const statusClass =
                  proposal.status === "DRAFT"
                    ? "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300"
                    : proposal.status === "APPROVED"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : proposal.status.includes("REJECTED")
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : proposal.status.includes("RETURNED")
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : proposal.status.includes("FORWARDED") || proposal.status.includes("COORDINATOR")
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";

                return (
                  <div
                    key={proposal.id}
                    id={`company-proposal-${proposal.id}`}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-[#212124] transition-shadow"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{proposal.companyName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {proposal.status === "DRAFT" ? "Created" : "Submitted"}{" "}
                          {formatDateMMDDYYYY(proposal.createdAt)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                          ID: {proposal.id}
                        </p>
                      </div>
                      <span className={`inline-flex items-center text-sm px-3 py-1.5 rounded-full ${statusClass}`}>
                        {proposal.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    {(proposal.status === "RETURNED_BY_INSTRUCTOR" ||
                      proposal.status === "REJECTED_BY_INSTRUCTOR") &&
                      proposal.remarks?.trim() && (
                        <div
                          className={`mt-3 rounded-lg border p-3 text-sm ${proposal.status === "REJECTED_BY_INSTRUCTOR"
                            ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20"
                            : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20"
                            }`}
                        >
                          <p
                            className={`text-xs font-semibold uppercase tracking-wide mb-1 ${proposal.status === "REJECTED_BY_INSTRUCTOR"
                              ? "text-red-900 dark:text-red-200"
                              : "text-amber-900 dark:text-amber-100"
                              }`}
                          >
                            Instructor remarks
                          </p>
                          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                            {proposal.remarks.trim()}
                          </p>
                        </div>
                      )}

                    {proposal.status === "DRAFT" && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/40 p-3 text-sm">
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          This proposal is a <span className="font-semibold">draft</span>. You do not need to attach files
                          yet unless your instructor has asked for specific documents. When ready, use{" "}
                          <span className="font-semibold">Submit to instructor</span>. After submission, uploads stay off
                          until your instructor returns this proposal for revision (if needed).
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSubmitDraftToInstructor(proposal)}
                          disabled={submittingDraftProposalId === proposal.id}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                          {submittingDraftProposalId === proposal.id
                            ? "Submitting…"
                            : "Submit to instructor"}
                        </button>
                      </div>
                    )}

                    {proposal.status === "RETURNED_BY_INSTRUCTOR" && (
                      <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/80 dark:border-indigo-800/60 dark:bg-indigo-950/30 p-3 text-sm">
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          Follow your instructor&apos;s remarks above. Upload files only if they asked for specific
                          documents; otherwise you can resubmit when you are ready. Use{" "}
                          <span className="font-semibold">Resubmit for review</span> so your instructor sees it in their
                          queue again.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleResubmitProposal(proposal)}
                          disabled={resubmittingProposalId === proposal.id}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                          {resubmittingProposalId === proposal.id ? "Resubmitting…" : "Resubmit for review"}
                        </button>
                      </div>
                    )}

                    {(proposal.status === "APPROVED" || proposal.status === "REJECTED") &&
                      proposal.coordinatorRemarks?.trim() && (
                        <div
                          className={`mt-3 rounded-lg border p-3 text-sm ${proposal.status === "REJECTED"
                            ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20"
                            : "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20"
                            }`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-800 dark:text-gray-200">
                            Coordinator decision notes
                          </p>
                          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                            {proposal.coordinatorRemarks.trim()}
                          </p>
                        </div>
                      )}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <p><span className="font-medium">Company years:</span> {proposal.companyYears ?? "-"}</p>
                      <p><span className="font-medium">Department assigned:</span> {proposal.assignedDepartment || "-"}</p>
                      <p><span className="font-medium">Role assigned:</span> {proposal.assignedRole || "-"}</p>
                      <p>
                        <span className="font-medium">Has PSU MOA:</span>{" "}
                        {proposal.hasPsuMoa == null ? "-" : proposal.hasPsuMoa ? "Yes" : "No"}
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Files</p>
                      {proposal.attachments.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No uploaded files yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {proposal.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md bg-gray-50 dark:bg-[#19191c]"
                            >
                              <span className="text-base text-gray-800 dark:text-gray-200 truncate">{attachment.filename}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    handlePreviewProposalAttachment(attachment.id, attachment.filename)
                                  }
                                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDownloadProposalAttachment(attachment.id, attachment.filename)
                                  }
                                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                {canStudentUpload && attachment.role === "STUDENT" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAttachmentToRemove({
                                        attachmentId: attachment.id,
                                        filename: attachment.filename,
                                      })
                                    }
                                    disabled={deletingAttachmentId === attachment.id}
                                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 disabled:opacity-50"
                                    title="Remove file"
                                  >
                                    {deletingAttachmentId === attachment.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {submittedToInstructor && (
                      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/90 dark:border-blue-900/50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-900 dark:text-blue-100">
                        <span className="font-medium">Submitted to your instructor.</span>{" "}
                        Upload is disabled until your instructor returns this proposal for revision or rejects it.
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {canStudentUpload ? (
                        <label
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-[#19191c] ${uploadingProposalId === proposal.id ? "opacity-60 cursor-wait pointer-events-none" : "cursor-pointer"}`}
                        >
                          <FileUp className="w-4 h-4" />
                          Upload File
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploadingProposalId === proposal.id}
                            onChange={(e) => handleUploadProposalFile(proposal.id, e.target.files?.[0] || null)}
                          />
                        </label>
                      ) : null}
                      {canStudentDelete ? (
                        <button
                          type="button"
                          onClick={() => requestDeleteProposal(proposal)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700"
                          title="Delete proposal"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      ) : null}
                      {uploadingProposalId === proposal.id && (
                        <div className="w-full min-w-[140px] space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                            <span>Uploading… {proposalUploadProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 dark:bg-indigo-500 transition-[width] duration-150"
                              style={{ width: `${proposalUploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </div>
        </div>

        <div className="lg:col-span-2 min-w-0 w-full space-y-6 lg:sticky lg:top-6 self-start">
          {/* Documents Checklist */}
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Required Documents</h3>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 dark:bg-[#212124] rounded-full h-2">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${(preDeploymentDocuments.filter((doc) => doc.document?.status === 'APPROVED').length / preDeploymentDocuments.length) * 100}%`
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {preDeploymentDocuments.filter((doc) => doc.document?.status === 'APPROVED').length} / {preDeploymentDocuments.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Documents you fill up in the Documents tab will appear here
              </p>
            </div>

            <div className="p-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto documents-scrollbar">
              <div className="space-y-3">
                {preDeploymentDocuments.map((doc) => {
                  const document = doc.document;
                  const isApproved = document?.status === 'APPROVED';
                  const isPending = document?.status === 'PENDING';
                  const isRejected = document?.status === 'REJECTED';
                  const isUploaded = !!document;

                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-lg border transition-all ${isApproved
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : isPending
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                          : isRejected
                            ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                            : "bg-gray-50 dark:bg-[#212124]/50 border-gray-200 dark:border-gray-700"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {doc.name}
                            </span>
                            {doc.required && (
                              <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded">
                                Required
                              </span>
                            )}
                            {isApproved && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            {isPending && (
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                            )}
                            {isRejected && (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {doc.formNumber}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {doc.description}
                          </p>
                        </div>
                      </div>

                      {isUploaded ? (
                        <div className="mt-3 flex items-center justify-between p-2 bg-white dark:bg-[#212124] rounded border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                              {document!.filename}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${isApproved
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                              : isPending
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                              }`}>
                              {document!.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handlePreview(document!)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(document!)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-white dark:bg-[#212124] rounded border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {doc.type === "MEDICAL_CERTIFICATE" ? (
                              <>
                                Not uploaded yet. Upload in the <strong>Documents</strong> tab.
                              </>
                            ) : (
                              <>
                                Not filled up yet. Fill up in the <strong>Documents</strong> tab.
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {isRejected && document?.remarks && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                          <strong>Remarks:</strong> {document.remarks}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Button to open Steps Modal */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowStepsModal(true)}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Briefcase className="w-5 h-5" />
                <span>View Steps to Find a Company</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Remove attachment confirmation */}
      {attachmentToRemove && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4"
          style={{ marginTop: 0 }}
          onClick={() => !deletingAttachmentId && setAttachmentToRemove(null)}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-attachment-title"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 id="remove-attachment-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Remove file?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-words">
                Remove{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {attachmentToRemove.filename}
                </span>{" "}
                from this proposal? This cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setAttachmentToRemove(null)}
                disabled={!!deletingAttachmentId}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmRemoveAttachment()}
                disabled={!!deletingAttachmentId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAttachmentId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove file
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete proposal confirmation */}
      {proposalToDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4"
          style={{ marginTop: 0 }}
          onClick={() => setProposalToDelete(null)}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-proposal-title"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 id="delete-proposal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete proposal?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Delete proposal for{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {proposalToDelete.companyName}
                </span>
                ? All uploaded proposal files will be removed. This cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setProposalToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteProposal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[70] flex items-center justify-center p-4"
          onClick={() => {
            setPreviewDoc(null);
            if (previewUrl) {
              window.URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
          }}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {previewDoc.filename}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {previewDoc.type.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewDoc(null);
                  if (previewUrl) {
                    window.URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-[#19191c]">
              {previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title={previewDoc.filename}
                />
              ) : previewDoc.mimeType?.startsWith('image/') ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewUrl}
                    alt={previewDoc.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Preview not available for this file type
                    </p>
                    <button
                      onClick={() => handleDownload(previewDoc)}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      Download to view
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Steps Modal */}
      {showStepsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4" style={{ marginTop: 0 }} onClick={() => setShowStepsModal(false)}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Steps to Find a Company</h3>
                </div>
                <button
                  onClick={() => setShowStepsModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Research Companies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Research companies in your field of interest. Look for companies that align with your career goals and offer relevant internship opportunities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Prepare Your Documents</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Complete all required documents from the checklist above. Make sure your resume, cover letter, and other documents are up-to-date and professional.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Contact Companies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Reach out to companies via email or phone. Introduce yourself, express your interest in an internship, and inquire about available opportunities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Schedule Interviews</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      If a company shows interest, schedule an interview. Prepare for common interview questions and be ready to discuss your skills and goals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">5</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Process MOA</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Once a company agrees, work with your instructor and coordinator to process the Memorandum of Agreement (MOA). They will guide you through the necessary steps.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#19191c]/50">
              <button
                onClick={() => setShowStepsModal(false)}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCompanyPartnershipAssistance;

