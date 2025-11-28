import api from './api';

// Interfaces
export interface SupervisorStudent {
  id: string;
  studentId: string;
  studentNumber: string;
  name: string;
  email: string;
  program: string;
  year: number;
  section: string;
  startDate: string | null;
  endDate: string | null;
  totalHours: number;
  completedHours: number;
  attendanceRate: number;
  tasksCompleted?: number;
  totalTasks?: number;
  lastEvaluation?: {
    date: string;
    overallRating: number;
  };
  status: 'active' | 'needs_attention' | 'completed';
  lastActivity?: string;
  pendingApprovals?: number;
  hasSupervisorFeedback?: boolean;
}

export interface AttendanceLog {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  durationMinutes: number;
  method: string;
  location?: string;
  coordinates?: string;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  remarks: string | null;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  filename: string;
  mimeType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  remarks: string | null;
}

export interface CompetencyEvaluation {
  rating: number;
  remarks: string;
}

export interface TerminationData {
  lackOfWork?: boolean;
  violationRules?: boolean;
  unfavorableHabits?: boolean;
  altercation?: boolean;
  absencesTardiness?: boolean;
  disrespectful?: boolean;
  noInterest?: boolean;
  other?: boolean;
  otherSpecify?: string;
  futureEmployment?: boolean;
  needsImprovement?: boolean;
}

export interface InternshipEvaluationData {
  studentId: string;
  competencies: Record<string, CompetencyEvaluation>;
  overallComments?: string;
  evaluatorName?: string;
  evaluatorPosition?: string;
  ojtGrade: number;
  termination?: TerminationData;
}

export interface EvaluationExportPayload extends InternshipEvaluationData {
  studentName: string;
  companyName: string;
  companyAddress?: string;
  dateStarted?: string | null;
  dateEnded?: string | null;
}

