// Shared attendance calculation utilities to ensure consistency between student and instructor views

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

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  totalHours: number;
  completedHours: number;
  verifiedDays: number;
  pendingDays: number;
  avgHoursPerDay: number;
}

/**
 * Calculate attendance statistics using consistent logic
 * This ensures both student and instructor views show the same data
 */
export function calculateAttendanceStats(
  logs: AttendanceLog[],
  requiredHours: number = 240
): AttendanceStats {
  if (!logs || !Array.isArray(logs)) {
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      attendanceRate: 0,
      totalHours: requiredHours,
      completedHours: 0,
      verifiedDays: 0,
      pendingDays: 0,
      avgHoursPerDay: 0,
    };
  }

  // Calculate completed hours from verified logs only
  const verifiedLogs = logs.filter(log => log.verified);
  const completedHours = verifiedLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0) / 60;
  
  // Calculate attendance metrics
  const verifiedDays = verifiedLogs.length;
  const pendingDays = logs.filter(log => !log.verified).length;
  
  // Calculate attendance rate based on all logs (including unverified)
  const totalDays = logs.length;
  const presentDays = logs.filter(log => log.timeIn && log.timeOut).length;
  const absentDays = totalDays - presentDays;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  // Calculate average hours per day
  const avgHoursPerDay = logs.length > 0 ? completedHours / logs.length : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    attendanceRate,
    totalHours: requiredHours,
    completedHours: Math.round(completedHours),
    verifiedDays,
    pendingDays,
    avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
  };
}

/**
 * Calculate attendance trend based on recent vs older attendance patterns
 */
export function calculateAttendanceTrend(logs: AttendanceLog[]): "up" | "down" | "stable" {
  if (!logs || logs.length < 7) return "stable";
  
  // Get recent 7 days and previous 7 days
  const recentLogs = logs.slice(-7);
  const olderLogs = logs.slice(-14, -7);
  
  if (olderLogs.length === 0) return "stable";
  
  const recentPresentDays = recentLogs.filter(log => log.timeIn && log.timeOut).length;
  const olderPresentDays = olderLogs.filter(log => log.timeIn && log.timeOut).length;
  
  const recentRate = recentPresentDays / recentLogs.length * 100;
  const olderRate = olderPresentDays / olderLogs.length * 100;
  
  if (recentRate > olderRate + 5) return "up";
  if (recentRate < olderRate - 5) return "down";
  return "stable";
}

/**
 * Determine student status based on attendance and performance
 */
export function determineStudentStatus(
  attendanceRate: number,
  lastEvaluation: number,
  completedHours: number,
  requiredHours: number
): "excellent" | "good" | "needs_attention" | "critical" {
  // Check if student has completed required hours
  const hoursProgress = (completedHours / requiredHours) * 100;
  
  if (attendanceRate >= 95 && lastEvaluation >= 4.5 && hoursProgress >= 80) {
    return "excellent";
  } else if (attendanceRate >= 85 && lastEvaluation >= 3.5 && hoursProgress >= 60) {
    return "good";
  } else if (attendanceRate >= 70 && hoursProgress >= 40) {
    return "needs_attention";
  } else {
    return "critical";
  }
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Format date for display
 */
export function formatAttendanceDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

/**
 * Format time for display
 */
export function formatAttendanceTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
