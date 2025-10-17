import api from './api';

export interface Document {
  id: string;
  type: string;
  filename: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  fileSize?: string;
  fileSizeMB?: string;
}

export interface UploadDocumentRequest {
  file: File;
  type: string;
  studentId?: string;
}

export interface DocumentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
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
      pending: documents.filter(d => d.status === 'PENDING').length,
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
      'APPLICATION_FOR_INTERNSHIP',
      'MEDICAL_CERTIFICATE_PSYCHOLOGICAL_TEST',
      'CERTIFICATION_OF_UNITS_EARNED',
      'INTERNSHIP_RESUME',
      'CONSENT_FORM',
      'ENDORSEMENT_LETTER',
      'INTERNSHIP_RELEASE_FORM'
    ];

    const uponApprovalTypes = [
      'MEMORANDUM_OF_AGREEMENT',
      'INTERNSHIP_AGREEMENT',
      'TRAINING_AGREEMENT_LIABILITY_WAIVER'
    ];

    const postOjtTypes = [
      'INTERNSHIP_EVALUATION_FORM',
      'CERTIFICATE_OF_TRAINING_COMPLETION',
      'INTERNSHIP_NARRATIVE_REPORT',
      'PHOTOCOPY_OF_DAILY_TIME_RECORD',
      'INTERNSHIP_TIME_FRAMES',
      'PRACTICUM_INTERNSHIP_WEEKLY_REPORTS',
      'STUDENT_TRAINEES_FEEDBACK_FORM',
      'TRAINING_SUPERVISORS_FEEDBACK_FORM',
      'EVALUATION_INSTRUMENT_SELF_RATEE',
      'EVALUATION_INSTRUMENT_STUDENT'
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
        return 'Pre-deployment Documents';
      case 'UPON_APPROVAL':
        return 'Upon Approval Documents';
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
      { value: 'PRE_DEPLOYMENT', label: 'Pre-deployment' },
      { value: 'UPON_APPROVAL', label: 'Upon Approval' },
      { value: 'POST_OJT', label: 'Post-OJT' }
    ];
  }
}

export const documentService = new DocumentService();
