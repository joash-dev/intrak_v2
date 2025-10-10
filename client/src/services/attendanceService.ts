import api from './api';

export interface AttendanceLog {
  id: string;
  studentId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  durationMinutes: number;
  verified: boolean;
  verificationMethod: 'QR' | 'GPS' | 'MANUAL';
  verificationMetadata?: any;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeData {
  token: string;
  qrCode: string;
  expiresAt: string;
}

export interface AttendanceStats {
  totalHours: number;
  completedHours: number;
  verifiedDays: number;
  pendingDays: number;
  avgHoursPerDay: number;
}

class AttendanceService {
  // Get student's attendance logs
  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    const response = await api.get('/attendance?studentId=me');
    console.log('Attendance API response:', response.data);
    // Handle different response formats from server
    const logs = response.data.logs || response.data.attendance || response.data || [];
    console.log('Processed attendance logs:', logs);
    return Array.isArray(logs) ? logs : [];
  }

  // Generate QR code for attendance
  async generateQRCode(): Promise<QRCodeData> {
    const response = await api.get('/attendance/qr/me');
    return response.data;
  }

  // Log manual attendance
  async logAttendance(data: {
    date: string;
    timeIn?: string;
    timeOut?: string;
    action: 'time-in' | 'time-out';
    remarks?: string;
  }): Promise<AttendanceLog> {
    const response = await api.post('/attendance/log', data);
    return response.data.log;
  }

  // Check if student has time-in for today
  async checkTimeInStatus(date: string): Promise<boolean> {
    try {
      const logs = await this.getAttendanceLogs();
      const todayLog = logs.find(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate === date && log.timeIn && !log.timeOut;
      });
      return !!todayLog;
    } catch (error) {
      console.error('Error checking time-in status:', error);
      return false;
    }
  }

  // Calculate attendance stats
  calculateStats(logs: AttendanceLog[]): AttendanceStats {
    if (!logs || !Array.isArray(logs)) {
      return {
        totalHours: 0,
        completedHours: 0,
        verifiedDays: 0,
        pendingDays: 0,
        avgHoursPerDay: 0,
      };
    }

    const totalHours = logs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60;
    const completedHours = logs
      .filter(log => log.verified)
      .reduce((sum, log) => sum + log.durationMinutes, 0) / 60;
    const verifiedDays = logs.filter(log => log.verified).length;
    const pendingDays = logs.filter(log => !log.verified).length;
    const avgHoursPerDay = logs.length > 0 ? totalHours / logs.length : 0;

    return {
      totalHours,
      completedHours,
      verifiedDays,
      pendingDays,
      avgHoursPerDay,
    };
  }

  // Format duration for display
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  // Format time for display
  formatTime(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Get attendance logs for coordinator view (all students)
  async getCoordinatorAttendanceLogs(date?: string): Promise<{ logs: AttendanceLog[] }> {
    const params = new URLSearchParams();
    if (date) {
      params.append('dateFrom', date);
      params.append('dateTo', date);
    }
    
    const response = await api.get(`/attendance?${params.toString()}`);
    return response.data;
  }

  // Verify attendance (for coordinators/instructors)
  async verifyAttendance(logId: string, verified: boolean, remarks?: string): Promise<AttendanceLog> {
    const response = await api.put(`/attendance/${logId}/verify`, {
      verified,
      remarks
    });
    return response.data.log;
  }
}

export const attendanceService = new AttendanceService();
