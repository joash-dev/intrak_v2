import api from './api';
import { companyService } from './companyService';
import type { AxiosResponse } from 'axios';
import type { Company, MOA, MOAStats, ApproveMOAResult, SupervisorProvisionResult } from './companyService';
import { devLog } from '../utils/devLog';
import { announcementService, type Announcement } from './announcementService';

export interface CoordinatorSettings {
  autoApproveDocuments: boolean;
  requireDocumentReview: boolean;
  attendanceReminderTime: string;
  defaultAnnouncementAudience: string;
  enableBulkOperations: boolean;
  showAdvancedMetrics: boolean;
  notificationFrequency: string;
}

// Types for coordinator data
export interface CoordinatorStats {
  totalStudents: number;
  activeInterns: number;
  pendingApprovals: number;
  completedInternships: number;
  attendanceRate: number;
  documentsPending: number;
  tasksCompleted: number;
  averageRating: number;
  trends: {
    students: number;
    attendance: number;
    documents: number;
    ratings: number;
  };
}

export interface CoordinatorStudent {
  id: string;
  name: string;
  email: string;
  studentNumber: string;
  phone?: string;
  company: string;
  companyId?: string | null;
  status: 'active' | 'pending' | 'completed' | 'inactive';
  attendance: number;
  tasks: {
    completed: number;
    total: number;
  };
  evaluation: number;
  profilePhoto?: string | null;
  lastActivity: string;
  avatar: string;
  program: string;
  year: number;
  section?: string;
  supervisor?: string;
  totalHours?: number;
  completedHours?: number;
  hoursCompleted?: number;
  requiredHours?: number;
  companyAddress?: string;
  supervisorEmail?: string;
  startDate?: string;
  endDate?: string;
  // Instructor information
  instructorId?: string | null;
  instructorName?: string | null;
  instructorEmail?: string | null;
}

