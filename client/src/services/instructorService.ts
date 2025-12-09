import api from './api';
import { calculateAttendanceStats } from '../utils/attendanceCalculations';
import { announcementService, type Announcement } from './announcementService';

// Types for instructor data
export interface InstructorStats {
  totalStudents: number;
  activeStudents: number;
  atRiskStudents: number;
  completedStudents: number;
  avgAttendance: number;
  avgRating: number;
  documentsPending: number;
  evaluationsPending: number;
}

export interface InstructorStudent {
  id: string;
  studentId: string;
  studentNumber: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  program: string;
  company: string;
  supervisor: string;
  supervisorEmail?: string;
  startDate: string;
  endDate: string;
  attendanceRate: number;
  hoursCompleted: number;
  requiredHours: number;
  lastEvaluation: number;
  status: 'active' | 'warning' | 'at_risk' | 'completed';
  lastActivity: string;
  year: number;
  section?: string;
  documentsPending?: number;
  attendanceAlerts?: number;
  attendanceGapDays?: number;
  lastAttendanceDate?: string | null;
  worksOnSaturday?: boolean;
  companyType?: 'PUBLIC' | 'PRIVATE';
}

export interface InstructorActivity {
  id: string;
  studentName: string;
  action: string;
  type: 'submission' | 'attendance' | 'task' | 'evaluation';
  timestamp: string;
}

export interface InstructorAlert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  message: string;
  studentId?: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InstructorDocument {
  id: string;
  studentId: string; // UUID
  studentNumber: string; // Display ID
  studentName: string;
  studentAvatar: string;
  company: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  submittedDate: string;
  dueDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED';
  description?: string;
  remarks?: string | null;
  reviewedDate?: string;
  fileSizeBytes?: number;
}

class InstructorService {
  // Get students assigned to the current instructor
  async getAssignedStudents(): Promise<InstructorStudent[]> {
    try {
      // Fetch only students assigned to the current instructor
      const response = await api.get('/students/my-assigned');

      const students = response.data.students || [];

      // Transform the API response to match InstructorStudent interface
      return students.map((student: any) => ({
        id: student.id,
        studentId: student.studentNumber,
        name: student.user?.name || 'Unknown',
        email: student.user?.email || '',
        avatar: this.generateAvatar(student.user?.name || 'Unknown'),
        program: student.program || 'BS Computer Engineering',
        company: student.company?.name || 'No Company',
        supervisor: student.supervisorName || 'No Supervisor',
        startDate: student.startDate || '',
        endDate: student.endDate || '',
        attendanceRate: student.attendanceRate || 0,
        hoursCompleted: student.completedHours || 0,
        requiredHours: student.totalHours || 240,
        lastEvaluation: student.lastEvaluation || 0,
        status: this.mapStudentStatus(student),
        lastActivity: this.formatLastActivity(student.lastActivity),
        year: student.year || 0,
        section: student.section || '',
        attendanceGapDays: student.attendanceGapDays ?? 0,
        lastAttendanceDate: student.lastAttendanceDate || null,
      }));
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      // Return empty array if API fails
      return [];
    }
  }

  // Get student attendance data
  async getStudentAttendance(studentId?: string): Promise<any[]> {
    try {
      console.log('Fetching attendance data...');

      const params = studentId ? { studentId } : {};
      const response = await api.get('/attendance', { params });
      console.log('Attendance API response:', response.data);

      return response.data.logs || response.data.attendance || [];
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      return [];
    }
  }

  // Get student attendance statistics (using shared calculation logic)
  async getStudentAttendanceStats(studentId: string): Promise<any> {
    try {
      console.log('Fetching attendance stats for student:', studentId);

      // Get attendance logs for the student
      const logs = await this.getStudentAttendance(studentId);

      // Get student profile to get required hours
      let requiredHours = 240; // Default fallback
      try {
        const profileResponse = await api.get(`/students/${studentId}`);
        requiredHours = profileResponse.data.totalHours || 240;
      } catch (error) {
        console.warn('Could not fetch student profile, using default 240 hours');
      }

      // Use shared calculation logic to ensure consistency
      return calculateAttendanceStats(logs, requiredHours);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      return calculateAttendanceStats([], 240); // Return default stats
    }
  }

