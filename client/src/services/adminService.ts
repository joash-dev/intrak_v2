import api from './api';
import { announcementService, type Announcement } from './announcementService';
import { devLog } from '../utils/devLog';

// Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COORDINATOR' | 'INSTRUCTOR' | 'STUDENT' | 'INDUSTRY_PARTNER';
  active: boolean;
  createdAt: string;
  phone?: string | null;
  department?: string | null;
  office?: string | null;
  profilePhoto?: string | null;
  companiesSupervised?: Array<{
    id: string;
    name: string;
    contactNumber: string;
  }>;
  student?: {
    id: string;  // Student record ID (different from user ID)
    studentNumber: string;
    program: string;
    year: number;
    company?: {
      name: string;
    };
  };
}

export interface AdminSettingsRecord {
  id: string;
  userId: string;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  systemAlerts: boolean;
  autoBackup: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  emailSystemAlerts: boolean;
  emailUserActivity: boolean;
  emailMaintenance: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminNotificationPreferences {
  emailSystemAlerts: boolean;
  emailUserActivity: boolean;
  emailMaintenance: boolean;
  pushNotifications: boolean;
}

export interface AdminSettingsImportPayload {
  systemSettings?: Partial<{
    maintenanceMode: boolean;
    emailNotifications: boolean;
    systemAlerts: boolean;
    autoBackup: boolean;
    sessionTimeout: number | string;
    maxLoginAttempts: number | string;
  }>;
  notifications?: Partial<AdminNotificationPreferences>;
  profile?: Partial<{
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    office: string | null;
  }>;
  appearance?: Partial<{
    theme: 'light' | 'dark' | 'system';
  }>;
}

export interface AdminSettingsImportResponse {
  message: string;
  adminSettings: AdminSettingsRecord;
  profile?: AdminUser | null;
  notifications: AdminNotificationPreferences;
}

export interface AdminSettingsExportResult {
  blob: Blob;
  fileName: string;
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
  industry?: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: string;
  moaStatus?: string;
  companyType?: 'PUBLIC' | 'PRIVATE';
  workingDays?: string[];
  moaExpiry?: string | null;
  studentCount?: number;
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

export interface SystemAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  component: 'storage' | 'database' | 'nas' | 'system';
  timestamp: string;
}

export interface NASStorage {
  total: string;
  used: string;
  free: string;
  percentUsed: number;
  path: string;
}

export interface NASConfig {
  enabled: boolean;
  mountPath: string;
  host: string;
  username: string;
  shareName: string;
  hasPassword: boolean;
}

export interface SystemInfo {
  version: string;
  lastUpdated: string;
  databaseSize: string;
  databaseSizeBytes?: number;
  activeUsers: number;
  totalDocuments: number;
  systemUptime: string;
  serverLoad: number;
  memoryUsage: number;
  diskUsage: number;
  databaseStatus?: string;
  apiServerStatus?: string;
  totalMemory?: number;
  freeMemory?: number;
  usedMemory?: number;
  totalDisk?: number;
  usedDisk?: number;
  cpuModel?: string;
  cpuCount?: number;
  platform?: string;
  arch?: string;
  nodeVersion?: string;
  environment?: string;
  // Load average details
  loadAverage1min?: string;
  loadAverage5min?: string;
  loadAverage15min?: string;
  // NAS storage metrics
  nasAvailable?: boolean;
  nasStorage?: NASStorage | null;
  // System alerts
  alerts?: SystemAlert[];
}

// Admin Service Class
// Updated SystemInfo interface with real system metrics
class AdminService {
  // Admin Profile Management
  async getAdminProfile(): Promise<{ user: AdminUser }> {
    try {
      const response = await api.get('/admin/profile');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin profile');
    }
  }

