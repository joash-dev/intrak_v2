import api from '../api/AxiosClient';
import { announcementService, type Announcement } from './announcementService';

// Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COORDINATOR' | 'INSTRUCTOR' | 'STUDENT' | 'INDUSTRY_PARTNER';
  active: boolean;
  createdAt: string;
  student?: {
    studentNumber: string;
    program: string;
    year: number;
    company?: {
      name: string;
    };
  };
}

export interface AdminCompany {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactNumber: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  students: Array<{
    user: {
      name: string;
      email: string;
    };
  }>;
}

export interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalCompanies: number;
  totalCoordinators: number;
  totalInstructors: number;
  totalIndustryPartners: number;
  pendingDocuments: number;
  pendingAttendance: number;
  systemUptime: string;
  recentRegistrations: number;
  monthlyActiveUsers: number;
}

export interface AdminActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  metadata?: any;
}

export interface AdminAlert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolved: boolean;
}

export interface StudentsByProgram {
  program: string;
  count: number;
  active: number;
}

export interface CompanyStats {
  name: string;
  students: number;
  status: 'active' | 'inactive';
}

export interface DocumentStats {
  type: string;
  count: number;
  pending: number;
}

// Admin Service Class
class AdminService {
  // User Management
  async getUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: AdminUser[]; pagination: any }> {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<{ user: AdminUser }> {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async createUser(userData: {
    name: string;
    email: string;
    password?: string;
    role: string;
    studentNumber?: string;
    program?: string;
    year?: string;
    department?: string;
    phone?: string;
    company?: string;
    position?: string;
  }): Promise<{ user: AdminUser }> {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: {
    name?: string;
    email?: string;
    password?: string;
    active?: boolean;
  }): Promise<{ user: AdminUser }> {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Company Management
  async getCompanies(params?: {
    search?: string;
  }): Promise<{ companies: AdminCompany[] }> {
    try {
      const response = await api.get('/companies', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  async getCompanyById(id: string): Promise<{ company: AdminCompany }> {
    try {
      const response = await api.get(`/companies/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  async createCompany(companyData: {
    name: string;
    address: string;
    contactPerson: string;
    contactEmail: string;
    contactNumber: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
  }): Promise<{ company: AdminCompany }> {
    try {
      const response = await api.post('/companies', companyData);
      return response.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  async updateCompany(id: string, companyData: Partial<AdminCompany>): Promise<{ company: AdminCompany }> {
    try {
      const response = await api.put(`/companies/${id}`, companyData);
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  async deleteCompany(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/companies/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<AdminStats> {
    try {
      // Fetch users and companies to calculate stats
      const [usersResponse, companiesResponse] = await Promise.all([
        this.getUsers({ limit: 1000 }), // Get all users for stats
        this.getCompanies()
      ]);

      const users = usersResponse.users;
      const companies = companiesResponse.companies;

      // Calculate statistics
      const stats: AdminStats = {
        totalStudents: users.filter(u => u.role === 'STUDENT').length,
        activeStudents: users.filter(u => u.role === 'STUDENT' && u.active).length,
        totalCompanies: companies.length,
        totalCoordinators: users.filter(u => u.role === 'COORDINATOR').length,
        totalInstructors: users.filter(u => u.role === 'INSTRUCTOR').length,
        totalIndustryPartners: users.filter(u => u.role === 'INDUSTRY_PARTNER').length,
        pendingDocuments: Math.floor(Math.random() * 50) + 10, // Mock data for now
        pendingAttendance: Math.floor(Math.random() * 30) + 5, // Mock data for now
        systemUptime: '99.9%',
        recentRegistrations: users.filter(u => {
          const createdAt = new Date(u.createdAt);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return createdAt > thirtyDaysAgo;
        }).length,
        monthlyActiveUsers: users.filter(u => u.active).length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get students by program
  async getStudentsByProgram(): Promise<StudentsByProgram[]> {
    try {
      const usersResponse = await this.getUsers({ role: 'STUDENT', limit: 1000 });
      const students = usersResponse.users;

      // Group students by program
      const programMap = new Map<string, { total: number; active: number }>();
      
      students.forEach(student => {
        if (student.student) {
          const program = student.student.program;
          if (!programMap.has(program)) {
            programMap.set(program, { total: 0, active: 0 });
          }
          const counts = programMap.get(program)!;
          counts.total++;
          if (student.active) {
            counts.active++;
          }
        }
      });

      return Array.from(programMap.entries()).map(([program, counts]) => ({
        program,
        count: counts.total,
        active: counts.active
      }));
    } catch (error) {
      console.error('Error fetching students by program:', error);
      throw error;
    }
  }

  // Get company statistics
  async getCompanyStats(): Promise<CompanyStats[]> {
    try {
      const companiesResponse = await this.getCompanies();
      const companies = companiesResponse.companies;

      return companies.map(company => ({
        name: company.name,
        students: company.students?.length || 0,
        status: ((company.students?.length || 0) > 0 ? 'active' : 'inactive') as 'active' | 'inactive'
      })).sort((a, b) => b.students - a.students).slice(0, 5); // Top 5 companies
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }

  // Get document statistics
  async getDocumentStats(): Promise<DocumentStats[]> {
    try {
      // Mock data for now - in real implementation, this would come from document service
      return [
        { type: 'MOA', count: 15, pending: 5 },
        { type: 'DTR', count: 89, pending: 12 },
        { type: 'Evaluation Forms', count: 45, pending: 8 },
        { type: 'Application Letters', count: 23, pending: 7 },
      ];
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }

  // Get recent activities (mock data for now)
  async getRecentActivities(): Promise<AdminActivity[]> {
    try {
      // Mock data - in real implementation, this would come from audit logs
      return [
        {
          id: '1',
          type: 'USER_CREATED',
          description: 'New student registered: Juan Dela Cruz',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: 'Coordinator'
        },
        {
          id: '2',
          type: 'DOCUMENT_APPROVED',
          description: 'MOA approved for Maria Santos',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          user: 'Coordinator'
        },
        {
          id: '3',
          type: 'COMPANY_ADDED',
          description: 'New company added: Tech Solutions Inc.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: 'Admin'
        },
        {
          id: '4',
          type: 'ATTENDANCE_VERIFIED',
          description: 'Attendance log verified for 15 students',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          user: 'Industry Partner'
        },
        {
          id: '5',
          type: 'SYSTEM_UPDATE',
          description: 'System backup completed successfully',
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          user: 'System'
        }
      ];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  // Get system alerts
  async getSystemAlerts(): Promise<AdminAlert[]> {
    try {
      // Mock data for now - in real implementation, this would come from monitoring system
      return [
        {
          id: '1',
          type: 'warning',
          title: 'Pending Document Reviews',
          message: '37 documents awaiting coordinator approval',
          priority: 'high',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          type: 'info',
          title: 'System Maintenance',
          message: 'Scheduled maintenance on Oct 15, 2024 at 2:00 AM',
          priority: 'medium',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '3',
          type: 'warning',
          title: 'Incomplete Profiles',
          message: '12 students have incomplete profile information',
          priority: 'medium',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          resolved: false
        }
      ];
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      throw error;
    }
  }

  // Get announcements for admin (all announcements)
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      console.log('Fetching announcements for admin...');
      
      const response = await announcementService.getAnnouncements();
      const allAnnouncements = response.announcements;
      
      // Admin can see all announcements
      const transformedAnnouncements = allAnnouncements.map(announcement => 
        announcementService.transformAnnouncement(announcement)
      );
      
      console.log(`Found ${transformedAnnouncements.length} announcements for admin`);
      return transformedAnnouncements;
    } catch (error) {
      console.error('Error fetching announcements for admin:', error);
      return [];
    }
  }

  // Track announcement view for admin
  async trackAnnouncementView(announcementId: string): Promise<void> {
    try {
      await announcementService.trackView(announcementId);
    } catch (error) {
      console.warn('Failed to track announcement view:', error);
    }
  }

  // Export data functionality
  async exportUsers(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const response = await api.get('/users/export', {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  async exportCompanies(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const response = await api.get('/companies/export', {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting companies:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
