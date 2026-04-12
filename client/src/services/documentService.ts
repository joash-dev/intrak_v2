import api from './api';
import { getMessageFromAxiosError } from '../utils/axiosErrorMessage';

export interface Document {
  id: string;
  type: string;
  filename: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED';
  createdAt: string | null;
  uploadedAt: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  fileSize?: number; // Raw bytes from server
  fileSizeMB?: string; // Legacy/Computed
  mimeType?: string;
  sharedStatus?: string | null; // null = normal, 'PENDING_ACCEPTANCE' = awaiting, 'ACCEPTED' = accepted, 'WAITING_FOR_ACCEPTANCE' = submitter waiting
  parentDocumentId?: string | null; // For child shared docs: the submitter's document ID
  uploadedBy?: { name?: string }; // Who submitted the shared document
}

export interface UploadDocumentRequest {
  file: File;
  type: string;
  studentId?: string;
  /** 0–100 from XMLHttpRequest upload progress */
  onUploadProgress?: (percentLoaded: number) => void;
}

export interface WeekData {
  weekNumber: number;
  dateRange: string;
  tasksAccomplished: string;
  knowledgeSkillsValues: string;
}

export interface DocumentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export type DocumentFeedbackType =
  | 'COMMENT'
  | 'REQUEST_CHANGES'
  | 'APPROVAL_NOTE'
  | 'STUDENT_RESPONSE';

export interface DocumentFeedbackAuthor {
  id: string;
  name: string;
  role: string;
  profilePhoto?: string | null;
}

export interface DocumentFeedbackEntry {
  id: string;
  message: string;
  type: DocumentFeedbackType;
  requiresAction: boolean;
  createdAt: string;
  author: DocumentFeedbackAuthor | null;
}

class DocumentService {
  // Get student's own documents
  async getStudentDocuments(): Promise<Document[]> {
    const response = await api.get('/documents/student');
    return response.data.documents;
  }

