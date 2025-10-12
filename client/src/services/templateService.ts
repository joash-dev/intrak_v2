import api from './api';

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
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
      throw error;
    }
  }

  // Get document type display name
  getDocumentTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      'APPLICATION_LETTER': 'Application Letter',
      'MOA': 'Memorandum of Agreement (MOA)',
      'ACCEPTANCE': 'Acceptance Letter',
      'EVALUATION_FORM': 'Evaluation Form',
      'DTR_HARDCOPY': 'Daily Time Record (DTR)',
      'OTHER': 'Other Document'
    };
    return typeMap[type] || type;
  }

  // Get document type options
  getDocumentTypeOptions(): { value: string; label: string }[] {
    return [
      { value: 'APPLICATION_LETTER', label: 'Application Letter' },
      { value: 'MOA', label: 'Memorandum of Agreement (MOA)' },
      { value: 'ACCEPTANCE', label: 'Acceptance Letter' },
      { value: 'EVALUATION_FORM', label: 'Evaluation Form' },
      { value: 'DTR_HARDCOPY', label: 'Daily Time Record (DTR)' },
      { value: 'OTHER', label: 'Other Document' }
    ];
  }
}

export const templateService = new TemplateService();