export interface CoordinatorActivity {
  id: string;
  type: 'document' | 'attendance' | 'evaluation' | 'task';
  student: string;
  action: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CoordinatorAlert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  message: string;
  description?: string;
  student?: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

class CoordinatorService {
  // Get all students for coordinator view
  async getAllStudents(): Promise<CoordinatorStudent[]> {
    try {
      devLog.log('Fetching students from API...');
      const response = await api.get('/students');
      devLog.log('Students API response:', response.data);
      const students = response.data.students || [];

      // Transform the API response to match CoordinatorStudent interface
      return students.map((student: any) => ({
        id: student.id,
        name: student.user?.name || 'Unknown',
        email: student.user?.email || '',
        studentNumber: student.studentNumber,
        phone: '', // Not available in current API
        company: student.company?.name || 'No Company',
        companyId: student.company?.id || null,
        status: this.mapStudentStatus(student),
        profilePhoto: student.user?.profilePhoto
          ? `/api/users/profile-photo/${student.user.profilePhoto}`
          : null,
        attendance: 0, // Would need separate API call
        tasks: { completed: 0, total: 0 }, // Would need separate API call
        evaluation: 0, // Would need separate API call
        lastActivity: 'Unknown',
        avatar: this.generateAvatar(student.user?.name || 'Unknown'),
        program: student.program || 'Unknown Program',
        year: student.year || 0,
        section: student.section || '',
        supervisor: student.supervisorName || '',
        totalHours: student.totalHours || 500,
        completedHours: 0, // Would need separate API call
        hoursCompleted: 0, // Would need separate API call
        requiredHours: student.totalHours || 500,
        companyAddress: '', // Not available in current API
        supervisorEmail: '', // Not available in current API
        startDate: student.startDate || '',
        endDate: student.endDate || '',
        // Add instructor information
        instructorId: student.instructor?.id || null,
        instructorName: student.instructor?.name || null,
        instructorEmail: student.instructor?.email || null,
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  // Get coordinator dashboard statistics
  async getDashboardStats(): Promise<CoordinatorStats> {
    try {
      // Since there's no specific coordinator stats endpoint, we'll calculate from students data
      const students = await this.getAllStudents();
      return this.calculateStatsFromStudents(students);
    } catch (error) {
      console.error('Error fetching coordinator stats:', error);
      // Return default stats if API fails
      return {
        totalStudents: 0,
        activeInterns: 0,
        pendingApprovals: 0,
        completedInternships: 0,
        attendanceRate: 0,
        documentsPending: 0,
        tasksCompleted: 0,
        averageRating: 0,
        trends: {
          students: 0,
          attendance: 0,
          documents: 0,
          ratings: 0,
        },
      };
    }
  }

  // Get recent activities from real document submissions
  async getRecentActivities(): Promise<CoordinatorActivity[]> {
    try {
      const response = await api.get('/documents', { params: { limit: 50 } });
      const documents = response.data.documents || [];

      const DocTypeMap: Record<string, string> = {
        APPLICATION_INTERNSHIP: 'Application for Internship',
        CERTIFICATION_UNITS: 'Certification of Units Earned',
        RECORD_FILE: 'Record File',
        CONSENT_FORM: 'Consent Form',
        TRAINING_AGREEMENT: 'Training Agreement',
        INTERNSHIP_AGREEMENT: 'Internship Agreement',
        STUDENT_FEEDBACK: 'Student Feedback',
        INTERNSHIP_RELEASE: 'Internship Release',
        INTERNSHIP_RESUME: 'Internship Resume',
      };

      return documents
        .slice(0, 10)
        .map((doc: any) => ({
          id: doc.id,
          type: 'document' as const,
          student: doc.student?.user?.name || 'Unknown Student',
          action: `Submitted ${DocTypeMap[doc.type] || doc.type}`,
          timestamp: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
          status: (doc.status || 'PENDING').toLowerCase() as 'pending' | 'approved' | 'rejected',
        }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  // Compute real alerts from student data
  computeAlerts(students: CoordinatorStudent[], pendingDocs: number): CoordinatorAlert[] {
    const alerts: CoordinatorAlert[] = [];

    const noCompany = students.filter(s => s.company === 'No Company' || !s.company);
    if (noCompany.length > 0) {
      alerts.push({
        id: 'alert-no-company',
        type: 'warning',
        title: 'Students Without Company',
        message: `${noCompany.length} student(s) have not been assigned to a company yet.`,
        description: `${noCompany.length} student(s) have not been assigned to a company yet.`,
        timestamp: 'Now',
        priority: 'high',
      });
    }

    if (pendingDocs > 0) {
      alerts.push({
        id: 'alert-pending-docs',
        type: 'info',
        title: 'Documents Awaiting Review',
        message: `${pendingDocs} document(s) are pending your review.`,
        description: `${pendingDocs} document(s) are pending your review.`,
        timestamp: 'Now',
        priority: 'medium',
      });
    }

    const noInstructor = students.filter(s => !s.instructorId);
    if (noInstructor.length > 0) {
      alerts.push({
        id: 'alert-no-instructor',
        type: 'warning',
        title: 'Students Without Instructor',
        message: `${noInstructor.length} student(s) have not been assigned to an instructor.`,
        description: `${noInstructor.length} student(s) have not been assigned to an instructor.`,
        timestamp: 'Now',
        priority: 'medium',
      });
    }

    const pendingStudents = students.filter(s => s.status === 'pending');
    if (pendingStudents.length > 0) {
      alerts.push({
        id: 'alert-pending-students',
        type: 'info',
        title: 'Pending Students',
        message: `${pendingStudents.length} student(s) have not started their internship yet.`,
        description: `${pendingStudents.length} student(s) have not started their internship yet.`,
        timestamp: 'Now',
        priority: 'low',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'alert-all-good',
        type: 'success',
        title: 'All Clear',
        message: 'No alerts at this time. Everything is running smoothly.',
        description: 'No alerts at this time. Everything is running smoothly.',
        timestamp: 'Now',
        priority: 'low',
      });
    }

    return alerts;
  }

  // Get announcements for coordinator
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await announcementService.getAnnouncements();
      const all = response.announcements || [];
      return all
        .filter((a: any) => a.audience === 'ALL' || a.audience === 'COORDINATORS')
        .map((a: any) => announcementService.transformAnnouncement(a));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }

  // Get document stats (pending count etc.)
  async getDocumentStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    try {
      const response = await api.get('/documents', { params: { limit: 500 } });
      const documents = response.data.documents || [];
      return {
        total: documents.length,
        pending: documents.filter((d: any) => d.status === 'PENDING').length,
        approved: documents.filter((d: any) => d.status === 'APPROVED').length,
        rejected: documents.filter((d: any) => d.status === 'REJECTED').length,
      };
    } catch (error) {
      console.error('Error fetching document stats:', error);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
  }

  // Get company count
  async getCompanyCount(): Promise<number> {
    try {
      const companies = await companyService.getAllCompanies();
      return companies.length;
    } catch (error) {
      console.error('Error fetching company count:', error);
      return 0;
    }
  }

  // Calculate stats from student data (fallback method)
  calculateStatsFromStudents(students: CoordinatorStudent[]): CoordinatorStats {
    const totalStudents = students.length;
    const activeInterns = students.filter(s => s.status === 'active').length;
    const pendingApprovals = students.filter(s => s.status === 'pending').length;
    const completedInternships = students.filter(s => s.status === 'completed').length;

    const attendanceRate = totalStudents > 0
      ? students.reduce((sum, s) => sum + s.attendance, 0) / totalStudents
      : 0;

    const documentsPending = students.reduce((sum, s) => sum + (s.tasks.total - s.tasks.completed), 0);
    const tasksCompleted = students.reduce((sum, s) => sum + s.tasks.completed, 0);

    const averageRating = totalStudents > 0
      ? students.reduce((sum, s) => sum + s.evaluation, 0) / totalStudents
      : 0;

    return {
      totalStudents,
      activeInterns,
      pendingApprovals,
      completedInternships,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      documentsPending,
      tasksCompleted,
      averageRating: Math.round(averageRating * 10) / 10,
      trends: {
        students: 0, // Would need historical data to calculate
        attendance: 0,
        documents: 0,
        ratings: 0,
      },
    };
  }

  async getCoordinatorSettings(): Promise<CoordinatorSettings> {
    try {
      const response = await api.get('/coordinator/settings');
      return response.data.settings;
    } catch (error) {
      console.error('Error fetching coordinator settings:', error);
      return {
        autoApproveDocuments: false,
        requireDocumentReview: true,
        attendanceReminderTime: '09:00',
        defaultAnnouncementAudience: 'ALL',
        enableBulkOperations: true,
        showAdvancedMetrics: false,
        notificationFrequency: 'immediate',
      };
    }
  }

  async updateCoordinatorSettings(
    settings: CoordinatorSettings,
  ): Promise<CoordinatorSettings> {
    const response = await api.put('/coordinator/settings', settings);
    return response.data.settings;
  }

  // Get student by ID
  async getStudentById(studentId: string): Promise<CoordinatorStudent | null> {
    try {
      const response = await api.get(`/students/${studentId}`);
      const student = response.data;

      // Transform the API response to match CoordinatorStudent interface
      return {
        id: student.id,
        name: student.user?.name || 'Unknown',
        email: student.user?.email || '',
        studentNumber: student.studentNumber,
        phone: '',
        company: student.company?.name || 'No Company',
        companyId: student.company?.id || null,
        status: this.mapStudentStatus(student),
        attendance: 0,
        tasks: { completed: 0, total: 0 },
        evaluation: 0,
        lastActivity: 'Unknown',
        avatar: this.generateAvatar(student.user?.name || 'Unknown'),
        program: student.program || 'Unknown Program',
        year: student.year || 0,
        section: student.section || '',
        supervisor: student.supervisorName || '',
        totalHours: student.totalHours || 500,
        completedHours: 0,
        hoursCompleted: 0,
        requiredHours: student.totalHours || 500,
        companyAddress: '',
        supervisorEmail: '',
        startDate: student.startDate || '',
        endDate: student.endDate || '',
      };
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
  }

  // Update student status
  async updateStudentStatus(_studentId: string, _status: string): Promise<boolean> {
    try {
      // You can implement this when the backend supports status updates
      // For now, just return true
      return true;
    } catch (error) {
      console.error('Error updating student status:', error);
      return false;
    }
  }

  // Get students by status
  async getStudentsByStatus(status: string): Promise<CoordinatorStudent[]> {
    try {
      // Filter students by status from the main students list
      const allStudents = await this.getAllStudents();
      return allStudents.filter(student => student.status === status);
    } catch (error) {
      console.error('Error fetching students by status:', error);
      return [];
    }
  }

  // Get all instructors
  async getInstructors(): Promise<any[]> {
    try {
      devLog.log('Fetching instructors from API...');
      const response = await api.get('/users?role=INSTRUCTOR');
      devLog.log('Instructors API response:', response.data);
      const instructors = response.data.users || [];

      // Transform the API response to include student count
      return instructors.map((instructor: any) => ({
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        studentsAssigned:
          instructor.studentsAssigned ??
          instructor._count?.studentsAssigned ??
          0,
        active: instructor.active
      }));
    } catch (error) {
      console.error('Error fetching instructors:', error);
      return [];
    }
  }

  // Search students
  async searchStudents(query: string): Promise<CoordinatorStudent[]> {
    try {
      const response = await api.get(`/students?search=${encodeURIComponent(query)}`);
      const students = response.data.students || [];

      // Transform the API response to match CoordinatorStudent interface
      return students.map((student: any) => ({
        id: student.id,
        name: student.user?.name || 'Unknown',
        email: student.user?.email || '',
        studentNumber: student.studentNumber,
        phone: '',
        company: student.company?.name || 'No Company',
        companyId: student.company?.id || null,
        status: this.mapStudentStatus(student),
        attendance: 0,
        tasks: { completed: 0, total: 0 },
        evaluation: 0,
        lastActivity: 'Unknown',
        avatar: this.generateAvatar(student.user?.name || 'Unknown'),
        program: student.program || 'Unknown Program',
        year: student.year || 0,
        section: student.section || '',
        supervisor: student.supervisorName || '',
        totalHours: student.totalHours || 500,
        completedHours: 0,
        hoursCompleted: 0,
        requiredHours: student.totalHours || 500,
        companyAddress: '',
        supervisorEmail: '',
        startDate: student.startDate || '',
        endDate: student.endDate || '',
      }));
    } catch (error) {
      console.error('Error searching students:', error);
      return [];
    }
  }

  // Helper method to map student status
  private mapStudentStatus(student: any): 'active' | 'pending' | 'completed' | 'inactive' {
    // You can customize this logic based on your business rules
    if (student.endDate && new Date(student.endDate) < new Date()) {
      return 'completed';
    }
    if (student.startDate && new Date(student.startDate) > new Date()) {
      return 'pending';
    }
    return 'active';
  }

  // Helper method to generate avatar initials
  private generateAvatar(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Helper method to generate secure password for new student accounts
  private generateStudentPassword(studentNumber: string, _studentName: string): string {
    // Clean student number (remove dashes and spaces)
    const cleanStudentNumber = studentNumber.replace(/[-\s]/g, '');

    // Get current year
    const currentYear = new Date().getFullYear().toString();

    // Generate random characters (2 uppercase, 2 lowercase, 1 special)
    const randomUpper = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const randomUpper2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const randomLower = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
    const randomLower2 = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    const specialChars = ['!', '@', '#', '$', '%', '&', '*'];
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];

    // Combine all elements
    const password = `${cleanStudentNumber}${randomUpper}${randomLower}${randomUpper2}${randomLower2}${randomSpecial}${currentYear}`;

    return password;
  }

  // Create a new student
  async createStudent(studentData: {
    name: string;
    email: string;
    studentNumber: string;
    program: string;
    year: number;
    company?: string;
    supervisor?: string;
    startDate?: string;
    endDate?: string;
    totalHours?: number;
  }): Promise<{ student: CoordinatorStudent; emailSent: boolean } | null> {
    try {
      devLog.log('Creating student with data:', studentData);
      devLog.log('API base URL:', api.defaults.baseURL);

      // Generate secure password for the student
      const generatedPassword = this.generateStudentPassword(studentData.studentNumber, studentData.name);
      devLog.log('Generated password for student:', generatedPassword);

      // First, create a user account using the register endpoint
      devLog.log('Creating user account...');
      const userResponse = await api.post('/auth/register', {
        name: studentData.name,
        email: studentData.email,
        role: 'STUDENT',
        password: generatedPassword
      });

      devLog.log('User created successfully:', userResponse.data);

      const userId = userResponse.data.user.id;

      // Convert year string to integer (e.g., "4th Year" -> 4)
      const yearNumber = parseInt(studentData.year.toString().replace(/\D/g, '')) || 4;

      // Then create the student record
      devLog.log('Creating student record...');
      const studentResponse = await api.post('/students', {
        userId: userId,
        studentNumber: studentData.studentNumber,
        program: "BS Computer Engineering", // Always BSCOE for this system
        year: yearNumber,
        section: 'A', // Default section
        companyId: null, // Optional field
        supervisorName: studentData.supervisor || '',
        startDate: studentData.startDate,
        endDate: studentData.endDate,
        totalHours: studentData.totalHours || 500
      });

      // Return the created student in the expected format
      const student = studentResponse.data.student;
      const coordinatorStudent: CoordinatorStudent = {
        id: student.id,
        name: studentData.name,
        email: studentData.email,
        studentNumber: studentData.studentNumber,
        phone: '',
        company: studentData.company || 'No Company',
        companyId: null,
        status: 'pending',
        attendance: 0,
        tasks: { completed: 0, total: 0 },
        evaluation: 0,
        lastActivity: 'Just created',
        avatar: this.generateAvatar(studentData.name),
        program: "BS Computer Engineering", // Always BSCOE for this system
        year: studentData.year,
        section: 'A',
        supervisor: studentData.supervisor || '',
        totalHours: studentData.totalHours || 500,
        completedHours: 0,
        hoursCompleted: 0,
        requiredHours: studentData.totalHours || 500,
        companyAddress: '',
        supervisorEmail: '',
        startDate: studentData.startDate || '',
        endDate: studentData.endDate || '',
      };

      // Send welcome email with temporary password
      devLog.log('Sending welcome email...');
      let emailSent = false;
      try {
        const emailResponse = await api.post('/email/welcome', {
          studentEmail: studentData.email,
          studentName: studentData.name,
          studentNumber: studentData.studentNumber,
          temporaryPassword: generatedPassword
        });
        emailSent = emailResponse.data.emailSent;
        devLog.log('Email sent successfully:', emailSent);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the student creation if email fails
        emailSent = false;
      }

      return {
        student: coordinatorStudent,
        emailSent: emailSent
      };
    } catch (error: any) {
      console.error('Error creating student:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      // Provide more specific error messages
      if (error.response?.status === 400) {
        const message = error.response.data.message || 'Invalid data provided';
        if (message.includes('Email already exists')) {
          throw new Error('A student with this email address already exists. Please use a different email.');
        } else if (message.includes('Student number already exists')) {
          throw new Error('A student with this student number already exists. Please use a different student number.');
        } else {
          throw new Error(message);
        }
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create students');
      } else if (error.response?.status === 409) {
        throw new Error('Student with this email or student number already exists');
      } else if (error.response?.status === 404) {
        throw new Error('API endpoint not found. Please check server configuration.');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to create student');
      }
    }
  }

  // Delete a student
  async deleteStudent(studentId: string): Promise<boolean> {
    try {
      devLog.log('Deleting student with ID:', studentId);

      // Delete the student record (this should cascade to delete the user as well)
      await api.delete(`/students/${studentId}`);

      devLog.log('Student deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting student:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      // Provide specific error messages
      if (error.response?.status === 404) {
        throw new Error('Student not found');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete students');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to delete student');
      }
    }
  }

  // Get all instructors
  async getAllInstructors(): Promise<any[]> {
    try {
      const response = await api.get('/users?role=INSTRUCTOR');
      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching instructors:', error);
      return [];
    }
  }

  // Assign student to instructor
  async assignStudentToInstructor(studentId: string, instructorId: string): Promise<boolean> {
    try {
      devLog.log('Assigning student to instructor:', { studentId, instructorId });
      const response = await api.patch(`/students/${studentId}/instructor`, {
        instructorId
      });

      devLog.log('Student assigned successfully:', response.data);
      return true;
    } catch (error: any) {
      console.error('Error assigning student to instructor:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to assign student to instructor';
      throw new Error(errorMessage);
    }
  }

  // Remove student from instructor (unassign)
  async unassignStudentFromInstructor(studentId: string): Promise<boolean> {
    try {
      devLog.log('Unassigning student from instructor:', { studentId });
      const response = await api.patch(`/students/${studentId}/instructor`, {
        instructorId: null
      });

      devLog.log('Student unassigned successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Error unassigning student from instructor:', error);
      return false;
    }
  }

  // =============================================
  // COMPANY MANAGEMENT METHODS
  // =============================================

  // Get all companies
  async getAllCompanies(): Promise<Company[]> {
    return companyService.getAllCompanies();
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<Company> {
    return companyService.getCompanyById(id);
  }

  // Create new company
  async createCompany(companyData: Partial<Company>): Promise<Company> {
    return companyService.createCompany(companyData);
  }

  // Update company
  async updateCompany(id: string, companyData: Partial<Company>): Promise<Company> {
    return companyService.updateCompany(id, companyData);
  }

  // Delete company
  async deleteCompany(id: string): Promise<void> {
    return companyService.deleteCompany(id);
  }

  // Upload MOA document
  async uploadMOA(formData: FormData): Promise<MOA> {
    return companyService.uploadMOA(formData);
  }

  // =============================================
  // MOA MANAGEMENT METHODS
  // =============================================

  // Get all MOAs
  async getAllMOAs(filters?: {
    status?: string;
    companyId?: string;
    expiring?: boolean;
  }): Promise<MOA[]> {
    return companyService.getAllMOAs(filters);
  }

  // Get MOA by ID
  async getMOAById(id: string): Promise<MOA> {
    return companyService.getMOAById(id);
  }

  // Approve MOA
  async approveMOA(id: string, notes?: string): Promise<ApproveMOAResult> {
    return companyService.approveMOA(id, notes);
  }

  // Reject MOA
  async rejectMOA(id: string, reason: string): Promise<MOA> {
    return companyService.rejectMOA(id, reason);
  }

  async downloadMOA(id: string): Promise<AxiosResponse<Blob>> {
    return companyService.downloadMOA(id);
  }

  async createSupervisorAccount(companyId: string): Promise<SupervisorProvisionResult> {
    return companyService.createSupervisorAccount(companyId);
  }

  async updateStudentCompany(studentId: string, companyId: string | null): Promise<void> {
    await api.put(`/students/${studentId}`, {
      companyId: companyId || null,
      supervisorName: companyId ? undefined : null,
    });
  }

  // Note: MOA deletion is handled through the document management system

  // Get MOA statistics
  async getMOAStats(): Promise<MOAStats> {
    return companyService.getMOAStats();
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  // Check if MOA is expiring soon
  isExpiringSoon(endDate: string): boolean {
    return companyService.isExpiringSoon(endDate);
  }

  // Check if MOA is expired
  isExpired(endDate: string): boolean {
    return companyService.isExpired(endDate);
  }

  // Get days until expiry
  getDaysUntilExpiry(endDate: string): number {
    return companyService.getDaysUntilExpiry(endDate);
  }

  // Format date for display
  formatDate(dateString: string): string {
    return companyService.formatDate(dateString);
  }

  // Get status info
  getStatusInfo(status: string) {
    return companyService.getStatusInfo(status);
  }
}

export const coordinatorService = new CoordinatorService();