class SupervisorService {
  // Get students assigned to supervisor's company
  async getMyStudents(): Promise<SupervisorStudent[]> {
    try {
      const response = await api.get('/students/');

      // Transform the data to match our interface
      const students = response.data.students || response.data || [];

      return students.map((student: any) => ({
        id: student.id,
        studentId: student.studentNumber,
        studentNumber: student.studentNumber,
        name: student.user?.name || student.name || 'Unknown',
        email: student.user?.email || student.email || '',
        program: student.program,
        year: student.year,
        section: student.section,
        startDate: student.startDate,
        endDate: student.endDate,
        totalHours: student.totalHours,
        completedHours: student.completedHours || 0,
        attendanceRate: student.attendanceRate || 0,
        status: this.calculateStudentStatus(student),
        lastActivity: student.lastActivity,
        pendingApprovals: student.pendingApprovals || 0,
        lastEvaluation: student.evaluations?.[0]
          ? {
            date: student.evaluations[0].createdAt,
            overallRating: student.evaluations[0].rating || 0,
          }
          : undefined,
        hasSupervisorFeedback: !!(student.supervisorFeedbacks && student.supervisorFeedbacks.length > 0),
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  // Get attendance logs for review
  async getAttendanceLogs(filters?: {
    studentId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AttendanceLog[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const query = params.toString();
      const response = await api.get(`/attendance${query ? `?${query}` : ""}`);
      const logs = response.data.logs || response.data || [];

      return logs.map((log: any) => ({
        id: log.id,
        studentId: log.studentId,
        studentName: log.student?.user?.name || 'Unknown',
        studentNumber: log.student?.studentNumber || '',
        date: log.date,
        timeIn: log.timeIn,
        timeOut: log.timeOut,
        durationMinutes: log.durationMinutes || 0,
        method: log.verificationMethod || log.method || 'MANUAL',
        location: log.location,
        coordinates: log.latitude && log.longitude
          ? `${log.latitude}° N, ${log.longitude}° E`
          : undefined,
        status: log.verified ? 'approved' : 'pending',
        verified: log.verified,
        remarks: log.remarks,
        submittedAt: log.createdAt || log.date,
        approvedAt: log.verifiedAt,
        approvedBy: log.verifiedBy,
      }));
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
      throw error;
    }
  }

  // Approve attendance log
  async approveAttendance(logId: string, remarks?: string): Promise<void> {
    try {
      await api.put(`/attendance/${logId}/verify`, {
        verified: true,
        remarks: remarks || 'Approved by supervisor',
      });
    } catch (error) {
      console.error('Error approving attendance:', error);
      throw error;
    }
  }

  // Reject attendance log
  async rejectAttendance(logId: string, reason: string): Promise<void> {
    try {
      await api.put(`/attendance/${logId}/verify`, {
        verified: false,
        remarks: reason,
      });
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      throw error;
    }
  }

  // Get student documents
  async getStudentDocuments(studentId?: string): Promise<StudentDocument[]> {
    try {
      const url = studentId ? `/documents?studentId=${studentId}` : '/documents';
      const response = await api.get(url);
      const documents = response.data.documents || response.data || [];

      return documents.map((doc: any) => ({
        id: doc.id,
        studentId: doc.studentId,
        studentName: doc.student?.user?.name || 'Unknown',
        type: doc.type,
        filename: doc.filename,
        mimeType: doc.mimeType,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        remarks: doc.remarks,
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  // Download document
  async downloadDocument(documentId: string): Promise<void> {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);

      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/i);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  // Submit evaluation for a student
  async submitEvaluation(data: InternshipEvaluationData): Promise<void> {
    try {
      const ratings = Object.values(data.competencies).map(
        (entry) => entry.rating
      );
      const overallRating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : 0;

      await api.post('/evaluations', {
        studentId: data.studentId,
        formType: 'internship_official',
        overallRating,
        competencies: data.competencies,
        overallComments: data.overallComments,
        evaluatorName: data.evaluatorName,
        evaluatorPosition: data.evaluatorPosition,
        ojtGrade: data.ojtGrade,
      });
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      throw error;
    }
  }

  async exportEvaluation(payload: EvaluationExportPayload): Promise<void> {
    try {
      // Include studentId in payload for PDF generation
      const exportPayload = {
        ...payload,
        studentId: payload.studentId,
      };

      const response = await api.post('/evaluations/export', exportPayload, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type:
          response.headers['content-type'] ||
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'];
      let filename = `InternshipEvaluation_${payload.studentName.replace(
        /[^a-z0-9]/gi,
        '_'
      )}.docx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/i);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting evaluation:', error);
      throw error;
    }
  }

  // Get evaluations history
  async getEvaluations(studentId?: string): Promise<any[]> {
    try {
      const url = studentId ? `/evaluations?studentId=${studentId}` : '/evaluations';
      const response = await api.get(url);
      return response.data.evaluations || response.data || [];
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      throw error;
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<any> {
    try {
      const students = await this.getMyStudents();
      const attendanceLogs = await this.getAttendanceLogs({ status: 'pending' });

      const activeStudents = students.filter(s => s.status === 'active').length;
      const pendingApprovals = attendanceLogs.filter(l => l.status === 'pending').length;
      const avgAttendance = students.length > 0
        ? students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length
        : 0;

      return {
        totalInterns: students.length,
        activeInterns: activeStudents,
        pendingApprovals,
        avgAttendance: avgAttendance.toFixed(1),
        students,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Helper: Calculate student status
  private calculateStudentStatus(student: any): 'active' | 'needs_attention' | 'completed' {
    if (student.completedHours >= student.totalHours) {
      return 'completed';
    }

    const attendanceRate = student.attendanceRate || 0;
    if (attendanceRate < 85) {
      return 'needs_attention';
    }

    return 'active';
  }

  // Record QR scan for attendance
  async recordQRAttendance(qrData: {
    studentId: string;
    action: 'time-in' | 'time-out';
    location?: string;
  }): Promise<void> {
    try {
      await api.post('/attendance/log', {
        studentId: qrData.studentId,
        method: 'QR',
        action: qrData.action,
        location: qrData.location || 'Company Office',
        timeIn: qrData.action === 'time-in' ? new Date().toISOString() : undefined,
        timeOut: qrData.action === 'time-out' ? new Date().toISOString() : undefined,
      });
    } catch (error) {
      console.error('Error recording QR attendance:', error);
      throw error;
    }
  }

  async verifyAttendanceWithQR(payload: {
    token: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ action: 'login' | 'logout'; log: any }> {
    try {
      const response = await api.post('/attendance/qr/verify', payload);
      return response.data;
    } catch (error) {
      console.error('Error verifying QR attendance:', error);
      throw error;
    }
  }

  // Submit supervisor feedback (Form 18)
  async submitSupervisorFeedback(data: {
    studentId: string;
    punctualRating: number;
    knowledgeRating: number;
    teamworkRating: number;
    taskPerformanceRating: number;
    policyComplianceRating: number;
    conductRating: number;
    traitsRating: number;
    comments?: string;
  }): Promise<void> {
    try {
      await api.post('/students/supervisor-feedback', data);
    } catch (error) {
      console.error('Error submitting supervisor feedback:', error);
      throw error;
    }
  }

  // Get supervisor feedback for a student
  async getSupervisorFeedback(studentId: string): Promise<any> {
    try {
      const response = await api.get(`/students/supervisor-feedback/${studentId}`);
      return response.data;
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return null; // No feedback exists yet
      }
      console.error('Error fetching supervisor feedback:', error);
      throw error;
    }
  }

  // Submit Form 19b - Agency Self Evaluation
  async submitAgencySelfEvaluation(data: {
    unitDivision?: string;
    age?: string;
    sex?: string;
    communicationConnectivity: number;
    communicationDialogue: number;
    communicationParticipation: number;
    ethicalReputation: number;
    ethicalCSR: number;
    ethicalSupport: number;
    psuSupervisorQualified: number;
    psuSupportActivities: number;
    psuFacilities: number;
    hteSupervision: number;
    hteSupervisorQualified: number;
    hteFeedback: number;
    qualityTimeliness: number;
    qualityObjectives: number;
    qualityResources: number;
  }): Promise<void> {
    try {
      await api.post('/students/agency-self-evaluation', data);
    } catch (error) {
      console.error('Error submitting agency self-evaluation:', error);
      throw error;
    }
  }

  // Get Form 19b - Agency Self Evaluation
  async getAgencySelfEvaluation(): Promise<any> {
    try {
      const response = await api.get('/students/agency-self-evaluation');
      return response.data;
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return null; // No evaluation exists yet
      }
      console.error('Error fetching agency self-evaluation:', error);
      throw error;
    }
  }

  // Export Form 19b - Agency Self Evaluation
  async exportAgencySelfEvaluation(): Promise<void> {
    try {
      const response = await api.get('/students/agency-self-evaluation/export', {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Form_19b_Agency_Self_Evaluation_${new Date().toISOString().split('T')[0]}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting agency self-evaluation:', error);
      throw error;
    }
  }

  // Export supervisor feedback as DOCX
  async exportSupervisorFeedback(studentId: string): Promise<void> {
    try {
      const response = await api.get(`/students/supervisor-feedback/export/${studentId}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Supervisor_Feedback_${studentId}.docx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/i);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting supervisor feedback:', error);
      throw error;
    }
  }
}

export const supervisorService = new SupervisorService();
