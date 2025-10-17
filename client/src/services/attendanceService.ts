import api from './api';
import { calculateAttendanceStats, formatDuration, formatAttendanceDate, formatAttendanceTime } from '../utils/attendanceCalculations';

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
    // Handle different response formats from server
    const logs = response.data.logs || response.data.attendance || response.data || [];
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

  // Calculate attendance stats using shared calculation logic
  async calculateStats(logs: AttendanceLog[]): Promise<AttendanceStats> {
    // Get the student's required hours from their profile
    let requiredHours = 240; // Default fallback
    try {
      const profileResponse = await api.get('/students/profile');
      requiredHours = profileResponse.data.totalHours || 240;
    } catch (error) {
      console.warn('Could not fetch student profile, using default 240 hours');
    }

    // Use shared calculation logic to ensure consistency
    const stats = calculateAttendanceStats(logs, requiredHours);
    
    // Return in the format expected by the student interface
    return {
      totalHours: stats.totalHours,
      completedHours: stats.completedHours,
      verifiedDays: stats.verifiedDays,
      pendingDays: stats.pendingDays,
      avgHoursPerDay: stats.avgHoursPerDay,
    };
  }

  // Format duration for display (using shared utility)
  formatDuration(minutes: number): string {
    return formatDuration(minutes);
  }

  // Format date for display (using shared utility)
  formatDate(dateString: string): string {
    return formatAttendanceDate(dateString);
  }

  // Format time for display (using shared utility)
  formatTime(dateString: string | null): string {
    return formatAttendanceTime(dateString);
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