  // Upload a document
  async uploadDocument(data: UploadDocumentRequest): Promise<Document> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('type', data.type);
    if (data.studentId) {
      formData.append('studentId', data.studentId);
    }

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (evt) => {
        if (!data.onUploadProgress || !evt.total) return;
        const pct = Math.min(100, Math.round((evt.loaded * 100) / evt.total));
        data.onUploadProgress(pct);
      },
    });
    return response.data.document;
  }

  // Download a document
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (err) {
      const parsed = await getMessageFromAxiosError(err);
      if (parsed) {
        throw new Error(parsed);
      }
      throw err;
    }
  }

  // Delete a document
  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`);
  }

  // Get document details
  async getDocumentById(documentId: string): Promise<Document> {
    const response = await api.get(`/documents/${documentId}`);
    return response.data.document;
  }

  // Get all documents (for coordinators/instructors)
  async getDocuments(): Promise<{ documents: Document[] }> {
    const response = await api.get('/documents');
    return response.data;
  }

  // Approve a document
  async approveDocument(documentId: string, remarks?: string): Promise<Document> {
    const response = await api.put(`/documents/${documentId}/approve`, { remarks });
    return response.data.document;
  }

  // Reject a document
  async rejectDocument(documentId: string, remarks?: string): Promise<Document> {
    const response = await api.put(`/documents/${documentId}/reject`, { remarks });
    return response.data.document;
  }

  async getDocumentFeedback(documentId: string): Promise<DocumentFeedbackEntry[]> {
    const response = await api.get(`/documents/${documentId}/feedback`);
    return response.data.feedback ?? [];
  }

  async addDocumentFeedback(
    documentId: string,
    payload: {
      message: string;
      type?: DocumentFeedbackType;
      requiresAction?: boolean;
    },
  ): Promise<DocumentFeedbackEntry> {
    const response = await api.post(`/documents/${documentId}/feedback`, payload);
    return response.data.feedback;
  }

  // Calculate document stats from documents array
  calculateStats(documents: Document[]): DocumentStats {
    if (!documents || !Array.isArray(documents)) {
      return {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
    }

    return {
      total: documents.length,
      approved: documents.filter(d => d.status === 'APPROVED').length,
      pending: documents.filter(d => d.status === 'PENDING' || d.status === 'RESUBMISSION_REQUESTED').length,
      rejected: documents.filter(d => d.status === 'REJECTED').length,
    };
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate file type
  isValidFileType(file: File): boolean {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(file.type);
  }

  // Validate file size (10MB limit)
  isValidFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }

  // Get document category based on document type
  getDocumentCategory(documentType: string): 'PRE_DEPLOYMENT' | 'UPON_APPROVAL' | 'POST_OJT' {
    const preDeploymentTypes = [
      'RECORD_FILE',
      'APPLICATION_INTERNSHIP',
      'MEDICAL_CERTIFICATE',
      'CERTIFICATION_UNITS',
      'INTERNSHIP_RESUME',
      'CONSENT_FORM',
      'ENDORSEMENT_LETTER',
      'INTERNSHIP_RELEASE'
    ];

    const uponApprovalTypes = [
      'MOA',
      'INTERNSHIP_AGREEMENT',
      'TRAINING_AGREEMENT'
    ];

    const postOjtTypes = [
      'INTERNSHIP_EVALUATION',
      'CERTIFICATE_COMPLETION',
      'INTERNSHIP_NARRATIVE_REPORT',
      'DTR_PHOTOCOPY',
      'TIME_FRAMES',
      'WEEKLY_REPORTS',
      'STUDENT_FEEDBACK',
      'SUPERVISOR_FEEDBACK',
      'AGENCY_SELF_EVALUATION',
      'AGENCY_STUDENT_EVALUATION'
    ];

    if (preDeploymentTypes.includes(documentType)) {
      return 'PRE_DEPLOYMENT';
    } else if (uponApprovalTypes.includes(documentType)) {
      return 'UPON_APPROVAL';
    } else if (postOjtTypes.includes(documentType)) {
      return 'POST_OJT';
    } else {
      return 'PRE_DEPLOYMENT'; // Default fallback
    }
  }

  // Get category display name
  getCategoryDisplay(category: string): string {
    switch (category) {
      case 'PRE_DEPLOYMENT':
        return 'Pre-OJT Documents';
      case 'UPON_APPROVAL':
        return 'Upon OJT Documents';
      case 'POST_OJT':
        return 'Post-OJT Documents';
      default:
        return 'Unknown Category';
    }
  }

  // Get category options for filtering
  getCategoryOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'all', label: 'All Categories' },
      { value: 'PRE_DEPLOYMENT', label: 'Pre-OJT' },
      { value: 'UPON_APPROVAL', label: 'Upon OJT' },
      { value: 'POST_OJT', label: 'Post-OJT' }
    ];
  }

  // ========== Form-based Document Generation ==========

  // Get form definition + auto-fill values for a document type
  async getFormDefinition(type: string): Promise<{
    definition: {
      documentType: string;
      templateFile: string;
      title: string;
      description: string;
      fields: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        autoFillKey?: string;
        placeholder?: string;
        options?: Array<{ value: string; label: string }>;
        section?: string;
      }>;
    };
    autoFillValues: Record<string, string>;
  }> {
    const response = await api.get(`/documents/form-definition/${type}`);
    return response.data;
  }

  // Generate preview HTML from form data
  async previewDocument(type: string, formData: Record<string, string>): Promise<string> {
    const response = await api.post('/documents/preview', { type, formData });
    return response.data.html;
  }

  // Finalize: generate PDF and create document record
  async finalizeDocument(type: string, formData: Record<string, string>): Promise<Document> {
    const response = await api.post('/documents/finalize', { type, formData });
    return response.data.document;
  }

  // Check if a document type has a form template
  hasFormTemplate(type: string): boolean {
    const formTypes = [
      'APPLICATION_INTERNSHIP',
      'RECORD_FILE',
      'CERTIFICATION_UNITS',
      'INTERNSHIP_RESUME',
      'CONSENT_FORM',
      'ENDORSEMENT_LETTER',
      'ENDORSEMENT_LETTER_MULTI',
      'INTERNSHIP_RELEASE',
      'STUDENT_FEEDBACK',
      'INTERNSHIP_AGREEMENT',
      'TRAINING_AGREEMENT',
      'WEEKLY_REPORTS',
    ];
    return formTypes.includes(type);
  }

  // Search students for the multi-student endorsement letter picker
  async searchStudentsForPicker(search?: string): Promise<Array<{
    id: string;
    name: string;
    studentNumber: string;
    program: string;
    year: number;
    section: string;
    company: string | null;
  }>> {
    const params = search ? { search } : {};
    const response = await api.get('/documents/student-picker', { params });
    return response.data.students;
  }

  // Accept a shared endorsement letter
  async acceptSharedDocument(id: string): Promise<{ message: string; allAccepted?: boolean; pdfGenerated?: boolean }> {
    const res = await api.post(`/documents/${id}/accept-shared`);
    return res.data;
  }

  // Decline a shared endorsement letter
  async declineSharedDocument(id: string): Promise<void> {
    await api.post(`/documents/${id}/decline-shared`);
  }

  // Check if a document type can be auto-generated from existing system data
  canAutoGenerate(type: string): boolean {
    const autoGenTypes = ['TIME_FRAMES'];
    return autoGenTypes.includes(type);
  }

  // Auto-generate a document from existing system data
  async autoGenerateDocument(type: string): Promise<Document> {
    const response = await api.post('/documents/generate-auto', { type });
    return response.data.document;
  }
}

export const documentService = new DocumentService();
