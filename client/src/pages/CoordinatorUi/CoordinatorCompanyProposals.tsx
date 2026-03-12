import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Download, Eye, FileUp, Search, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  companyProposalService,
  type CompanyProposal,
  type CompanyProposalStatus,
} from '../../services/companyProposalService';
import Skeleton from '../../components/Skeleton';

const statusLabel: Record<CompanyProposalStatus, string> = {
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
  SUBMITTED_TO_INSTRUCTOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  RETURNED_BY_INSTRUCTOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  REJECTED_BY_INSTRUCTOR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  FORWARDED_TO_COORDINATOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  UNDER_COORDINATOR_REVIEW: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  PENDING_EXTERNAL_APPROVAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const processableStatuses: CompanyProposalStatus[] = [
  'FORWARDED_TO_COORDINATOR',
  'UNDER_COORDINATOR_REVIEW',
  'PENDING_EXTERNAL_APPROVAL',
];

const CoordinatorCompanyProposals = () => {
  const [proposals, setProposals] = useState<CompanyProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [externalRefMap, setExternalRefMap] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await companyProposalService.getCoordinatorProposals('all');
      setProposals(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load company proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return proposals;
    return proposals.filter((proposal) =>
      proposal.companyName.toLowerCase().includes(query) ||
      proposal.student.user.name.toLowerCase().includes(query),
    );
  }, [proposals, search]);

  const handleUpload = async (proposalId: string, file: File | null) => {
    if (!file) return;
    try {
      setUploadingId(proposalId);
      await companyProposalService.uploadAttachment(proposalId, file, 'COORDINATOR_FINAL_DOCUMENT');
      toast.success('Final document uploaded');
      await loadProposals();
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
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 sm:w-64" />
            <Skeleton className="h-4 w-full sm:w-96" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg mt-4" />
        </div>
        {/* Proposal Card Skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40 sm:w-56" />
                <Skeleton className="h-3 w-28 sm:w-36" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-36 rounded-lg" />
              <Skeleton className="h-9 w-44 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Coordinator Company Proposals</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review submitted files, record external reference, then finalize as approved or rejected.
          </p>
        </div>
        <div className="mt-3 sm:mt-4 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or company"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212124] dark:text-white"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-sm text-gray-500 dark:text-gray-400">
          No proposals found.
        </div>
      ) : (
        filtered.map((proposal) => {
          const canProcess = processableStatuses.includes(proposal.status);
          const canSendToPresident =
            proposal.status === 'FORWARDED_TO_COORDINATOR' || proposal.status === 'UNDER_COORDINATOR_REVIEW';
          const coordinatorDocs = proposal.attachments.filter((attachment) => attachment.role === 'COORDINATOR');
          const canFinalizeNow = proposal.status === 'PENDING_EXTERNAL_APPROVAL';
          const allDocs = proposal.attachments;

          return (
            <div
              key={proposal.id}
              className="bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-3 sm:space-y-4"
            >
              {/* Header: Company name + status */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{proposal.companyName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Student: {proposal.student.user.name}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap self-start ${statusClass[proposal.status]}`}>
                  {statusLabel[proposal.status]}
                </span>
              </div>

              {/* Attachments */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Proposal Attachments</p>
                {allDocs.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No files uploaded yet.</p>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2">
                    {allDocs.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between text-xs bg-white dark:bg-[#212124] rounded px-2 py-1.5 border border-gray-200 dark:border-gray-700"
                      >
                        <span className="truncate mr-2 min-w-0">
                          {attachment.filename} <span className="text-gray-400">({attachment.role})</span>
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handlePreviewAttachment(attachment.id)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
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
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Coordinator Remarks</label>
                <textarea
                  rows={2}
                  value={remarksMap[proposal.id] || ''}
                  onChange={(e) => setRemarksMap((prev) => ({ ...prev, [proposal.id]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212124] dark:text-white text-sm"
                  placeholder="Required for final approval/rejection"
                />
                <input
                  value={externalRefMap[proposal.id] || ''}
                  onChange={(e) => setExternalRefMap((prev) => ({ ...prev, [proposal.id]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212124] dark:text-white text-sm"
                  placeholder="External reference (optional)"
                />
                {proposal.status === 'PENDING_EXTERNAL_APPROVAL' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    This proposal is already sent to University President. Once decision is available, mark Approve or Reject.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
                <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg bg-amber-600 text-white disabled:opacity-50 transition-colors hover:bg-amber-700"
                >
                  {proposal.status === 'PENDING_EXTERNAL_APPROVAL'
                    ? 'Already Sent to Univ President'
                    : 'Send to Univ President'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleFinalize(proposal.id, 'APPROVED')}
                    disabled={!canFinalizeNow || processingId === proposal.id}
                    className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg bg-green-600 text-white disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-colors hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> Approve
                  </button>

                  <button
                    onClick={() => handleFinalize(proposal.id, 'REJECTED')}
                    disabled={!canFinalizeNow || processingId === proposal.id}
                    className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg bg-red-600 text-white disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-colors hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 flex-shrink-0" /> Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CoordinatorCompanyProposals;
