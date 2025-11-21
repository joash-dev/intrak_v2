import api from './api';

export interface Document {
  id: string;
  type: string;
  filename: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED';
  uploadedAt: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  fileSize?: string;
  fileSizeMB?: string;
  mimeType?: string;
}

export interface UploadDocumentRequest {
  file: File;
  type: string;
  studentId?: string;
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
    });
    return response.data.document;
  }

  // Download a document
  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
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
}

export const documentService = new DocumentService();
