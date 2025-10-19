import api from './api';

// Types for Company and MOA
export type Company = {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactNumber: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  createdAt: string;
  updatedAt: string;
  students?: any[];
  _count?: {
    students: number;
  };
};

export type MOA = {
  id: string;
  type: "MOA";
  title: string;
  description?: string;
  filepath: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks?: string;
  uploadedAt: string;
  reviewedAt?: string;
  student?: {
    id: string;
    companyId?: string;
    user: {
      name: string;
      email: string;
    };
    company?: {
      id: string;
      name: string;
      contactEmail: string;
      contactPerson: string;
    };
  };
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export type MOAStats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  expiring: number;
};

class CompanyService {
  // =============================================
  // COMPANY MANAGEMENT
  // =============================================

  // Get all companies
  async getAllCompanies(): Promise<Company[]> {
    try {
      console.log('Fetching companies from API...');
      const response = await api.get('/companies');
      console.log('Companies API response:', response.data);
      return response.data.companies || [];
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch companies');
    }
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<Company> {
    try {
      const response = await api.get(`/companies/${id}`);
      return response.data.company;
    } catch (error: any) {
      console.error('Error fetching company:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch company');
    }
  }

  // Create new company
  async createCompany(companyData: Partial<Company>): Promise<Company> {
    try {
      const response = await api.post('/companies', companyData);
      return response.data.company;
    } catch (error: any) {
      console.error('Error creating company:', error);
      throw new Error(error.response?.data?.message || 'Failed to create company');
    }
  }

  // Update company
  async updateCompany(id: string, companyData: Partial<Company>): Promise<Company> {
    try {
      const response = await api.put(`/companies/${id}`, companyData);
      return response.data.company;
    } catch (error: any) {
      console.error('Error updating company:', error);
      throw new Error(error.response?.data?.message || 'Failed to update company');
    }
  }

  // Delete company
  async deleteCompany(id: string): Promise<void> {
    try {
      await api.delete(`/companies/${id}`);
    } catch (error: any) {
      console.error('Error deleting company:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete company');
    }
  }

  // =============================================
  // MOA MANAGEMENT
  // =============================================

  // Get all MOAs
  async getAllMOAs(filters?: {
    status?: string;
    companyId?: string;
    expiring?: boolean;
  }): Promise<MOA[]> {
    try {
      console.log('Fetching MOAs from API...');
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.companyId) params.append('companyId', filters.companyId);
      if (filters?.expiring) params.append('expiring', 'true');

      const response = await api.get(`/companies/moas/all?${params.toString()}`);
      console.log('MOAs API response:', response.data);
      return response.data.moas || [];
    } catch (error: any) {
      console.error('Error fetching MOAs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch MOAs');
    }
  }

  // Get MOA by ID
  async getMOAById(id: string): Promise<MOA> {
    try {
      const response = await api.get(`/companies/moas/${id}`);
      return response.data.moa;
    } catch (error: any) {
      console.error('Error fetching MOA:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch MOA');
    }
  }

  // Note: MOA creation and update are handled through the document upload system
  // These methods are not implemented as MOAs are created as documents by students

  // Approve MOA
  async approveMOA(id: string, notes?: string): Promise<MOA> {
    try {
      const response = await api.patch(`/companies/moas/${id}/approve`, { notes });
      return response.data.moa;
    } catch (error: any) {
      console.error('Error approving MOA:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve MOA');
    }
  }

  // Reject MOA
  async rejectMOA(id: string, reason: string): Promise<MOA> {
    try {
      const response = await api.patch(`/companies/moas/${id}/reject`, { reason });
      return response.data.moa;
    } catch (error: any) {
      console.error('Error rejecting MOA:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject MOA');
    }
  }

  // Note: MOA deletion is handled through the document management system

  // Get MOA statistics
  async getMOAStats(): Promise<MOAStats> {
    try {
      const response = await api.get('/companies/moas/stats/overview');
      return response.data.stats;
    } catch (error: any) {
      console.error('Error fetching MOA stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch MOA statistics');
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  // Check if MOA is expiring soon (within 30 days)
  isExpiringSoon(endDate: string): boolean {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }

  // Check if MOA is expired
  isExpired(endDate: string): boolean {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  }

  // Get days until expiry
  getDaysUntilExpiry(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get status color and styling
  getStatusInfo(status: string) {
    switch (status) {
      case "APPROVED":
        return { 
          color: "text-green-600 bg-green-100", 
          icon: "CheckCircle",
          label: "Approved"
        };
      case "PENDING":
        return { 
          color: "text-yellow-600 bg-yellow-100", 
          icon: "Clock",
          label: "Pending"
        };
      case "REJECTED":
        return { 
          color: "text-red-600 bg-red-100", 
          icon: "XCircle",
          label: "Rejected"
        };
      default:
        return { 
          color: "text-gray-600 bg-gray-100", 
          icon: "Clock",
          label: status
        };
    }
  }

  // Upload MOA document
  async uploadMOA(formData: FormData): Promise<MOA> {
    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.document;
    } catch (error: any) {
      console.error('Error uploading MOA:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload MOA');
    }
  }
}

export const companyService = new CompanyService();

// Re-export types for external use
export type { Company, MOA, MOAStats };
