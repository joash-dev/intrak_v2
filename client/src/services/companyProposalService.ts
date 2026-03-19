import api from './api';

export type CompanyProposalStatus =
  | 'SUBMITTED_TO_INSTRUCTOR'
  | 'RETURNED_BY_INSTRUCTOR'
  | 'REJECTED_BY_INSTRUCTOR'
  | 'FORWARDED_TO_COORDINATOR'
  | 'UNDER_COORDINATOR_REVIEW'
  | 'PENDING_EXTERNAL_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface CompanyProposalAttachment {
  id: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'COORDINATOR' | 'ADMIN';
  documentType: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface CompanyProposal {
  id: string;
  companyName: string;
  companyYears?: number | null;
  assignedDepartment?: string | null;
  assignedRole?: string | null;
  hasPsuMoa?: boolean | null;
  address?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactNumber?: string | null;
  industry?: string | null;
  remarks?: string | null;
  coordinatorRemarks?: string | null;
  externalReference?: string | null;
  status: CompanyProposalStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  instructor?: {
    id: string;
    name: string;
    email: string;
  } | null;
  attachments: CompanyProposalAttachment[];
}

const uploadAttachment = async (
  proposalId: string,
  file: File,
  documentType: string,
): Promise<CompanyProposalAttachment> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const response = await api.post(`/company-proposals/${proposalId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.attachment;
};

export const companyProposalService = {
  async createProposal(payload: {
    companyName: string;
    companyYears: number;
    assignedDepartment: string;
    assignedRole: string;
    hasPsuMoa: boolean;
    address?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactNumber?: string;
    industry?: string;
    remarks?: string;
  }): Promise<CompanyProposal> {
    const response = await api.post('/company-proposals', payload);
    return response.data.proposal;
  },

  async getMyProposals(): Promise<CompanyProposal[]> {
    const response = await api.get('/company-proposals/my');
    return response.data.proposals || [];
  },

  async deleteProposal(id: string): Promise<void> {
    await api.delete(`/company-proposals/${id}`);
  },

  async getInstructorProposals(status: string = 'all'): Promise<CompanyProposal[]> {
    const response = await api.get('/company-proposals/instructor', {
      params: { status: status === 'all' ? undefined : status },
    });
    return response.data.proposals || [];
  },

  async getCoordinatorProposals(status: string = 'all'): Promise<CompanyProposal[]> {
    const response = await api.get('/company-proposals/coordinator', {
      params: { status: status === 'all' ? undefined : status },
    });
    return response.data.proposals || [];
  },

  uploadAttachment,

  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const response = await api.get(`/company-proposals/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async instructorForward(id: string, remarks?: string): Promise<CompanyProposal> {
    const response = await api.patch(`/company-proposals/${id}/instructor/forward`, { remarks });
    return response.data.proposal;
  },

  async instructorDecision(
    id: string,
    decision: 'RETURNED_BY_INSTRUCTOR' | 'REJECTED_BY_INSTRUCTOR',
    remarks: string,
  ): Promise<CompanyProposal> {
    const response = await api.patch(`/company-proposals/${id}/instructor/decision`, {
      decision,
      remarks,
    });
    return response.data.proposal;
  },

  async instructorNotifyStudent(id: string, message?: string): Promise<void> {
    await api.patch(`/company-proposals/${id}/instructor/notify-student`, { message });
  },

  async coordinatorMarkExternalPending(id: string, remarks?: string): Promise<CompanyProposal> {
    const response = await api.patch(`/company-proposals/${id}/coordinator/mark-external-pending`, {
      remarks,
    });
    return response.data.proposal;
  },

  async coordinatorFinalize(
    id: string,
    payload: {
      decision: 'APPROVED' | 'REJECTED';
      remarks: string;
      externalReference?: string;
    },
  ): Promise<CompanyProposal> {
    const response = await api.patch(`/company-proposals/${id}/coordinator/finalize`, payload);
    return response.data.proposal;
  },
};