  // Get instructor dashboard statistics
  async getDashboardStats(): Promise<InstructorStats> {
    try {
      // Get students first, then calculate stats
      const students = await this.getAssignedStudents();
      return this.calculateStatsFromStudents(students);
    } catch (error) {
      console.error('Error fetching instructor stats:', error);
      // Return default stats if API fails
      return {
        totalStudents: 0,
        activeStudents: 0,
        atRiskStudents: 0,
        completedStudents: 0,
        avgAttendance: 0,
        avgRating: 0,
        documentsPending: 0,
        evaluationsPending: 0,
      };
    }
  }

  // Get recent activities for instructor's students
  async getRecentActivities(): Promise<InstructorActivity[]> {
    try {

      const activities: InstructorActivity[] = [];

      // Get assigned students
      const students = await this.getAssignedStudents();

      // Fetch recent document submissions (backend will automatically filter by instructor's assigned students)
      try {
        const documentsResponse = await api.get('/documents', {
          params: { limit: 10 }
        });
        const recentDocuments = documentsResponse.data.documents || [];

        for (const doc of recentDocuments) {
          const student = students.find(s => s.id === doc.studentId);
          if (student) {
            activities.push({
              id: `doc-${doc.id}`,
              studentName: student.name,
              action: `Submitted ${this.getDocumentTypeDisplay(doc.type)}`,
              type: 'submission',
              timestamp: doc.uploadedAt || doc.createdAt
            });
          }
        }
      } catch (docError) {
        console.warn('Could not fetch documents for activities:', docError);
      }

      // Fetch recent attendance logs and filter by assigned students
      try {
        const attendanceResponse = await api.get('/attendance', {
          params: { limit: 50 } // Get more to filter by assigned students
        });
        const allAttendance = attendanceResponse.data.logs || [];

        // Filter to only include attendance from assigned students
        const assignedStudentIds = students.map(s => s.id);
        const recentAttendance = allAttendance
          .filter((log: any) => assignedStudentIds.includes(log.studentId))
          .slice(0, 10);

        for (const log of recentAttendance) {
          const student = students.find(s => s.id === log.studentId);
          if (student) {
            const action = log.timeIn && log.timeOut
              ? 'Completed attendance session'
              : log.timeIn
                ? 'Checked in for attendance'
                : 'Checked out from attendance';

            activities.push({
              id: `att-${log.id}`,
              studentName: student.name,
              action: action,
              type: 'attendance',
              timestamp: log.timeIn || log.createdAt
            });
          }
        }
      } catch (attError) {
        console.warn('Could not fetch attendance for activities:', attError);
      }

      // Fetch instructor activities from audit logs (evaluations, assignments, etc.)
      try {
        const auditResponse = await api.get('/audit');
        const logs = auditResponse.data.logs || [];

        // Only keep logs related to our assigned students or global system actions
        const assignedNames = new Set(students.map(s => s.name));
        const relevant = logs.filter((log: any) => {
          const studentName = log.meta?.studentName || log.meta?.name || '';
          return assignedNames.has(studentName) ||
            ['USER_REGISTERED', 'STUDENT_AUTO_ASSIGNED', 'EVALUATION_SUBMITTED', 'COMPANY_ADDED'].includes(log.action);
        }).slice(0, 20);

        for (const log of relevant) {
          if (log.action === 'USER_REGISTERED' && log.meta?.role === 'STUDENT') {
            activities.push({
              id: `inst-${log.id}`,
              studentName: 'System',
              action: `Added new student: ${log.meta.email}`,
              type: 'evaluation', // Using evaluation type for instructor actions
              timestamp: log.createdAt
            });
          } else if (log.action === 'STUDENT_AUTO_ASSIGNED') {
            activities.push({
              id: `assign-${log.id}`,
              studentName: 'System',
              action: `Assigned student to instructor`,
              type: 'evaluation', // Using evaluation type for instructor actions
              timestamp: log.createdAt
            });
          } else if (log.action === 'EVALUATION_SUBMITTED') {
            const studentName = log.meta?.studentName || 'Student';
            activities.push({
              id: `eval-${log.id}`,
              studentName,
              action: `Evaluation submitted`,
              type: 'evaluation',
              timestamp: log.createdAt
            });
          } else if (log.action === 'COMPANY_ADDED') {
            activities.push({
              id: `company-${log.id}`,
              studentName: 'System',
              action: `New company added`,
              type: 'task',
              timestamp: log.createdAt
            });
          }
        }
      } catch (auditError) {
        console.warn('Could not fetch audit logs for instructor activities:', auditError);
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Return only the 10 most recent activities
      return activities.slice(0, 10);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Return empty array if API fails
      return [];
    }
  }

  // Helper method to get document type display name
  private getDocumentTypeDisplay(type: string): string {
    const typeMap: Record<string, string> = {
      'weekly_report': 'Weekly Report',
      'monthly_timesheet': 'Monthly Timesheet',
      'accomplishment_report': 'Accomplishment Report',
      'final_report': 'Final Report',
      'timesheet': 'Timesheet',
      'report': 'Report',
      'document': 'Document'
    };

    return typeMap[type?.toLowerCase()] || type || 'Document';
  }

  // Get announcements for instructor
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      // Get announcements targeted at instructors or all users
      const response = await announcementService.getAnnouncements();
      const allAnnouncements = response.announcements;

      // Filter announcements that are relevant to instructors
      const instructorAnnouncements = allAnnouncements.filter(announcement =>
        announcement.audience === 'ALL' ||
        announcement.audience === 'INSTRUCTORS' ||
        announcement.audience === 'COORDINATORS' // Instructors might also want to see coordinator announcements
      );

      // Transform announcements for display
      const transformedAnnouncements = instructorAnnouncements.map(announcement =>
        announcementService.transformAnnouncement(announcement)
      );

      return transformedAnnouncements;
    } catch (error) {
      console.error('Error fetching announcements for instructor:', error);
      // Return empty array if API fails
      return [];
    }
  }

  // Track announcement view for instructor
  async trackAnnouncementView(announcementId: string): Promise<void> {
    try {
      await announcementService.trackView(announcementId);
    } catch (error) {
      console.warn('Failed to track announcement view:', error);
    }
  }

  // Get alerts for instructor
  async getAlerts(): Promise<InstructorAlert[]> {
    try {
      console.log('Fetching alerts for instructor...');

      // TODO: Implement actual alerts system based on:
      // - Students with low attendance
      // - Pending document reviews
      // - Students at risk
      // - Overdue evaluations

      console.log('No alerts endpoint available yet');
      return [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Return empty array if API fails
      return [];
    }
  }

  // Map student status from detailed status to simple status
  private mapStudentStatus(student: any): 'active' | 'warning' | 'at_risk' | 'completed' {
    const completionPercentage =
      student.totalHours > 0 ? (student.completedHours / student.totalHours) * 100 : 0;
    const attendanceGapDays = student.attendanceGapDays ?? 0;
    const startDate = student.startDate ? new Date(student.startDate) : null;
    const today = new Date();

    // If no start date yet or start date in the future, student should be active
    if (!startDate || startDate > today) {
      return 'active';
    }

    if (completionPercentage >= 100 && student.attendanceRate >= 75) {
      return 'completed';
    }

    if (attendanceGapDays >= 5) {
      return 'at_risk';
    }

    if (attendanceGapDays >= 3) {
      return 'warning';
    }

    // Default to active unless explicit risk indicators are provided
    return 'active';
  }

  // Calculate stats from student data
  private calculateStatsFromStudents(students: InstructorStudent[]): InstructorStats {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const atRiskStudents = students.filter(s => s.status === 'at_risk').length;
    const completedStudents = students.filter(s => s.status === 'completed').length;

    const avgAttendance = totalStudents > 0
      ? students.reduce((sum, s) => sum + s.attendanceRate, 0) / totalStudents
      : 0;

    const studentsWithEvaluations = students.filter(s => s.lastEvaluation > 0);
    const avgRating = studentsWithEvaluations.length > 0
      ? studentsWithEvaluations.reduce((sum, s) => sum + s.lastEvaluation, 0) / studentsWithEvaluations.length
      : 0;

    const documentsPending = 0; // Task tracking removed
    const evaluationsPending = students.filter(s => s.lastEvaluation === 0).length;

    return {
      totalStudents,
      activeStudents,
      atRiskStudents,
      completedStudents,
      avgAttendance: Math.round(avgAttendance * 10) / 10,
      avgRating: Math.round(avgRating * 10) / 10,
      documentsPending,
      evaluationsPending,
    };
  }



  // Helper method to format last activity
  private formatLastActivity(lastActivity: string | Date | null): string {
    if (!lastActivity) return 'No recent activity';

    const date = new Date(lastActivity);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  // Helper method to format timestamp
  private formatTimestamp(timestamp: string | Date | null): string {
    if (!timestamp) return 'Unknown';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
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

  // Get student details for evaluation
  async getStudentDetails(studentId: string): Promise<InstructorStudent | null> {
    try {
      const students = await this.getAssignedStudents();
      return students.find(s => s.id === studentId) || null;
    } catch (error) {
      console.error('Error fetching student details:', error);
      return null;
    }
  }

  // Submit student evaluation
  async submitEvaluation(studentId: string, evaluationData: {
    rating: number;
    comments: string;
    criteria: Record<string, number>;
  }): Promise<boolean> {
    try {
      console.log('Submitting evaluation for student:', studentId);
      const response = await api.post('/evaluations', {
        studentId,
        ...evaluationData
      });

      console.log('Evaluation submitted successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      return false;
    }
  }

  // Get evaluation history for a student
  async getStudentEvaluationHistory(studentId: string): Promise<any[]> {
    try {
      const response = await api.get(`/evaluations/student/${studentId}`);
      return response.data.evaluations || [];
    } catch (error) {
      console.error('Error fetching evaluation history:', error);
      return [];
    }
  }

  // Get all instructors (for assignment purposes)
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
    } catch (error: any) {
      console.error('Error assigning student to instructor:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to assign student to instructor';
      throw new Error(errorMessage);
    }
  }

  // Bulk assign students to instructor
  async bulkAssignStudentsToInstructor(studentIds: string[], instructorId: string): Promise<boolean> {
    try {
      console.log('Bulk assigning students to instructor:', { studentIds, instructorId });
      const response = await api.patch('/students/bulk-assign-instructor', {
        studentIds,
        instructorId
      });

      console.log('Students bulk assigned successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Error bulk assigning students to instructor:', error);
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

  // Get documents for review from assigned students only
  async getDocumentsForReview(): Promise<InstructorDocument[]> {
    try {
      // First get assigned students
      const assignedStudents = await this.getAssignedStudents();
      const assignedStudentIds = assignedStudents.map(s => s.id);

      if (assignedStudentIds.length === 0) {
        return [];
      }

      // Fetch documents (backend will automatically filter by instructor's assigned students)
      const response = await api.get('/documents');

      const documents = response.data.documents || [];

      // Transform the API response to match InstructorDocument interface
      return documents.map((doc: any) => ({
        id: doc.id,
        studentId: doc.student?.id || '',
        studentNumber: doc.student?.studentNumber || '',
        studentName: doc.student?.user?.name || 'Unknown',
        studentAvatar: this.generateAvatar(doc.student?.user?.name || 'Unknown'),
        company: doc.student?.company?.name || 'No Company',
        documentType: this.mapDocumentType(doc.type),
        fileName: doc.filename || 'Unknown File',
        fileSize: this.formatFileSize(doc.fileSize || 0),
        fileSizeBytes: doc.fileSize || 0,
        submittedDate: this.formatTimestamp(doc.uploadedAt),
        dueDate: doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : undefined,
        status: doc.status || 'PENDING',
        description: doc.description || '',
        remarks: doc.remarks || null,
        reviewedDate: doc.reviewedAt ? this.formatTimestamp(doc.reviewedAt) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching documents for review:', error);
      // Return empty array if API fails
      return [];
    }
  }

  // Approve a document
  async approveDocument(documentId: string, remarks?: string): Promise<boolean> {
    try {
      await api.put(`/documents/${documentId}/approve`, { remarks });
      return true;
    } catch (error) {
      console.error('Error approving document:', error);
      return false;
    }
  }

  // Reject a document
  async rejectDocument(documentId: string, remarks?: string): Promise<boolean> {
    try {
      await api.put(`/documents/${documentId}/reject`, { remarks });
      return true;
    } catch (error) {
      console.error('Error rejecting document:', error);
      return false;
    }
  }

  // Download a document
  async downloadDocument(documentId: string): Promise<Blob | null> {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading document:', error);
      return null;
    }
  }

  // Preview a document (get document details)
  async getDocumentDetails(documentId: string): Promise<InstructorDocument | null> {
    try {
      console.log('Getting document details:', documentId);
      const response = await api.get(`/documents/${documentId}`);
      const doc = response.data.document;

      if (!doc) return null;

      return {
        id: doc.id,
        studentId: doc.student?.id || '',
        studentNumber: doc.student?.studentNumber || '',
        studentName: doc.student?.user?.name || 'Unknown',
        studentAvatar: this.generateAvatar(doc.student?.user?.name || 'Unknown'),
        company: doc.student?.company?.name || 'No Company',
        documentType: this.mapDocumentType(doc.type),
        fileName: doc.filename || 'Unknown File',
        fileSize: this.formatFileSize(doc.fileSize || 0),
        fileSizeBytes: doc.fileSize || 0,
        submittedDate: this.formatTimestamp(doc.uploadedAt),
        dueDate: doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : undefined,
        status: doc.status || 'PENDING',
        description: doc.description || '',
        remarks: doc.remarks || null,
        reviewedDate: doc.reviewedAt ? this.formatTimestamp(doc.reviewedAt) : undefined,
      };
    } catch (error) {
      console.error('Error getting document details:', error);
      return null;
    }
  }

  // Helper method to map document type
  private mapDocumentType(type: string): string {
    const typeMap: Record<string, string> = {
      'weekly_report': 'Weekly Report',
      'monthly_timesheet': 'Monthly Timesheet',
      'accomplishment_report': 'Accomplishment Report',
      'final_report': 'Final Report',
      'timesheet': 'Timesheet',
      'report': 'Report',
      'document': 'Document',
    };

    return typeMap[type?.toLowerCase()] || type || 'Document';
  }

  // Helper method to format file size
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Student Management Methods
  async createStudent(studentData: {
    studentNumber: string;
    name: string;
    email: string;
    phone: string;
    program: string;
    year: string;
  }): Promise<any> {
    let userId: string | null = null;

    try {
      console.log('Creating student with data:', studentData);

      // Check for student number conflicts before creating user account
      console.log('Checking for existing student number...');
      const studentExists = await this.checkStudentExists(studentData.studentNumber);
      if (studentExists) {
        throw new Error(`Student number "${studentData.studentNumber}" is already in use. Please use a different student number.`);
      }

      // Generate secure password for the student
      const generatedPassword = this.generateStudentPassword(studentData.studentNumber, studentData.name);
      console.log('Generated password for student:', generatedPassword);

      // First, create a user account using the register endpoint
      console.log('Creating user account...');
      let userResponse;
      try {
        userResponse = await api.post('/auth/register', {
          name: studentData.name,
          email: studentData.email,
          role: 'STUDENT',
          password: generatedPassword
        });
        console.log('User created successfully:', userResponse.data);
        userId = userResponse.data.user.id;
      } catch (userError: any) {
        console.error('Error creating user account:', userError);
        if (userError.response?.status === 400 && userError.response?.data?.message?.includes('Email already exists')) {
          throw new Error(`A user with email "${studentData.email}" already exists. Please use a different email address.`);
        }
        throw userError;
      }

      // Convert year string to integer
      const yearNumber = parseInt(studentData.year.toString().replace(/\D/g, '')) || 4;

      // Then create the student record
      console.log('Creating student record...');
      let studentResponse;
      try {
        studentResponse = await api.post('/students', {
          userId: userId,
          studentNumber: studentData.studentNumber,
          program: studentData.program,
          year: yearNumber,
          section: 'A', // Default section
          companyId: null, // Students will choose their company later
          supervisorName: '', // Students will fill this later
          startDate: null, // Students will fill this later
          endDate: null, // Students will fill this later
          totalHours: 240 // Default hours
        });
      } catch (studentError: any) {
        console.error('Error creating student record:', studentError);

        // Clean up the user account that was created
        if (userId) {
          console.log('Cleaning up created user account due to student creation failure...');
          try {
            await api.delete(`/users/${userId}`);
            console.log('User account cleaned up successfully');

            // Verify the user was actually deleted
            const userStillExists = await this.checkUserExists(studentData.email);
            if (userStillExists) {
              console.error('WARNING: User still exists after cleanup attempt!');
            } else {
              console.log('Verification: User successfully deleted from database');
            }
          } catch (cleanupError) {
            console.error('Failed to cleanup user account:', cleanupError);
          }
        }

        if (studentError.response?.status === 400 && studentError.response?.data?.message?.includes('Student with number')) {
          throw new Error(`Student number "${studentData.studentNumber}" is already in use. Please use a different student number.`);
        }
        throw studentError;
      }

      console.log('Student created successfully:', studentResponse.data);

      // Send welcome email to student
      let emailSent = false;
      try {
        await api.post('/email/welcome', {
          studentEmail: studentData.email,
          studentName: studentData.name,
          studentNumber: studentData.studentNumber,
          temporaryPassword: generatedPassword
        });
        emailSent = true;
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
      }

      return {
        student: studentResponse.data.student,
        emailSent: emailSent,
        name: studentData.name,
        email: studentData.email,
        studentNumber: studentData.studentNumber
      };
    } catch (error: any) {
      console.error('Error creating student:', error);

      // Provide more specific error messages with debugging information
      console.error('Student creation error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      if (error.response?.status === 400) {
        const errorMsg = error.response.data?.message || 'Validation error';
        console.error('Backend validation error:', errorMsg);

        if (errorMsg.includes('Email already exists')) {
          throw new Error(`A user with email "${studentData.email}" already exists. Please use a different email address.`);
        } else if (errorMsg.includes('Student with number')) {
          throw new Error(`Student number "${studentData.studentNumber}" is already in use. Please use a different student number.`);
        } else if (errorMsg.includes('User already has a student record')) {
          throw new Error(`A student record already exists for this user. Please check the existing records.`);
        } else {
          throw new Error(`Validation error: ${errorMsg}`);
        }
      } else if (error.response?.status === 401) {
        throw new Error('Authentication error. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Permission denied. You do not have permission to create students.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred. Please try again later.');
      }

      throw error;
    }
  }

  // Helper method to check if user exists in database
  async checkUserExists(email: string): Promise<boolean> {
    try {
      console.log(`Checking if user with email ${email} exists...`);
      const response = await api.get(`/users?email=${email}`);
      const exists = response.data.users && response.data.users.length > 0;
      console.log(`User ${email} exists:`, exists);
      return exists;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Helper method to check if student exists in database
  async checkStudentExists(studentNumber: string): Promise<boolean> {
    try {
      console.log(`Checking if student with number ${studentNumber} exists...`);
      const response = await api.get('/students');
      if (response.data.students) {
        const exists = response.data.students.some((student: any) => student.studentNumber === studentNumber);
        console.log(`Student ${studentNumber} exists:`, exists);
        return exists;
      }
      return false;
    } catch (error) {
      console.error('Error checking student existence:', error);
      return false;
    }
  }

  // Helper method to generate student password
  private generateStudentPassword(studentNumber: string, name: string): string {
    // Generate a secure password based on student number and name
    const namePart = name.split(' ')[0].toLowerCase().substring(0, 3);
    const numberPart = studentNumber.replace(/-/g, '').substring(0, 4);
    const randomPart = Math.random().toString(36).substring(2, 6);
    return `${namePart}${numberPart}${randomPart}@`;
  }

  async updateStudent(studentId: string, studentData: Partial<InstructorStudent>): Promise<boolean> {
    try {
      await api.put(`/students/${studentId}`, studentData);
      return true;
    } catch (error) {
      console.error('Error updating student:', error);
      return false;
    }
  }

  async deleteStudent(studentId: string): Promise<boolean> {
    try {
      await api.delete(`/students/${studentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  // Bulk create students (client-side loop to work with existing API)
  async bulkCreateStudents(rows: Array<{
    studentNumber: string;
    name: string;
    email: string;
    phone?: string;
    year: string | number;
    program?: string;
  }>): Promise<{ success: number; failed: number; errors: Array<{ row: any; error: string }> }> {
    const errors: Array<{ row: any; error: string }> = [];
    let success = 0;

    for (const row of rows) {
      try {
        await this.createStudent({
          studentNumber: row.studentNumber,
          name: row.name,
          email: row.email,
          phone: row.phone || '',
          program: row.program || 'BS Computer Engineering',
          year: String(row.year),
        });
        success += 1;
      } catch (e: any) {
        errors.push({ row, error: e?.message || 'Unknown error' });
      }
    }
    return { success, failed: errors.length, errors };
  }
}

export const instructorService = new InstructorService();
