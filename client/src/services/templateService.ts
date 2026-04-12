import api from './api';
import { getMessageFromAxiosError } from '../utils/axiosErrorMessage';

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: 'PRE_DEPLOYMENT' | 'UPON_APPROVAL' | 'POST_OJT';
  filename: string;
  mimeType: string;
  isActive: boolean;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  fileSizeMB?: string;
  uploadedBy?: {
    name: string;
    email: string;
  };
}

export interface TemplateUploadData {
  name: string;
  description?: string;
  type: string;
  category: 'PRE_DEPLOYMENT' | 'UPON_APPROVAL' | 'POST_OJT';
  file: File;
}

class TemplateService {
  // Get all templates
  async getTemplates(type?: string, active?: boolean): Promise<DocumentTemplate[]> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (active !== undefined) params.append('active', active.toString());
      
      const response = await api.get(`/templates?${params.toString()}`);
      return response.data.templates || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<DocumentTemplate> {
    try {
      const response = await api.get(`/templates/${id}`);
      return response.data.template;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  // Upload template
  async uploadTemplate(data: TemplateUploadData): Promise<DocumentTemplate> {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('type', data.type);
      formData.append('category', data.category);
      if (data.description) {
        formData.append('description', data.description);
      }
      formData.append('file', data.file);

      const response = await api.post('/templates/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.template;
    } catch (error) {
      console.error('Error uploading template:', error);
      throw error;
    }
  }

  // Update template
  async updateTemplate(id: string, data: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    try {
      const response = await api.put(`/templates/${id}`, data);
      return response.data.template;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  // Delete template
  async deleteTemplate(id: string): Promise<void> {
    try {
      await api.delete(`/templates/${id}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // Download template
  async downloadTemplate(id: string, filename: string): Promise<void> {
    try {
      const response = await api.get(`/templates/${id}/download`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      const parsed = await getMessageFromAxiosError(error);
      if (parsed) {
        throw new Error(parsed);
      }
      throw error;
    }
  }

  // Get document type display name
  getDocumentTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      // Pre-deployment documents
      'RECORD_FILE': 'Record File',
      'APPLICATION_INTERNSHIP': 'Application for Internship (Form FM-AA-INT-01)',
      'MEDICAL_CERTIFICATE': 'Medical Certificate and Psychological Test',
      'CERTIFICATION_UNITS': 'Certification of Units Earned (Form FM-AA-INT-02)',
      'INTERNSHIP_RESUME': 'Internship Resume (Form FM-AA-INT-09)',
      'CONSENT_FORM': 'Consent Form (Form FM-AA-INT-03)',
      'ENDORSEMENT_LETTER': 'Endorsement Letter (Form FM-AA-INT-05)',
      'INTERNSHIP_RELEASE': 'Internship Release Form (Form FM-AA-INT-12)',
      
      // Upon approval documents
      'MOA': 'Memorandum of Agreement (Form FM-AA-INT-10)',
      'INTERNSHIP_AGREEMENT': 'Internship Agreement (Form FM-AA-INT-10)',
      'TRAINING_AGREEMENT': 'Training Agreement and Liability Waiver (Form FM-AA-INT-15)',
      
      // Post-OJT documents
      'INTERNSHIP_EVALUATION': 'Internship Evaluation Form (Form FM-AA-INT-11)',
      'CERTIFICATE_COMPLETION': 'Certificate of Training Completion',
      'NARRATIVE_REPORT': 'Internship Narrative Report',
      'DTR_PHOTOCOPY': 'Photocopy of Daily Time Record',
      'TIME_FRAMES': 'Internship Time Frames (Form FM-AA-INT-14)',
      'WEEKLY_REPORTS': 'Practicum/Internship Weekly Reports (Form FM-AA-INT-16)',
      'STUDENT_FEEDBACK': 'Student-Trainees Feedback Form (Form FM-AA-INT-17)',
      'SUPERVISOR_FEEDBACK': 'Training Supervisor Feedback Form (Form FM-AA-INT-18)',
      'AGENCY_SELF_EVALUATION': 'Evaluation Instrument of PSU Partner Agencies (Self Ratee) (Form FM-AA-INT-19b)',
      'AGENCY_STUDENT_EVALUATION': 'Evaluation Instrument of PSU Partner Agencies (Student) (Form FM-AA-INT-19c)',
      
      // Legacy types
      'APPLICATION_LETTER': 'Application Letter',
      'ACCEPTANCE': 'Acceptance Letter',
      'EVALUATION_FORM': 'Evaluation Form',
      'DTR_HARDCOPY': 'Daily Time Record (DTR)',
      'OTHER': 'Other Document'
    };
    return typeMap[type] || type;
  }

  // Get document type options by category
  getDocumentTypeOptionsByCategory(category: 'PRE_DEPLOYMENT' | 'UPON_APPROVAL' | 'POST_OJT'): { value: string; label: string }[] {
    const options = {
      PRE_DEPLOYMENT: [
        { value: 'RECORD_FILE', label: 'Record File' },
        { value: 'APPLICATION_INTERNSHIP', label: 'Application for Internship (Form FM-AA-INT-01)' },
        { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate and Psychological Test' },
        { value: 'CERTIFICATION_UNITS', label: 'Certification of Units Earned (Form FM-AA-INT-02)' },
        { value: 'INTERNSHIP_RESUME', label: 'Internship Resume (Form FM-AA-INT-09)' },
        { value: 'CONSENT_FORM', label: 'Consent Form (Form FM-AA-INT-03)' },
        { value: 'ENDORSEMENT_LETTER', label: 'Endorsement Letter (Form FM-AA-INT-05)' },
        { value: 'INTERNSHIP_RELEASE', label: 'Internship Release Form (Form FM-AA-INT-12)' },
        { value: 'TIME_FRAMES', label: 'Internship Time Frames (Form FM-AA-INT-14)' }
      ],
      UPON_APPROVAL: [
        { value: 'MOA', label: 'Memorandum of Agreement (Form FM-AA-INT-10)' },
        { value: 'INTERNSHIP_AGREEMENT', label: 'Internship Agreement (Form FM-AA-INT-10)' },
        { value: 'TRAINING_AGREEMENT', label: 'Training Agreement and Liability Waiver (Form FM-AA-INT-15)' }
      ],
      POST_OJT: [
        { value: 'INTERNSHIP_EVALUATION', label: 'Internship Evaluation Form (Form FM-AA-INT-11)' },
        { value: 'CERTIFICATE_COMPLETION', label: 'Certificate of Training Completion' },
        { value: 'NARRATIVE_REPORT', label: 'Internship Narrative Report' },
        { value: 'DTR_PHOTOCOPY', label: 'Photocopy of Daily Time Record' },
        { value: 'WEEKLY_REPORTS', label: 'Practicum/Internship Weekly Reports (Form FM-AA-INT-16)' },
        { value: 'STUDENT_FEEDBACK', label: 'Student-Trainees Feedback Form (Form FM-AA-INT-17)' },
        { value: 'SUPERVISOR_FEEDBACK', label: 'Training Supervisor Feedback Form (Form FM-AA-INT-18)' },
        { value: 'AGENCY_SELF_EVALUATION', label: 'Evaluation Instrument of PSU Partner Agencies (Self Ratee) (Form FM-AA-INT-19b)' },
        { value: 'AGENCY_STUDENT_EVALUATION', label: 'Evaluation Instrument of PSU Partner Agencies (Student) (Form FM-AA-INT-19c)' }
      ]
    };
    return options[category] || [];
  }

  // Get all document type options (legacy method)
  getDocumentTypeOptions(): { value: string; label: string }[] {
    return [
      ...this.getDocumentTypeOptionsByCategory('PRE_DEPLOYMENT'),
      ...this.getDocumentTypeOptionsByCategory('UPON_APPROVAL'),
      ...this.getDocumentTypeOptionsByCategory('POST_OJT'),
      { value: 'OTHER', label: 'Other Document' }
    ];
  }

  // Get category display name
  getCategoryDisplay(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'PRE_DEPLOYMENT': 'Pre-deployment Documents',
      'UPON_APPROVAL': 'Upon Approval Documents',
      'POST_OJT': 'Post-OJT Documents'
    };
    return categoryMap[category] || category;
  }

  // Get category options
  getCategoryOptions(): { value: string; label: string }[] {
    return [
      { value: 'PRE_DEPLOYMENT', label: 'Pre-deployment Documents' },
      { value: 'UPON_APPROVAL', label: 'Upon Approval Documents' },
      { value: 'POST_OJT', label: 'Post-OJT Documents' }
    ];
  }
}

export const templateService = new TemplateService();
