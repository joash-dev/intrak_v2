import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Download, Eye, FileUp, Search, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  companyProposalService,
  type CompanyProposal,
  type CompanyProposalStatus,
} from '../../services/companyProposalService';
import Skeleton from '../../components/Skeleton';
import { requestCoordinatorNavBadgesRefresh } from '../../services/coordinatorService';
import { instructorNavCountsCompanyProposal } from '../../utils/instructorNavAttention';

const statusLabel: Record<CompanyProposalStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED_TO_INSTRUCTOR: 'Submitted to Instructor',
  RETURNED_BY_INSTRUCTOR: 'Returned by Instructor',
  REJECTED_BY_INSTRUCTOR: 'Rejected by Instructor',
  FORWARDED_TO_COORDINATOR: 'Forwarded to Coordinator',
  UNDER_COORDINATOR_REVIEW: 'Under Coordinator Review',
  PENDING_EXTERNAL_APPROVAL: 'Pending External Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const statusClass: Record<CompanyProposalStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
  SUBMITTED_TO_INSTRUCTOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  RETURNED_BY_INSTRUCTOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  REJECTED_BY_INSTRUCTOR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  FORWARDED_TO_COORDINATOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  UNDER_COORDINATOR_REVIEW: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  PENDING_EXTERNAL_APPROVAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const CoordinatorCompanyProposals = () => {
  const [proposals, setProposals] = useState<CompanyProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [externalRefMap, setExternalRefMap] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pulseIds, setPulseIds] = useState<Set<string>>(() => new Set());

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await companyProposalService.getCoordinatorProposals('all');
      setProposals(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load company proposals');
    } finally {
      setLoading(false);
      requestCoordinatorNavBadgesRefresh();
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  // Pulse cards ONE time when they newly enter coordinator-action statuses.
  useEffect(() => {
    const isActionable = (status: string) =>
      status === "FORWARDED_TO_COORDINATOR" || status === "UNDER_COORDINATOR_REVIEW";
    const key = (id: string) => `intrak:seen-attn:coordinator:proposal:${id}`;
    const actionable = proposals.filter((p) => isActionable(p.status));
    const newly = actionable
      .map((p) => p.id)
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
    setPulseIds(new Set(newly));
    const t = window.setTimeout(() => setPulseIds(new Set()), 1000);
    return () => window.clearTimeout(t);
  }, [proposals]);

  const filtered = useMemo(() => {
    let result = proposals;
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((p) =>
        p.companyName.toLowerCase().includes(query) ||
        p.student.user.name.toLowerCase().includes(query),
      );
    }
    return result;
  }, [proposals, search, statusFilter]);

  const handleUpload = async (proposalId: string, file: File | null) => {
    if (!file) return;
    try {
      setUploadingId(proposalId);
      const attachment = await companyProposalService.uploadAttachment(
        proposalId,
        file,
        'COORDINATOR_FINAL_DOCUMENT'
      );
      toast.success('Final document uploaded');
      // Avoid refetching the whole proposals list; update only the affected card.
      setProposals((prev) =>
        prev.map((p) => {
          if (p.id !== proposalId) return p;

          const existing = p.attachments ?? [];
          const filtered = existing.filter(
            (a) =>
              !(a.role === attachment.role && a.documentType === attachment.documentType)
          );
          return { ...p, attachments: [...filtered, attachment] };
        })
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingId(null);
    }
  };

  const handlePreviewAttachment = async (attachmentId: string) => {
    try {
      const blob = await companyProposalService.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to preview attachment');
    }
  };

  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      const blob = await companyProposalService.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to download attachment');
    }
  };

  const handleExternalPending = async (proposalId: string) => {
    try {
      setProcessingId(proposalId);
      await companyProposalService.coordinatorMarkExternalPending(proposalId, remarksMap[proposalId] || '');
      toast.success('Marked as pending external approval');
      await loadProposals();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update proposal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFinalize = async (proposalId: string, decision: 'APPROVED' | 'REJECTED') => {
    const remarks = (remarksMap[proposalId] || '').trim();
    if (!remarks) {
      toast.error('Remarks are required before finalizing');
      return;
    }

    try {
      setProcessingId(proposalId);
      await companyProposalService.coordinatorFinalize(proposalId, {
        decision,
        remarks,
        externalReference: externalRefMap[proposalId] || undefined,
      });
      toast.success(`Proposal ${decision.toLowerCase()} successfully`);
      await loadProposals();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to finalize proposal');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#19191c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          {/* Header Skeleton */}
          <div className="bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48 sm:w-64" />
                  <Skeleton className="h-4 w-64 sm:w-96" />
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <div className="space-y-6">
            {/* Search Skeleton */}
            <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <Skeleton className="h-12 w-40 rounded-xl" />
              </div>
            </div>
            {/* Card Skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40 sm:w-56" />
                    <Skeleton className="h-3 w-28 sm:w-36" />
                  </div>
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-10 w-40 rounded-xl" />
                  <Skeleton className="h-10 w-48 rounded-xl" />
                  <Skeleton className="h-10 w-28 rounded-xl" />
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#19191c]">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        <div className="group relative bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Company Proposals
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Review submitted files, record external reference, then finalize as approved or rejected
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={loadProposals}
                  className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <RefreshCw className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by student name or company..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white text-sm font-medium placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white text-sm font-medium min-w-[160px]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="FORWARDED_TO_COORDINATOR">Forwarded</option>
                    <option value="UNDER_COORDINATOR_REVIEW">Under Review</option>
                    <option value="PENDING_EXTERNAL_APPROVAL">Pending External</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Proposals List */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#212124] rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <FileUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No proposals found.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((proposal) => {
                const canSendToPresident =
                  proposal.status === 'FORWARDED_TO_COORDINATOR' || proposal.status === 'UNDER_COORDINATOR_REVIEW';
                const canFinalizeNow = proposal.status === 'PENDING_EXTERNAL_APPROVAL';
                const allDocs = proposal.attachments;
                const shouldPulse = pulseIds.has(proposal.id);

                return (
                  <div
                    key={proposal.id}
                    className={[
                      "bg-white dark:bg-[#212124] rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200",
                      shouldPulse ? "animate-attention-once" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {/* Header: Company name + status */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center">
                          <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{proposal.companyName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Student: {proposal.student.user.name}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap self-start ${statusClass[proposal.status]}`}>
                        {statusLabel[proposal.status]}
                      </span>
                    </div>

                    {/* Company Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-[#19191c]/50 rounded-xl p-3 sm:p-4">
                      <p><strong>Company Years:</strong> {proposal.companyYears ?? '-'}</p>
                      <p><strong>Department Assigned:</strong> {proposal.assignedDepartment || '-'}</p>
                      <p><strong>Role Assigned:</strong> {proposal.assignedRole || '-'}</p>
                      <p><strong>Has PSU MOA:</strong> {proposal.hasPsuMoa == null ? '-' : proposal.hasPsuMoa ? 'Yes' : 'No'}</p>
                      <p><strong>Address:</strong> {proposal.address || '-'}</p>
                      <p><strong>Industry:</strong> {proposal.industry || '-'}</p>
                      <p><strong>Contact Person:</strong> {proposal.contactPerson || '-'}</p>
                      <p><strong>Contact Email:</strong> {proposal.contactEmail || '-'}</p>
                    </div>

                    {/* Attachments */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50/50 dark:bg-[#19191c]/50">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Proposal Attachments</p>
                      {allDocs.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">No files uploaded yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {allDocs.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between text-xs bg-white dark:bg-[#212124] rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700"
                            >
                              <span className="truncate mr-2 min-w-0">
                                {attachment.filename} <span className="text-gray-400">({attachment.role})</span>
                              </span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handlePreviewAttachment(attachment.id)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  title="Preview"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remarks & External Reference */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Coordinator Remarks</label>
                      <textarea
                        rows={2}
                        value={remarksMap[proposal.id] || ''}
                        onChange={(e) => setRemarksMap((prev) => ({ ...prev, [proposal.id]: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212124] dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Required for final approval/rejection"
                      />
                      <input
                        value={externalRefMap[proposal.id] || ''}
                        onChange={(e) => setExternalRefMap((prev) => ({ ...prev, [proposal.id]: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212124] dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="External reference (optional)"
                      />
                      {proposal.status === 'PENDING_EXTERNAL_APPROVAL' && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          This proposal is already sent to University President. Once decision is available, mark Approve or Reject.
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <FileUp className="w-4 h-4 flex-shrink-0" />
                        <span>Upload Final Document</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleUpload(proposal.id, e.target.files?.[0] || null)}
                        />
                      </label>

                      <button
                        onClick={() => handleExternalPending(proposal.id)}
                        disabled={!canSendToPresident || processingId === proposal.id || uploadingId === proposal.id}
                        className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-amber-600 text-white disabled:opacity-50 transition-colors hover:bg-amber-700"
                      >
                        {proposal.status === 'PENDING_EXTERNAL_APPROVAL'
                          ? 'Already Sent to Univ President'
                          : 'Send to Univ President'}
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFinalize(proposal.id, 'APPROVED')}
                          disabled={!canFinalizeNow || processingId === proposal.id}
                          className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-green-600 text-white disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 flex-shrink-0" /> Approve
                        </button>

                        <button
                          onClick={() => handleFinalize(proposal.id, 'REJECTED')}
                          disabled={!canFinalizeNow || processingId === proposal.id}
                          className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-red-600 text-white disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 flex-shrink-0" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorCompanyProposals;