  async updateAdminProfile(profileData: {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    office?: string;
  }): Promise<{ user: AdminUser }> {
    try {
      const response = await api.put('/admin/profile', profileData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating admin profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update admin profile');
    }
  }

  async changeAdminPassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    try {
      devLog.log('🔐 AdminService: Attempting password change...');
      devLog.log('🔐 AdminService: Current token exists:', !!localStorage.getItem('accessToken'));
      devLog.log('🔐 AdminService: Refresh token exists:', !!localStorage.getItem('refreshToken'));

      const response = await api.put('/admin/password', passwordData);
      devLog.log('✅ AdminService: Password change successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ AdminService: Error changing admin password:', error);
      console.error('❌ AdminService: Error response:', error.response);
      console.error('❌ AdminService: Error response data:', error.response?.data);
      console.error('❌ AdminService: Error response status:', error.response?.status);
      console.error('❌ AdminService: Error response headers:', error.response?.headers);


      // Extract the specific error message from the API response
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to change password';

      console.error('❌ AdminService: Final error message:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Admin Settings Management
  async getAdminSettings(): Promise<{ adminSettings: AdminSettingsRecord }> {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin settings');
    }
  }

  async updateAdminSettings(settingsData: {
    maintenanceMode?: boolean;
    emailNotifications?: boolean;
    systemAlerts?: boolean;
    autoBackup?: boolean;
    sessionTimeout?: number;
    maxLoginAttempts?: number;
    emailSystemAlerts?: boolean;
    emailUserActivity?: boolean;
    emailMaintenance?: boolean;
    pushNotifications?: boolean;
    theme?: string;
  }): Promise<{ adminSettings: AdminSettingsRecord }> {
    try {
      const response = await api.put('/admin/settings', settingsData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating admin settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to update admin settings');
    }
  }

  async exportAdminSettings(): Promise<AdminSettingsExportResult> {
    try {
      const response = await api.get('/admin/settings/export', {
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'] as string | undefined;
      let fileName = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;

      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (match && match[1]) {
          fileName = decodeURIComponent(match[1]);
        }
      }

      return {
        blob: response.data,
        fileName,
      };
    } catch (error: any) {
      console.error('Error exporting admin settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to export admin settings');
    }
  }

  async importAdminSettings(payload: AdminSettingsImportPayload): Promise<AdminSettingsImportResponse> {
    try {
      const response = await api.post('/admin/settings/import', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error importing admin settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to import admin settings');
    }
  }

  // User Management
  async getUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: AdminUser[]; pagination: any }> {
    try {
      const response = await api.get('/users', { params });
      // Map the users to include the correct profile photo URL
      if (response.data && response.data.users) {
        response.data.users = response.data.users.map((user: AdminUser) => ({
          ...user,
          profilePhoto: user.profilePhoto
            ? `/api/users/profile-photo/${user.profilePhoto}`
            : null
        }));
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<{ user: AdminUser }> {
    try {
      const response = await api.get(`/users/${id}`);
      if (response.data && response.data.user) {
        response.data.user = {
          ...response.data.user,
          profilePhoto: response.data.user.profilePhoto
            ? `/api/users/profile-photo/${response.data.user.profilePhoto}`
            : null
        };
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Get all instructors for assignment dropdown
  async getInstructors(): Promise<{ id: string; name: string; email: string; active: boolean; _count: { studentsAssigned: number } }[]> {
    try {
      const response = await api.get('/admin/instructors');
      return response.data.instructors || [];
    } catch (error) {
      console.error('Error fetching instructors:', error);
      const message =
        (error as any)?.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to fetch instructors');
      throw new Error(message);
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
      // Generate a default password if not provided
      const password = userData.password || this.generateDefaultPassword();

      // Prepare user data for registration
      const userRegistrationData = {
        name: userData.name,
        email: userData.email,
        password: password,
        role: userData.role
      };

      // Create the user first
      const userResponse = await api.post('/auth/register', userRegistrationData);
      const user = userResponse.data.user;

      // If this is a student, create the student profile
      if (userData.role === 'STUDENT' && (userData.studentNumber || userData.program || userData.year)) {
        try {
          // Validate and format student number if provided
          let formattedStudentNumber = userData.studentNumber;
          if (formattedStudentNumber && !/^\d{2}-[A-Z]{2}-\d{4}$/.test(formattedStudentNumber)) {
            // Try to format the student number if it's in a different format
            console.warn(`Invalid student number format: ${formattedStudentNumber}. Expected format: 22-UR-0592`);
            // For now, we'll skip student profile creation if format is wrong
            throw new Error(`Invalid student number format. Expected: 22-UR-0592, got: ${formattedStudentNumber}`);
          }

          const studentData = {
            userId: user.id,
            studentNumber: formattedStudentNumber,
            program: userData.program,
            year: userData.year ? parseInt(userData.year) : undefined,
            section: userData.department // Using department as section for now
          };

          // Remove undefined values
          const cleanStudentData = Object.fromEntries(
            Object.entries(studentData).filter(([_, value]) => value !== undefined)
          );

          if (Object.keys(cleanStudentData).length > 1) { // More than just userId
            devLog.log('Creating student profile with data:', cleanStudentData);
            await api.post('/students', cleanStudentData);
          }
        } catch (studentError: any) {
          console.warn('Failed to create student profile, but user was created:', studentError);
          console.warn('Student error response:', studentError.response?.data);
          // Don't throw here as the user was successfully created
        }
      }

      // Send welcome email to the user
      let emailSent = false;
      try {
        devLog.log('Sending welcome email to user...');

        // Use the same approach as instructor service for consistency
        if (userData.role === 'STUDENT') {
          // For students, use the student welcome email endpoint
          const emailResponse = await api.post('/email/welcome', {
            studentEmail: userData.email,
            studentName: userData.name,
            studentNumber: userData.studentNumber || 'N/A',
            temporaryPassword: password
          });
          emailSent = emailResponse.data.emailSent;
        } else {
          // For other roles, use the general user welcome email endpoint
          const emailResponse = await api.post('/email/welcome-user', {
            userEmail: userData.email,
            userName: userData.name,
            userRole: userData.role,
            temporaryPassword: password,
            additionalInfo: {
              studentNumber: userData.studentNumber,
              program: userData.program,
              department: userData.department
            }
          });
          emailSent = emailResponse.data.emailSent;
        }

        devLog.log('Welcome email sent successfully:', emailSent);
      } catch (emailError: any) {
        console.warn('Failed to send welcome email:', emailError);
        console.warn('Email error response:', emailError.response?.data);
        console.warn('Email error status:', emailError.response?.status);
        // Don't throw here as the user was successfully created
      }

      return {
        ...userResponse.data,
        emailSent
      };
    } catch (error: any) {
      console.error('Error creating user:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('User data sent:', userData);
      throw error;
    }
  }

  private generateDefaultPassword(): string {
    // Generate a secure default password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async updateUser(id: string, userData: {
    name?: string;
    email?: string;
    password?: string;
    active?: boolean;
    phone?: string;
    company?: string;
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
    companyType?: 'PUBLIC' | 'PRIVATE';
    workingDays?: string[];
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

  // Get recent activities (realistic data)
  async getRecentActivities(): Promise<AdminActivity[]> {
    try {
      const response = await api.get('/activities', { params: { limit: 15 } });
      return response.data.activities.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        timestamp: activity.createdAt,
        user: activity.userName || 'System'
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  // Get system alerts
  async getSystemAlerts(): Promise<AdminAlert[]> {
    try {
      const response = await api.get('/alerts', { params: { resolved: false, limit: 20 } });
      return response.data.alerts.map((alert: any) => ({
        id: alert.id,
        type: alert.type.toLowerCase(),
        title: alert.title,
        message: alert.message,
        priority: alert.priority.toLowerCase(),
        createdAt: alert.createdAt,
        resolved: alert.resolved
      }));
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return [];
    }
  }

  // Get announcements for admin (all announcements)
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await announcementService.getAnnouncements();
      const allAnnouncements = response.announcements;

      // Admin can see all announcements
      const transformedAnnouncements = allAnnouncements.map(announcement =>
        announcementService.transformAnnouncement(announcement)
      );

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

  // Admin system information
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      devLog.log('Fetching system information...');
      const response = await api.get('/admin/system-info');
      devLog.log('System info API response:', response.data);
      const data = response.data.systemInfo || response.data;
      return data;
    } catch (error) {
      console.error('Error fetching system information:', error);
      // Minimal fallback — omit CPU/memory/disk numbers so the UI does not contradict itself.
      return {
        version: '2.1.3',
        lastUpdated: new Date().toISOString(),
        databaseSize: '—',
        activeUsers: 0,
        totalDocuments: 0,
        systemUptime: '—',
        serverLoad: 0,
        memoryUsage: 0,
        databaseStatus: 'unknown',
        apiServerStatus: 'unknown',
        diskUsage: 0,
        nasAvailable: false
      };
    }
  }

  async getNASConfig(): Promise<{ nasConfig: NASConfig; runtime: { storagePath: string; isUsingFallback: boolean } }> {
    try {
      const response = await api.get('/admin/nas-config');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching NAS config:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch NAS configuration');
    }
  }

  async updateNASConfig(payload: {
    enabled: boolean;
    mountPath: string;
    host: string;
    username: string;
    shareName: string;
    password?: string;
  }): Promise<{ message: string; nasConfig: NASConfig }> {
    try {
      const response = await api.put('/admin/nas-config', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error updating NAS config:', error);
      throw new Error(error.response?.data?.message || 'Failed to update NAS configuration');
    }
  }

  async testNASConnection(): Promise<{ connected: boolean; message: string; runtime?: { storagePath: string; isUsingFallback: boolean } }> {
    try {
      const response = await api.post('/admin/nas-config/test');
      return response.data;
    } catch (error: any) {
      console.error('Error testing NAS connection:', error);
      throw new Error(error.response?.data?.message || 'Failed to test NAS connection');
    }
  }

  async syncLocalToNAS(): Promise<{ message: string; synced: number; failed: number }> {
    try {
      const response = await api.post('/admin/nas-config/sync');
      return response.data;
    } catch (error: any) {
      console.error('Error syncing files to NAS:', error);
      throw new Error(error.response?.data?.message || 'Failed to sync local files to NAS');
    }
  }

  async clearAllNASData(targets?: string[]): Promise<{
    message: string;
    mode: 'all' | 'selected';
    requestedTargets: string[];
    mountPath: string;
    deletesFilesOnly?: boolean;
    deletedItems: number;
    failedItems: number;
    deletedNames: string[];
    failedNames: string[];
  }> {
    try {
      const response = await api.post('/admin/nas-config/clear-all', {
        targets: targets && targets.length > 0 ? targets : undefined
      });
      return response.data;
    } catch (error: any) {
      console.error('Error clearing NAS data:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear NAS data');
    }
  }

  async getClearAllNASPreview(): Promise<{
    available: boolean;
    reason?: string;
    mountPath: string;
    topLevelEntryCount: number;
    totalFiles: number;
    totalDirectories: number;
    totalSizeBytes: number;
    entries: Array<{
      name: string;
      type: 'file' | 'directory';
      files: number;
      directories: number;
      sizeBytes: number;
    }>;
    deletesFilesOnly?: boolean;
  }> {
    try {
      const response = await api.get('/admin/nas-config/clear-all/preview');
      return response.data;
    } catch (error: any) {
      console.error('Error getting NAS clear preview:', error);
      throw new Error(error.response?.data?.message || 'Failed to get NAS clear preview');
    }
  }

  async clearSystemCache(): Promise<void> {
    await api.post('/admin/system/cache/clear');
  }

  async restartSystem(): Promise<void> {
    try {
      await api.post('/admin/system/restart');
    } catch (error: any) {
      // When the server exits the process, the request may be interrupted.
      if (error?.code === 'ERR_NETWORK') {
        return;
      }
      throw error;
    }
  }

  // Check maintenance mode status
  async checkMaintenanceStatus(): Promise<{
    maintenanceMode: boolean;
    message: string;
    lastUpdated: string | null;
  }> {
    try {
      const response = await api.get('/admin/maintenance-status');
      return response.data;
    } catch (error) {
      console.error('Error checking maintenance status:', error);
      return {
        maintenanceMode: false,
        message: 'Unable to check maintenance status',
        lastUpdated: null
      };
    }
  }
}

export const adminService = new AdminService();
