import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Download, Eye, FileUp, RotateCcw, Search, XCircle } from 'lucide-react';
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

const actionStatuses: CompanyProposalStatus[] = ['SUBMITTED_TO_INSTRUCTOR', 'RETURNED_BY_INSTRUCTOR'];

const getInstructorDecisionLabel = (status: CompanyProposalStatus): string => {
  if (status === 'RETURNED_BY_INSTRUCTOR') return 'Returned to Student';
  if (status === 'REJECTED_BY_INSTRUCTOR') return 'Rejected by Instructor';
  if (
    status === 'FORWARDED_TO_COORDINATOR' ||
    status === 'UNDER_COORDINATOR_REVIEW' ||
    status === 'PENDING_EXTERNAL_APPROVAL' ||
    status === 'APPROVED' ||
    status === 'REJECTED'
  ) {
    return 'Forwarded to Coordinator';
  }
  return 'No decision yet';
};

const InstructorCompanyProposals = () => {
  const [proposals, setProposals] = useState<CompanyProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notifiedMap, setNotifiedMap] = useState<Record<string, boolean>>({});

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await companyProposalService.getInstructorProposals('all');
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
      await companyProposalService.uploadAttachment(proposalId, file, 'INSTRUCTOR_ENDORSEMENT');
      toast.success('Instructor endorsement uploaded');
      await loadProposals();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingId(null);
    }
  };

  const handleForward = async (proposalId: string) => {
    try {
      setProcessingId(proposalId);
      await companyProposalService.instructorForward(proposalId, remarksMap[proposalId] || '');
      toast.success('Proposal forwarded to coordinator');
      await loadProposals();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to forward proposal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecision = async (
    proposalId: string,
    decision: 'RETURNED_BY_INSTRUCTOR' | 'REJECTED_BY_INSTRUCTOR',
  ) => {
    const remarks = (remarksMap[proposalId] || '').trim();
    if (!remarks) {
      toast.error('Remarks are required for this action');
      return;
    }

    try {
      setProcessingId(proposalId);
      await companyProposalService.instructorDecision(proposalId, decision, remarks);
      toast.success(decision === 'RETURNED_BY_INSTRUCTOR' ? 'Proposal returned to student' : 'Proposal rejected');
      await loadProposals();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update proposal');
    } finally {
      setProcessingId(null);
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

  const handleNotifyStudent = async (proposalId: string, status: CompanyProposalStatus) => {
    try {
      setProcessingId(proposalId);
      await companyProposalService.instructorNotifyStudent(
        proposalId,
        status === 'APPROVED'
          ? 'Your proposed company is approved. Please proceed with next OJT application steps.'
          : 'Your proposed company was not approved. Please coordinate with your instructor for alternatives.',
      );
      setNotifiedMap((prev) => ({ ...prev, [proposalId]: true }));
      toast.success('Student has been notified');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to notify student');
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
            <Skeleton className="h-4 w-full sm:w-80" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-9 w-40 rounded-lg" />
              <div className="flex gap-2 flex-1 sm:justify-end">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Instructor Company Proposals</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review student files, add remarks, then forward, return, or reject.
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
          const canReview = actionStatuses.includes(proposal.status);
          const hasInstructorEndorsement = proposal.attachments.some(
            (attachment) => attachment.role === 'INSTRUCTOR',
          );

          const studentFiles = proposal.attachments.filter((attachment) => attachment.role === 'STUDENT');
          const instructorFiles = proposal.attachments.filter((attachment) => attachment.role === 'INSTRUCTOR');

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

              {/* Company Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs text-gray-600 dark:text-gray-300">
                <p><strong>Address:</strong> {proposal.address || '-'}</p>
                <p><strong>Industry:</strong> {proposal.industry || '-'}</p>
                <p><strong>Contact Person:</strong> {proposal.contactPerson || '-'}</p>
                <p><strong>Contact Email:</strong> {proposal.contactEmail || '-'}</p>
              </div>

              {/* Current Decision */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Current Decision</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getInstructorDecisionLabel(proposal.status)}
                </p>
                {proposal.remarks && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Remarks: {proposal.remarks}
                  </p>
                )}
                {notifiedMap[proposal.id] && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Student has been notified for this decision.
                  </p>
                )}
              </div>

              {/* Files for Review */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Files for Review</p>
                {!hasInstructorEndorsement ? (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Upload your instructor endorsement first. Forward is disabled until this is uploaded.
                  </p>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2">
                    {[...studentFiles, ...instructorFiles].map((attachment) => (
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

              {/* Remarks */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Instructor Remarks</label>
                <textarea
                  rows={2}
                  value={remarksMap[proposal.id] || ''}
                  onChange={(e) => setRemarksMap((prev) => ({ ...prev, [proposal.id]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212124] dark:text-white text-sm"
                  placeholder="Required for return/reject. Optional for forward."
                />
              </div>

              {/* Upload & Decision Actions */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Upload</p>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <FileUp className="w-4 h-4 flex-shrink-0" />
                    Upload Endorsement
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleUpload(proposal.id, e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Decision</p>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      onClick={() => handleForward(proposal.id)}
                      disabled={!canReview || !hasInstructorEndorsement || processingId === proposal.id || uploadingId === proposal.id}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg bg-green-600 text-white disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-colors hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0" /> Forward
                    </button>

                    <button
                      onClick={() => handleDecision(proposal.id, 'RETURNED_BY_INSTRUCTOR')}
                      disabled={!canReview || processingId === proposal.id}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg bg-amber-600 text-white disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-colors hover:bg-amber-700"
                    >
                      <RotateCcw className="w-4 h-4 flex-shrink-0" /> Return
                    </button>

                    <button
                      onClick={() => handleDecision(proposal.id, 'REJECTED_BY_INSTRUCTOR')}
                      disabled={!canReview || processingId === proposal.id}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg bg-red-600 text-white disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-colors hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 flex-shrink-0" /> Reject
                    </button>

                    {(proposal.status === 'APPROVED' || proposal.status === 'REJECTED') && (
                      <button
                        onClick={() => handleNotifyStudent(proposal.id, proposal.status)}
                        disabled={processingId === proposal.id}
                        className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {processingId === proposal.id ? 'Notifying...' : notifiedMap[proposal.id] ? 'Notified' : 'Notify Student'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default InstructorCompanyProposals;
