import api from './api';
import { companyService } from './companyService';
import type { Company, MOA, MOAStats, ApproveMOAResult } from './companyService';

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
  status: 'active' | 'pending' | 'completed' | 'inactive';
  attendance: number;
  tasks: {
    completed: number;
    total: number;
  };
  evaluation: number;
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
      console.log('Fetching students from API...');
      const response = await api.get('/students');
      console.log('Students API response:', response.data);
      const students = response.data.students || [];
      
      // Transform the API response to match CoordinatorStudent interface
      return students.map((student: any) => ({
        id: student.id,
        name: student.user?.name || 'Unknown',
        email: student.user?.email || '',
        studentNumber: student.studentNumber,
        phone: '', // Not available in current API
        company: student.company?.name || 'No Company',
        status: this.mapStudentStatus(student),
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

  // Get recent activities
  async getRecentActivities(): Promise<CoordinatorActivity[]> {
    try {
      // For now, return empty array since this endpoint doesn't exist yet
      // You can implement this later when the backend supports it
      return [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  // Get alerts and notifications
  async getAlerts(): Promise<CoordinatorAlert[]> {
    try {
      // For now, return empty array since this endpoint doesn't exist yet
      // You can implement this later when the backend supports it
      return [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
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
      console.log('Fetching instructors from API...');
      const response = await api.get('/users?role=INSTRUCTOR');
      console.log('Instructors API response:', response.data);
      const instructors = response.data.users || [];
      
      // Transform the API response to include student count
      return instructors.map((instructor: any) => ({
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        studentsAssigned: instructor.studentsAssigned || 0,
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
      console.log('Creating student with data:', studentData);
      console.log('API base URL:', api.defaults.baseURL);
      
      // Generate secure password for the student
      const generatedPassword = this.generateStudentPassword(studentData.studentNumber, studentData.name);
      console.log('Generated password for student:', generatedPassword);
      
      // First, create a user account using the register endpoint
      console.log('Creating user account...');
      const userResponse = await api.post('/auth/register', {
        name: studentData.name,
        email: studentData.email,
        role: 'STUDENT',
        password: generatedPassword
      });
      
      console.log('User created successfully:', userResponse.data);

      const userId = userResponse.data.user.id;

      // Convert year string to integer (e.g., "4th Year" -> 4)
      const yearNumber = parseInt(studentData.year.toString().replace(/\D/g, '')) || 4;
      
      // Then create the student record
      console.log('Creating student record...');
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
      console.log('Sending welcome email...');
      let emailSent = false;
      try {
        const emailResponse = await api.post('/email/welcome', {
          studentEmail: studentData.email,
          studentName: studentData.name,
          studentNumber: studentData.studentNumber,
          temporaryPassword: generatedPassword
        });
        emailSent = emailResponse.data.emailSent;
        console.log('Email sent successfully:', emailSent);
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
      console.log('Deleting student with ID:', studentId);
      
      // Delete the student record (this should cascade to delete the user as well)
      await api.delete(`/students/${studentId}`);
      
      console.log('Student deleted successfully');
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
      console.log('Assigning student to instructor:', { studentId, instructorId });
      const response = await api.patch(`/students/${studentId}/instructor`, {
        instructorId
      });
      
      console.log('Student assigned successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Error assigning student to instructor:', error);
      return false;
    }
  }

  // Remove student from instructor (unassign)
  async unassignStudentFromInstructor(studentId: string): Promise<boolean> {
    try {
      console.log('Unassigning student from instructor:', { studentId });
      const response = await api.patch(`/students/${studentId}/instructor`, {
        instructorId: null
      });
      
      console.log('Student unassigned successfully:', response.data);
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

  // Note: MOA creation and update are handled through the document upload system

  // Approve MOA
  async approveMOA(id: string, notes?: string): Promise<ApproveMOAResult> {
    return companyService.approveMOA(id, notes);
  }

  // Reject MOA
  async rejectMOA(id: string, reason: string): Promise<MOA> {
    return companyService.rejectMOA(id, reason);
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
