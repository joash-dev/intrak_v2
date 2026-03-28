import api from './api';
import { attendanceService, type AttendanceLog } from './attendanceService';

// Default data structure for loading states
const defaultDashboardData: DashboardData = {
  student: {
    id: "",
    name: "",
    email: "",
    studentNumber: "",
    program: "",
    year: 0,
    section: "",
    company: "",
    supervisor: "",
    totalHours: 0,
    completedHours: 0,
  },
  documents: [],
  attendance: [],
  evaluations: [],
  announcements: [],
};

// Types for API responses
export interface Student {
  id: string;
  name: string;
  email: string;
  studentNumber: string;
  program: string;
  year: number;
  section: string;
  company?: string;
  supervisor?: string;
  totalHours?: number;
  completedHours?: number;
  startDate?: string;
  endDate?: string;
}

export interface Document {
  id: string;
  type: string;
  filename: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  fileSize?: string;
  fileSizeMB?: string;
}

// AttendanceLog interface is imported from attendanceService

export interface Evaluation {
  id: string;
  evaluator: string;
  rating: number;
  type: string;
  date: string;
  comments?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DashboardData {
  student: Student;
  documents: Document[];
  attendance: AttendanceLog[];
  evaluations: Evaluation[];
  announcements: Announcement[];
}

// API Service Functions
export const dashboardService = {
  // Get current student profile
  async getStudentProfile(): Promise<Student> {
    const response = await api.get('/students/profile');
    return response.data;
  },

  // Get student documents
  async getStudentDocuments(): Promise<Document[]> {
    try {
      // IMPORTANT: Student dashboard must use the same source of truth as the Student Documents page.
      // `/documents` is paginated and may not match the student's full list.
      const response = await api.get('/documents/student');
      return response.data.documents || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  },

  // Get student attendance logs
  async getStudentAttendance(): Promise<AttendanceLog[]> {
    try {
      return await attendanceService.getAttendanceLogs();
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  },

  // Get student evaluations
  async getStudentEvaluations(): Promise<Evaluation[]> {
    try {
      const response = await api.get('/evaluations');
      const evaluations = response.data.evaluations || response.data || [];

      // Map backend format to frontend format
      const mappedEvaluations = evaluations.map((evaluation: any) => ({
        id: evaluation.id,
        evaluator: evaluation.evaluatorName || evaluation.evaluator || 'Unknown',
        rating: evaluation.overallRating || evaluation.rating || 0, // Map overallRating to rating
        type: evaluation.type || 'Mid-term',
        date: evaluation.date,
        comments: evaluation.comments
      }));


      return mappedEvaluations;
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      return [];
    }
  },

  // Get announcements
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await api.get('/announcements');
      const announcements = response.data.announcements || response.data || [];
      // Student dashboard should only see ALL + STUDENTS announcements
      return (announcements || []).filter((a: any) =>
        a?.audience === 'ALL' || a?.audience === 'STUDENTS'
      );
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  },

  // Get complete dashboard data
  async getDashboardData(): Promise<DashboardData> {
    try {
      const [student, documents, attendance, evaluations, announcements] = await Promise.allSettled([
        this.getStudentProfile(),
        this.getStudentDocuments(),
        this.getStudentAttendance(),
        this.getStudentEvaluations(),
        this.getAnnouncements(),
      ]);

      return {
        student: student.status === 'fulfilled' ? student.value : defaultDashboardData.student,
        documents: documents.status === 'fulfilled' ? documents.value : [],
        attendance: attendance.status === 'fulfilled' ? attendance.value : [],
        evaluations: evaluations.status === 'fulfilled' ? evaluations.value : [],
        announcements: announcements.status === 'fulfilled' ? announcements.value : [],
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Upload document
  async uploadDocument(file: File, type: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Log attendance
  async logAttendance(data: { timeIn: string; timeOut?: string; location?: string }): Promise<AttendanceLog> {
    const response = await api.post('/attendance/log', data);
    return response.data;
  },
};
