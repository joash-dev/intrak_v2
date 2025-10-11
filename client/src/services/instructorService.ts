import api from './api';

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
  name: string;
  email: string;
  avatar: string;
  program: string;
  company: string;
  supervisor: string;
  startDate: string;
  endDate: string;
  attendanceRate: number;
  hoursCompleted: number;
  requiredHours: number;
  tasksCompleted: number;
  totalTasks: number;
  lastEvaluation: number;
  status: 'active' | 'at_risk' | 'completed';
  lastActivity: string;
  year: number;
  section?: string;
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
  studentId: string;
  studentName: string;
  studentAvatar: string;
  company: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  submittedDate: string;
  dueDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  description?: string;
  remarks?: string | null;
  reviewedDate?: string;
  fileSizeBytes?: number;
}

class InstructorService {
  // Get students assigned to current instructor
  async getAssignedStudents(): Promise<InstructorStudent[]> {
    try {
      console.log('Fetching assigned students for instructor...');
      
      // Fetch students assigned to current instructor
      const response = await api.get('/students/my-assigned');
      console.log('Assigned students API response:', response.data);
      
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
        tasksCompleted: student.tasksCompleted || 0,
        totalTasks: student.totalTasks || 20,
        lastEvaluation: student.lastEvaluation || 0,
        status: student.status || 'active',
        lastActivity: this.formatLastActivity(student.lastActivity),
        year: student.year || 0,
        section: student.section || '',
      }));
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      // Return empty array if API fails
      return [];
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
      console.log('Fetching recent activities for instructor...');
      const response = await api.get('/instructor/activities');
      console.log('Instructor activities API response:', response.data);
      
      const activities = response.data.activities || [];
      
      return activities.map((activity: any) => ({
        id: activity.id,
        studentName: activity.student?.user?.name || 'Unknown',
        action: activity.description || activity.action || 'Unknown action',
        type: this.mapActivityType(activity.type),
        timestamp: this.formatTimestamp(activity.createdAt || activity.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Return empty array if API fails
      return [];
    }
  }

  // Get alerts for instructor
  async getAlerts(): Promise<InstructorAlert[]> {
    try {
      console.log('Fetching alerts for instructor...');
      const response = await api.get('/instructor/alerts');
      console.log('Instructor alerts API response:', response.data);
      
      const alerts = response.data.alerts || [];
      
      return alerts.map((alert: any) => ({
        id: alert.id,
        type: alert.type || 'info',
        title: alert.title || 'Alert',
        message: alert.message || alert.description || 'No message',
        studentId: alert.studentId,
        timestamp: this.formatTimestamp(alert.createdAt || alert.timestamp),
        priority: alert.priority || 'medium',
      }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Return empty array if API fails
      return [];
    }
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
    
    const documentsPending = students.reduce((sum, s) => sum + (s.totalTasks - s.tasksCompleted), 0);
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


  // Helper method to map activity type
  private mapActivityType(type: string): 'submission' | 'attendance' | 'task' | 'evaluation' {
    switch (type?.toLowerCase()) {
      case 'document':
      case 'submission':
      case 'upload':
        return 'submission';
      case 'attendance':
      case 'checkin':
      case 'checkout':
        return 'attendance';
      case 'task':
      case 'assignment':
      case 'project':
        return 'task';
      case 'evaluation':
      case 'assessment':
      case 'rating':
        return 'evaluation';
      default:
        return 'submission';
    }
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

  // Get documents from assigned students for review
  async getDocumentsForReview(): Promise<InstructorDocument[]> {
    try {
      console.log('Fetching documents for instructor review...');
      const response = await api.get('/documents');
      console.log('Instructor documents API response:', response.data);
      
      const documents = response.data.documents || [];
      
      // Transform the API response to match InstructorDocument interface
      return documents.map((doc: any) => ({
        id: doc.id,
        studentId: doc.student?.id || '',
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
      console.log('Approving document:', documentId);
      const response = await api.put(`/documents/${documentId}/approve`, { remarks });
      console.log('Document approved successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Error approving document:', error);
      return false;
    }
  }

  // Reject a document
  async rejectDocument(documentId: string, remarks?: string): Promise<boolean> {
    try {
      console.log('Rejecting document:', documentId);
      const response = await api.put(`/documents/${documentId}/reject`, { remarks });
      console.log('Document rejected successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Error rejecting document:', error);
      return false;
    }
  }

  // Download a document
  async downloadDocument(documentId: string): Promise<Blob | null> {
    try {
      console.log('Downloading document:', documentId);
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
}

export const instructorService = new InstructorService();
