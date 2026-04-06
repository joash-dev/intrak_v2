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

export type AttendanceNoWorkReason =
  | 'TYPHOON'
  | 'NATURAL_DISASTER'
  | 'POWER_OUTAGE'
  | 'TRANSPORT_INTERRUPTED'
  | 'COMPANY_SUSPENDED'
  | 'OTHER';

export type AttendanceNoWorkStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AttendanceNoWorkNotice {
  id: string;
  studentId: string;
  dateKey: string;
  reason: AttendanceNoWorkReason;
  details: string | null;
  status: AttendanceNoWorkStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  supervisorRemarks: string | null;
  createdAt: string;
  updatedAt: string;
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
    date?: string;
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

  // Export DTR as PDF
  async exportDTR(options?: {
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    try {
      const params = new URLSearchParams();
      
      if (options?.month) params.append('month', options.month.toString());
      if (options?.year) params.append('year', options.year.toString());
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);

      const queryString = params.toString();
      const url = `/attendance/export-dtr/me${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(url, {
        responseType: 'blob'
      });

      // Create blob link to download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      
      // Generate filename
      const monthYear = options?.month && options?.year 
        ? `${options.year}-${options.month.toString().padStart(2, '0')}`
        : new Date().toISOString().split('T')[0];
      link.download = `Internship_TimeFrame_${monthYear}.pdf`;
      
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting DTR:', error);
      throw new Error('Failed to export DTR. Please try again.');
    }
  }

  // Export DTR as Word Document (DOCX)
  async exportDTRDocx(options?: {
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    try {
      const params = new URLSearchParams();
      
      if (options?.month) params.append('month', options.month.toString());
      if (options?.year) params.append('year', options.year.toString());
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);

      const queryString = params.toString();
      const url = `/attendance/export-dtr-docx/me${queryString ? `?${queryString}` : ''}`;

      try {
        const response = await api.get(url, {
          responseType: 'blob'
        });

        // Check if response is actually an error (JSON error response disguised as blob)
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          const text = await (response.data as Blob).text();
          const errorData = JSON.parse(text);
          console.error('Server returned JSON error:', errorData);
          throw new Error(errorData.message || errorData.details?.message || JSON.stringify(errorData.details) || 'Failed to export DTR document');
        }

        // Create blob link to download
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        
        // Generate filename
        const monthYear = options?.month && options?.year 
          ? `${options.year}-${options.month.toString().padStart(2, '0')}`
          : new Date().toISOString().split('T')[0];
        link.download = `Internship_TimeFrame_${monthYear}.docx`;
        
        link.click();
        window.URL.revokeObjectURL(link.href);
      } catch (axiosError: any) {
        // Handle axios errors - check if response is a blob that contains JSON error
        if (axiosError.response && axiosError.response.data) {
          const data = axiosError.response.data;
          
          // If it's a blob, try to extract JSON error
          if (data instanceof Blob) {
            try {
              const text = await data.text();
              // Check if it's JSON
              if (text.trim().startsWith('{')) {
                const errorData = JSON.parse(text);
                console.error('Server error (from blob):', errorData);
                console.error('Full error details:', JSON.stringify(errorData, null, 2));
                // Extract error message from details object
                let errorMsg = errorData.message || 'Failed to export DTR document';
                if (errorData.details) {
                  if (typeof errorData.details === 'string') {
                    errorMsg += `: ${errorData.details}`;
                  } else if (errorData.details.message) {
                    errorMsg += `: ${errorData.details.message}`;
                  } else {
                    errorMsg += `: ${JSON.stringify(errorData.details)}`;
                  }
                }
                throw new Error(errorMsg);
              }
            } catch (parseError) {
              // Not JSON, just a generic error
            }
          } else if (typeof data === 'object' && data.message) {
            // Direct JSON error
            console.error('Server error:', data);
            throw new Error(data.message || data.details?.message || 'Failed to export DTR document');
          }
        }
        
        // Re-throw if we haven't handled it
        throw axiosError;
      }
    } catch (error: any) {
      console.error('Error exporting DTR DOCX:', error);
      const errorMessage = error.message || 'Failed to export DTR document. Please check server logs for details.';
      throw new Error(errorMessage);
    }
  }

  // Update student's Saturday work preference
  async updateSaturdayPreference(studentId: string, worksOnSaturday: boolean): Promise<void> {
    try {
      await api.put(`/students/${studentId}/saturday-preference`, { worksOnSaturday });
    } catch (error: any) {
      console.error('Error updating Saturday preference:', error);
      throw new Error(error.response?.data?.message || 'Failed to update Saturday preference');
    }
  }

  async getMyNoWorkNotices(): Promise<AttendanceNoWorkNotice[]> {
    const response = await api.get('/attendance/no-work-notices/me');
    return response.data.notices ?? [];
  }

  async createNoWorkNotice(payload: {
    dateKey: string;
    reason: AttendanceNoWorkReason;
    details?: string;
  }): Promise<AttendanceNoWorkNotice> {
    const response = await api.post('/attendance/no-work-notices', payload);
    return response.data.notice;
  }

}

export const attendanceService = new AttendanceService();
